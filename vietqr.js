// Chuỗi VietQR (chuẩn EMVCo của Napas) — dựng ngay trên máy, KHÔNG gọi dịch vụ ngoài (img.vietqr.io…)
// để số tiền + mã hợp đồng của khách không rời máy. App ngân hàng nào ở VN cũng quét được.
//
// Cấu trúc (mỗi trường = mã 2 số + độ dài 2 số + giá trị):
//   00 "01"  · 01 "12" (QR động, có số tiền) · 38 { 00 "A000000727" · 01 { 00 BIN · 01 số TK } · 02 "QRIBFTTA" }
//   53 "704" (VND) · 54 số tiền · 58 "VN" · 62 { 08 nội dung CK } · 63 CRC16-CCITT (khởi tạo FFFF) tính trên cả "6304".

const truong = (ma, gt) => ma + String(gt.length).padStart(2, '0') + gt;

export function crc16(s) {
  let crc = 0xffff;
  for (let i = 0; i < s.length; i++) {
    crc ^= s.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/** Nội dung chuyển khoản: bỏ dấu, chỉ chữ số + chữ cái + khoảng trắng + gạch, tối đa 25 ký tự (nhiều ngân hàng cắt). */
export const noiDungCK = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
  .replace(/[^A-Za-z0-9 \-]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 25);

export function chuoiVietQR({ bin, stk, soTien, noiDung }) {
  if (!/^\d{6}$/.test(bin) || !/^\d{4,19}$/.test(stk)) throw new Error('Thiếu hoặc sai mã ngân hàng / số tài khoản trong cau-hinh.js');
  const tien = Math.round(Number(soTien) || 0);
  const nguoiNhan = truong('00', 'A000000727') + truong('01', truong('00', bin) + truong('01', stk)) + truong('02', 'QRIBFTTA');
  let s = truong('00', '01') + truong('01', tien > 0 ? '12' : '11') + truong('38', nguoiNhan) + truong('53', '704');
  if (tien > 0) s += truong('54', String(tien));
  s += truong('58', 'VN');
  const nd = noiDung ? noiDungCK(noiDung) : '';
  if (nd) s += truong('62', truong('08', nd));
  s += '6304';
  return s + crc16(s);
}
