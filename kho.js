// Lớp dữ liệu của app CRM. Mọi thao tác gọi MỘT hàm SQL ở crm/db/004-ham-app.sql — mỗi hàm là một giao dịch.
// Hai đường chạy, cùng bộ hàm:
//   · Supabase (bản thật) — khi cau-hinh.js có URL + khoá công khai. Phải đăng nhập; nhật ký ghi theo tài khoản.
//   · PGlite (bản thử)    — khi cau-hinh.js để trống: Postgres chạy ngay trong trình duyệt, lưu IndexedDB.
import { SUPABASE_URL, SUPABASE_KHOA_CONG_KHAI } from './cau-hinh.js?v=20261109h';

export const THAT = !!(SUPABASE_URL && SUPABASE_KHOA_CONG_KHAI) && !new URLSearchParams(location.search).has('thu');
let db, sb;
const so = (v) => (v == null ? 0 : Number(v));
const SQL_THU = ['../db/001-bang.sql', '../db/002-danh-muc.sql', '../db/004-ham-app.sql', '../db/007-ham-tong-quan.sql', '../db/008-mo-rong.sql', '../db/009-pancake-lead.sql', '../db/010-album.sql', '../db/011-luong.sql'];
const docSql = async (f) => (await fetch(f, { cache: 'no-store' })).text();

export async function moKho(ten = 'crm-home-studio') {
  if (THAT) {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.4/+esm');
    sb = createClient(SUPABASE_URL, SUPABASE_KHOA_CONG_KHAI);
    return;
  }
  const { PGlite } = await import('https://cdn.jsdelivr.net/npm/@electric-sql/pglite@0.2.17/dist/index.js');
  db = new PGlite('idb://' + ten);
  await db.waitReady;
  const { rows } = await db.query("select to_regclass('public.goi') is not null co, to_regproc('public.crm_danh_muc') is not null co_ham, to_regproc('public.crm_trang_chu') is not null co_007");
  if (!rows[0].co) for (const f of SQL_THU) await db.exec(await docSql(f));
  else if (!rows[0].co_ham) await db.exec(await docSql('../db/004-ham-app.sql'));   // sổ thử cũ (trước 08/11) chưa có hàm
  // 007 toàn "create or replace" ⇒ nạp lại mỗi lần mở để sổ thử cũ luôn có bản hàm mới nhất.
  if (rows[0].co) for (const f of ['../db/007-ham-tong-quan.sql', '../db/008-mo-rong.sql', '../db/009-pancake-lead.sql', '../db/010-album.sql', '../db/011-luong.sql']) await db.exec(await docSql(f));
}

export async function xoaSachVaNapLai() {
  if (THAT) throw new Error('Bản thật không cho xoá sạch.');
  await db.exec('drop schema public cascade; create schema public;');
  for (const f of SQL_THU) await db.exec(await docSql(f));
}

// Gọi một hàm SQL bằng tham số đặt tên — giống hệt supabase.rpc(ten, thamSo).
async function goi(ten, thamSo = {}) {
  if (THAT) {
    const { data, error } = await sb.rpc(ten, thamSo);
    if (error) throw new Error(dichLoi(error.message));
    return data;
  }
  const khoa = Object.keys(thamSo);
  const p = khoa.map((k) => { const v = thamSo[k]; return v != null && typeof v === 'object' ? JSON.stringify(v) : v ?? null; });
  try {
    const r = await db.query(`select ${ten}(${khoa.map((k, i) => `${k} => $${i + 1}`).join(', ')}) as r`, p);
    return r.rows[0].r;
  } catch (e) { throw new Error(dichLoi(e.message)); }
}

function dichLoi(m) {
  if (/JWT|not authenticated|permission denied/i.test(m)) return 'Phiên đăng nhập đã hết hoặc không có quyền — đăng nhập lại.';
  if (/khach_hang_sdt_key/.test(m)) return 'SĐT này đã có khách khác.';
  if (/hop_dong_ekip_pkey/.test(m)) return 'Một người bị chọn trùng vai.';
  if (/Failed to fetch|NetworkError/i.test(m)) return 'Không nối được máy chủ — kiểm tra mạng.';
  return m;
}

// ───────── đăng nhập (chỉ bản thật) ─────────
export async function toi() {
  if (!THAT) return null;
  const { data } = await sb.auth.getSession();
  if (!data.session) return null;
  return goi('crm_toi');
}
export async function dangNhap(email, matKhau) {
  const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password: matKhau });
  if (error) throw new Error(/Invalid login/i.test(error.message) ? 'Sai email hoặc mật khẩu.' : error.message);
}
export async function dangXuat() { await sb.auth.signOut(); }
export async function doiMatKhau(moi) {
  const { error } = await sb.auth.updateUser({ password: moi });
  if (error) throw new Error(error.message);
}

export function chuanSdt(s) {
  let d = String(s || '').replace(/\D/g, '');
  if (d.startsWith('84') && d.length === 11) d = '0' + d.slice(2);
  return d;
}

// ───────── danh mục ─────────
export async function danhMuc() {
  const dm = await goi('crm_danh_muc');
  for (const g of dm.goi) { g.gia_ban = so(g.gia_ban); g.gia_niem_yet = so(g.gia_niem_yet); }
  for (const p of dm.phuThu) { p.gia_tu = so(p.gia_tu); p.gia_den = p.gia_den == null ? null : so(p.gia_den); }
  for (const g of dm.giaIn) g.gia = so(g.gia);
  return dm;
}

// ───────── khách ─────────
export const timKhach = (sdt) => goi('crm_tim_khach', { p_sdt: chuanSdt(sdt) });

// ───────── hợp đồng ─────────
export async function taoHopDong(d, ai) {
  const sdt = chuanSdt(d.sdt);
  if (!/^0\d{9}$/.test(sdt)) throw new Error('SĐT phải đủ 10 số, bắt đầu bằng 0.');
  if (!String(d.ten || '').trim()) throw new Error('Thiếu tên khách.');
  if (!d.goi_ma) throw new Error('Chưa chọn gói.');
  return goi('crm_tao_hop_dong', { d: { ...d, sdt }, p_ai: ai });
}

export async function dsHopDong({ trangThai, tu, den, tim } = {}) {
  const rows = await goi('crm_ds_hop_dong', { p_trang_thai: trangThai ? Number(trangThai) : null, p_tu: tu || null, p_den: den || null, p_tim: tim || null });
  for (const r of rows) for (const c of ['tong_hoa_don', 'da_thu', 'con_lai', 'tien_thua']) r[c] = so(r[c]);
  return rows;
}

export async function chiTiet(id) {
  const h = await goi('crm_chi_tiet', { p_id: id });
  if (!h) return null;
  for (const c of ['gia_goi', 'giam_gia']) h[c] = so(h[c]);
  for (const c of ['tien_goi', 'tien_phat_sinh', 'tong_hoa_don', 'da_thu', 'con_lai', 'tien_thua']) h.tien[c] = so(h.tien[c]);
  for (const r of h.phatSinh) { r.don_gia = so(r.don_gia); r.thanh_tien = so(r.thanh_tien); }
  for (const r of h.phieuThu) r.so_tien = so(r.so_tien);
  return h;
}

export const capNhatHopDong = (id, d, ai) => goi('crm_cap_nhat_hop_dong', { p_id: id, d, p_ai: ai });
export const datEkip = (id, ekip, ai) => goi('crm_dat_ekip', { p_id: id, p_ekip: ekip, p_ai: ai });
export async function themPhatSinh(id, p, ai) {
  if (!(Number(p.so_luong) > 0)) throw new Error('Số lượng phải lớn hơn 0.');
  return goi('crm_them_phat_sinh', { p_id: id, p, p_ai: ai });
}
export const xoaPhatSinh = (id, psId, ai) => goi('crm_xoa_phat_sinh', { p_id: id, p_ps_id: psId, p_ai: ai });
export async function themPhieuThu(id, p, ai) {
  if (!Number(p.so_tien)) throw new Error('Số tiền phải khác 0.');
  return goi('crm_them_phieu_thu', { p_id: id, p, p_ai: ai });
}

// ───────── lịch ─────────
// Cờ trùng: cùng một người trong ekip có hai ca cùng ngày cách nhau dưới 2 giờ.
export async function lich(tu, den) {
  const ca = await goi('crm_lich', { p_tu: tu, p_den: den });
  const phut = (g) => (g ? Number(g.slice(0, 2)) * 60 + Number(g.slice(3, 5)) : null);
  for (const a of ca) {
    a.trung = [];
    for (const b of ca) {
      if (a === b || a.ngay !== b.ngay) continue;
      const pa = phut(a.gio), pb = phut(b.gio);
      if (pa == null || pb == null || Math.abs(pa - pb) >= 120) continue;
      const chung = a.ekip.filter((x) => b.ekip.some((y) => y.id === x.id)).map((x) => x.ten);
      if (chung.length) a.trung.push({ ma: b.ma, gio: b.gio, nguoi: [...new Set(chung)] });
    }
  }
  return ca;
}

export async function tongQuan() {
  const r = await goi('crm_tong_quan');
  r.con_phai_thu = so(r.con_phai_thu);
  return r;
}

// ───────── giao diện mới (007, 09/11/2026) ─────────
// Supabase trả bigint dạng chuỗi ⇒ đổi các ô tiền về số.
const O_TIEN = ['tien', 'tong_hoa_don', 'da_thu', 'con_lai', 'so_tien', 'ck', 'tm', 'con_no'];
const soHoa = (o) => { for (const k of Object.keys(o || {})) if (O_TIEN.includes(k)) o[k] = so(o[k]); return o; };
export async function trangChu(thang) {
  const r = await goi('crm_trang_chu', { p_thang: thang || null });
  ['hd_moi', 'thuc_thu', 'cong_no'].forEach((k) => soHoa(r[k]));
  r.lich_hom_nay.forEach(soHoa);
  return r;
}
export async function congNo(thang) {
  const r = await goi('crm_cong_no', { p_thang: thang || null });
  soHoa(r.thu); r.thu.hom_nay = so(r.thu.hom_nay); r.thu_thang_truoc = so(r.thu_thang_truoc); soHoa(r.con_no);
  for (const g of Object.values(r.giai_doan)) soHoa(g);
  r.hang_muc.forEach((h) => { h.da_thu = so(h.da_thu); h.con_no = so(h.con_no); });
  r.phieu.forEach(soHoa); r.can_thu.forEach(soHoa);
  return r;
}
export const hauKy = () => goi('crm_hau_ky');

// Các màn hình mở rộng (008) gọi thẳng hàm theo tên — mỗi hàm vẫn là một giao dịch ở máy chủ.
export const ham = (ten, thamSo) => goi(ten, thamSo);
