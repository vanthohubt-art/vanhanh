// Ảnh hoá đơn gửi khách — dựng PNG bằng canvas ngay trên máy, không gửi dữ liệu đi đâu.
// Sale bấm "Ảnh hoá đơn" ở màn hình ca → xem trước → Chia sẻ (Zalo/Messenger trên điện thoại) hoặc Tải ảnh.
// Chỉ in thứ khách nên thấy: gói, phát sinh, tiền đã thu, còn lại, hẹn trả ảnh. KHÔNG in ghi chú nội bộ, ekip, lịch sử.

import { TAI_KHOAN_NHAN } from './cau-hinh.js?v=20261109h';
import { chuoiVietQR, noiDungCK } from './vietqr.js?v=20261109b';
import { goiGom } from './goi-gom.js?v=20261111a';

// Điều khoản in cuối hợp đồng (cọc, đổi lịch, huỷ, thời hạn giữ file…). ĐỂ TRỐNG cho tới khi anh Thọ chốt câu chữ —
// trợ lý KHÔNG tự viết điều khoản. Mỗi phần tử là một câu; mảng rỗng thì không in mục này.
const DIEU_KHOAN = [];

const STUDIO = {
  ten: 'HOME STUDIO',
  phu: 'Chụp ảnh cho bé và gia đình',
  diaChi: '79 Hà Huy Tập, Yên Viên, Gia Lâm, Hà Nội',
  lienHe: 'Hotline / Zalo 0961 818 905',
};
const MAU = { nen: '#F5FBFA', the: '#FFFFFF', chu: '#17302B', nhat: '#5A6F6A', vien: '#DCEDE8', nhan: '#0E8571', xanh: '#2E7D32', do: '#B3261E' };   // tông trắng · xanh mint (anh Thọ 10/11/2026), khớp app.css
const PHONG = '"Be Vietnam Pro", "Segoe UI", system-ui, sans-serif';
const W = 1080, LE = 72;

const tien = (n) => (Math.round(Number(n) || 0)).toLocaleString('vi-VN') + 'đ';
const ngayDu = (d) => (d ? `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}` : '');

/** Cắt chữ thành nhiều dòng vừa bề rộng `rong`. */
function catDong(ctx, chu, rong) {
  const tu = String(chu).split(/\s+/); const dong = []; let d = '';
  for (const t of tu) {
    const thu = d ? d + ' ' + t : t;
    if (ctx.measureText(thu).width <= rong || !d) d = thu; else { dong.push(d); d = t; }
  }
  if (d) dong.push(d);
  return dong;
}

// Phát sinh nhập từ sổ Sheet chỉ có TỔNG tiền, chi tiết nằm ở ghi chú nội bộ ⇒ in tên dễ hiểu cho khách, không in ghi chú.
const PS_SO_CU = 'Phát sinh ghi trong sổ cũ (chi tiết xem ghi chú hợp đồng)';

/** Các dòng của hợp đồng gửi khách, từ chi tiết hợp đồng (kho.chiTiet). Tách riêng để phép thử gọi được. */
export function dongHoaDon(h) {
  const giaGoi = Number(h.tien.tien_goi) + Number(h.giam_gia || 0);
  const phatSinh = (h.phatSinh || []).map((p) => ({
    ten: p.mo_ta === PS_SO_CU ? 'Phát sinh thêm (in ảnh, dịch vụ ngoài gói)' : p.mo_ta,
    chiTiet: p.mo_ta !== PS_SO_CU && Number(p.so_luong) > 1 ? `${p.so_luong} × ${tien(p.don_gia)}` : '',
    so: Number(p.thanh_tien),
  }));
  const thu = (h.phieuThu || []).filter((p) => !p.huy && !p.dao).map((p) => ({
    ten: `${p.so_tien < 0 ? 'Hoàn tiền' : 'Đã thu'} ${String(p.luc || '').slice(0, 5)} · ${p.hinh_thuc === 'tien_mat' ? 'tiền mặt' : 'chuyển khoản'}`,
    so: -p.so_tien,
  }));
  return { goi: { ten: `Gói ${h.goi_ten}`, so: giaGoi }, gom: goiGom(h), giam: Number(h.giam_gia || 0), phatSinh,
    tongPs: phatSinh.reduce((a, p) => a + p.so, 0), thu, tong: h.tien.tong_hoa_don, conLai: h.tien.con_lai, thua: h.tien.tien_thua || 0 };
}

export async function veHoaDon(h) {
  try { await document.fonts.load(`700 30px "Be Vietnam Pro"`); await document.fonts.load(`400 30px "Be Vietnam Pro"`); } catch { /* phông dự phòng */ }
  const d = dongHoaDon(h);
  const c = document.createElement('canvas'); const ctx = c.getContext('2d');
  const rongTen = W - LE * 2 - 280, hn = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);

  // Lượt 1: đo chiều cao; lượt 2: vẽ thật.
  const ve = (that) => {
    let y = 0;
    const chu = (s, x, yy, co, dam, mau, canh = 'left') => {
      if (!that) return;
      ctx.font = `${dam ? 700 : 400} ${co}px ${PHONG}`; ctx.fillStyle = mau; ctx.textAlign = canh; ctx.fillText(s, x, yy);
    };
    const ke = (yy, mau = MAU.vien, day = 2) => { if (that) { ctx.fillStyle = mau; ctx.fillRect(LE, yy, W - LE * 2, day); } };
    const dong = (ten, so, { dam = false, mau = MAU.chu, co = 32, phu = '' } = {}) => {
      ctx.font = `${dam ? 700 : 400} ${co}px ${PHONG}`;
      const ds = catDong(ctx, ten, rongTen);
      ds.forEach((t, i) => chu(t, LE, y + co + i * (co + 12), co, dam, mau));
      chu(tien(so), W - LE, y + co, co, dam, mau, 'right');
      y += ds.length * (co + 12);
      if (phu) { chu(phu, LE, y + 24, 24, false, MAU.nhat); y += 34; }
      y += 22;
    };
    const muc = (so, ten) => { y += 30; chu(`${so}. ${ten}`, LE, y + 28, 28, true, MAU.nhan); y += 52; };
    const thongTin = (nhan, gt) => { if (!gt) return; chu(nhan, LE, y + 30, 30, false, MAU.nhat); chu(gt, LE + 250, y + 30, 30, false, MAU.chu); y += 46; };
    const gach = (s, co = 28) => {   // một ý "gói gồm", có chấm đầu dòng, tự xuống dòng
      ctx.font = `400 ${co}px ${PHONG}`;
      catDong(ctx, s, W - LE * 2 - 44).forEach((t, i) => { if (!i) chu('•', LE + 8, y + co, co, true, MAU.nhan); chu(t, LE + 40, y + co, co, false, MAU.chu); y += co + 12; });
      y += 4;
    };

    if (that) { ctx.fillStyle = MAU.nen; ctx.fillRect(0, 0, W, c.height); ctx.fillStyle = MAU.nhan; ctx.fillRect(0, 0, W, 14); }
    y = 110; chu(STUDIO.ten, LE, y, 64, true, MAU.chu);
    y += 50; chu(STUDIO.phu, LE, y, 30, false, MAU.nhan);
    y += 44; chu(STUDIO.diaChi, LE, y, 26, false, MAU.nhat);
    y += 38; chu(STUDIO.lienHe, LE, y, 26, false, MAU.nhat);
    y += 44; ke(y, MAU.nhan, 3);

    y += 70; chu('HỢP ĐỒNG DỊCH VỤ CHỤP ẢNH', LE, y, 40, true, MAU.chu);
    y += 44; chu(`Số ${h.ma} · lập ngày ${ngayDu(hn)}`, LE, y, 26, false, MAU.nhat);

    muc(1, 'KHÁCH HÀNG');
    thongTin('Họ tên', h.khach); thongTin('Điện thoại', h.sdt); thongTin('Địa chỉ', h.dia_chi); thongTin('Tư vấn', h.sale_online);

    muc(2, 'LỊCH CHỤP');
    thongTin('Ngày chụp', h.ngay_chup ? `${ngayDu(h.ngay_chup)}${h.gio_chup ? ' · ' + String(h.gio_chup).slice(0, 5) : ''}` : 'Sẽ hẹn sau');
    thongTin('Địa điểm', h.ngay_chup ? 'Home Studio — 79 Hà Huy Tập, Yên Viên' : '');
    if (h.hen_tra_anh && h.trang_thai < 8) thongTin('Hẹn trả ảnh', ngayDu(h.hen_tra_anh));

    muc(3, 'GÓI DỊCH VỤ');
    dong(d.goi.ten, d.goi.so, { dam: true });
    if (d.gom.length) { y -= 8; for (const s of d.gom) gach(s); y += 10; }
    if (h.anhChon && h.anhChon.length) { gach('Concept / makeup đã chọn: ' + h.anhChon.join(', ')); y += 10; }
    if (d.giam) dong('Giảm giá', -d.giam, { mau: MAU.xanh });

    if (d.phatSinh.length) {
      muc(4, 'DỊCH VỤ PHÁT SINH');
      for (const p of d.phatSinh) dong(p.ten, p.so, { phu: p.chiTiet });
    }

    muc(d.phatSinh.length ? 5 : 4, 'THANH TOÁN');
    dong(`Gói dịch vụ${d.giam ? ' (đã giảm)' : ''}`, d.goi.so - d.giam);
    if (d.phatSinh.length) dong('Dịch vụ phát sinh', d.tongPs);
    ke(y); y += 20;
    dong('TỔNG GIÁ TRỊ HỢP ĐỒNG', d.tong, { dam: true, co: 36 });
    for (const r of d.thu) dong(r.ten, r.so, { mau: MAU.nhat, co: 28 });
    ke(y); y += 20;
    if (d.thua) dong('Tiền thừa (hoàn khách hoặc trừ vào in)', d.thua, { dam: true, co: 38, mau: MAU.xanh });
    else dong(d.conLai ? 'CÒN LẠI CẦN THANH TOÁN' : 'ĐÃ THANH TOÁN ĐỦ', d.conLai, { dam: true, co: 38, mau: d.conLai ? MAU.do : MAU.xanh });

    // Mã VietQR: chỉ khi còn tiền phải thu, đã có số TK trong cau-hinh.js và thư viện vẽ QR (cdnjs) đã tải.
    // Thiếu thư viện (mất mạng) thì vẫn in số TK bằng chữ — hoá đơn không bao giờ hỏng vì thiếu QR.
    const tk = TAI_KHOAN_NHAN;
    if (d.conLai > 0 && tk && tk.stk) {
      const nd = noiDungCK(h.ma);
      y += 30; ke(y); y += 60;
      chu('Quét mã để chuyển khoản', W / 2, y, 32, true, MAU.chu, 'center'); y += 30;
      if (typeof window.qrcode === 'function') {
        const qr = window.qrcode(0, 'M'); qr.addData(chuoiVietQR({ bin: tk.bin, stk: tk.stk, soTien: d.conLai, noiDung: nd })); qr.make();
        const n = qr.getModuleCount(), o = Math.floor(400 / (n + 8)), canh = o * (n + 8), x0 = (W - canh) / 2;
        if (that) {
          ctx.fillStyle = '#fff'; ctx.fillRect(x0, y, canh, canh); ctx.fillStyle = '#000';
          for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (qr.isDark(r, k)) ctx.fillRect(x0 + (k + 4) * o, y + (r + 4) * o, o, o);
        }
        y += canh + 20;
      }
      y += 26; chu(`${tk.nganHang} · ${tk.stk.replace(/(\d{4})(?=\d)/g, '$1 ')}`, W / 2, y, 30, true, MAU.chu, 'center');
      y += 42; chu(tk.chuTk, W / 2, y, 30, false, MAU.chu, 'center');
      y += 42; chu(`Số tiền ${tien(d.conLai)} · Nội dung: ${nd}`, W / 2, y, 26, false, MAU.nhat, 'center');
      y += 20;
    }

    if (DIEU_KHOAN.length) {
      y += 10; muc(d.phatSinh.length ? 6 : 5, 'ĐIỀU KHOẢN');
      for (const s of DIEU_KHOAN) gach(s, 26);
    }
    y += 50; chu('Cảm ơn gia đình đã tin chọn Home Studio!', W / 2, y, 30, false, MAU.nhan, 'center');
    y += 70;
    return y;
  };

  c.width = W; c.height = 2000; c.height = Math.ceil(ve(false));
  ve(true);
  return c;
}

/** Ảnh mã QR chuyển khoản cho MỘT số tiền bất kỳ (cọc, thu nốt, tiền in) — sale gửi khách trước khi có hoá đơn đủ. */
export async function veQrThu(h, soTien) {
  const tk = TAI_KHOAN_NHAN;
  if (!tk || !tk.stk) throw new Error('Chưa có số tài khoản nhận tiền trong cau-hinh.js');
  if (!(soTien > 0)) throw new Error('Nhập số tiền cần thu trước (lớn hơn 0)');
  if (typeof window.qrcode !== 'function') throw new Error('Chưa tải được thư viện vẽ mã QR — kiểm tra mạng rồi tải lại trang');
  try { await document.fonts.load(`700 30px "Be Vietnam Pro"`); } catch { /* phông dự phòng */ }
  const nd = noiDungCK(h.ma);
  const qr = window.qrcode(0, 'M'); qr.addData(chuoiVietQR({ bin: tk.bin, stk: tk.stk, soTien, noiDung: nd })); qr.make();
  const n = qr.getModuleCount(), o = Math.floor(560 / (n + 8)), canh = o * (n + 8), x0 = (W - canh) / 2;
  const c = document.createElement('canvas'); c.width = W; c.height = 1500; const ctx = c.getContext('2d');
  const chu = (s, y, co, dam, mau) => { ctx.font = `${dam ? 700 : 400} ${co}px ${PHONG}`; ctx.fillStyle = mau; ctx.textAlign = 'center'; ctx.fillText(s, W / 2, y); };
  ctx.fillStyle = MAU.nen; ctx.fillRect(0, 0, W, c.height); ctx.fillStyle = MAU.nhan; ctx.fillRect(0, 0, W, 14);
  chu(STUDIO.ten, 110, 60, true, MAU.chu);
  chu(STUDIO.phu, 160, 30, false, MAU.nhan);
  chu(`Chuyển khoản cho hợp đồng ${h.ma}`, 250, 36, true, MAU.chu);
  chu(`Khách hàng: ${h.khach}`, 300, 30, false, MAU.nhat);
  let y = 340;
  ctx.fillStyle = '#fff'; ctx.fillRect(x0, y, canh, canh); ctx.fillStyle = '#000';
  for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (qr.isDark(r, k)) ctx.fillRect(x0 + (k + 4) * o, y + (r + 4) * o, o, o);
  y += canh + 80;
  chu(tien(soTien), y, 64, true, MAU.do); y += 70;
  chu(`${tk.nganHang} · ${tk.stk.replace(/(\d{4})(?=\d)/g, '$1 ')}`, y, 34, true, MAU.chu); y += 50;
  chu(tk.chuTk, y, 32, false, MAU.chu); y += 50;
  chu(`Nội dung: ${nd}`, y, 30, false, MAU.nhat); y += 60;
  chu('Mở app ngân hàng → Quét mã — số tiền và nội dung tự điền sẵn', y, 26, false, MAU.nhat); y += 70;
  chu(STUDIO.lienHe, y, 26, false, MAU.nhat); y += 50;
  // Cắt canvas vừa nội dung
  const ra = document.createElement('canvas'); ra.width = W; ra.height = y; ra.getContext('2d').drawImage(c, 0, 0);
  return ra;
}

export async function moQrThu(h, soTien) {
  const c = await veQrThu(h, soTien);
  return moAnh(c, `qr-${h.ma}-${Math.round(soTien)}.png`, 'Mã QR chuyển khoản ' + h.ma);
}

/** Mở hộp xem trước + nút Chia sẻ / Tải ảnh. */
export async function moHoaDon(h) {
  return moAnh(await veHoaDon(h), `hop-dong-${h.ma}.png`, 'Hợp đồng Home Studio ' + h.ma);
}

async function moAnh(c, tenTep, tieuDe) {
  const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
  const url = URL.createObjectURL(blob);
  const tep = new File([blob], tenTep, { type: 'image/png' });
  const coChiaSe = !!(navigator.canShare && navigator.canShare({ files: [tep] }));

  const nen = document.createElement('div');
  nen.className = 'hop-nen';
  nen.innerHTML = `<div class="hop" role="dialog" aria-label="${tieuDe}">
    <img src="${url}" alt="${tieuDe}">
    <div class="hang-nut" style="margin-top:12px;justify-content:flex-end">
      <button class="nut phu nho" data-k="dong">Đóng</button>
      <a class="nut phu nho" data-k="tai" href="${url}" download="${tenTep}" style="text-decoration:none">Tải ảnh</a>
      ${coChiaSe ? '<button class="nut nho" data-k="chia">Chia sẻ (Zalo…)</button>' : ''}
    </div>
    <p class="mo" style="margin:8px 0 0">Ảnh dựng ngay trên máy này. Gửi cho khách là việc của sale — máy không tự gửi.</p>
  </div>`;
  const dong = () => { nen.remove(); URL.revokeObjectURL(url); };
  nen.onclick = (e) => { if (e.target === nen) dong(); };
  nen.querySelector('[data-k=dong]').onclick = dong;
  const nutChia = nen.querySelector('[data-k=chia]');
  if (nutChia) nutChia.onclick = async () => { try { await navigator.share({ files: [tep], title: tieuDe }); } catch { /* người dùng huỷ */ } };
  document.body.appendChild(nen);
}
