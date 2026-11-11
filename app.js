// App vận hành Home Studio — giao diện theo bố cục hệ Sky Studio (anh Thọ chốt 09/11/2026).
// Menu xếp theo DÒNG CHẢY MỘT KHÁCH: Bán hàng → Chụp & hậu kỳ → Thu chi. Màn hình chỉ gọi kho.js.
// Học từ chỗ Sky hỏng (output/2026-10-28-phuong-an-web-crm-home-studio mục 1.3): việc mỗi nhóm tối đa 8 dòng,
// 8 trạng thái đánh số liền, không mục menu rỗng, hoá đơn có tiền thừa.
import * as kho from './kho.js?v=20261110i';
import { moHoaDon, moQrThu, PS_SO_CU } from './hoa-don.js?v=20261111e';
import { psTuSo, ghiChuSo } from './goi-gom.js?v=20261111e';
import * as mr from './mo-rong.js?v=20261111d';
import * as kh from './khoang.js?v=20261110b';

const $ = (s, g = document) => g.querySelector(s);
const tien = (n) => (Math.round(Number(n) || 0)).toLocaleString('vi-VN') + 'đ';
const trieu = (n) => { const v = Number(n) || 0; return Math.abs(v) >= 1e6 ? (v / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + 'tr' : tien(v); };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const homNay = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);   // giờ Việt Nam
const congNgay = (d, n) => new Date(new Date(d + 'T12:00:00Z').getTime() + n * 864e5).toISOString().slice(0, 10);
const ngayVN = (d) => (d ? d.slice(8, 10) + '/' + d.slice(5, 7) : '—');
const THU = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const THU_DAI = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const thuCua = (d) => new Date(d + 'T12:00:00Z').getUTCDay();
const VAI = { chup: 'Chụp', pts: 'PTS', stylist: 'Stylist', makeup: 'Makeup', sale_offline: 'Sale tại studio' };
const NGUON = { quang_cao: 'Quảng cáo', gioi_thieu: 'Người quen giới thiệu', khach_cu: 'Khách cũ', tu_tim: 'Tự tìm (Google, fanpage)', chua_ro: 'Chưa rõ' };
const KHUNG = [['08:00', '10:00'], ['10:00', '12:00'], ['12:00', '14:00'], ['14:00', '16:00'], ['16:00', '18:00'], ['18:00', '21:00']];
let DM, toi = '', vaiToi = [], tcNho = null;
const coTien = () => vaiToi.includes('sale_online') || vaiToi.includes('chu');
const KHONG_TIEN = '<div class="the mo">Chỉ sale online hoặc anh Thọ ghi tiền (phát sinh, thu tiền). Cần thêm khoản nào thì nhắn sale.</div>';

const ICON = {
  nha: '<path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z"/>',
  tim: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  hd: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M12 12v6M9 15h6"/>',
  hop: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
  lich: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/>',
  hk: '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
  vi: '<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18M16 15h2"/>',
  dt: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
  ca: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  tien: '<path d="M12 3v18M17 7H9.5a3 3 0 0 0 0 6h5a3 3 0 0 1 0 6H6"/>',
  canh: '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0"/>',
  may: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="4"/>',
  dich: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  them: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M19 8v6M16 11h6"/>',
  anh: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',
  co: '<path d="m14 4 6 6-9 9H5v-6z"/><path d="M5 19l-2 2"/>',
  qua: '<rect x="3" y="8" width="18" height="13" rx="1"/><path d="M3 12h18M12 8v13M12 8S10 3 7.5 4 9 8 12 8s3.5-3 4.5-4S12 8 12 8"/>',
  video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3"/>',
  tim2: '<path d="M12 20s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9z"/>',
  sao: '<path d="m12 3 2.8 5.8 6.2.9-4.5 4.4 1 6.2L12 17.4 6.5 20.3l1-6.2L3 9.7l6.2-.9z"/>',
  tui: '<path d="M5 8h14l-1 13H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  gui: '<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>',
};
const ic = (k) => `<svg viewBox="0 0 24 24">${ICON[k] || ''}</svg>`;

// Menu theo dòng chảy một khách. Chỉ có mục đã làm thật — không để mục rỗng (bài học Sky: 234 sản phẩm, 0 đang hoạt động).
// 09/11 (lần 2): anh Thọ muốn ĐỦ menu như Sky ⇒ mỗi mục đều có màn hình thật (008-mo-rong.sql + mo-rong.js).
const MENU = [
  { tt: '', ten: 'Trang chủ', ic: 'nha' },
  { tt: 'toi', ten: 'Việc của tôi', ic: 'ca' },
  { tt: 'tim', ten: 'Tìm khách', ic: 'tim' },
  { tt: 'ke-hoach', ten: 'Kế hoạch tháng', ic: 'dich', tien: true },
  { nhom: 'Bán hàng' },
  { tt: 'lead', ten: 'Khách tiềm năng', ic: 'them' },
  { tt: 'moi', ten: 'Lên hợp đồng', ic: 'hd', tien: true },
  { tt: 'concept', ten: 'Ảnh mẫu concept', ic: 'anh' },
  { tt: 'makeup', ten: 'Ảnh makeup', ic: 'co' },
  { tt: 'san-pham', ten: 'Sản phẩm & dịch vụ', ic: 'hop' },
  { nhom: 'Chụp & hậu kỳ' },
  { tt: 'lich', ten: 'Lịch chụp', ic: 'lich' },
  { tt: 'hau-ky', ten: 'Hậu kỳ', ic: 'hk' },
  { tt: 'han-giao', ten: 'Hạn giao ảnh', ic: 'qua' },
  { tt: 'video', ten: 'Video khách', ic: 'video' },
  { nhom: 'Sau chụp' },
  { tt: 'cskh', ten: 'Chăm sóc khách', ic: 'tim2' },
  { tt: 'cho-lay', ten: 'Chờ khách lấy ảnh', ic: 'qua' },
  { tt: 'chat-luong', ten: 'Chất lượng dịch vụ', ic: 'sao' },
  { nhom: 'Thu chi' },
  { tt: 'cong-no', ten: 'Công nợ & thu tiền', ic: 'vi', tien: true },
  { tt: 'chi', ten: 'Chi cửa hàng', ic: 'tui', tien: true },
  { tt: 'hoa-hong', ten: 'Lương & hoa hồng', ic: 'tien' },
  { nhom: 'Marketing' },
  { tt: 'dang-bai', ten: 'Đăng bài Facebook', ic: 'gui' },
];
const laChu = () => vaiToi.includes('chu');
// Ngữ cảnh đưa cho các màn hình ở mo-rong.js.
const ctx = () => ({ kho, DM, toi, vaiToi, coTien, laChu, $, tien, trieu, esc, homNay, congNgay, ngayVN, THU, theSo, dauTrang, theCa, sdtHtml, bao, chay, trang: $('#trang') });

function bao(s, loi) {
  const b = Object.assign(document.createElement('div'), { className: 'bao' + (loi ? ' loi' : ''), textContent: s });
  document.body.appendChild(b); setTimeout(() => b.remove(), loi ? 4500 : 2200);
}
async function chay(fn) { try { await fn(); } catch (e) { console.error(e); bao(e.message || String(e), true); } }
const nhanTT = (so, ten) => `<span class="nhan tt${so}">${so}. ${esc(ten)}</span>`;
const tenTT = (so) => DM.trangThai.find((t) => t.so === so)?.ten || '';
// Nút gọi là <span>, KHÔNG phải <a>: nó nằm trong thẻ ca vốn là <a>, mà trình duyệt không cho <a> lồng <a> —
// gặp là tự đóng thẻ ngoài và đẩy nửa sau thẻ ca ra ngoài (đụng 09/11: thẻ lịch mất cả trạng thái lẫn ekip).
const sdtHtml = (s) => (s ? `<span class="sdt" role="link" tabindex="0" onclick="event.preventDefault();event.stopPropagation();location.href='tel:${esc(s)}'">${ic('dt')}${esc(s.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3'))}</span>` : '<span class="mo">chưa có SĐT</span>');
const dauTrang = (nhan, tieuDe, moTa, phai = '') => `<div class="dau-trang"><div><div class="nhan-nho">${nhan}</div><h1>${tieuDe}</h1>${moTa ? `<div class="mo">${moTa}</div>` : ''}</div>${phai ? `<div class="phai">${phai}</div>` : ''}</div>`;
const theSo = (href, icon, mau, nhan, so, phu) => `<a class="o-so" href="${href}"><span class="bieu" style="background:${mau[0]};color:${mau[1]}">${ic(icon)}</span><span class="chu"><small>${nhan}</small><b>${so}</b><span class="phu">${phu}</span></span></a>`;

function theCa(h, phu = '') {
  return `<a class="the-ca vien-tt${h.trang_thai}" href="#/ca/${h.id}">
    <div class="hang"><span class="gio">${h.ngay_chup ? `${h.gio_chup || ''} ${THU[thuCua(h.ngay_chup)]}, ${ngayVN(h.ngay_chup)}${h.ngay_chup.slice(0, 4) !== homNay().slice(0, 4) ? '/' + h.ngay_chup.slice(0, 4) : ''}` : h.so_cu ? `Sổ không ghi ngày${h.thang_so ? ' · tháng ' + h.thang_so : ''}` : 'Chưa có lịch'}</span>${nhanTT(h.trang_thai, h.trang_thai_ten || tenTT(h.trang_thai))}</div>
    <div class="hang"><span class="ten">${esc(h.khach)}</span>${h.tong_hoa_don != null ? `<span class="tien">${tien(h.tong_hoa_don)}</span>` : ''}</div>
    <div class="phu">${esc(h.goi)} · ${h.ma}${h.hen_tra_anh ? ' · hẹn trả ' + ngayVN(h.hen_tra_anh) : ''}</div>
    <div class="hang">${sdtHtml(h.sdt)}<span style="margin-left:auto">${h.con_lai ? `<span class="nhan do">còn ${tien(h.con_lai)}</span>` : h.tien_thua ? `<span class="nhan vang">thừa ${tien(h.tien_thua)}</span>` : h.tong_hoa_don != null ? '<span class="nhan xanh">đã đủ</span>' : ''}</span></div>
    ${phu}${h.can_sua_lai ? '<div><span class="nhan do">cần sửa lại</span></div>' : ''}
  </a>`;
}

// ═════════ TRANG CHỦ ═════════
const BO_PHAN = { sale: ['Sale · tư vấn', 'Chốt lịch, thu cọc, xếp ekip'], hau_ky: ['Hậu kỳ', 'Gửi ảnh gốc, chỉnh, trả ảnh đúng hạn'], cskh: ['CSKH · thu ngân', 'Nhắc khách chọn ảnh, thu nốt tiền'] };
const NHOM_GAP = ['qua_hen', 'thieu_tho', 'sap_chup_chua_coc'];
// Đối chiếu sổ Sheet ⇄ CRM đêm qua (Apps Script 21:00, crm/db/023) — chỉ chủ. Không chặn trang chủ: lỗi thì im.
async function veDoiChieuDem() {
  const o = $('#dc-dem'); if (!o || !laChu()) return;
  let g; try { g = await kho.ham('crm_doi_chieu_dem_moi', { p_ai: toi }); } catch { return; }
  if (!g) return;
  const k = g.ket_qua || {}, dc = k.doi_chieu || {}, cn = k.cap_nhat || {};
  const qua = g.ngay < congNgay(homNay(), -1);
  const ds = [['Có ở Sheet, chưa có trong app', dc.chi_sheet || [], (x) => `${ngayVN(x.ngay)} · ${esc(x.ten)}${x.sdt ? ' · ' + esc(x.sdt) : ''}`],
    ['Có trong app, chưa có ở Sheet', dc.chi_crm || [], (x) => `${ngayVN(x.ngay)} · <a href="#/tim/${encodeURIComponent(x.ma)}">${x.ma}</a> · ${esc(x.ten)}`],
    ['Lệch tiền', dc.lech_tien || [], (x) => `${ngayVN(x.ngay)} · <a href="#/tim/${encodeURIComponent(x.ma)}">${x.ma}</a> · ${esc(x.ten)}: tổng Sheet ${tien(x.tong_so)} / app ${tien(x.tong_crm)} · thu ${tien(x.thu_so)} / ${tien(x.thu_crm)}`],
    ['Một ca có hai bản trong CRM', dc.hai_ban || [], (x) => `${ngayVN(x.ngay)} · ${esc(x.ten)} · ${x.ma_so} & ${x.ma_app}`]].filter(([, d]) => d.length);
  const mau = k.dung || qua ? 'var(--do)' : ds.length ? 'var(--vang, #C98A00)' : 'var(--xanh)';
  o.innerHTML = `<div class="the" style="border-color:${mau}"><div class="dau-the"><h2>Đối chiếu sổ ⇄ app · ${ngayVN(g.ngay)}</h2><span class="phai mo">chạy ${g.luc.slice(11)}</span></div>
    ${qua ? '<p style="color:var(--do);margin:0 0 6px"><b>Đêm qua máy KHÔNG chạy</b> — xem mục Thực thi của Apps Script "CRM doi chieu so".</p>' : ''}
    ${k.dung ? `<p style="color:var(--do);margin:0"><b>Máy dừng, không ghi gì:</b> ${(k.loi || []).map(esc).join(' · ')}</p>` : `
    <p class="mo" style="margin:0 0 6px">Sổ → CRM: ${(cn.sua || []).length} ô cập nhật${(cn.ma_moi || []).length ? ' · thêm ' + cn.ma_moi.length + ' ca cũ' : ''}${(cn.bo_qua || []).length ? ' · giữ bản app ' + cn.bo_qua.length + ' ô' : ''} · so ${dc.so_ca_so || 0} ca sổ với ${dc.so_ca_crm || 0} ca CRM từ ${ngayVN(dc.tu || g.tu)}</p>
    ${ds.length ? ds.map(([t, d, f]) => `<details style="margin:4px 0"><summary><b>${t}: ${d.length}</b></summary><div class="mo" style="margin:4px 0 0 14px">${d.map(f).join('<br>')}</div></details>`).join('')
      : '<p style="margin:0;color:var(--xanh)"><b>✓ Sheet và app khớp</b></p>'}`}</div>`;
}

async function trangChu() {
  const tc = await kho.trangChu(); tcNho = tc; veDaiGap(tc);
  setTimeout(veDoiChieuDem, 0);
  const thang = tc.thang.slice(5, 7) + '/' + tc.thang.slice(0, 4);
  const tongViec = tc.viec.reduce((s, v) => s + v.so, 0);
  const theoBP = {};
  for (const v of tc.viec) (theoBP[v.bo_phan] ||= []).push(v);
  $('#trang').innerHTML = dauTrang(`Trung tâm điều hành · ${THU_DAI[thuCua(tc.hom_nay)]}, ${ngayVN(tc.hom_nay)}/${tc.hom_nay.slice(0, 4)}`, `Tổng quan tháng ${thang}`,
    'Một màn hình để cả đội biết hôm nay cần làm gì.', (coTien() ? `<a class="nut" href="#/moi">${ic('hd')} Lên hợp đồng</a> ` : '') + '<a class="nut phu" href="#/toi">Việc của tôi</a>') + `
    <div class="so-lieu">
      ${theSo('#/tim', 'hd', ['var(--tt6n)', 'var(--tt6c)'], 'Hợp đồng mới trong tháng', tc.hd_moi.so, trieu(tc.hd_moi.tien))}
      ${theSo('#/cong-no', 'tien', ['var(--xanh-nhat)', 'var(--xanh)'], 'Thực thu trong tháng', trieu(tc.thuc_thu.tien), tc.thuc_thu.so + ' phiếu thu')}
      ${theSo('#/cong-no', 'canh', ['var(--do-nhat)', 'var(--do)'], 'Công nợ cần thu', trieu(tc.cong_no.tien), tc.cong_no.so + ' hợp đồng')}
      ${theSo('#/lich/' + tc.hom_nay + '/thang', 'lich', ['var(--tt8n)', 'var(--tt8c)'], 'Ca chụp trong tháng', tc.ca_thang.so, tc.ca_thang.xong + ' ca đã hoàn thành')}
      ${theSo('#/', 'ca', ['var(--nhan-nhat)', 'var(--nhan-dam)'], 'Việc đang chờ cả đội', tongViec, tc.gap ? `<span style="color:var(--do);font-weight:700">${tc.gap} việc gấp</span>` : 'không có việc gấp')}
    </div>
    <div id="dc-dem"></div>
    <div class="hai-cot">
      <div class="the">
        <div class="dau-the"><div><div class="nhan-nho mo" style="font-weight:700;color:var(--nhan);font-size:11px">LỊCH CHỤP HÔM NAY</div><h2>${tc.lich_hom_nay.length} ca cần phối hợp</h2></div>
          <a class="phai mo" href="#/lich">Xem toàn bộ lịch ›</a></div>
        ${tc.lich_hom_nay.length ? tc.lich_hom_nay.map((c) => `
          <a class="dong-ca" href="#/ca/${c.id}">
            <span class="gio">${c.gio || '--:--'}</span>
            <span><span class="ten">${esc(c.khach)}</span><br><span class="phu">${esc(c.goi)} · ${c.ekip.length ? c.ekip.map((e) => esc(e.ten)).join(', ') : '<b style="color:var(--do)">chưa xếp ekip</b>'}</span></span>
            <span style="text-align:right">${nhanTT(c.trang_thai, c.trang_thai_ten)}${c.con_lai ? `<br><span class="phu" style="color:var(--do)">còn ${tien(c.con_lai)}</span>` : ''}</span>
          </a>`).join('') : '<div class="trong">Hôm nay không có ca chụp.</div>'}
        ${tc.ca_cu_mo ? `<div class="canh" style="margin:12px 0 0">${ic('canh')} <b>${tc.ca_cu_mo} ca cũ</b> (chụp hơn 45 ngày trước) chưa hoàn thành — nhiều nhà <b>chưa đến lấy ảnh in</b>. <a href="#/cho-lay">Xem danh sách chờ khách lấy ảnh</a>.</div>` : ''}
      </div>
      <div>
        <div class="dau-the"><div><div class="nhan-nho" style="font-weight:700;color:var(--nhan);font-size:11px">CÔNG VIỆC CẦN XỬ LÝ</div><h2>${tongViec} việc đang chờ</h2></div>
          <span class="phai mo">Mỗi nhóm hiện 8 việc gấp nhất</span></div>
        ${Object.entries(BO_PHAN).map(([k, [ten, mo]]) => {
          const ds = theoBP[k] || [];
          const tong = ds.reduce((s, v) => s + v.so, 0);
          return `<div class="bo-phan"><div class="dau-bp"><div><b>${ten}</b><div class="mo nho">${mo}</div></div><span class="tong-bp">${tong}</span></div>
            ${ds.length ? ds.map((v) => `<div class="nhom-viec"><div class="ten-nhom">${v.ten} <span class="nhan ${NHOM_GAP.includes(v.nhom) ? 'do' : ''}">${v.so}</span></div>
              ${v.ds.map((x) => `<a class="viec ${NHOM_GAP.includes(v.nhom) ? 'gap' : ''}" href="#/ca/${x.id}"><span class="ten">${esc(x.khach)}</span><span class="mo nho">${esc(x.goi)}</span><span class="ly-do">${esc(x.ly_do)}</span></a>`).join('')}
              ${v.so > v.ds.length ? `<div class="con-nua">… và ${v.so - v.ds.length} việc nữa</div>` : ''}</div>`).join('')
              : '<div class="nhom-viec mo">Không có việc chờ ✓</div>'}
          </div>`;
        }).join('')}
      </div>
    </div>`;
}

function veDaiGap(tc) {
  const d = $('#dai-gap');
  if (!tc || !tc.gap || !coTien()) { d.hidden = true; return; }
  const dem = (k) => tc.viec.find((v) => v.nhom === k)?.so || 0;
  d.innerHTML = `<b>${tc.gap} việc cần xử lý ngay</b>${dem('qua_hen') ? `<span>${dem('qua_hen')} ca quá hẹn trả ảnh</span>` : ''}${dem('thieu_tho') ? `<span>${dem('thieu_tho')} ca sắp chụp chưa xếp thợ</span>` : ''}${dem('sap_chup_chua_coc') ? `<span>${dem('sap_chup_chua_coc')} ca sắp chụp chưa thu cọc</span>` : ''}<span class="xem">Xem ›</span>`;
  d.hidden = false;
}
async function lamMoiDaiGap() { try { tcNho = await kho.trangChu(); veDaiGap(tcNho); } catch { /* không chặn trang */ } }

// ═════════ TÌM KHÁCH / DANH SÁCH CA ═════════
async function trangTim(q0 = '') {
  const loc = JSON.parse(sessionStorage.getItem('loc') || '{}');
  if (q0) loc.tim = q0;
  $('#trang').innerHTML = dauTrang('Bán hàng · tra cứu', 'Tìm khách & hợp đồng', 'Tìm theo tên, số điện thoại hoặc mã hợp đồng (HD-…, SO-… là sổ cũ).') + `
    <div class="the" style="padding:12px 14px"><input id="tim" value="${esc(loc.tim || '')}" placeholder="Thu Hà, 0912…, HD-2026-…" style="margin-bottom:10px">
      <div id="loc-tt"><span class="chip ${!loc.trangThai ? 'chon' : ''}" data-tt="">Tất cả</span>${DM.trangThai.map((t) => `<span class="chip ${String(loc.trangThai) === String(t.so) ? 'chon' : ''}" data-tt="${t.so}">${t.so}. ${esc(t.ten)}</span>`).join('')}</div></div>
    <div class="mo" id="dem" style="margin-bottom:8px"></div>
    <div class="luoi-ca" id="ds"></div>`;
  const ve = async () => {
    const l = { tim: $('#tim').value.trim(), trangThai: $('#loc-tt .chon')?.dataset.tt || '' };
    sessionStorage.setItem('loc', JSON.stringify(l));
    const ds = await kho.dsHopDong(l);
    $('#dem').textContent = ds.length >= 300 ? 'Hiện 300 ca mới nhất — gõ thêm để lọc.' : `${ds.length} ca`;
    $('#ds').innerHTML = ds.length ? ds.map((h) => theCa(h)).join('') : '<div class="trong">Không có ca nào khớp.</div>';
  };
  let hen; $('#tim').oninput = () => { clearTimeout(hen); hen = setTimeout(() => chay(ve), 250); };
  document.querySelectorAll('#loc-tt .chip').forEach((c) => (c.onclick = () => { document.querySelectorAll('#loc-tt .chip').forEach((x) => x.classList.remove('chon')); c.classList.add('chon'); chay(ve); }));
  await ve();
  $('#tim').focus();
}

// ═════════ LÊN HỢP ĐỒNG ═════════
function chonGoiHtml(chon) {
  const nhom = {};
  for (const g of DM.goi) (nhom[g.hang_muc_ten] = nhom[g.hang_muc_ten] || []).push(g);
  return '<option value="">— Chọn gói —</option>' + Object.entries(nhom).map(([hm, ds]) =>
    `<optgroup label="${esc(hm)}">${ds.map((g) => `<option value="${g.ma}" ${g.ma === chon ? 'selected' : ''}>${esc(g.ten)} — ${tien(g.gia_ban)}</option>`).join('')}</optgroup>`).join('');
}
function ekipHtml(chon = []) {
  return Object.entries(VAI).map(([vai, nhan]) => {
    const ns = DM.nhanSu.filter((n) => (n.vai || []).includes(vai) || (vai === 'chup' && n.vai.includes('chu')));
    if (!ns.length) return '';
    return `<div style="margin-bottom:6px"><div class="mo">${nhan}</div>${ns.map((n) => {
      const co = chon.some((e) => e.nhan_su_id === n.id && e.vai === vai);
      return `<span class="chip ${co ? 'chon' : ''}" data-ns="${n.id}" data-vai="${vai}">${esc(n.ten)}</span>`;
    }).join('')}</div>`;
  }).join('');
}
const docEkip = (g) => [...g.querySelectorAll('.chip.chon')].map((c) => ({ nhan_su_id: Number(c.dataset.ns), vai: c.dataset.vai }));
function batChip(g) { g.querySelectorAll('.chip').forEach((c) => (c.onclick = () => c.classList.toggle('chon'))); }

async function trangMoi(ngayGoiY = '') {
  if (!coTien()) { $('#trang').innerHTML = '<div class="the">Chỉ sale online hoặc anh Thọ tạo hợp đồng.</div>'; return; }
  const sale = DM.nhanSu.filter((n) => n.vai.includes('sale_online'));
  $('#trang').innerHTML = dauTrang('Bán hàng', 'Lên hợp đồng', 'Tên + SĐT bắt buộc; trùng SĐT thì máy gắn vào hồ sơ khách cũ.') + `
    <div class="ho-so">
      <div>
        <div class="the"><h2>Khách</h2>
          <div class="hai"><label>Số điện thoại *<input id="sdt" type="tel" inputmode="numeric" placeholder="09xx xxx xxx"></label>
            <label>Tên khách *<input id="ten" placeholder="Mẹ bé Na / chị Thu Hà"></label></div>
          <div id="khach-cu" class="mo" style="margin-top:6px"></div>
          <div class="hai" style="margin-top:10px">
            <label>Khách biết đến bên mình qua<select id="nguon">${Object.entries(NGUON).map(([k, v]) => `<option value="${k}" ${k === 'chua_ro' ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
            <label>Bằng chứng nguồn<input id="nguon-bc" placeholder="Câu khách nói, nhãn quảng cáo… — đừng đoán"></label></div>
        </div>
        <div class="the"><h2>Gói và lịch</h2>
          <label>Gói *<select id="goi">${chonGoiHtml()}</select></label>
          <div id="goi-mo" class="mo" style="margin:6px 0 10px"></div>
          <div class="hai">
            <label>Giá gói<input id="gia" type="number" min="0" step="1000"></label>
            <label>Giảm giá<input id="giam" type="number" min="0" step="1000" value="0"></label>
            <label>Ngày chụp<input id="ngay" type="date" value="${esc(ngayGoiY)}"></label>
            <label>Giờ chụp<input id="gio" type="time" step="900"></label>
          </div>
          <div id="trung" style="margin-top:8px"></div>
        </div>
      </div>
      <div>
        <div class="the"><h2>Người phụ trách</h2>
          <label style="margin-bottom:10px">Sale chốt (online)<select id="sale"><option value="">—</option>${sale.map((n) => `<option value="${n.id}" ${n.ma === toi ? 'selected' : ''}>${esc(n.ten)}</option>`).join('')}</select></label>
          <div id="ekip">${ekipHtml()}</div>
        </div>
        <div class="the"><h2>Đặt cọc</h2>
          <div class="hai"><label>Số tiền cọc<input id="coc" type="number" min="0" step="1000" value="0"></label>
            <label>Hình thức<select id="htcoc"><option value="chuyen_khoan">Chuyển khoản</option><option value="tien_mat">Tiền mặt</option></select></label></div>
          <label style="margin-top:10px">Ghi chú cho ekip<textarea id="ghi" rows="3" placeholder="Bé hay ngủ trưa lúc mấy giờ, đi mấy người, khách lo lắng điều gì…"></textarea></label>
        </div>
        <div class="hang-nut"><button class="nut" id="luu">Lưu hợp đồng</button><a class="nut phu" href="#/" onclick="sessionStorage.removeItem('lead')">Huỷ</a></div>
      </div>
    </div>`;
  batChip($('#ekip'));
  const lead = JSON.parse(sessionStorage.getItem('lead') || 'null');
  if (lead) {
    $('#sdt').value = lead.sdt || ''; $('#ten').value = lead.ten || '';
    $('#nguon').value = lead.kenh === 'gioi_thieu' ? 'gioi_thieu' : 'chua_ro';
    $('#nguon-bc').value = 'Khách tiềm năng #' + lead.id + ' · kênh ' + lead.kenh + (lead.nhu_cau ? ' · "' + lead.nhu_cau + '"' : '');
    $('#ghi').value = lead.nhu_cau || '';
  }
  $('#sdt').onblur = () => chay(async () => {
    const k = await kho.timKhach($('#sdt').value);
    $('#khach-cu').innerHTML = k ? `Khách cũ: <b>${esc(k.ten)}</b> · đã có ${k.so_ca} ca. Hợp đồng sẽ gắn vào hồ sơ này.` : '';
    if (k && !$('#ten').value) $('#ten').value = k.ten;
    if (k) $('#nguon').value = 'khach_cu';
  });
  const khachMoi = JSON.parse(sessionStorage.getItem('khach-moi') || 'null');   // 028: bấm từ hồ sơ khách
  if (khachMoi && !lead) {
    sessionStorage.removeItem('khach-moi');
    $('#sdt').value = khachMoi.sdt; $('#ten').value = khachMoi.ten; $('#nguon').value = 'khach_cu';
    if (khachMoi.sdt) $('#sdt').onblur();
  }
  $('#goi').onchange = () => {
    const g = DM.goi.find((x) => x.ma === $('#goi').value);
    $('#gia').value = g ? g.gia_ban : '';
    $('#goi-mo').innerHTML = g ? [g.so_boi_canh, g.so_anh_sua ? g.so_anh_sua + ' ảnh sửa' : '', g.qua_in_co ? `in ${g.qua_in_co}` : '', g.qua_checkin ? `tặng ${g.qua_checkin} khi check-in` : '', g.noi_dung].filter(Boolean).map(esc).join(' · ') : '';
  };
  const kiemTrung = () => chay(async () => {
    const ngay = $('#ngay').value, gio = $('#gio').value;
    if (!ngay) { $('#trung').innerHTML = ''; return; }
    const ca = await kho.lich(ngay, ngay), ekip = docEkip($('#ekip'));
    const phut = (g) => Number(g.slice(0, 2)) * 60 + Number(g.slice(3, 5));
    const trung = gio ? ca.filter((c) => c.gio && Math.abs(phut(c.gio) - phut(gio)) < 120 && c.ekip.some((e) => ekip.some((x) => x.nhan_su_id === e.id))) : [];
    $('#trung').innerHTML = trung.length ? `<div class="canh">⚠ Trùng ekip trong khung 2 giờ: ${trung.map((c) => `${c.gio} ${esc(c.khach)} (${[...new Set(c.ekip.map((e) => e.ten))].map(esc).join(', ')})`).join('; ')}</div>`
      : ca.length ? `<div class="mo">Ngày này đã có ${ca.length} ca: ${ca.map((c) => (c.gio || '?') + ' ' + esc(c.khach)).join(' · ')}</div>` : '<div class="mo">Ngày này còn trống cả ngày.</div>';
  });
  $('#ngay').onchange = kiemTrung; $('#gio').onchange = kiemTrung; $('#ekip').addEventListener('click', kiemTrung);
  if (ngayGoiY) kiemTrung();
  $('#luu').onclick = () => chay(async () => {
    $('#luu').disabled = true;
    try {
      const h = await kho.taoHopDong({
        sdt: $('#sdt').value, ten: $('#ten').value, nguon: $('#nguon').value, nguon_bang_chung: $('#nguon-bc').value.trim(),
        goi_ma: $('#goi').value, gia_goi: $('#gia').value, giam_gia: $('#giam').value, ngay_chup: $('#ngay').value, gio_chup: $('#gio').value,
        sale_online_id: $('#sale').value ? Number($('#sale').value) : null, ekip: docEkip($('#ekip')),
        coc: $('#coc').value, hinh_thuc_coc: $('#htcoc').value, ghi_chu: $('#ghi').value.trim(),
      }, toi);
      if (lead) {   // gắn hợp đồng vào khách tiềm năng ⇒ đo được tỉ lệ chốt
        await kho.ham('crm_luu_lead', { d: { ...lead, sdt: lead.sdt || '', trang_thai: 'da_chot', hop_dong_id: h.id }, p_ai: toi });
        sessionStorage.removeItem('lead');
      }
      bao('Đã tạo ' + h.ma); location.hash = '#/ca/' + h.id;
    } finally { $('#luu').disabled = false; }
  });
}

// ═════════ HỒ SƠ CA ═════════
async function trangCa(id) {
  const h = await kho.chiTiet(id);
  if (!h) { $('#trang').innerHTML = '<div class="the">Không thấy hợp đồng.</div>'; return; }
  try {   // 027: cặp phiếu gõ nhầm / phiếu huỷ — gạch ngang, không in lên hoá đơn khách
    const ph = await kho.ham('crm_phieu_huy', { p_id: id }), goc = new Set(ph.map((x) => x.goc)), dao = new Set(ph.map((x) => x.dao));
    h.phieuThu.forEach((p) => { p.huy = goc.has(p.id); p.dao = dao.has(p.id); });
  } catch { /* máy chủ chưa có 027 */ }
  const huyDuoc = (p) => coTien() && h.trang_thai !== 9 && !p.huy && !p.dao && !(p.ghi_chu || '').startsWith('Cột "Đặt cọc/Thanh toán" của sổ cũ') && p.ghi_chu !== 'Hoàn cọc khi huỷ hợp đồng';
  const cos = [...new Set(DM.giaIn.map((g) => g.co))];
  const quaHen = h.hen_tra_anh && h.hen_tra_anh < homNay() && h.trang_thai < 8;
  $('#trang').innerHTML = `
    <div class="mo" style="margin-bottom:10px"><a href="javascript:history.back()">‹ Quay lại</a></div>
    <div class="the dau-ca">
      <div class="hang-nut" style="align-items:flex-end;gap:14px">
        <span class="gio-lon">${h.gio_chup || '--:--'}</span>
        <span class="mo">${h.ngay_chup ? `${THU_DAI[thuCua(h.ngay_chup)]}, ${ngayVN(h.ngay_chup)}/${h.ngay_chup.slice(0, 4)}` : 'Chưa có ngày chụp'}</span>
        <span class="mo" style="margin-left:auto">Hợp đồng <b>${h.ma}</b></span>${coTien() && h.trang_thai !== 9 ? '<button class="nut phu nho" id="sua-hd">Sửa</button>' : ''}
      </div>
      <h1 style="margin:8px 0 4px"><a href="#/khach/${h.khach_id}" style="color:inherit" title="Hồ sơ khách — mọi lần chụp">${esc(h.khach)}</a></h1>
      <div class="hang-nut">${nhanTT(h.trang_thai, h.trang_thai_ten)} <span class="nhan">${esc(h.goi_ten)}</span> ${NGUON[h.nguon] ? `<span class="nhan">${NGUON[h.nguon]}</span>` : ''}
        ${h.hen_tra_anh ? `<span class="nhan ${quaHen ? 'do' : ''}">hẹn trả ${ngayVN(h.hen_tra_anh)}${quaHen ? ' · quá hẹn' : ''}</span>` : ''} ${h.can_sua_lai ? '<span class="nhan do">cần sửa lại</span>' : ''}</div>
      <div class="hang-nut" style="margin-top:10px">${sdtHtml(h.sdt)}${h.sdt ? `<a class="nut phu nho" href="https://zalo.me/${esc(h.sdt)}" target="_blank" rel="noopener">Zalo</a>` : ''}</div>
    </div>
    <div class="ho-so">
      <div>
        <div id="huy-hd"></div>
        <div class="the">
          <h2>Đổi trạng thái</h2>
          <div class="ds-tt">${DM.trangThai.filter((t) => t.so !== 9 || h.trang_thai === 9).map((t) => `<button data-tt="${t.so}" class="tt${t.so} ${t.so === h.trang_thai ? 'dang' : ''}">${t.so}. ${esc(t.ten)}</button>`).join('')}</div>
          <div class="hai" style="margin-top:12px">
            <label>Ngày chụp<input id="ngay" type="date" value="${h.ngay_chup || ''}"></label>
            <label>Giờ chụp<input id="gio" type="time" step="900" value="${h.gio_chup || ''}"></label>
            <label>Hẹn trả ảnh<input id="hen" type="date" value="${h.hen_tra_anh || ''}"></label>
            <label style="align-self:end;flex-direction:row;display:flex;gap:8px;align-items:center"><input id="sua" type="checkbox" style="width:auto" ${h.can_sua_lai ? 'checked' : ''}> Cần sửa lại</label>
          </div>
          <label style="margin-top:10px">Ghi chú cho ekip<textarea id="ghi" rows="3">${esc(h.ghi_chu || '')}</textarea></label>
          <div class="hang-nut" style="margin-top:10px"><button class="nut nho" id="luu-tt">Lưu thay đổi</button>
            <span class="mo">Sang "Đã chụp" mà chưa có hẹn trả ảnh thì máy tự hẹn 10 ngày.</span></div>
        </div>
        <div class="the">
          <h2>Ekip</h2>
          ${coTien() ? `<div id="ekip">${ekipHtml(h.ekip)}</div><button class="nut nho phu" id="luu-ekip">Lưu ekip</button>`
            : `<div class="hang-nut">${h.ekip.map((e) => `<span class="ekip-chip">${esc(e.ten)} · ${VAI[e.vai] || e.vai}</span>`).join('') || '<span class="mo">Chưa xếp ekip</span>'}</div><p class="mo" style="margin:8px 0 0">Chỉ sale online hoặc anh Thọ sửa ekip.</p>`}
        </div>
        <div id="ho-so-them"></div>
        <div class="the"><h2>Gói gồm</h2>
          <p class="mo" style="margin:0">${[h.so_boi_canh, h.so_anh_sua ? h.so_anh_sua + ' ảnh sửa' : '', h.qua_in_co ? 'in ' + h.qua_in_co : '', h.qua_checkin ? 'tặng ' + h.qua_checkin + ' khi check-in' : '', h.noi_dung].filter(Boolean).map(esc).join(' · ') || '—'}</p></div>
      </div>
      <div>
        <div class="the">
          <div class="dau-the"><h2>Tiền</h2><span class="phai">${coTien() ? `<button class="nut nho" id="anh-hd">${ic('may')} Ảnh hợp đồng</button>` : ''}</span></div>
          <table>
            <tr><td>Gói ${esc(h.goi_ten)}${h.giam_gia ? ` (giảm ${tien(h.giam_gia)})` : ''}</td><td class="so">${tien(h.tien.tien_goi)}</td></tr>
            ${h.phatSinh.map((p) => `<tr><td>${esc(p.mo_ta)}${p.so_luong > 1 ? ' × ' + p.so_luong : ''}${coTien() ? ` <a href="#" data-xoa="${p.id}" class="mo">xoá</a>` : ''}</td><td class="so">${tien(p.thanh_tien)}</td></tr>`).join('')}
            <tr class="tong"><td>Tổng hoá đơn</td><td class="so">${tien(h.tien.tong_hoa_don)}</td></tr>
            ${h.phieuThu.map((p) => `<tr${p.huy || p.dao ? ' class="phieu-huy"' : ''}><td class="mo">${p.dao ? 'Huỷ phiếu' : p.so_tien < 0 ? 'Hoàn' : 'Đã thu'} ${p.luc} · ${p.hinh_thuc === 'tien_mat' ? 'tiền mặt' : 'chuyển khoản'}${p.ghi_chu && !p.dao ? ' · ' + esc(p.ghi_chu) : ''}${p.dao ? ' · ' + esc((p.ghi_chu || '').replace(/^Huỷ phiếu [0-9/]+ [0-9]+:[0-9]+: /, '')) : ''}${p.huy ? ' · <b>đã huỷ</b>' : ''}${huyDuoc(p) ? ` <a href="#" data-huy-pt="${p.id}" class="mo">huỷ</a>` : ''}</td><td class="so">${tien(-p.so_tien)}</td></tr>`).join('')}
            <tr class="tong"><td>${h.tien.tien_thua ? 'Tiền thừa — hoàn khách hoặc trừ vào in' : 'Còn lại'}</td><td class="so" style="color:${h.tien.con_lai ? 'var(--do)' : 'var(--xanh)'}">${tien(h.tien.tien_thua || h.tien.con_lai)}</td></tr>
          </table>
        </div>
        ${coTien() ? `<div class="the">
          <h2>Thu tiền</h2>
          <div class="hai">
            <label>Số tiền (âm = hoàn khách)<input id="pt-tien" type="number" step="1000" value="${h.tien.con_lai || ''}"></label>
            <label>Hình thức<select id="pt-ht"><option value="chuyen_khoan">Chuyển khoản</option><option value="tien_mat">Tiền mặt</option></select></label>
          </div>
          <label style="margin-top:10px">Ghi chú<input id="pt-ghi" placeholder="Thu nốt sau buổi chụp…"></label>
          <div class="hang-nut" style="margin-top:10px"><button class="nut phu nho" id="pt-qr" title="Ảnh mã QR đúng số tiền ô trên, gửi khách chuyển khoản">Mã QR số tiền này</button><button class="nut nho" id="pt-thu">Ghi phiếu thu</button></div>
          <p class="mo" style="margin:8px 0 0">Xin cọc: gõ số tiền cọc → <b>Mã QR số tiền này</b> → gửi khách. Khách quét là tự điền số tiền + mã HĐ. Tiền về thì bấm Ghi phiếu thu.</p>
        </div>
        <div class="the">
          <h2>Thêm phát sinh</h2>
          <div class="hai">
            <label>Loại<select id="ps-loai"><option value="in">In ảnh</option><option value="phu_thu">Phụ thu</option><option value="khac">Khác</option></select></label>
            <label>Số lượng<input id="ps-sl" type="number" min="1" value="1"></label>
          </div>
          <div id="ps-in" class="hai" style="margin-top:10px">
            <label>Cỡ<select id="ps-co">${cos.map((c) => `<option>${c}</option>`).join('')}</select></label>
            <label>Chất liệu<select id="ps-cl"></select></label>
          </div>
          <div id="ps-pt" style="margin-top:10px;display:none"><label>Phụ thu<select id="ps-ptma">${DM.phuThu.map((p) => `<option value="${p.ma}">${esc(p.ten)} — ${tien(p.gia_tu)}${p.gia_den ? '–' + tien(p.gia_den) : ''}/${esc(p.don_vi)}</option>`).join('')}</select></label></div>
          <div id="ps-khac" style="margin-top:10px;display:none"><label>Mô tả<input id="ps-mota" placeholder="Ảnh sửa thêm, album…"></label></div>
          <label style="margin-top:10px">Đơn giá<input id="ps-gia" type="number" min="0" step="1000"></label>
          <div class="hang-nut" style="margin-top:10px"><button class="nut nho" id="ps-them">Thêm vào hoá đơn</button></div>
        </div>` : KHONG_TIEN}
        <div class="the"><h2>Lịch sử</h2>
          <div class="cuon-doc" style="max-height:300px">${h.lichSu.map((l) => `<div class="mo" style="padding:3px 0">${l.luc} · <b>${esc(l.ai)}</b> · ${esc(l.viec)}</div>`).join('') || '<div class="mo">—</div>'}</div></div>
      </div>
    </div>`;

  chay(() => mr.veHoSoThem(ctx(), h, $('#ho-so-them')));
  chay(() => mr.veHuy(ctx(), h, $('#huy-hd'), () => { trangCa(id); lamMoiDaiGap(); }));
  let ttChon = h.trang_thai;
  document.querySelectorAll('[data-tt]').forEach((b) => (b.onclick = () => {
    ttChon = Number(b.dataset.tt);
    document.querySelectorAll('[data-tt]').forEach((x) => x.classList.toggle('dang', Number(x.dataset.tt) === ttChon));
  }));
  $('#luu-tt').onclick = () => chay(async () => {
    await kho.capNhatHopDong(id, { trang_thai: ttChon, ngay_chup: $('#ngay').value, gio_chup: $('#gio').value, hen_tra_anh: $('#hen').value, can_sua_lai: $('#sua').checked, ghi_chu: $('#ghi').value.trim() }, toi);
    bao('Đã lưu'); trangCa(id); lamMoiDaiGap();
  });
  if (coTien()) {
    $('#anh-hd').onclick = () => chay(async () => {   // tên concept / makeup khách đã chọn in vào mục Gói dịch vụ
      if (h.phatSinh.some((p) => p.mo_ta === PS_SO_CU)) {   // ca nhập sổ: sale soát chi tiết phát sinh trước
        const ps = await mr.hoiPsSoCu(ctx(), h, psTuSo(ghiChuSo(h.ghi_chu)));
        if (!ps) return;
        h.psChiTiet = ps;
      }
      try { h.anhChon = (await kho.ham('crm_ca_them', { p_id: id, p_ai: toi })).anh_mau.map((a) => a.ten); } catch { h.anhChon = []; }
      await moHoaDon(h);
    });
    const nutSua = $('#sua-hd'); if (nutSua) nutSua.onclick = () => mr.moSuaHd(ctx(), h, chonGoiHtml, () => { trangCa(id); lamMoiDaiGap(); });
    document.querySelectorAll('[data-huy-pt]').forEach((a) => (a.onclick = (e) => { e.preventDefault();
      mr.moHuyPhieu(ctx(), h.phieuThu.find((p) => p.id === Number(a.dataset.huyPt)), () => { trangCa(id); lamMoiDaiGap(); }); }));
    $('#pt-qr').onclick = () => chay(() => moQrThu(h, Number($('#pt-tien').value)));
    const veCl = () => {
      const ds = DM.giaIn.filter((g) => g.co === $('#ps-co').value);
      $('#ps-cl').innerHTML = ds.map((g) => `<option value="${g.chat_lieu}" data-gia="${g.gia}">${esc(g.chat_lieu_ten)} — ${tien(g.gia)}</option>`).join('');
      $('#ps-gia').value = ds[0] ? ds[0].gia : '';
    };
    const vePt = () => { const p = DM.phuThu.find((x) => x.ma === $('#ps-ptma').value); $('#ps-gia').value = p ? p.gia_tu : ''; };
    $('#ps-co').onchange = veCl; $('#ps-cl').onchange = () => ($('#ps-gia').value = $('#ps-cl').selectedOptions[0].dataset.gia);
    $('#ps-ptma').onchange = vePt;
    $('#ps-loai').onchange = () => {
      const l = $('#ps-loai').value;
      $('#ps-in').style.display = l === 'in' ? '' : 'none'; $('#ps-pt').style.display = l === 'phu_thu' ? '' : 'none'; $('#ps-khac').style.display = l === 'khac' ? '' : 'none';
      if (l === 'in') veCl(); else if (l === 'phu_thu') vePt(); else $('#ps-gia').value = '';
    };
    veCl();
    $('#ps-them').onclick = () => chay(async () => {
      const l = $('#ps-loai').value;
      let mo_ta, co = null, chat_lieu = null;
      if (l === 'in') { co = $('#ps-co').value; chat_lieu = $('#ps-cl').value; mo_ta = `In ${co} ${$('#ps-cl').selectedOptions[0].text.split(' — ')[0]}`; }
      else if (l === 'phu_thu') mo_ta = $('#ps-ptma').selectedOptions[0].text.split(' — ')[0];
      else mo_ta = $('#ps-mota').value.trim();
      if (!mo_ta) throw new Error('Thiếu mô tả phát sinh.');
      const p = DM.phuThu.find((x) => x.ma === $('#ps-ptma').value);
      const gia = Number($('#ps-gia').value);
      if (l === 'phu_thu' && p && (gia < p.gia_tu || (p.gia_den && gia > p.gia_den))) throw new Error(`Đơn giá phụ thu này phải trong khoảng ${tien(p.gia_tu)}–${tien(p.gia_den || p.gia_tu)}.`);
      await kho.themPhatSinh(id, { loai: l, mo_ta, co, chat_lieu, so_luong: $('#ps-sl').value, don_gia: gia }, toi);
      bao('Đã thêm vào hoá đơn'); trangCa(id);
    });
    document.querySelectorAll('[data-xoa]').forEach((a) => (a.onclick = (e) => { e.preventDefault(); chay(async () => {
      if (!confirm('Xoá dòng phát sinh này?')) return;
      await kho.xoaPhatSinh(id, Number(a.dataset.xoa), toi); trangCa(id);
    }); }));
    $('#pt-thu').onclick = () => chay(async () => {
      await kho.themPhieuThu(id, { so_tien: $('#pt-tien').value, hinh_thuc: $('#pt-ht').value, ghi_chu: $('#pt-ghi').value.trim() }, toi);
      bao('Đã ghi phiếu thu'); trangCa(id); lamMoiDaiGap();
    });
    batChip($('#ekip'));
    $('#luu-ekip').onclick = () => chay(async () => { await kho.datEkip(id, docEkip($('#ekip')), toi); bao('Đã lưu ekip'); trangCa(id); lamMoiDaiGap(); });
  }
}

// ═════════ LỊCH CHỤP ═════════
// #/lich/<ngày>/<ngay|tuan|thang>. Ngày: khung 2 giờ + cột "Chờ xếp lịch". Tuần: 7 cột. Tháng: lưới.
async function trangLich(ngay = homNay(), cheDo = 'ngay') {
  const nutNhanh = [['Hôm nay', homNay(), 'ngay'], ['Hôm qua', congNgay(homNay(), -1), 'ngay'], ['Ngày mai', congNgay(homNay(), 1), 'ngay'],
    ['7 ngày tới', homNay(), 'tuan'], ['Lịch tháng', ngay, 'thang']];
  const buoc = cheDo === 'thang' ? null : cheDo === 'tuan' ? 7 : 1;
  const nhanNgay = cheDo === 'thang' ? `Tháng ${ngay.slice(5, 7)}/${ngay.slice(0, 4)}` : cheDo === 'tuan' ? `${ngayVN(ngay)} → ${ngayVN(congNgay(ngay, 6))}` : `${THU_DAI[thuCua(ngay)]}, ${ngayVN(ngay)}/${ngay.slice(0, 4)}`;
  const truoc = cheDo === 'thang' ? (() => { const d = new Date(ngay + 'T12:00:00Z'); d.setUTCMonth(d.getUTCMonth() - 1); return d.toISOString().slice(0, 10); })() : congNgay(ngay, -buoc);
  const sau = cheDo === 'thang' ? (() => { const d = new Date(ngay + 'T12:00:00Z'); d.setUTCMonth(d.getUTCMonth() + 1); return d.toISOString().slice(0, 10); })() : congNgay(ngay, buoc);
  $('#trang').innerHTML = dauTrang('Điều phối', 'Lịch chụp & phân ekip', 'Xếp ca theo khung 2 giờ, cảnh báo trùng ekip, khách chờ xếp lịch ở cột phải.',
    coTien() ? `<a class="nut" href="#/moi/${ngay}">+ Tạo lịch</a>` : '') + `
    <div class="the" style="padding:12px">
      <div class="thanh-ngay"><a class="nut phu nho" href="#/lich/${truoc}/${cheDo}">‹</a>
        <div class="ngay-chon">${ic('lich')} ${nhanNgay}<input type="date" id="chon-ngay" value="${ngay}"></div>
        <a class="nut phu nho" href="#/lich/${sau}/${cheDo}">›</a></div>
      <div>${nutNhanh.map(([t, d, c]) => `<a class="chip ${d === ngay && c === cheDo ? 'chon' : ''}" href="#/lich/${d}/${c}">${t}</a>`).join('')}</div>
    </div>
    <div id="lich-than"><p class="mo">Đang tải…</p></div>`;
  $('#chon-ngay').onchange = (e) => (location.hash = `#/lich/${e.target.value}/${cheDo}`);

  if (cheDo === 'thang') {
    const dau = ngay.slice(0, 8) + '01';
    const lui = (thuCua(dau) + 6) % 7;              // tuần bắt đầu Thứ Hai
    const batDau = congNgay(dau, -lui);
    const ca = await kho.lich(batDau, congNgay(batDau, 41));
    const o = [];
    for (let i = 0; i < 42; i++) {
      const d = congNgay(batDau, i), trong = ca.filter((c) => c.ngay === d);
      o.push(`<a class="o ${d.slice(0, 7) !== ngay.slice(0, 7) ? 'khac-thang' : ''} ${d === homNay() ? 'hom-nay' : ''}" href="#/lich/${d}/ngay">
        <span class="so-ngay">${Number(d.slice(8))}</span> ${trong.length ? `<span class="nhan cam">${trong.length} ca</span>` : ''}
        ${trong.slice(0, 3).map((c) => `<span class="ca-nho">${c.gio || ''} ${esc(c.khach)}</span>`).join('')}${trong.length > 3 ? `<span class="ca-nho mo">+${trong.length - 3}</span>` : ''}</a>`);
    }
    $('#lich-than').innerHTML = `<div class="the cuon-ngang"><div class="thang" style="min-width:640px">${['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((t) => `<div class="thu">${t}</div>`).join('')}${o.join('')}</div></div>`;
    return;
  }
  if (cheDo === 'tuan') {
    const ca = await kho.lich(ngay, congNgay(ngay, 6));
    $('#lich-than').innerHTML = `<div class="cuon-ngang"><div class="tuan">${[0, 1, 2, 3, 4, 5, 6].map((i) => {
      const d = congNgay(ngay, i), trong = ca.filter((c) => c.ngay === d);
      return `<div class="cot-ngay ${d === homNay() ? 'hom-nay' : ''}"><a href="#/lich/${d}/ngay" style="text-decoration:none"><b>${THU[thuCua(d)]} ${ngayVN(d)}</b> <span class="mo">· ${trong.length} ca</span></a>
        ${trong.map((c) => `<a class="ca-lich" href="#/ca/${c.id}" style="grid-template-columns:1fr;margin-top:8px"><span><b>${c.gio || '--:--'}</b> ${esc(c.khach)}</span><span class="mo nho">${esc(c.goi)}</span>
          ${c.trung.length ? '<span class="nhan do">trùng ekip</span>' : ''}</a>`).join('') || '<div class="mo nho" style="margin-top:8px">Còn trống</div>'}</div>`;
    }).join('')}</div></div>`;
    return;
  }
  const [ca, cho] = await Promise.all([kho.lich(ngay, ngay), kho.dsHopDong({ trangThai: 1 })]);
  const choXep = cho.filter((h) => !h.ngay_chup);
  const phut = (g) => Number(g.slice(0, 2)) * 60 + Number(g.slice(3, 5));
  const theLich = (c) => `<a class="ca-lich" href="#/ca/${c.id}" style="border-left-color:var(--tt${c.trang_thai}c)">
      <span class="gio">${c.gio || '--:--'}</span><span><span class="ten">${esc(c.khach)}</span><br><span class="mo nho">${esc(c.goi)} · ${c.ma}</span></span>
      <span class="phai">${sdtHtml(c.sdt)}${nhanTT(c.trang_thai, tenTT(c.trang_thai))}${c.ekip.length ? c.ekip.map((e) => `<span class="ekip-chip">${esc(e.ten)} · ${VAI[e.vai] || e.vai}</span>`).join('') : '<span class="nhan do">chưa xếp ekip</span>'}
        ${c.trung.length ? `<span class="nhan do">⚠ trùng ${c.trung.map((t) => `${esc(t.nguoi.join(', '))} (${t.gio})`).join('; ')}</span>` : ''}</span></a>`;
  const ngoai = ca.filter((c) => !c.gio || !KHUNG.some(([a, b]) => phut(c.gio) >= phut(a) && phut(c.gio) < phut(b)));
  $('#lich-than').innerHTML = `<div class="lich-cot">
    <div class="the">
      <div class="dau-the"><div><h2>Ca chụp trong ngày</h2><div class="mo">Chia theo khung giờ chụp · ${ca.length} ca</div></div></div>
      ${KHUNG.map(([a, b]) => {
        const trong = ca.filter((c) => c.gio && phut(c.gio) >= phut(a) && phut(c.gio) < phut(b));
        if (!trong.length && (a === '12:00' || a === '18:00')) return '';
        return `<div class="khung-gio"><div class="dau-kg">${ic('lich')} ${a.slice(0, 2)}h – ${b.slice(0, 2)}h <span class="mo">${trong.length ? trong.length + ' ca' : 'Còn trống'}</span></div>
          ${trong.map(theLich).join('') || `<div class="trong">Còn trống — chọn khách ở cột "Chờ xếp lịch" hoặc bấm "+ Tạo lịch".</div>`}</div>`;
      }).join('')}
      ${ngoai.length ? `<div class="khung-gio"><div class="dau-kg">Chưa có giờ / ngoài khung <span class="mo">${ngoai.length} ca</span></div>${ngoai.map(theLich).join('')}</div>` : ''}
    </div>
    <div class="the cho-xep">
      <div class="dau-the"><div><h2>Chờ xếp lịch</h2><div class="mo">${choXep.length} hợp đồng chưa có ngày giờ</div></div><span class="phai nhan vang">Ưu tiên</span></div>
      <div class="cuon-doc">${choXep.map((h) => `<div class="dong"><span class="avt">${esc((h.khach || '?').trim().charAt(0).toUpperCase())}</span>
        <span><b>${esc(h.khach)}</b><br><span class="mo nho">${esc(h.sdt || 'chưa có SĐT')} · ${esc(h.goi)}</span></span>
        <a class="nut phu nho" href="#/ca/${h.id}">Xếp lịch</a></div>`).join('') || '<div class="trong">Không có hợp đồng nào chờ xếp lịch.</div>'}</div>
    </div></div>`;
}

// ═════════ HẬU KỲ ═════════
async function trangHauKy() {
  const r = await kho.hauKy();
  const cot = [3, 4, 5, 6, 7];
  const han = (c) => c.con_ngay == null ? '' : c.con_ngay < 0 ? `<span class="nhan do">trễ ${-c.con_ngay} ngày</span>` : c.con_ngay <= 2 ? `<span class="nhan vang">còn ${c.con_ngay} ngày</span>` : `<span class="nhan">hạn ${ngayVN(c.hen_tra_anh)}</span>`;
  const tre = r.ca.filter((c) => c.con_ngay != null && c.con_ngay < 0).length;
  $('#trang').innerHTML = dauTrang('Chụp & hậu kỳ', 'Hậu kỳ & hạn giao ảnh', `${r.ca.length} ca đang trong khâu hậu kỳ (chụp trong 90 ngày)${tre ? ` · <b style="color:var(--do)">${tre} ca quá hẹn</b>` : ''}. Bấm một ca để đổi trạng thái.`) + `
    ${r.ca_cu ? `<div class="canh">${ic('canh')} Còn <b>${r.ca_cu} ca cũ hơn 90 ngày</b> đang dừng ở khâu hậu kỳ — phần lớn là sổ cũ không ghi tiến độ. Không hiện ở đây để bảng khỏi rối.</div>` : ''}
    <div class="bang-cot">${cot.map((so) => {
      const ds = r.ca.filter((c) => c.trang_thai === so);
      return `<div class="cot-hk"><div class="dau-cot">${nhanTT(so, tenTT(so))}<span class="so">${ds.length}</span></div>
        ${ds.map((c) => `<a class="the-ca vien-tt${so}" href="#/ca/${c.id}"><div class="hang"><span class="ten" style="font-size:14px">${esc(c.khach)}</span></div>
          <div class="phu">${esc(c.goi)} · chụp ${ngayVN(c.ngay_chup)}</div>
          <div class="hang" style="flex-wrap:wrap">${han(c)}${c.pts.length ? `<span class="ekip-chip">PTS ${c.pts.map(esc).join(', ')}</span>` : ''}${c.can_sua_lai ? '<span class="nhan do">cần sửa lại</span>' : ''}</div></a>`).join('') || '<div class="mo nho">Trống</div>'}</div>`;
    }).join('')}</div>`;
}

// ═════════ CÔNG NỢ & THU TIỀN ═════════
const GIAI_DOAN = [['thu_khi_chup', 'Thu khi chụp', 'Có lịch, chưa chụp', 'var(--tt8c)'], ['truoc_giao', 'Thu trước khi giao ảnh', 'Đã chụp, chưa giao', 'var(--tt3c)'],
  ['da_giao', 'Đã giao ảnh vẫn nợ', 'Gọi khách thanh toán', 'var(--do)'], ['chua_lich', 'Chưa có lịch chụp', 'Thu khi chốt lịch', 'var(--chu-nhat)']];
// Kỳ xem chọn tự do (tháng · năm · quý · từ ngày đến ngày) — khoang.js. Link cũ "#/cong-no/2026-11" vẫn chạy.
async function trangCongNo(chu) {
  const hn = homNay(), k = kh.docKhoang(chu, hn), nhan = kh.nhanKhoang(k, hn), diaChi = (c) => '#/cong-no/' + c;
  const r = await kho.congNoKhoang(k.tu, k.den);
  const t = r.thu, ss = r.thu_ky_truoc ? Math.round((t.tien / r.thu_ky_truoc - 1) * 100) : null;
  const tenKyTruoc = { thang: 'tháng trước', nam: 'năm trước', quy: 'quý trước' }[k.kieu] || 'kỳ trước cùng độ dài';
  const pCK = t.tien ? Math.round((t.ck / t.tien) * 100) : 0;
  $('#trang').innerHTML = dauTrang('Sổ thu · công nợ', 'Thu tiền & đối soát', 'Mỗi lần khách trả là một phiếu thu riêng. Nợ chia theo giai đoạn để biết thu lúc nào.',
    kh.cumKhoang(k, hn, diaChi)) + `
    <div class="ba-the">
      <div class="the"><div class="mo">Đã thu · ${nhan}</div>
        <div class="so-to" style="color:var(--xanh)">${tien(t.tien)}</div>
        <div class="mo">${t.so} phiếu thu${ss != null ? ` · <b style="color:${ss >= 0 ? 'var(--xanh)' : 'var(--do)'}">${ss >= 0 ? '▲' : '▼'} ${Math.abs(ss)}%</b> so với ${tenKyTruoc}` : ''}</div>
        <div class="thanh-ty-le"><i style="width:${pCK}%;background:var(--tt8c)"></i><i style="width:${100 - pCK}%;background:var(--nhan)"></i></div>
        <div class="hai"><div><span class="mo">● Chuyển khoản</span><br><b>${tien(t.ck)}</b><br><span class="mo nho">${t.so_ck} phiếu · ${pCK}%</span></div>
          <div><span class="mo" style="color:var(--nhan)">● Tiền mặt</span><br><b>${tien(t.tm)}</b><br><span class="mo nho">${t.so_tm} phiếu · ${100 - pCK}%</span></div></div>
        <div class="mo" style="margin-top:10px">Hôm nay: <b>${tien(t.hom_nay)}</b></div></div>
      <div class="the"><div class="mo">Còn phải thu</div>
        <div class="so-to" style="color:var(--do)">${tien(r.con_no.tien)}</div>
        <div class="mo">${r.con_no.so} hợp đồng còn nợ · chia theo giai đoạn</div>
        ${GIAI_DOAN.map(([gd, ten, mo, mau]) => { const g = r.giai_doan[gd] || { tien: 0, so: 0 };
          return `<a class="gd" href="#/cong-no/${k.chu}/${gd}" style="text-decoration:none"><span style="width:10px;height:10px;border-radius:50%;background:${mau}"></span><span><b style="font-weight:600">${ten}</b><br><span class="mo nho">${mo} · ${g.so} HĐ</span></span><b>${trieu(g.tien)}</b></a>`; }).join('')}</div>
      <div class="the"><div class="mo">Theo loại dịch vụ</div>
        <div class="cuon-doc" style="max-height:300px">${r.hang_muc.map((h) => `<div class="gd"><span><b style="font-weight:600">${esc(h.ten)}</b><br><span class="mo nho">đã thu ${trieu(h.da_thu)} · ${h.so_phieu} phiếu</span></span>
          <b style="color:${h.con_no ? 'var(--do)' : 'var(--xanh)'}">${h.con_no ? 'nợ ' + trieu(h.con_no) : 'đủ'}</b></div>`).join('') || '<div class="mo">Chưa có số.</div>'}</div></div>
    </div>
    <div class="hai-cot deu">
      <div class="the"><div class="dau-the"><div><h2>Sổ phiếu thu</h2><div class="mo">${r.phieu.length} phiếu · ${nhan}</div></div></div>
        <div id="loc-phieu"><span class="chip chon" data-ht="">Tất cả</span><span class="chip" data-ht="chuyen_khoan">Chuyển khoản</span><span class="chip" data-ht="tien_mat">Tiền mặt</span></div>
        <div class="cuon-doc" id="ds-phieu"></div></div>
      <div class="the"><div class="dau-the"><div><h2>Danh sách cần thu</h2><div class="mo">${r.con_no.so} hợp đồng · ${tien(r.con_no.tien)}</div></div></div>
        <div id="loc-no"><span class="chip" data-gd="">Tất cả</span>${GIAI_DOAN.map(([k, ten]) => `<span class="chip" data-gd="${k}">${ten} <span class="so">${(r.giai_doan[k] || {}).so || 0}</span></span>`).join('')}</div>
        <div class="cuon-doc" id="ds-no"></div></div>
    </div>`;
  kh.ganKhoang(k, hn, diaChi);
  const vePhieu = (ht) => {
    const ds = r.phieu.filter((p) => !ht || p.hinh_thuc === ht);
    $('#ds-phieu').innerHTML = ds.map((p) => `<a class="dong-phieu" href="#/ca/${p.hop_dong_id}"><span class="ht ${p.hinh_thuc === 'tien_mat' ? 'tm' : ''}">${p.hinh_thuc === 'tien_mat' ? 'TM' : 'CK'}</span>
      <span><b>${esc(p.khach)}</b><br><span class="mo nho">${p.ma} · ${esc(p.sdt || '')} · ${p.luc}${p.ghi_chu ? ' · ' + esc(p.ghi_chu) : ''}</span></span>
      <b style="color:${p.so_tien < 0 ? 'var(--do)' : 'var(--xanh)'}">${p.so_tien > 0 ? '+' : ''}${tien(p.so_tien)}</b></a>`).join('') || '<div class="trong">Chưa có phiếu thu.</div>';
  };
  const veNo = (gd) => {
    const ds = r.can_thu.filter((c) => !gd || c.giai_doan === gd);
    const ten = Object.fromEntries(GIAI_DOAN.map(([k, t]) => [k, t]));
    $('#ds-no').innerHTML = ds.map((c) => `<div class="can-thu" style="border-left-color:${GIAI_DOAN.find((g) => g[0] === c.giai_doan)[3]}">
      <span><b>${esc(c.khach)}</b> <span class="mo nho">${c.ma}</span></span><b style="color:var(--do)">${tien(c.con_lai)}</b>
      <span class="mo nho" style="grid-column:1/-1"><span class="nhan">${ten[c.giai_doan]}</span> ${esc(c.goi)} · ${c.ngay ? 'chụp ' + ngayVN(c.ngay) : 'chưa lịch'} · đã trả ${tien(c.da_thu)} / ${tien(c.tong_hoa_don)}</span>
      <span style="grid-column:1/-1" class="hang-nut">${sdtHtml(c.sdt)}<a class="nut nho" href="#/ca/${c.id}" style="margin-left:auto">Thu tiền</a></span></div>`).join('') || '<div class="trong">Không còn ai nợ ✓</div>';
  };
  const batLoc = (sel, attr, ve) => document.querySelectorAll(sel + ' .chip').forEach((c) => (c.onclick = () => { document.querySelectorAll(sel + ' .chip').forEach((x) => x.classList.remove('chon')); c.classList.add('chon'); ve(c.dataset[attr]); }));
  batLoc('#loc-phieu', 'ht', vePhieu); batLoc('#loc-no', 'gd', veNo);
  vePhieu('');
  const gd0 = location.hash.split('/')[3] || '';
  document.querySelector(`#loc-no .chip[data-gd="${gd0}"]`)?.classList.add('chon');
  veNo(gd0);
}

// ═════════ SẢN PHẨM & DỊCH VỤ ═════════
async function trangSanPham() {
  const hm = [...new Set(DM.goi.map((g) => g.hang_muc_ten))];
  const tb = DM.goi.length ? Math.round(DM.goi.reduce((s, g) => s + g.gia_ban, 0) / DM.goi.length) : 0;
  const cos = [...new Set(DM.giaIn.map((g) => g.co))], cls = [...new Set(DM.giaIn.map((g) => g.chat_lieu_ten))];
  $('#trang').innerHTML = dauTrang('Danh mục', 'Sản phẩm & dịch vụ', 'Gói chụp, giá in và phụ thu đang bán. Đổi giá thì nhắn trợ lý — sửa một chỗ, app, hoá đơn và website cùng đổi.') + `
    <div class="so-lieu bon">
      ${theSo('#/san-pham', 'hop', ['var(--nhan-nhat)', 'var(--nhan-dam)'], 'Gói chụp đang bán', DM.goi.length, hm.length + ' hạng mục')}
      ${theSo('#/san-pham', 'tien', ['var(--xanh-nhat)', 'var(--xanh)'], 'Giá gói bình quân', trieu(tb), 'theo bảng giá hiện hành')}
      ${theSo('#/san-pham', 'may', ['var(--tt8n)', 'var(--tt8c)'], 'Ô giá in', DM.giaIn.length, cos.length + ' cỡ × ' + cls.length + ' chất liệu')}
      ${theSo('#/san-pham', 'canh', ['var(--vang-nhat)', '#8A5A00'], 'Phụ thu', DM.phuThu.length, 'có khoảng giá trần–sàn')}
    </div>
    <div class="the"><div class="dau-the"><h2>Gói chụp</h2><span class="phai"><select id="loc-hm" style="width:auto"><option value="">Tất cả hạng mục</option>${hm.map((h) => `<option>${esc(h)}</option>`).join('')}</select></span></div>
      <div class="cuon-ngang"><table><thead><tr><th>Mã</th><th>Tên gói</th><th>Hạng mục</th><th>Gồm</th><th class="so">Giá niêm yết</th><th class="so">Giá bán</th></tr></thead><tbody id="ds-goi"></tbody></table></div></div>
    <div class="hai-cot ba-hai">
      <div class="the"><h2>Giá in</h2><div class="cuon-ngang"><table><thead><tr><th>Cỡ</th>${cls.map((c) => `<th class="so">${esc(c)}</th>`).join('')}</tr></thead><tbody>
        ${cos.map((co) => `<tr><td><b>${co}</b></td>${cls.map((cl) => { const g = DM.giaIn.find((x) => x.co === co && x.chat_lieu_ten === cl); return `<td class="so">${g ? tien(g.gia) : '—'}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div></div>
      <div class="the"><h2>Phụ thu</h2><table><thead><tr><th>Khoản</th><th class="so">Giá</th></tr></thead><tbody>
        ${DM.phuThu.map((p) => `<tr><td>${esc(p.ten)}</td><td class="so">${tien(p.gia_tu)}${p.gia_den ? '–' + tien(p.gia_den) : ''}<span class="mo">/${esc(p.don_vi)}</span></td></tr>`).join('')}</tbody></table></div>
    </div>`;
  const ve = () => {
    const l = $('#loc-hm').value;
    $('#ds-goi').innerHTML = DM.goi.filter((g) => !l || g.hang_muc_ten === l).map((g) => `<tr><td class="mo">${g.ma}</td><td><b>${esc(g.ten)}</b></td><td>${esc(g.hang_muc_ten)}</td>
      <td class="mo">${[g.so_boi_canh, g.so_anh_sua ? g.so_anh_sua + ' ảnh sửa' : '', g.qua_in_co ? 'in ' + g.qua_in_co : '', g.qua_checkin ? 'check-in: ' + g.qua_checkin : ''].filter(Boolean).map(esc).join(' · ')}</td>
      <td class="so mo">${g.gia_niem_yet && g.gia_niem_yet !== g.gia_ban ? tien(g.gia_niem_yet) : ''}</td><td class="so"><b>${tien(g.gia_ban)}</b></td></tr>`).join('');
  };
  $('#loc-hm').onchange = ve; ve();
}

// ═════════ KHUNG ═════════
function veMenu() {
  $('#menu').innerHTML = MENU.map((m) => m.nhom ? `<div class="nhom-menu">${m.nhom}</div>`
    : (m.tien && !coTien()) ? '' : `<a href="#/${m.tt}" data-trang="${m.tt}">${ic(m.ic)}<span>${m.ten}</span>${m.tt === '' ? '<span class="dem" id="dem-gap" hidden></span>' : ''}</a>`).join('');
}
async function dieuHuong() {
  const h = location.hash.replace(/^#\/?/, ''), [p0, p1, p2] = h.split('/');
  const trang = p0 === 'ca' || p0 === 'khach' ? 'tim' : p0 || '';
  document.querySelectorAll('#menu a').forEach((a) => a.classList.toggle('dang', a.dataset.trang === trang));
  const m = MENU.find((x) => x.tt === trang && !x.nhom);
  const nhom = (() => { let g = 'HOME STUDIO'; for (const x of MENU) { if (x.nhom) g = x.nhom.toUpperCase(); if (x === m) return g; } return 'HOME STUDIO'; })();
  $('#tieu-de').innerHTML = `<small>${m ? nhom : 'HOME STUDIO'}</small><b>${p0 === 'ca' ? 'Hồ sơ ca' : p0 === 'khach' ? 'Hồ sơ khách' : m ? m.ten : 'Trang chủ'}</b>`;
  document.body.classList.remove('mo-menu');
  window.scrollTo(0, 0);
  await chay(async () => {
    if (p0 === 'mat-khau' && kho.THAT) trangMatKhau();
    else if (p0 === 'moi') await trangMoi(p1 || '');
    else if (p0 === 'lich') await trangLich(p1 || homNay(), p2 || 'ngay');
    else if (p0 === 'ca') await trangCa(Number(p1));
    else if (p0 === 'khach') await mr.trangKhach(ctx(), Number(p1));
    else if (p0 === 'tim') await trangTim(p1 ? decodeURIComponent(p1) : '');
    else if (p0 === 'hau-ky') await trangHauKy();
    else if (p0 === 'cong-no') await trangCongNo(p1 || undefined);
    else if (p0 === 'san-pham') await trangSanPham();
    else if (p0 === 'ke-hoach') await mr.trangKeHoach(ctx(), p1 || undefined);
    else if (p0 === 'lead') await mr.trangLead(ctx(), p1 || '');
    else if (p0 === 'concept') await mr.trangAnhMau(ctx(), 'concept');
    else if (p0 === 'makeup') await mr.trangAnhMau(ctx(), 'makeup');
    else if (p0 === 'han-giao') await mr.trangHanGiao(ctx());
    else if (p0 === 'video') await mr.trangVideo(ctx(), p1 || 'can_lam');
    else if (p0 === 'cskh') await mr.trangCskh(ctx());
    else if (p0 === 'cho-lay') await mr.trangChoLay(ctx(), p1 || '');
    else if (p0 === 'chat-luong') await mr.trangChatLuong(ctx(), p1 || undefined);
    else if (p0 === 'chi') await mr.trangChi(ctx(), p1 || undefined);
    else if (p0 === 'dang-bai') await mr.trangDangBai(ctx());
    else if (p0 === 'hoa-hong') await mr.trangHoaHong(ctx(), p1 || undefined);
    else if (p0 === 'toi' || (!p0 && !coTien())) await mr.trangCuaToi(ctx());
    else await trangChu();
  });
  if (!coTien()) $('#dai-gap').hidden = true;   // việc gấp cả studio chỉ cho sale online / chủ
  if (p0 && !tcNho) lamMoiDaiGap();
  const dem = $('#dem-gap'); if (dem && tcNho) { dem.textContent = tcNho.gap; dem.hidden = !tcNho.gap; }
}

// ═════════ ĐĂNG NHẬP (bản thật) ═════════
function trangDangNhap(loi) {
  $('#menu-trai').hidden = true; $('.dau').hidden = true; $('#dai-gap').hidden = true;
  document.querySelector('.khung').style.gridTemplateColumns = '1fr';
  $('#trang').innerHTML = `
    <div class="the" style="max-width:380px;margin:60px auto">
      <div class="logo" style="padding:0 0 14px"><span class="logo-o">H</span><span><b>HOME STUDIO</b><small>Vận hành studio</small></span></div>
      <h1 style="margin-bottom:6px">Đăng nhập</h1>
      <p class="mo">Tài khoản do anh Thọ cấp. Quên mật khẩu thì nhắn anh Thọ đặt lại.</p>
      <form id="dn" class="hai" style="grid-template-columns:1fr">
        <label>Email<input id="dn-email" type="email" autocomplete="username" required></label>
        <label>Mật khẩu<input id="dn-mk" type="password" autocomplete="current-password" required></label>
        <button class="nut" type="submit">Vào</button>
      </form>
      ${loi ? `<p style="color:var(--do)">${esc(loi)}</p>` : ''}
    </div>`;
  $('#dn').onsubmit = (e) => {
    e.preventDefault();
    chay(async () => {
      try { await kho.dangNhap($('#dn-email').value, $('#dn-mk').value); } catch (er) { return trangDangNhap(er.message); }
      await vaoApp();
    });
  };
}

function trangMatKhau() {
  $('#trang').innerHTML = `
    <div class="the" style="max-width:380px;margin:20px auto">
      <h1>Đổi mật khẩu</h1>
      <form id="mk" class="hai" style="grid-template-columns:1fr;margin-top:10px">
        <label>Mật khẩu mới (ít nhất 8 ký tự, không dấu)<input id="mk-1" type="password" autocomplete="new-password" minlength="8" required></label>
        <label>Gõ lại<input id="mk-2" type="password" autocomplete="new-password" minlength="8" required></label>
        <button class="nut" type="submit">Lưu</button>
      </form>
    </div>`;
  $('#mk').onsubmit = (e) => {
    e.preventDefault();
    chay(async () => {
      const a = $('#mk-1').value;
      if (a !== $('#mk-2').value) throw new Error('Hai lần gõ không khớp.');
      if (/[^\x20-\x7e]/.test(a)) throw new Error('Mật khẩu không dùng chữ có dấu (điện thoại gõ khác máy tính).');
      await kho.doiMatKhau(a); bao('Đã đổi mật khẩu'); location.hash = '#/';
    });
  };
}

async function vaoApp() {
  if (kho.THAT) {
    const t = await kho.toi();
    if (!t) return trangDangNhap();
    toi = t.nhan_su?.ma || t.email; vaiToi = t.nhan_su?.vai || [];   // máy chủ tự lấy người làm từ phiên đăng nhập; biến này chỉ để hiển thị
    $('#toi').hidden = true;
    $('#nguoi').hidden = false;
    $('#nguoi').innerHTML = `<div class="ten-toi">${esc(t.nhan_su?.ten || t.email)}</div><div class="mo nho">${(vaiToi.includes('chu') ? 'Chủ studio' : vaiToi.map((v) => VAI[v] || (v === 'sale_online' ? 'Sale online' : v)).join(' · ')) || 'chưa gắn vai'}</div>
      <div style="margin-top:6px"><a href="#/mat-khau">Đổi mật khẩu</a> · <a href="#" id="thoat">Thoát</a></div>`;
    $('#thoat').onclick = (e) => { e.preventDefault(); chay(async () => { await kho.dangXuat(); trangDangNhap(); }); };
  } else {
    toi = localStorage.getItem('toi') || '';
    $('#toi').onchange = () => { toi = $('#toi').value; localStorage.setItem('toi', toi); vaiToi = DM.nhanSu.find((n) => n.ma === toi)?.vai || []; veMenu(); dieuHuong(); };
  }
  $('#menu-trai').hidden = false; $('.dau').hidden = false; document.querySelector('.khung').style.gridTemplateColumns = '';
  DM = await kho.danhMuc();
  DM.hangMuc = [...new Map(DM.goi.map((g) => [g.hang_muc, { ma: g.hang_muc, ten: g.hang_muc_ten }])).values()];
  if (!kho.THAT) $('#toi').innerHTML = '<option value="">Đang dùng: —</option>' + DM.nhanSu.map((n) => `<option value="${n.ma}" ${n.ma === toi ? 'selected' : ''}>${esc(n.ten)}</option>`).join('');
  if (!kho.THAT) vaiToi = DM.nhanSu.find((n) => n.ma === toi)?.vai || [];
  veMenu();
  await dieuHuong();
}

(async () => {
  $('#mo-menu').onclick = () => document.body.classList.toggle('mo-menu');
  $('#nen-menu').onclick = () => document.body.classList.remove('mo-menu');
  $('#tim-nhanh').onsubmit = (e) => { e.preventDefault(); const q = $('#tim-o').value.trim(); location.hash = '#/tim' + (q ? '/' + encodeURIComponent(q) : ''); $('#tim-o').blur(); };
  await chay(async () => {
    await kho.moKho();
    window.addEventListener('hashchange', () => { if (DM) dieuHuong(); });
    await vaoApp();
  });
})();
