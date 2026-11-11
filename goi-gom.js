// "Gói gồm những gì" để in lên hợp đồng gửi khách (anh Thọ 11/11/2026: "cần đủ thông tin gói chụp, dịch vụ gói, phát sinh,
// kiểu phải là hợp đồng dịch vụ"). Không import gì ⇒ phép thử Node gọi thẳng: node crm/app/thu-goi-gom.mjs
//
// Cột goi.noi_dung TRỘN ghi chú nội bộ ("số tấm chưa ghi rõ trên bảng giá", "gói đang lỗ", "tiền nằm ở phat_sinh"…) với mô
// tả cho khách ⇒ tách theo câu, bỏ câu có dấu hiệu nội bộ, bỏ ngoặc ghi chú, bỏ câu bán thêm ("Thêm concept 400k…" không phải
// thứ có sẵn trong gói). Thêm gói mới mà câu nội bộ lọt ra ⇒ thêm mẫu vào NOI_BO, chạy lại phép thử.

export const TEN_CL = { UV: 'phủ UV', GO: 'gỗ Lami', TT: 'thuỷ tinh', MICA: 'mica gương', G4K: 'gương 4K', KC: 'kim cương', LED: 'LED 8K' };

const NOI_BO = /bảng giá|phat_sinh|nhập sổ|phân tích|đang lỗ|chưa có|chưa ghi|chưa chốt|dòng family|tiết kiệm|giá mua riêng|chỉ lấy file|wiki|giá theo|\/người|không xác định/i;
const BAN_THEM = /^thêm\s/i;

/** Các câu khách nên đọc trong goi.noi_dung. */
export function cauChoKhach(noiDung) {
  return String(noiDung || '')
    .replace(/\s*\((?:[^()]*(?:thêm từ|dòng|bảng giá|chưa)[^()]*)\)/gi, '')   // ngoặc ghi chú nội bộ
    .split(/(?<=\.)\s+/)
    .map((c) => c.trim().replace(/\.$/, ''))
    .filter((c) => c && !NOI_BO.test(c) && !BAN_THEM.test(c))
    .map((c) => c.replace(/\bKHÔNG\b/g, 'không'));
}

/** Tên gói in cho khách. Soát 1.448 hợp đồng thật 11/11/2026: tên gói danh mục có ghi chú nội bộ ("Beauty (sổ cũ, không rõ
 *  bậc)", "Phóng sự cưới cũ – Gói 1") và gói KHAC = ca nhập sổ không xác định được gói ⇒ không in chữ "Khác" lên phiếu. */
export function tenGoi(h) {
  if (h.goi_ma === 'KHAC' || !h.goi_ten) return 'Dịch vụ Home Studio';
  return String(h.goi_ten).replace(/\s*\([^()]*(?:sổ cũ|không rõ)[^()]*\)/gi, '').replace(/\s+cũ(?=\s*[–-]|$)/i, '').trim();
}

/** Danh sách dòng "Gói gồm" từ chi tiết hợp đồng (crm_chi_tiet). */
export function goiGom(h) {
  const cau = cauChoKhach(h.noi_dung), noi = cau.join(' ').toLowerCase(), ra = [];
  if (h.so_boi_canh) ra.push(/buổi|photographer|videographer/i.test(h.so_boi_canh) ? h.so_boi_canh : 'Bối cảnh: ' + h.so_boi_canh);
  if (h.so_anh_sua) ra.push(`${h.so_anh_sua} ảnh chỉnh sửa hoàn thiện`);
  if (h.qua_in_co && !noi.includes(String(h.qua_in_co).toLowerCase())) ra.push(`Tặng ảnh in ${h.qua_in_co}${h.qua_in_cl ? ' ' + (TEN_CL[h.qua_in_cl] || h.qua_in_cl) : ''}`);
  if (h.qua_checkin && !noi.includes('check-in')) ra.push(`Tặng ảnh ${h.qua_checkin.replace('Gỗ', 'gỗ')} khi check-in tại studio`);
  return ra.concat(cau);
}

// ── Chi tiết phát sinh của ca NHẬP TỪ SỔ (anh Thọ 11/11/2026: "phát sinh cần ghi chi tiết những gì phát sinh").
// Sổ chỉ có TỔNG tiền phát sinh; món nào nằm ở cột GHI CHÚ, viết tắt kiểu "40x60 gỗ lên thủy tinh tkm22 = 800k 1 make bà = 300k".
// Máy tách thành từng dòng + viết lại cho khách đọc được, rồi SALE SOÁT/SỬA trong hộp trước khi dựng phiếu (máy không đoán chắc được).
const TIEN_TAT = /(?:=|:)?\s*(-?\d+(?:[.,]\d+)?)\s*(k|tr\d{0,3}|triệu)(?![a-zà-ỹ])/gi;
const doiTien = (so, dv) => {
  dv = dv.toLowerCase(); let n;
  if (dv === 'k') n = Number(so.replace(',', '.')) * 1000;
  else { const m = /^tr(\d*)$/.exec(dv) || ['', '']; n = Number(so.replace(',', '.')) * 1e6 + (m[1] ? Number(m[1].padEnd(3, '0')) * 1000 : 0); }
  return Math.round(n).toLocaleString('vi-VN') + 'đ';
};
export function ghiChuSo(ghiChuHopDong) {
  const m = /(?:^|·)\s*Ghi chú:\s*([^·]*)/.exec(String(ghiChuHopDong || ''));
  return m ? m[1].trim() : '';
}
export function psTuSo(gc) {
  let s = String(gc || '').replace(/\s+/g, ' ').trim();
  if (!s) return [];
  s = s.replace(/(lên|sang|gương|led)\s+([48])k(?![a-zà-ỹ])/gi, (x, tu, so) => `${tu} §${so}§`);   // "lên 4k" là chất liệu gương 4K, không phải 4.000đ
  // cắt dòng sau mỗi cụm tiền ("= 800k", ": 1tr6", "300k") và ở dấu ; , xuống dòng
  s = s.replace(TIEN_TAT, (all, so, dv) => ` = ${doiTien(so, dv)}\n`);
  return s.split(/\n|;|(?:^|\s),\s/).map((d) => d.replace(/^[\s,:=-]+|[\s,:]+$/g, '').replace(/\s*:\s*=/, ' =').replace(/\s+/g, ' ').trim()).filter(Boolean)
    .map((d) => d
      .replace(/(?:gương |led )?§4§/gi, 'gương 4K').replace(/(?:gương |led )?§8§/gi, 'LED 8K').replace(/\btkm\s?(\d+)/gi, '(mẫu TKM$1)').replace(/\bthủy tinh\b/gi, 'thuỷ tinh')
      .replace(/\bmake\b(?!up)/gi, 'makeup').replace(/^(đi|di) lại/i, 'Phí đi lại')
      .replace(/^(?:đổi|đôi)?\s*(\d+x\d+(?:\s+(?:gỗ|mica|UV|thuỷ tinh))?)\s+(lên|sang)\s+/i, (a, co, _x) => `Nâng ảnh ${co} lên `)
      .replace(/^./, (c) => c.toUpperCase()));
}
