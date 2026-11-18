-- 054 · 18/11/2026 · Anh Thọ: ngày 17/11 của Mai và Hải Dương (ngày đầu dùng app, chấm từ giữa ngày) "Tính đủ 1 công".
-- Thay vì sửa giờ chấm (là bằng chứng), anh ĐÁNH DẤU NGÀY ĐỦ CÔNG: ngày nửa công được đánh dấu ⇒ tính 1 công. Bỏ dấu ⇒ về luật 053.
-- Chỉ chủ đánh dấu được; mỗi lần đánh / bỏ ghi nhật ký. Chỉ có tác dụng với ngày CÓ cặp Vào→Ra hợp lệ (không tạo công từ không khí).
create table if not exists cham_cong_du_cong (
  nhan_su_id int not null references nhan_su(id),
  ngay       date not null,
  boi        text,
  luc        timestamptz not null default now(),
  primary key (nhan_su_id, ngay)
);
alter table cham_cong_du_cong enable row level security;

create or replace function crm_du_cong(p_ns int, p_ngay date, p_du boolean, p_ai text default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not (vai_hien_tai(p_ai) && array['chu']) then raise exception 'Chỉ chủ studio chỉnh ngày công.'; end if;
  if p_du then
    insert into cham_cong_du_cong (nhan_su_id, ngay, boi) values (p_ns, p_ngay, ai_hien_tai(p_ai)) on conflict (nhan_su_id, ngay) do nothing;
  else
    delete from cham_cong_du_cong where nhan_su_id = p_ns and ngay = p_ngay;
  end if;
  perform crm_ghi_nhat_ky(p_ai, 'cham_cong_du_cong', p_ns || '@' || p_ngay, case when p_du then 'tính đủ 1 công' else 'bỏ đủ công (về nửa công)' end, null, jsonb_build_object('ngay', p_ngay));
end $$;

create or replace function crm_cham_cong_thang(p_thang date default null, p_ai text default null) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare dau date := date_trunc('month', coalesce(p_thang, crm_hom_nay()))::date; cuoi date := (dau + interval '1 month')::date;
        la_chu boolean := vai_hien_tai(p_ai) && array['chu']; toi int := nhan_su_hien_tai(p_ai); kq jsonb;
        gv time; gr time; tc_min int; nc numeric;
begin
  select gio_vao, gio_ra, tc_toi_thieu_phut, nua_cong_duoi_gio into gv, gr, tc_min, nc from cham_cong_dia_diem where id = 1;
  with c0 as (
    select c.*, cc_ngay(c.luc) ngay,
           lead(c.loai) over w lo_sau, lead(c.luc) over w luc_sau, lead(c.trang_thai) over w tt_sau
    from cham_cong c
    where c.luc >= dau - interval '7 hours' and c.luc < cuoi + interval '17 hours' and c.trang_thai <> 'tu_choi'
      and (la_chu or c.nhan_su_id = toi)
    window w as (partition by c.nhan_su_id order by c.luc)
  ), c as (
    select c0.*,
      (loai = 'vao' and trang_thai in ('hop_le', 'da_duyet') and lo_sau = 'ra' and tt_sau in ('hop_le', 'da_duyet')
        and cc_ngay(luc_sau) = ngay and luc_sau - luc <= interval '14 hours') cap_ok,
      (loai = 'vao' and lo_sau = 'ra' and (cc_ngay(luc_sau) <> ngay or luc_sau - luc > interval '14 hours')) cap_dai
    from c0 where ngay >= dau and ngay < cuoi
  ), c2 as (
    -- 052: phút NGOÀI GIỜ của cặp hợp lệ = phần trước giờ vào chuẩn + phần sau giờ ra chuẩn (giờ nghỉ trưa không tính).
    select c.*, case when cap_ok then
      greatest(0, extract(epoch from least(cc_dia(luc_sau), ngay + gv) - cc_dia(luc)) / 60)
      + greatest(0, extract(epoch from cc_dia(luc_sau) - greatest(cc_dia(luc), ngay + gr)) / 60) else 0 end tc_phut
    from c
  ), ngay as (
    select nhan_su_id, ngay,
      bool_or(cap_ok) co_cong,
      bool_or(trang_thai = 'cho_duyet') cho,
      bool_or(not trong_vung and loai in ('vao', 'ra') and not ('ghi_ho' = any (co))) ngoai,
      bool_or(cap_dai) ca_dai,
      round(sum(tc_phut))::int tc_phut,
      min(cc_gio(luc)) filter (where loai = 'vao') vao, max(cc_gio(luc)) filter (where loai = 'ra') ra,
      round(coalesce(sum(extract(epoch from luc_sau - luc) / 3600) filter (where cap_ok), 0)::numeric, 2) gio,
      bool_or(loai = 'vao' and trang_thai in ('hop_le', 'da_duyet') and lo_sau is distinct from 'ra' and ngay < crm_hom_nay()) quen_ra
    from c2 group by nhan_su_id, ngay
  ), ngay2 as (
    -- Ngoài giờ QUÁ tc_min phút (mặc định 30) trong ngày ⇒ cả số phút đó là tăng ca; từ tc_min trở xuống ⇒ 0.
    -- 053: công của ngày = 1, hoặc 0,5 khi giờ làm dưới mốc nửa công.
    select ngay.*, case when tc_phut > tc_min then tc_phut else 0 end tc,
      case when co_cong is not true then 0 when gio < nc and dt.ngay is null then 0.5 else 1 end cong, dt.ngay is not null du_tay
    from ngay left join cham_cong_du_cong dt on dt.nhan_su_id = ngay.nhan_su_id and dt.ngay = ngay.ngay
  )
  select jsonb_build_object('thang', to_char(dau, 'YYYY-MM'), 'la_chu', la_chu, 'gio_lam', jsonb_build_object('vao', to_char(gv, 'HH24:MI'), 'ra', to_char(gr, 'HH24:MI'), 'tc_toi_thieu_phut', tc_min, 'nua_cong_duoi_gio', nc),
    'nguoi', coalesce(jsonb_agg(jsonb_build_object('id', n.id, 'ten', n.ten,
        'ngay_cong', (select coalesce(sum(x.cong), 0) from ngay2 x where x.nhan_su_id = n.id),
        'nua_ngay', (select count(*) from ngay2 x where x.nhan_su_id = n.id and x.cong = 0.5),
        'ngay_an_trua', (select count(*) from ngay2 x where x.nhan_su_id = n.id and x.co_cong),
        'gio', (select coalesce(sum(x.gio), 0) from ngay2 x where x.nhan_su_id = n.id),
        'tc_gio', (select round(coalesce(sum(x.tc), 0) / 60.0, 1) from ngay2 x where x.nhan_su_id = n.id),
        'tc_ngay', (select count(*) from ngay2 x where x.nhan_su_id = n.id and x.tc > 0),
        'cho_duyet', (select count(*) from cham_cong y where y.nhan_su_id = n.id and y.trang_thai = 'cho_duyet' and cc_ngay(y.luc) >= dau and cc_ngay(y.luc) < cuoi),
        'quen_ra', (select count(*) from ngay2 x where x.nhan_su_id = n.id and x.quen_ra),
        'may_chung', (select count(*) from cham_cong y where y.nhan_su_id = n.id and exists (select 1 from unnest(y.co) k where k like 'may_chung:%') and cc_ngay(y.luc) >= dau and cc_ngay(y.luc) < cuoi),
        'ngay', (select coalesce(jsonb_agg(jsonb_build_object('ngay', to_char(x.ngay, 'DD/MM'), 'vao', x.vao, 'ra', x.ra, 'gio', x.gio,
                   'co_cong', x.co_cong, 'cho', x.cho, 'ngoai', x.ngoai, 'quen_ra', x.quen_ra, 'ca_dai', x.ca_dai, 'tc_phut', x.tc_phut, 'tc', x.tc, 'cong', x.cong, 'du_tay', x.du_tay, 'ngay_iso', x.ngay::text) order by x.ngay), '[]') from ngay2 x where x.nhan_su_id = n.id)
      ) order by n.ten), '[]'),
    'cho_duyet', case when la_chu then (select coalesce(jsonb_agg(jsonb_build_object('id', y.id, 'ten', s.ten, 'loai', y.loai,
        'ngay', to_char(cc_ngay(y.luc), 'DD/MM'), 'gio', cc_gio(y.luc), 'cach_m', y.cach_m, 'sai_so_m', y.sai_so_m, 'ly_do', y.ly_do,
        'lat', y.lat, 'lng', y.lng, 'trong_vung', y.trong_vung, 'co', to_jsonb(y.co)) order by y.luc), '[]')
        from cham_cong y join nhan_su s on s.id = y.nhan_su_id where y.trang_thai = 'cho_duyet') end,
    -- Quên ra ca (mọi tháng, để anh ghi giờ ra hộ): lượt VÀO hợp lệ cuối cùng của ngày đã qua mà không có RA theo sau.
    'quen_ra_ds', case when la_chu then (select coalesce(jsonb_agg(jsonb_build_object('id', v.id, 'ns', v.nhan_su_id, 'ten', s.ten,
        'ngay', to_char(cc_ngay(v.luc), 'DD/MM'), 'ngay_iso', cc_ngay(v.luc)::text, 'vao', cc_gio(v.luc)) order by v.luc), '[]')
        from (select c.*, lead(c.loai) over (partition by c.nhan_su_id order by c.luc) lo_sau from cham_cong c where c.trang_thai <> 'tu_choi') v
        join nhan_su s on s.id = v.nhan_su_id
        where v.loai = 'vao' and v.trang_thai in ('hop_le', 'da_duyet') and v.lo_sau is null and cc_ngay(v.luc) < crm_hom_nay()
          and v.luc > now() - interval '45 days') end,
    'dia_diem', case when la_chu then (select to_jsonb(d) - 'sua_luc' from cham_cong_dia_diem d where id = 1) end)
  into kq
  from nhan_su n
  where n.dang_lam and not ('may' = any (n.vai)) and not n.khong_cham_cong and (la_chu or n.id = toi)
    and (n.co_bang_luong or exists (select 1 from cham_cong y where y.nhan_su_id = n.id));
  return kq;
end $$;
