// Nối app với Supabase (dự án HomeStudio, Tokyo). Để TRỐNG thì app chạy bản thử trong trình duyệt (PGlite);
// thêm ?thu vào địa chỉ (index.html?thu#/) cũng ép chạy bản thử dù đã điền.
// Khoá dưới là khoá CÔNG KHAI (publishable) — Supabase thiết kế để nằm trong mã trang web; dữ liệu vẫn khoá bằng
// RLS + đăng nhập (người chưa đăng nhập gọi được 0/14 hàm, đo 08/11/2026).
// TUYỆT ĐỐI không dán khoá secret / service_role vào đây.
export const SUPABASE_URL = 'https://nqmvkurjggoaqiyaapes.supabase.co';
export const SUPABASE_KHOA_CONG_KHAI = 'sb_publishable_3ofCbtu14E0NJ0tgqrcsxw_4peUxAfc';

// Tài khoản NHẬN tiền in trên ảnh hoá đơn (mã VietQR) — anh Thọ gửi 09/11/2026 kèm ảnh QR của Techcombank.
// Đây là thông tin đưa cho khách, không phải bí mật. Để trống stk thì hoá đơn không in mã QR.
// BIN Napas: Techcombank 970407 · Vietcombank 970436 · MB 970422 · VietinBank 970415 · BIDV 970418 · ACB 970416.
// App album chọn ảnh (Apps Script, vanthohubt@) — khách mở ?a=<mã>, studio mở ?ql, CRM đọc tóm tắt ?api=tom&a=<mã>.
export const ALBUM_URL = 'https://script.google.com/macros/s/AKfycbwLyheNPcx8mxaY1uMR_XtlvBsRs2QYLtl-SmIneu9F2w0CDvgSiPYaKNR6QBU0nPA/exec';

export const TAI_KHOAN_NHAN ={ bin: '970407', nganHang: 'Techcombank', stk: '9961818905', chuTk: 'NGUYEN VAN THO' };
