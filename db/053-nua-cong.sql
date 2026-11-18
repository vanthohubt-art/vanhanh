-- 053 · 18/11/2026 · Anh Thọ chốt: ngày chỉ làm nửa buổi tính NỬA CÔNG, nhưng "làm nửa ngày vẫn có ăn trưa".
-- Ngày có cặp Vào→Ra hợp lệ: giờ làm < nua_cong_duoi_gio (mặc định 6 giờ; ca đủ 8–12 + 14–18 = 8 giờ) ⇒ 0,5 công, còn lại 1 công.
-- Đặt 0 ⇒ không bao giờ tính nửa công. Sửa ở thẻ "Giờ làm & tăng ca".
-- Bảng lương: ô "Ngày công (ăn trưa)" gợi ý số NGÀY CÓ MẶT (mỗi ngày có cặp hợp lệ = 1 suất), không phải số công.
alter table cham_cong_dia_diem add column if not exists nua_cong_duoi_gio numeric(4,1) not null default 6;

create or replace function crm_dat_gio_lam(d jsonb, p_ai text default null) returns void
language plpgsql security definer set search_path = public as $$
declare truoc jsonb; v_vao time := nullif(d->>'vao', '')::time; v_ra time := nullif(d->>'ra', '')::time; v_ph int := nullif(d->>'tc_toi_thieu_phut', '')::int;
        v_nc numeric := coalesce(nullif(d->>'nua_cong_duoi_gio', '')::numeric, (select nua_cong_duoi_gio from cham_cong_dia_diem where id = 1), 6);
begin
  if not (vai_hien_tai(p_ai) && array['chu']) then raise exception 'Chỉ chủ studio đặt giờ làm.'; end if;
  if v_vao is null or v_ra is null or v_ra <= v_vao then raise exception 'Giờ ra phải sau giờ vào (vd 08:00 – 18:00).'; end if;
  if v_ph is null or v_ph < 0 or v_ph > 240 then raise exception 'Số phút tối thiểu tính tăng ca phải từ 0 đến 240.'; end if;
  if v_nc < 0 or v_nc > 12 then raise exception 'Mốc nửa công phải từ 0 đến 12 giờ.'; end if;
  select to_jsonb(x) into truoc from cham_cong_dia_diem x where id = 1;
  update cham_cong_dia_diem set gio_vao = v_vao, gio_ra = v_ra, tc_toi_thieu_phut = v_ph, nua_cong_duoi_gio = v_nc, sua_boi = ai_hien_tai(p_ai), sua_luc = now() where id = 1;
  perform crm_ghi_nhat_ky(p_ai, 'cham_cong_dia_diem', '1', 'đặt giờ làm / tăng ca', truoc, d);
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
      case when co_cong is not true then 0 when gio < nc then 0.5 else 1 end cong from ngay
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
                   'co_cong', x.co_cong, 'cho', x.cho, 'ngoai', x.ngoai, 'quen_ra', x.quen_ra, 'ca_dai', x.ca_dai, 'tc_phut', x.tc_phut, 'tc', x.tc, 'cong', x.cong) order by x.ngay), '[]') from ngay2 x where x.nhan_su_id = n.id)
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
