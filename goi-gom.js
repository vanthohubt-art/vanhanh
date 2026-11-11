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
