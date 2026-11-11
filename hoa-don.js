// Ảnh hoá đơn gửi khách — dựng PNG bằng canvas ngay trên máy, không gửi dữ liệu đi đâu.
// Sale bấm "Ảnh hoá đơn" ở màn hình ca → xem trước → Chia sẻ (Zalo/Messenger trên điện thoại) hoặc Tải ảnh.
// Chỉ in thứ khách nên thấy: gói, phát sinh, tiền đã thu, còn lại, hẹn trả ảnh. KHÔNG in ghi chú nội bộ, ekip, lịch sử.

import { TAI_KHOAN_NHAN } from './cau-hinh.js?v=20261109h';
import { chuoiVietQR, noiDungCK } from './vietqr.js?v=20261109b';
import { goiGom, tenGoi } from './goi-gom.js?v=20261111e';

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
export const PS_SO_CU = 'Phát sinh ghi trong sổ cũ (chi tiết xem ghi chú hợp đồng)';

/** Các dòng của phiếu thanh toán gửi khách, từ chi tiết hợp đồng (kho.chiTiet). Tách riêng để phép thử gọi được.
 *  Bố cục bảng theo mẫu anh Thọ gửi 11/11/2026: STT · Dịch vụ / sản phẩm (kèm gạch đầu dòng) · Đơn giá · SL · Ưu đãi · Thành tiền. */
export function dongHoaDon(h) {
  const giaGoi = Number(h.tien.tien_goi) + Number(h.giam_gia || 0), giam = Number(h.giam_gia || 0);
  const goiChiTiet = goiGom(h).concat(h.anhChon && h.anhChon.length ? ['Concept / makeup đã chọn: ' + h.anhChon.join(', ')] : []);
  const hang = [{ ten: tenGoi(h), chiTiet: goiChiTiet, donGia: giaGoi, sl: 1, uuDai: giam, thanhTien: giaGoi - giam, la: 'goi' }];
  for (const p of h.phatSinh || []) {
    const soCu = p.mo_ta === PS_SO_CU, sl = soCu ? 1 : Number(p.so_luong) || 1;
    hang.push({ ten: soCu ? 'Phát sinh thêm' : p.mo_ta, chiTiet: soCu ? (h.psChiTiet && h.psChiTiet.length ? h.psChiTiet : ['In ảnh, dịch vụ ngoài gói']) : [],
      donGia: soCu ? Number(p.thanh_tien) : Number(p.don_gia), sl, uuDai: 0, thanhTien: Number(p.thanh_tien) });
  }
  const thu = (h.phieuThu || []).filter((p) => !p.huy && !p.dao).map((p) => ({
    luc: String(p.luc || '').slice(0, 5), so: Number(p.so_tien), hinhThuc: p.hinh_thuc === 'tien_mat' ? 'tiền mặt' : 'chuyển khoản',
  }));
  const tamTinh = hang.reduce((a, r) => a + r.donGia * r.sl, 0), uuDai = hang.reduce((a, r) => a + r.uuDai, 0);
  return { hang, thu, tamTinh, uuDai, tong: Number(h.tien.tong_hoa_don), daThu: Number(h.tien.da_thu), conLai: Number(h.tien.con_lai), thua: Number(h.tien.tien_thua || 0) };
}

const loiCamOn = (ten) => (/^(chị|anh|mẹ|bố|ba|cô|chú|bé|gia đình)\s/i.test(ten || '') ? 'Cảm ơn ' : 'Cảm ơn gia đình ') + (ten || '');
const soGon = (n) => (Math.round(Number(n) || 0)).toLocaleString('vi-VN');

export async function veHoaDon(h) {
  try { await document.fonts.load(`700 30px "Be Vietnam Pro"`); await document.fonts.load(`400 30px "Be Vietnam Pro"`); } catch { /* phông dự phòng */ }
  const d = dongHoaDon(h);
  const c = document.createElement('canvas'); const ctx = c.getContext('2d');
  const hn = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
  const R = W - LE;                                                  // mép phải nội dung
  const X = { stt: LE, ten: LE + 56, donGia: 690, sl: 745, uuDai: 870, thanhTien: R };
  const RONG_TEN = X.donGia - 120 - X.ten;

  // Lượt 1: đo chiều cao; lượt 2: vẽ thật.
  const ve = (that) => {
    let y = 0;
    const chu = (s, x, yy, co, dam, mau, canh = 'left', nghieng = false) => {
      if (!that) return;
      ctx.font = `${nghieng ? 'italic ' : ''}${dam ? 700 : 400} ${co}px ${PHONG}`; ctx.fillStyle = mau; ctx.textAlign = canh; ctx.fillText(s, x, yy);
    };
    const ke = (yy, mau = MAU.vien, day = 2, x0 = LE, x1 = R) => { if (that) { ctx.fillStyle = mau; ctx.fillRect(x0, yy, x1 - x0, day); } };
    const hop = (x, yy, w, hh, nen, vien) => {
      if (!that) return;
      ctx.beginPath(); ctx.roundRect(x, yy, w, hh, 14); ctx.fillStyle = nen; ctx.fill();
      if (vien) { ctx.strokeStyle = vien; ctx.lineWidth = 2; ctx.stroke(); }
    };
    const nhanNho = (s, x, yy, mau = MAU.nhat) => chu(s.toUpperCase(), x, yy, 19, true, mau);

    // ── nền giấy + dải màu ──
    if (that) { ctx.fillStyle = MAU.the; ctx.fillRect(0, 0, W, c.height); ctx.fillStyle = MAU.nhan; ctx.fillRect(0, 0, W, 12); }

    // ── đầu phiếu: logo · tên · liên hệ ──
    y = 60;
    hop(LE, y, 76, 76, MAU.nhan); chu('H', LE + 38, y + 54, 44, true, '#fff', 'center');
    chu(STUDIO.ten, LE + 100, y + 34, 34, true, MAU.chu); chu(STUDIO.phu, LE + 100, y + 68, 22, false, MAU.nhan);
    chu(STUDIO.lienHe, R, y + 34, 21, false, MAU.nhat, 'right'); chu(STUDIO.diaChi, R, y + 64, 21, false, MAU.nhat, 'right');
    y += 106; ke(y);

    // ── tiêu đề + số phiếu ──
    y += 52; nhanNho('Phiếu thanh toán dịch vụ', LE, y, MAU.nhan);
    ctx.font = `700 44px ${PHONG}`;
    const tieuDe = catDong(ctx, loiCamOn(h.khach), 600);
    tieuDe.forEach((t, i) => chu(t, LE, y + 56 + i * 54, 44, true, MAU.chu));
    chu('Số phiếu', 820, y + 26, 21, false, MAU.nhat, 'right'); chu(h.ma, R, y + 26, 21, true, MAU.chu, 'right');
    chu('Ngày lập', 820, y + 58, 21, false, MAU.nhat, 'right'); chu(ngayDu(hn), R, y + 58, 21, true, MAU.chu, 'right');
    y += 56 + (tieuDe.length - 1) * 54 + 34;

    // ── ô thông tin: khách hàng | buổi chụp ──
    const khach = [h.khach, h.sdt ? '☎ ' + h.sdt.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3') : '', h.dia_chi ? '⌂ ' + h.dia_chi : ''].filter(Boolean);
    const buoi = [
      `Ngày chụp: ${h.ngay_chup ? ngayDu(h.ngay_chup) + (h.gio_chup ? ' · ' + String(h.gio_chup).slice(0, 5) : '') : 'sẽ hẹn sau'}`,
      h.sale_online ? `Tư vấn: ${h.sale_online}` : '',
      h.hen_tra_anh && h.trang_thai < 8 ? `Nhận ảnh dự kiến: ${ngayDu(h.hen_tra_anh)}` : '',
    ].filter(Boolean);
    const cao = 70 + Math.max(khach.length, buoi.length) * 34;
    hop(LE, y, R - LE, cao, MAU.nen);
    const giua = LE + (R - LE) / 2 + 20;
    nhanNho('Khách hàng', LE + 26, y + 40); nhanNho('Buổi chụp', giua, y + 40);
    khach.forEach((t, i) => chu(t.length > 38 ? t.slice(0, 37) + '…' : t, LE + 26, y + 78 + i * 34, 23, i === 0, MAU.chu));
    buoi.forEach((t, i) => chu(t, giua, y + 78 + i * 34, 23, false, MAU.chu));
    y += cao + 50;

    // ── bảng dịch vụ ──
    const dauBang = [['STT', X.stt, 'left'], ['DỊCH VỤ / SẢN PHẨM', X.ten, 'left'], ['ĐƠN GIÁ', X.donGia, 'right'], ['SL', X.sl, 'center'], ['ƯU ĐÃI', X.uuDai, 'right'], ['THÀNH TIỀN', X.thanhTien, 'right']];
    for (const [t, x, canh] of dauBang) chu(t, x, y, 19, true, MAU.nhat, canh);
    y += 18; ke(y, MAU.chu, 3);
    d.hang.forEach((r, i) => {
      y += 44;
      chu(String(i + 1).padStart(2, '0'), X.stt, y, 23, false, MAU.nhat);
      ctx.font = `700 24px ${PHONG}`;
      const ten = catDong(ctx, r.la === 'goi' ? r.ten.toUpperCase() : r.ten, RONG_TEN);
      ten.forEach((t, k) => chu(t, X.ten, y + k * 32, 24, true, MAU.chu));
      chu(soGon(r.donGia), X.donGia, y, 23, false, MAU.chu, 'right');
      chu(String(r.sl), X.sl, y, 23, false, MAU.chu, 'center');
      chu(r.uuDai ? '-' + soGon(r.uuDai) : '–', X.uuDai, y, 23, false, r.uuDai ? MAU.do : MAU.nhat, 'right');
      chu(soGon(r.thanhTien), X.thanhTien, y, 23, true, MAU.chu, 'right');
      y += (ten.length - 1) * 32 + 10;
      ctx.font = `400 20px ${PHONG}`;
      for (const s of r.chiTiet) for (const [k, t] of catDong(ctx, s, RONG_TEN + 100 - 18).entries()) {
        y += 29; if (!k) chu('•', X.ten, y, 20, true, MAU.nhan); chu(t, X.ten + 18, y, 20, false, MAU.nhat);
      }
      y += 28; ke(y);
    });

    // ── tổng + dấu đã thanh toán ──
    y += 46;
    const yTong = y, L = 540;
    const dongTong = (nhan, so, { co = 22, dam = false, mau = MAU.nhat } = {}) => { chu(nhan, L, y, co, dam, dam ? MAU.chu : MAU.nhat); chu(so, R, y, co, dam, mau, 'right'); y += co + 18; };
    dongTong('Tạm tính (giá gốc)', soGon(d.tamTinh));
    if (d.uuDai) dongTong('Ưu đãi', '-' + soGon(d.uuDai), { mau: MAU.do });
    ke(y - 10, MAU.vien, 2, L, R); y += 30;
    chu('Tổng thanh toán', L, y, 24, true, MAU.chu); chu(tien(d.tong), R, y + 4, 40, true, MAU.chu, 'right'); y += 58;
    dongTong('Đã thanh toán', soGon(d.daThu));
    if (d.thua) dongTong('Tiền thừa (hoàn khách hoặc trừ vào in)', soGon(d.thua), { mau: MAU.xanh });
    else dongTong('Còn lại', soGon(d.conLai), { co: d.conLai ? 26 : 22, dam: !!d.conLai, mau: d.conLai ? MAU.do : MAU.nhat });
    if (!d.conLai && d.daThu > 0 && that) {          // dấu "ĐÃ THANH TOÁN ĐỦ" nghiêng như con dấu
      const ngayCuoi = d.thu.length ? d.thu[d.thu.length - 1].luc + '/' + hn.slice(0, 4) : '';
      ctx.font = `700 32px ${PHONG}`;
      const nua = Math.ceil(ctx.measureText('ĐÃ THANH TOÁN ĐỦ').width / 2) + 34;   // khung ôm theo bề rộng chữ thật
      ctx.save(); ctx.translate(LE + nua + 20, yTong + 70); ctx.rotate(-0.08);
      ctx.strokeStyle = MAU.xanh; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(-nua, -54, nua * 2, 108, 12); ctx.stroke();
      ctx.lineWidth = 1.5; ctx.beginPath(); ctx.roundRect(-nua + 8, -46, nua * 2 - 16, 92, 8); ctx.stroke();
      ctx.fillStyle = MAU.xanh; ctx.textAlign = 'center'; ctx.fillText('ĐÃ THANH TOÁN ĐỦ', 0, 4);
      if (ngayCuoi) { ctx.font = `400 20px ${PHONG}`; ctx.fillText(ngayCuoi, 0, 34); }
      ctx.restore();
    }
    y += 10;

    // ── lịch sử thanh toán ──
    if (d.thu.length) {
      y += 20; ke(y); y += 40;
      ctx.font = `400 20px ${PHONG}`;
      const ls = 'Lịch sử thanh toán: ' + d.thu.map((t) => `${t.luc} · ${t.so < 0 ? 'hoàn ' + soGon(-t.so) : soGon(t.so)} · ${t.hinhThuc}`).join('   |   ');
      catDong(ctx, ls, R - LE).forEach((t, i) => chu(t, LE, y + i * 30, 20, false, MAU.nhat));
      y += catDong(ctx, ls, R - LE).length * 30;
    }

    // ── mã VietQR khi còn phải thu ──
    // Chỉ khi còn tiền phải thu, có số TK trong cau-hinh.js và thư viện vẽ QR (cdnjs) đã tải. Thiếu thư viện vẫn in số TK.
    const tk = TAI_KHOAN_NHAN;
    if (d.conLai > 0 && tk && tk.stk) {
      const nd = noiDungCK(h.ma);
      y += 30; const y0 = y;
      let canh = 0;
      if (typeof window.qrcode === 'function') {
        const qr = window.qrcode(0, 'M'); qr.addData(chuoiVietQR({ bin: tk.bin, stk: tk.stk, soTien: d.conLai, noiDung: nd })); qr.make();
        const n = qr.getModuleCount(), o = Math.floor(260 / (n + 8)); canh = o * (n + 8);
        if (that) {
          ctx.fillStyle = '#fff'; ctx.fillRect(LE, y0, canh, canh); ctx.fillStyle = '#000';
          for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (qr.isDark(r, k)) ctx.fillRect(LE + (k + 4) * o, y0 + (r + 4) * o, o, o);
        }
      }
      const xq = LE + (canh ? canh + 36 : 0);
      nhanNho('Quét mã để chuyển khoản', xq, y0 + 40, MAU.nhan);
      chu(`${tk.nganHang} · ${tk.stk.replace(/(\d{4})(?=\d)/g, '$1 ')}`, xq, y0 + 84, 26, true, MAU.chu);
      chu(tk.chuTk, xq, y0 + 122, 24, false, MAU.chu);
      chu(`Số tiền: ${tien(d.conLai)}`, xq, y0 + 166, 24, true, MAU.do);
      chu(`Nội dung: ${nd}`, xq, y0 + 202, 22, false, MAU.nhat);
      y = y0 + Math.max(canh, 220) + 10;
    }

    // ── điều khoản (chỉ in khi anh Thọ đã đưa câu chữ) ──
    if (DIEU_KHOAN.length) {
      y += 30; ke(y); y += 44; nhanNho('Điều khoản', LE, y); y += 6;
      ctx.font = `400 20px ${PHONG}`;
      for (const s of DIEU_KHOAN) for (const [k, t] of catDong(ctx, s, R - LE - 18).entries()) { y += 29; if (!k) chu('•', LE, y, 20, true, MAU.nhan); chu(t, LE + 18, y, 20, false, MAU.nhat); }
    }

    // ── chân phiếu ──
    y += 40; ke(y); y += 40;
    chu('Home Studio — cảm ơn quý khách đã tin chọn.', LE, y, 20, false, MAU.nhat, 'left', true);
    chu(`Mã phiếu ${h.ma}`, R, y, 20, false, MAU.nhat, 'right');
    y += 44;
    return y;
  };

  c.width = W; c.height = 3000; c.height = Math.ceil(ve(false));
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
