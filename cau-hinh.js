// Nối app với Supabase (dự án HomeStudio, Tokyo). Để TRỐNG thì app chạy bản thử trong trình duyệt (PGlite);
// thêm ?thu vào địa chỉ (index.html?thu#/) cũng ép chạy bản thử dù đã điền.
// Khoá dưới là khoá CÔNG KHAI (publishable) — Supabase thiết kế để nằm trong mã trang web; dữ liệu vẫn khoá bằng
// RLS + đăng nhập (người chưa đăng nhập gọi được 0/14 hàm, đo 08/11/2026).
// TUYỆT ĐỐI không dán khoá secret / service_role vào đây.
export const SUPABASE_URL = 'https://nqmvkurjggoaqiyaapes.supabase.co';
export const SUPABASE_KHOA_CONG_KHAI = 'sb_publishable_3ofCbtu14E0NJ0tgqrcsxw_4peUxAfc';
