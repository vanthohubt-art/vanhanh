// Ảnh hoá đơn gửi khách — dựng PNG bằng canvas ngay trên máy, không gửi dữ liệu đi đâu.
// Sale bấm "Ảnh hoá đơn" ở màn hình ca → xem trước → Chia sẻ (Zalo/Messenger trên điện thoại) hoặc Tải ảnh.
// Chỉ in thứ khách nên thấy: gói, phát sinh, tiền đã thu, còn lại, hẹn trả ảnh. KHÔNG in ghi chú nội bộ, ekip, lịch sử.

import { TAI_KHOAN_NHAN } from './cau-hinh.js?v=20261109h';
import { chuoiVietQR, noiDungCK } from './vietqr.js?v=20261109b';

const STUDIO = {
  ten: 'HOME STUDIO',
  phu: 'Chụp ảnh cho bé và gia đình',
  diaChi: '79 Hà Huy Tập, Yên Viên, Gia Lâm, Hà Nội',
  lienHe: 'Hotline / Zalo 0961 818 905',
};
const MAU = { nen: '#FBF7F2', the: '#FFFFFF', chu: '#2B211B', nhat: '#6E5F55', vien: '#E6DACC', nhan: '#B4532A', xanh: '#3F7A55', do: '#B3261E' };
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

/** Danh sách dòng hoá đơn từ chi tiết hợp đồng (kho.chiTiet). Tách riêng để phép thử gọi được. */
export function dongHoaDon(h) {
  const hang = [{ ten: `Gói ${h.goi_ten}`, so: h.tien.tien_goi + (h.giam_gia || 0) }];
  if (h.giam_gia) hang.push({ ten: 'Giảm giá', so: -h.giam_gia });
  for (const p of h.phatSinh || []) hang.push({ ten: p.mo_ta + (p.so_luong > 1 ? ` × ${p.so_luong}` : ''), so: p.thanh_tien });
  const thu = (h.phieuThu || []).map((p) => ({
    ten: `${p.so_tien < 0 ? 'Hoàn tiền' : 'Đã thu'} ${String(p.luc || '').slice(0, 5)} ·${p.hinh_thuc === 'tien_mat' ? 'tiền mặt' : 'chuyển khoản'}`,
    so: -p.so_tien,
  }));
  return { hang, thu, tong: h.tien.tong_hoa_don, conLai: h.tien.con_lai, thua: h.tien.tien_thua || 0 };
}

export async function veHoaDon(h) {
  try { await document.fonts.load(`700 30px "Be Vietnam Pro"`); await document.fonts.load(`400 30px "Be Vietnam Pro"`); } catch { /* phông dự phòng */ }
  const d = dongHoaDon(h);
  const c = document.createElement('canvas'); const ctx = c.getContext('2d');
  const rongTen = W - LE * 2 - 280;

  // Lượt 1: đo chiều cao; lượt 2: vẽ thật.
  const ve = (that) => {
    let y = 0;
    const chu = (s, x, yy, co, dam, mau, canh = 'left') => {
      if (!that) return;
      ctx.font = `${dam ? 700 : 400} ${co}px ${PHONG}`; ctx.fillStyle = mau; ctx.textAlign = canh; ctx.fillText(s, x, yy);
    };
    const ke = (yy, mau = MAU.vien, day = 2) => { if (that) { ctx.fillStyle = mau; ctx.fillRect(LE, yy, W - LE * 2, day); } };
    const dong = (ten, so, { dam = false, mau = MAU.chu, co = 32 } = {}) => {
      ctx.font = `${dam ? 700 : 400} ${co}px ${PHONG}`;
      const ds = catDong(ctx, ten, rongTen);
      ds.forEach((t, i) => chu(t, LE, y + co + i * (co + 12), co, dam, mau));
      chu(tien(so), W - LE, y + co, co, dam, mau, 'right');
      y += ds.length * (co + 12) + 22;
    };

    if (that) { ctx.fillStyle = MAU.nen; ctx.fillRect(0, 0, W, c.height); ctx.fillStyle = MAU.nhan; ctx.fillRect(0, 0, W, 14); }
    y = 110; chu(STUDIO.ten, LE, y, 64, true, MAU.chu);
    y += 50; chu(STUDIO.phu, LE, y, 30, false, MAU.nhan);
    y += 44; chu(STUDIO.diaChi, LE, y, 26, false, MAU.nhat);
    y += 38; chu(STUDIO.lienHe, LE, y, 26, false, MAU.nhat);
    y += 44; ke(y, MAU.nhan, 3);

    y += 70; chu('HOÁ ĐƠN DỊCH VỤ', LE, y, 40, true, MAU.chu); chu(h.ma, W - LE, y, 30, false, MAU.nhat, 'right');
    y += 56; chu(`Khách hàng: ${h.khach}`, LE, y, 32, false, MAU.chu);
    if (h.sdt) { y += 46; chu(`Số điện thoại: ${h.sdt}`, LE, y, 32, false, MAU.chu); }
    if (h.ngay_chup) { y += 46; chu(`Ngày chụp: ${ngayDu(h.ngay_chup)}${h.gio_chup ? ' · ' + String(h.gio_chup).slice(0, 5) : ''}`, LE, y, 32, false, MAU.chu); }
    y += 40; ke(y);

    y += 26; for (const r of d.hang) dong(r.ten, r.so);
    ke(y); y += 20;
    dong('TỔNG HOÁ ĐƠN', d.tong, { dam: true, co: 36 });
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

    if (h.hen_tra_anh && h.trang_thai < 8) { y += 20; chu(`Hẹn trả ảnh: ${ngayDu(h.hen_tra_anh)}`, LE, y + 30, 30, true, MAU.chu); y += 60; }
    y += 40; chu('Cảm ơn gia đình đã tin chọn Home Studio!', W / 2, y, 30, false, MAU.nhan, 'center');
    y += 70;
    return y;
  };

  c.width = W; c.height = 2000; c.height = Math.ceil(ve(false));
  ve(true);
  return c;
}

/** Mở hộp xem trước + nút Chia sẻ / Tải ảnh. */
export async function moHoaDon(h) {
  const c = await veHoaDon(h);
  const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
  const url = URL.createObjectURL(blob);
  const tenTep = `hoa-don-${h.ma}.png`;
  const tep = new File([blob], tenTep, { type: 'image/png' });
  const coChiaSe = !!(navigator.canShare && navigator.canShare({ files: [tep] }));

  const nen = document.createElement('div');
  nen.className = 'hop-nen';
  nen.innerHTML = `<div class="hop" role="dialog" aria-label="Ảnh hoá đơn">
    <img src="${url}" alt="Ảnh hoá đơn ${h.ma}">
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
  if (nutChia) nutChia.onclick = async () => { try { await navigator.share({ files: [tep], title: 'Hoá đơn Home Studio ' + h.ma }); } catch { /* người dùng huỷ */ } };
  document.body.appendChild(nen);
}
