// Màn hình mở rộng cho đủ menu như hệ Sky (anh Thọ yêu cầu 09/11/2026):
// Kế hoạch tháng · Khách tiềm năng · Ảnh mẫu concept · Ảnh makeup · Hạn giao ảnh · Video khách ·
// Chăm sóc khách · Chất lượng dịch vụ · Chi cửa hàng · Đăng bài Facebook · và phần thêm của hồ sơ ca.
// Mỗi hàm nhận `c` (ngữ cảnh từ app.js): kho, DM, toi, vaiToi, coTien, laChu và các hàm định dạng.

import { ALBUM_URL } from './cau-hinh.js?v=20261109h';
import * as kh from './khoang.js?v=20261110b';

const KENH = { facebook: 'Facebook', zalo: 'Zalo', tiktok: 'TikTok', instagram: 'Instagram', gioi_thieu: 'Người quen giới thiệu', vang_lai: 'Vãng lai', website: 'Website', khac: 'Khác' };
const TT_LEAD = { moi: ['Mới', 'tt1'], dang_tu_van: ['Đang tư vấn', 'tt3'], da_bao_gia: ['Đã báo giá', 'tt4'], hen_den: ['Hẹn đến studio', 'tt6'], da_chot: ['Đã chốt', 'tt2'], mat: ['Mất', 'tt5'] };
const KHOAN = { mat_bang: 'Mặt bằng', dien_nuoc: 'Điện nước', luong: 'Lương', quang_cao: 'Quảng cáo', in_an: 'In ấn', dao_cu_trang_phuc: 'Đạo cụ · trang phục', thiet_bi: 'Thiết bị', van_phong_pham: 'Văn phòng phẩm', an_uong: 'Ăn uống', van_chuyen: 'Vận chuyển', sua_chua: 'Sửa chữa', khac: 'Khác' };
const VAN_DE = { chup_lau: 'Chụp lâu', anh_xau: 'Ảnh chưa đẹp', tra_tre: 'Trả ảnh trễ', thai_do: 'Thái độ', gia: 'Giá cao', phat_sinh: 'Phát sinh bất ngờ', khac: 'Khác' };
const CSKH = { nhac_chon_anh: ['Nhắc khách chọn ảnh', 'Đã gửi ảnh gốc mà khách chưa chọn'], xin_danh_gia: ['Xin đánh giá sau chụp', 'Trả ảnh 2–14 ngày, chưa có đánh giá'],
  sinh_nhat: ['Sinh nhật bé sắp tới', 'Mời chụp sinh nhật — trong 30 ngày tới'],
  sap_sinh: ['Mẹ bầu sắp sinh', 'Chụp bầu 30–75 ngày trước, chưa đặt Newborn — mời chụp khi bé chào đời'],
  ky_niem: ['Khách cũ sắp tròn năm', 'Newborn: ngày 290–310 (bé sắp 1 tuổi) · ca khác: ngày 335–355 — nhắc TRƯỚC mốc khách hay quay lại'] };
// Loại CSKH ghi từ màn khác (không thành cột việc ở màn Chăm sóc khách) — chỉ để gọi tên trong nhật ký.
const TEN_CSKH_KHAC = { bao_tra_anh: ['Nhắc lấy ảnh in'], hoi_tham: ['Hỏi thăm'], khac: ['Khác'] };
const TT_BAI = { nhap: ['Nháp', 'tt1'], cho_duyet: ['Chờ anh Thọ duyệt', 'tt3'], da_duyet: ['Đã duyệt — chờ đăng', 'tt4'], da_dang: ['Đã đăng', 'tt2'], huy: ['Huỷ', 'tt5'] };
// Tên Page THẬT ở bảng Lark 14.1 (đọc 09/11/2026) — máy đăng tra token theo tên này. Nhiều Page: cách nhau dấu phẩy.
const FANPAGE = ['Home Studio - Chụp ảnh cho bé và gia đình', 'Home Studio - Ảnh viện gia đình và bé yêu', 'Homestudio - Chụp ảnh thẻ', 'Homestudio - Phóng sự cưới & Event film', 'TayTo Studio', 'TayTo Studio - Chụp ảnh kỷ yếu đẹp chất Hà Nội'];
// Ô ảnh/video: mỗi dòng một nguồn (link http/Drive, hoặc đường dẫn trên máy studio).
const dsNguon = (u) => String(u || '').split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
function xemTruoc(c, u) {
  const n = dsNguon(u);
  if (!n.length) return '<div class="mo nho">⚠️ chưa có ảnh/video</div>';
  const d = n[0], laVideo = /\.(mp4|mov|m4v|webm)(\?|$)/i.test(d);
  const dau = /^https?:/i.test(d) && !laVideo
    ? `<img src="${c.esc(anhTrucTiep(d))}" alt="" style="width:100%;max-height:180px;object-fit:cover;border-radius:8px">`
    : `<div class="mo nho">${laVideo ? '🎬' : '📁'} ${c.esc(d.split(/[\\/]/).pop())}</div>`;
  return dau + (n.length > 1 ? `<div class="mo nho">+ ${n.length - 1} file nữa</div>` : '');
}

const n = (v) => Number(v) || 0;
const thangCong = (t, k) => { const d = new Date(t + '-15T12:00:00Z'); d.setUTCMonth(d.getUTCMonth() + k); return d.toISOString().slice(0, 7); };
const navThang = (href, t) => `<a class="nut phu nho" href="${href}/${thangCong(t, -1)}">‹</a><span class="nut phu nho" style="cursor:default">Tháng ${t.slice(5)}/${t.slice(0, 4)}</span><a class="nut phu nho" href="${href}/${thangCong(t, 1)}">›</a>`;
const thanh = (pt, mau = 'var(--nhan)') => `<div class="thanh-ty-le"><i style="width:${Math.max(0, Math.min(100, pt))}%;background:${mau}"></i></div>`;

// Link Google Drive "chia sẻ" không hiện được trong <img> ⇒ đổi sang ảnh thu nhỏ của Drive.
export function anhTrucTiep(u) {
  const m = String(u || '').match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]{20,})/);
  return m ? `https://drive.google.com/thumbnail?id=${m[1]}&sz=w800` : u;
}

function hop(c, tieuDe, than) {
  const nen = document.createElement('div');
  nen.className = 'hop-nen';
  nen.innerHTML = `<div class="hop" role="dialog" aria-label="${c.esc(tieuDe)}" style="flex-basis:560px"><div class="dau-the"><h2>${c.esc(tieuDe)}</h2><button class="nut phu nho phai" data-dong>Đóng</button></div>${than}</div>`;
  const dong = () => nen.remove();
  nen.onclick = (e) => { if (e.target === nen) dong(); };
  nen.querySelector('[data-dong]').onclick = dong;
  document.body.appendChild(nen);
  return { g: nen, dong };
}
const giaTri = (g, sel) => g.querySelector(sel)?.value?.trim() ?? '';

// ═════════ KẾ HOẠCH THÁNG ═════════
// Kỳ xem tự do (khoang.js · 021). Mục tiêu: trọn một tháng = dòng tháng đó (sửa được); quý/năm = cộng các tháng nằm trọn trong kỳ.
export async function trangKeHoach(c, chu) {
  const hn = c.homNay(), k = kh.docKhoang(chu, hn), nhan = kh.nhanKhoang(k, hn), thang = k.chu, motThang = k.kieu === 'thang';
  const r = await c.kho.ham('crm_ke_hoach_khoang', { p_tu: k.tu, p_den: k.den });
  const mt = r.muc_tieu || {}, tt = r.thuc_te;
  const tl = (a, b) => (n(b) ? Math.round((100 * n(a)) / n(b)) : null);
  const duBao = r.ngay_da_qua ? Math.round((n(tt.doanh_thu_da_chup) / r.ngay_da_qua) * r.so_ngay) : null;
  const laiTam = n(r.thuc_thu) - n(r.chi);
  const cot = (ten, thuc, muc, phu, mau) => `<div class="the"><div class="mo">${ten}</div><div class="so-to" style="color:${mau}">${thuc}</div>
    ${muc != null ? `${thanh(muc, mau)}<div class="mo">${muc}% mục tiêu · ${phu}</div>` : `<div class="mo">${phu}</div>`}</div>`;
  // Kỳ dài hơn 2 tháng: gom cột theo tháng (365 cột/năm không đọc được).
  const theoThang = r.so_ngay > 62;
  const cotNgay = !theoThang ? r.theo_ngay.map((d) => ({ ...d, nhan: Number(d.ngay.slice(8)), href: `#/lich/${d.ngay}/ngay`, ten: c.ngayVN(d.ngay), xong: d.ngay <= c.homNay() }))
    : Object.values(r.theo_ngay.reduce((o, d) => { const t = d.ngay.slice(0, 7); (o[t] ||= { ngay: t, so_ca: 0, doanh_thu: 0 }); o[t].so_ca += n(d.so_ca); o[t].doanh_thu += n(d.doanh_thu); return o; }, {}))
      .map((d) => ({ ...d, nhan: 'T' + Number(d.ngay.slice(5)), href: '#/ke-hoach/' + d.ngay, ten: 'Tháng ' + d.ngay.slice(5) + '/' + d.ngay.slice(0, 4), xong: d.ngay <= c.homNay().slice(0, 7) }));
  const maxNgay = Math.max(1, ...cotNgay.map((d) => n(d.doanh_thu)));
  c.trang.innerHTML = c.dauTrang('Điều hành', motThang ? 'Kế hoạch tháng' : 'Kế hoạch & tiến độ', `Mục tiêu và tiến độ · ${nhan} · đã qua ${r.ngay_da_qua}/${r.so_ngay} ngày${mt.so_thang ? ` · mục tiêu cộng ${mt.so_thang} tháng đã đặt` : ''}.`, kh.cumKhoang(k, hn, (x) => '#/ke-hoach/' + x)) + `
    <div class="ba-the">
      ${cot('Doanh thu ca chụp trong kỳ', c.trieu(tt.doanh_thu), mt.doanh_thu ? tl(tt.doanh_thu, mt.doanh_thu) : null,
        mt.doanh_thu ? `mục tiêu ${c.trieu(mt.doanh_thu)}${duBao != null ? ` · dự báo cuối kỳ ${c.trieu(duBao)}` : ''}` : 'chưa đặt mục tiêu', 'var(--xanh)')}
      ${cot('Số ca chụp', tt.so_ca + ' ca', mt.so_ca ? tl(tt.so_ca, mt.so_ca) : null, `${tt.so_ca_da_chup} đã chụp${mt.so_ca ? ' · mục tiêu ' + mt.so_ca : ''}`, 'var(--tt8c)')}
      ${cot('Tỉ lệ bán thêm (phát sinh / tiền gói)', tt.upsell_pt != null ? tt.upsell_pt + '%' : '—', mt.upsell_pt && tt.upsell_pt != null ? tl(tt.upsell_pt, mt.upsell_pt) : null,
        `${tt.ca_co_upsell}/${tt.so_ca} ca có phát sinh · ${c.trieu(tt.phat_sinh)}`, 'var(--nhan)')}
    </div>
    <div class="ba-the">
      <div class="the"><div class="mo">Dòng tiền trong kỳ</div>
        <div class="gd"><span>Thực thu</span><b style="color:var(--xanh)">${c.tien(r.thuc_thu)}</b></div>
        <div class="gd"><span>Chi cửa hàng</span><b style="color:var(--do)">− ${c.tien(r.chi)}</b></div>
        <div class="gd"><span><b>Lãi tạm (thu − chi đã ghi)</b></span><b>${c.tien(laiTam)}</b></div>
        <div class="mo nho">Chỉ đúng khi mọi khoản chi đã ghi ở mục Chi cửa hàng.</div></div>
      <div class="the"><div class="mo">Khách tiềm năng → chốt (theo ngày nhận lead)</div>
        <div class="so-to">${r.lead.so ? Math.round((100 * r.lead.chot) / r.lead.so) + '%' : '—'}</div>
        <div class="mo">${r.lead.so} lead · ${r.lead.chot} chốt · ${r.lead.mat} mất${r.lead.so ? '' : ' — chưa nhập lead nào ở mục Khách tiềm năng'}</div></div>
      <div class="the"><div class="mo">Theo hạng mục</div>
        <div class="cuon-doc" style="max-height:220px">${r.theo_hang_muc.map((h) => `<div class="gd"><span><b style="font-weight:600">${c.esc(h.ten)}</b><br><span class="mo nho">${h.so_ca} ca${h.upsell_pt != null ? ' · bán thêm ' + h.upsell_pt + '%' : ''}</span></span><b>${c.trieu(h.doanh_thu)}</b></div>`).join('') || '<div class="mo">Chưa có ca.</div>'}</div></div>
    </div>
    <div class="the"><h2>Doanh thu theo ${theoThang ? 'tháng' : 'ngày chụp'}</h2>
      <div class="cuon-ngang"><div style="display:flex;gap:4px;align-items:flex-end;height:150px;min-width:${cotNgay.length * 26}px">
        ${cotNgay.map((d) => `<a href="${d.href}" title="${d.ten} · ${d.so_ca} ca · ${c.tien(d.doanh_thu)}" style="flex:1;min-width:20px;text-align:center;text-decoration:none">
          <div style="height:${Math.round((n(d.doanh_thu) / maxNgay) * 120)}px;background:${d.xong ? 'var(--nhan)' : 'var(--nhan-nhat)'};border-radius:5px 5px 0 0"></div>
          <div class="mo" style="font-size:10px">${d.nhan}</div></a>`).join('') || '<div class="mo">Chưa có ca trong kỳ.</div>'}
      </div></div><div class="mo nho">Cột đậm: đã chụp · cột nhạt: lịch đã chốt sắp tới.</div></div>
    ${c.laChu() && !motThang ? '<div class="the mo">Đặt mục tiêu: chọn một tháng (bấm nhãn kỳ → T1…T12).</div>' : ''}
    ${c.laChu() && motThang ? `<div class="the"><h2>Đặt mục tiêu tháng ${k.tu.slice(5, 7)}/${k.tu.slice(0, 4)}</h2>
      <div class="hai"><label>Doanh thu mục tiêu (đ)<input id="mt-dt" type="number" step="1000000" value="${mt.doanh_thu ?? ''}"></label>
        <label>Số ca mục tiêu<input id="mt-ca" type="number" value="${mt.so_ca ?? ''}"></label>
        <label>Tỉ lệ bán thêm mục tiêu (%)<input id="mt-up" type="number" step="0.5" value="${mt.upsell_pt ?? ''}"></label>
        <label>Ghi chú<input id="mt-ghi" value="${c.esc(mt.ghi_chu || '')}" placeholder="Chiến dịch tháng, ngày nghỉ…"></label></div>
      <div class="hang-nut" style="margin-top:10px"><button class="nut nho" id="mt-luu">Lưu mục tiêu</button></div></div>` : ''}`;
  kh.ganKhoang(k, hn, (x) => '#/ke-hoach/' + x);
  if (c.laChu() && motThang) c.$('#mt-luu').onclick = () => c.chay(async () => {
    await c.kho.ham('crm_luu_muc_tieu', { p_thang: k.tu, d: { doanh_thu: c.$('#mt-dt').value, so_ca: c.$('#mt-ca').value, upsell_pt: c.$('#mt-up').value, ghi_chu: c.$('#mt-ghi').value }, p_ai: c.toi });
    c.bao('Đã lưu mục tiêu'); trangKeHoach(c, thang);
  });
}

// ═════════ KHÁCH TIỀM NĂNG ═════════
export async function trangLead(c, loc = '') {
  const r = await c.kho.ham('crm_ds_lead', { p_trang_thai: loc || null, p_tim: null });
  const dem = r.dem || {};
  const dangMo = ['moi', 'dang_tu_van', 'da_bao_gia', 'hen_den'].reduce((s, k) => s + n(dem[k]), 0);
  const nguoi = n(r.nguoi);
  c.trang.innerHTML = c.dauTrang('Bán hàng', 'Khách tiềm năng', 'Khách hỏi chưa chốt. Máy đọc hội thoại Pancake mỗi 30 phút: khách nhắn mà chưa ai trả lời thì lên đầu; sale trả lời rồi khách im thì hẹn nhắn lại sau 2 ngày; im quá 14 ngày thì xếp "Nguội". Sale tự đổi ngày hẹn thì máy không đè. Chốt xong bấm "Lên hợp đồng".',
    `<button class="nut" id="lead-moi">+ Thêm khách</button>`) + `
    <div class="so-lieu">
      ${c.theSo('#/lead/cho_tra_loi', 'canh', ['var(--do-nhat)', 'var(--do)'], 'Khách chờ trả lời', n(r.cho_tra_loi), n(r.cho_tra_loi) ? 'khách nhắn sau tin cuối của sale' : 'không ai đang chờ')}
      ${c.theSo('#/lead/qua_hen', 'lich', ['var(--vang-nhat)', '#8A5A00'], 'Quá hẹn nhắn lại', r.qua_hen, r.qua_hen ? 'khách im, tới lúc nhắn lại' : 'không ai bị bỏ quên')}
      ${c.theSo('#/lead', 'tim', ['var(--tt4n)', 'var(--tt4c)'], 'Đang theo', dangMo - nguoi, `chưa chốt · ${nguoi} nguội (im >14 ngày)`)}
      ${c.theSo('#/lead/da_chot', 'hd', ['var(--xanh-nhat)', 'var(--xanh)'], 'Đã chốt', n(dem.da_chot), n(dem.mat) + ' mất')}
      ${r.qc_30 ? c.theSo('#/lead', 'nha', ['var(--tt8n)', 'var(--tt8c)'], 'Từ quảng cáo (30 ngày)', `${r.qc_30.so}/${r.qc_30.tong}`,
        r.qc_30.so ? `chốt ${r.qc_30.chot} · ${Math.round((100 * r.qc_30.chot) / r.qc_30.so)}% · tổng chốt ${r.qc_30.tong_chot}` : 'chưa có khách từ quảng cáo')
        : c.theSo('#/lead', 'nha', ['var(--tt8n)', 'var(--tt8c)'], 'Nguồn 30 ngày', Object.values(r.theo_kenh || {}).reduce((s, x) => s + n(x), 0), Object.entries(r.theo_kenh || {}).map(([k, v]) => `${KENH[k] || k} ${v}`).join(' · ') || 'chưa có')}
    </div>
    <div class="the" style="padding:12px 14px"><a class="chip ${!loc ? 'chon' : ''}" href="#/lead">Tất cả</a>${[['cho_tra_loi', 'Chờ trả lời', r.cho_tra_loi], ['qua_hen', 'Quá hẹn', r.qua_hen], ['nguoi', 'Nguội', r.nguoi]].map(([k, t, so]) => `<a class="chip ${loc === k ? 'chon' : ''}" href="#/lead/${k}">${t} <span class="so">${n(so)}</span></a>`).join('')}${Object.entries(TT_LEAD).map(([k, [t]]) => `<a class="chip ${loc === k ? 'chon' : ''}" href="#/lead/${k}">${t} <span class="so">${n(dem[k])}</span></a>`).join('')}</div>
    <div class="luoi-ca">${r.ds.map((l) => `<div class="the-ca" style="border-left-color:var(--${TT_LEAD[l.trang_thai][1]}c)">
      <div class="hang"><span class="nhan ${TT_LEAD[l.trang_thai][1]}">${TT_LEAD[l.trang_thai][0]}</span>${l.nguon_qc ? '<span class="nhan cam" title="Khách bấm vào quảng cáo rồi nhắn">Quảng cáo</span>' : ''}
        <span class="mo nho" style="margin-left:auto">${l.tu_pancake ? 'Pancake' : KENH[l.kenh] || l.kenh} · ${l.tao}</span></div>
      <div class="hang"><span class="ten">${c.esc(l.ten)}</span>${l.hang_muc_ten ? `<span class="nhan" style="margin-left:auto">${c.esc(l.hang_muc_ten)}</span>` : ''}</div>
      ${l.nhu_cau ? `<div class="phu">"${c.esc(l.nhu_cau)}"</div>` : ''}
      ${l.tu_pancake ? `<div class="phu">${l.so_tin_khach || 0} tin khách nhắn${l.tin_khach_vn ? ' · khách nhắn cuối ' + l.tin_khach_vn + (l.tin_sale_vn ? ' · sale nhắn cuối ' + l.tin_sale_vn : ' · sale chưa trả lời') : l.tin_cuoi_vn ? ' · tin cuối ' + l.tin_cuoi_vn : ''}${(l.nhan_pancake || []).length ? ' · nhãn: ' + l.nhan_pancake.map(c.esc).join(', ') : ''}</div>` : ''}
      <div class="phu">${l.du_kien_chup ? 'dự kiến chụp ' + c.ngayVN(l.du_kien_chup) + ' · ' : ''}${l.cho_tra_loi ? '<b style="color:var(--do)">khách đang chờ trả lời</b>'
        : l.nguoi ? '<span class="mo">nguội — khách im hơn 14 ngày</span>'
        : l.hen_lien_he ? `<b style="color:${l.qua_hen || (l.hen_lien_he <= c.homNay() && !['da_chot', 'mat'].includes(l.trang_thai)) ? 'var(--do)' : 'inherit'}">hẹn nhắn lại ${c.ngayVN(l.hen_lien_he)}</b>${l.hen_tay ? ' <span class="mo nho">(sale đặt)</span>' : ''}` : ''}${l.sale ? ' · ' + c.esc(l.sale) : ''}</div>
      ${l.ly_do_mat ? `<div class="phu" style="color:var(--do)">Mất vì: ${c.esc(l.ly_do_mat)}</div>` : ''}
      <div class="hang-nut">${c.sdtHtml(l.sdt)}<button class="nut phu nho" data-sua="${l.id}">Sửa</button>
        ${l.hop_dong_id ? `<a class="nut phu nho" href="#/ca/${l.hop_dong_id}">${l.hop_dong_ma}</a>` : c.coTien() && l.trang_thai !== 'mat' ? `<button class="nut nho" data-hd="${l.id}">Lên hợp đồng</button>` : ''}</div>
    </div>`).join('') || '<div class="trong">Chưa có khách tiềm năng. Bấm "+ Thêm khách" khi có người nhắn hỏi.</div>'}</div>`;
  const moForm = (l = {}) => {
    const h = hop(c, l.id ? 'Sửa khách tiềm năng' : 'Thêm khách tiềm năng', `
      <div class="hai"><label>Tên *<input id="l-ten" value="${c.esc(l.ten || '')}"></label><label>SĐT<input id="l-sdt" type="tel" value="${c.esc(l.sdt || '')}"></label>
        <label>Kênh<select id="l-kenh">${Object.entries(KENH).map(([k, t]) => `<option value="${k}" ${k === (l.kenh || 'facebook') ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
        <label>Hạng mục<select id="l-hm"><option value="">—</option>${c.DM.hangMuc.map((x) => `<option value="${x.ma}" ${x.ma === l.hang_muc ? 'selected' : ''}>${c.esc(x.ten)}</option>`).join('')}</select></label>
        <label>Trạng thái<select id="l-tt">${Object.entries(TT_LEAD).map(([k, [t]]) => `<option value="${k}" ${k === (l.trang_thai || 'moi') ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
        <label>Hẹn nhắn lại<input id="l-hen" type="date" value="${l.hen_lien_he || c.congNgay(c.homNay(), 1)}"></label>
        <label>Dự kiến chụp<input id="l-du" type="date" value="${l.du_kien_chup || ''}"></label>
        <label>Sale theo<select id="l-sale"><option value="">—</option>${c.DM.nhanSu.filter((x) => x.vai.includes('sale_online') || x.vai.includes('chu')).map((x) => `<option value="${x.id}" ${x.id === l.sale_id || (!l.id && x.ma === c.toi) ? 'selected' : ''}>${c.esc(x.ten)}</option>`).join('')}</select></label></div>
      <label style="margin-top:10px">Nhu cầu (câu khách nói)<textarea id="l-nc" rows="2">${c.esc(l.nhu_cau || '')}</textarea></label>
      <label style="margin-top:10px">Lý do mất (bắt buộc khi chọn "Mất")<input id="l-mat" value="${c.esc(l.ly_do_mat || '')}" placeholder="Giá · lịch · chọn bên khác · không trả lời…"></label>
      <label style="margin-top:10px">Ghi chú<input id="l-ghi" value="${c.esc(l.ghi_chu || '')}"></label>
      <div class="hang-nut" style="margin-top:12px"><button class="nut" id="l-luu">Lưu</button></div>`);
    h.g.querySelector('#l-luu').onclick = () => c.chay(async () => {
      await c.kho.ham('crm_luu_lead', { d: { id: l.id || null, ten: giaTri(h.g, '#l-ten'), sdt: giaTri(h.g, '#l-sdt'), kenh: giaTri(h.g, '#l-kenh'), hang_muc: giaTri(h.g, '#l-hm'),
        trang_thai: giaTri(h.g, '#l-tt'), hen_lien_he: giaTri(h.g, '#l-hen'), du_kien_chup: giaTri(h.g, '#l-du'), sale_id: giaTri(h.g, '#l-sale'),
        nhu_cau: giaTri(h.g, '#l-nc'), ly_do_mat: giaTri(h.g, '#l-mat'), ghi_chu: giaTri(h.g, '#l-ghi'), hop_dong_id: l.hop_dong_id || null }, p_ai: c.toi });
      h.dong(); c.bao('Đã lưu'); trangLead(c, loc);
    });
  };
  c.$('#lead-moi').onclick = () => moForm();
  document.querySelectorAll('[data-sua]').forEach((b) => (b.onclick = () => moForm(r.ds.find((x) => x.id === Number(b.dataset.sua)))));
  document.querySelectorAll('[data-hd]').forEach((b) => (b.onclick = () => {
    const l = r.ds.find((x) => x.id === Number(b.dataset.hd));
    sessionStorage.setItem('lead', JSON.stringify(l));
    location.hash = '#/moi' + (l.du_kien_chup ? '/' + l.du_kien_chup : '');
  }));
}

// ═════════ ẢNH MẪU (concept · makeup) ═════════
export async function trangAnhMau(c, loai) {
  const ds = await c.kho.ham('crm_anh_mau', { p_loai: loai });
  const mk = loai === 'makeup' ? await c.kho.ham('crm_makeup', { p_thang: c.homNay().slice(0, 8) + '01' }) : null;
  const hm = [...new Set(ds.map((a) => a.hang_muc_ten).filter(Boolean))];
  const ten = loai === 'concept' ? 'Ảnh mẫu concept' : 'Ảnh makeup';
  c.trang.innerHTML = c.dauTrang('Bán hàng', ten, loai === 'concept'
    ? 'Thư viện concept để sale gửi khách chọn trước buổi chụp. Concept khách chọn gắn vào hồ sơ ca để ekip chuẩn bị.'
    : 'Mẫu makeup để khách chọn kiểu, và checkout makeup theo ca (số mặt — gốc tính lương makeup theo lượt).',
    `<button class="nut" id="am-moi">+ Thêm ảnh mẫu</button>`) + `
    ${mk ? `<div class="hai-cot deu"><div class="the"><h2>Checkout makeup tháng này</h2>
      ${mk.theo_tho.map((t) => `<div class="gd"><span><b style="font-weight:600">${c.esc(t.ten)}</b><br><span class="mo nho">${t.so_ca} ca</span></span><b>${t.nguoi_lon} người lớn · ${t.tre_em} trẻ em</b></div>`).join('') || '<div class="mo">Chưa có checkout. Thợ makeup ghi ở hồ sơ từng ca.</div>'}</div>
      <div class="the"><h2>Ca đã checkout</h2><div class="cuon-doc" style="max-height:240px">${mk.ds.map((x) => `<a class="gd" href="#/ca/${x.hop_dong_id}" style="text-decoration:none"><span>${c.ngayVN(x.ngay)} · ${c.esc(x.khach)}<br><span class="mo nho">${c.esc(x.tho)}</span></span><b>${x.nguoi_lon}+${x.tre_em}</b></a>`).join('') || '<div class="mo">—</div>'}</div></div></div>` : ''}
    <div class="the" style="padding:12px 14px"><span class="chip chon" data-hm="">Tất cả <span class="so">${ds.length}</span></span>${hm.map((h) => `<span class="chip" data-hm="${c.esc(h)}">${c.esc(h)}</span>`).join('')}</div>
    <div class="luoi-anh" id="luoi-anh"></div>`;
  const ve = (h) => {
    c.$('#luoi-anh').innerHTML = ds.filter((a) => !h || a.hang_muc_ten === h).map((a) => `<figure class="o-anh">
      <img src="${c.esc(anhTrucTiep(a.anh_url))}" alt="${c.esc(a.ten)}" loading="lazy">
      <figcaption><b>${c.esc(a.ten)}</b><span class="mo nho">${c.esc(a.hang_muc_ten || '')}${a.so_lan_chon ? ` · ${a.so_lan_chon} ca đã chọn` : ''}</span></figcaption></figure>`).join('')
      || '<div class="trong">Chưa có ảnh mẫu. Bấm "+ Thêm ảnh mẫu" và dán link ảnh (Google Drive để chế độ ai có link đều xem).</div>';
  };
  document.querySelectorAll('[data-hm]').forEach((x) => (x.onclick = () => { document.querySelectorAll('[data-hm]').forEach((y) => y.classList.remove('chon')); x.classList.add('chon'); ve(x.dataset.hm); }));
  ve('');
  c.$('#am-moi').onclick = () => {
    const h = hop(c, 'Thêm ' + ten.toLowerCase(), `
      <div class="hai"><label>Tên *<input id="am-ten" placeholder="${loai === 'concept' ? 'Mây trắng · Gấu nâu · Tết đỏ…' : 'Trong veo · Tây Âu…'}"></label>
        <label>Hạng mục<select id="am-hm"><option value="">—</option>${c.DM.hangMuc.map((x) => `<option value="${x.ma}">${c.esc(x.ten)}</option>`).join('')}</select></label></div>
      <label style="margin-top:10px">Link ảnh * (Google Drive, Facebook, website)<input id="am-url" placeholder="https://drive.google.com/file/d/…"></label>
      <label style="margin-top:10px">Mô tả<input id="am-mo" placeholder="Đạo cụ, trang phục, màu chủ đạo…"></label>
      <div id="am-xem" style="margin-top:10px"></div>
      <div class="hang-nut" style="margin-top:12px"><button class="nut" id="am-luu">Lưu</button></div>`);
    h.g.querySelector('#am-url').oninput = (e) => { h.g.querySelector('#am-xem').innerHTML = /^https?:/.test(e.target.value) ? `<img src="${c.esc(anhTrucTiep(e.target.value))}" style="max-height:180px;border-radius:8px">` : ''; };
    h.g.querySelector('#am-luu').onclick = () => c.chay(async () => {
      await c.kho.ham('crm_luu_anh_mau', { d: { loai, ten: giaTri(h.g, '#am-ten'), hang_muc: giaTri(h.g, '#am-hm'), anh_url: giaTri(h.g, '#am-url'), mo_ta: giaTri(h.g, '#am-mo') }, p_ai: c.toi });
      h.dong(); c.bao('Đã thêm'); trangAnhMau(c, loai);
    });
  };
}

// ═════════ HẠN GIAO ẢNH ═════════
export async function trangHanGiao(c) {
  const tu = c.homNay(), den = c.congNgay(tu, 13);
  const datHen = c.coTien();   // chủ / sale online — hẹn trả ảnh là lời hứa với khách
  const [r, thieu, cu] = await Promise.all([c.kho.ham('crm_han_giao', { p_tu: tu, p_den: den }), datHen ? c.kho.ham('crm_thieu_hen', {}) : [],
    c.laChu() ? c.kho.ham('crm_ca_cu_mo', { p_ai: c.toi }) : null]);
  const tre = r.ca.filter((x) => x.con_ngay < 0 && x.trang_thai < 8);
  const dh = r.dung_han;
  c.trang.innerHTML = c.dauTrang('Chụp & hậu kỳ', 'Hạn giao ảnh', 'Lịch hẹn trả ảnh 14 ngày tới và các ca đã quá hẹn. Chuyển ca sang "8. Hoàn thành" là máy ghi ngày trả thật để đo đúng hạn.') + `
    <div class="so-lieu bon">
      ${c.theSo('#/han-giao', 'canh', ['var(--do-nhat)', 'var(--do)'], 'Quá hẹn trả ảnh', tre.length, tre.length ? 'xử lý trước tiên' : 'không ca nào trễ')}
      ${c.theSo('#/han-giao', 'lich', ['var(--vang-nhat)', '#8A5A00'], 'Đến hạn trong 2 ngày', r.ca.filter((x) => x.con_ngay >= 0 && x.con_ngay <= 2 && x.trang_thai < 8).length, 'chuẩn bị giao')}
      ${c.theSo('#/chat-luong', 'tien', ['var(--xanh-nhat)', 'var(--xanh)'], 'Trả đúng hạn (60 ngày)', dh.so ? Math.round((100 * dh.dung) / dh.so) + '%' : '—', dh.so ? `${dh.dung}/${dh.so} ca` : 'đo từ 09/11/2026 — chưa có ca trả')}
      ${c.theSo('#/chat-luong', 'may', ['var(--tt8n)', 'var(--tt8c)'], 'Chụp → trả ảnh trung bình', dh.tb_ngay != null ? dh.tb_ngay + ' ngày' : '—', 'cam kết 7–10 ngày')}
    </div>
    ${thieu.length ? `<div class="the" style="border-color:var(--vang, #C98A00)" id="thieu-hen">
      <div class="dau-the"><h2>Chưa có hẹn trả ảnh · ${thieu.length} ca</h2><span class="phai"><button class="nut nho" id="th-luu">Lưu các ô đã điền</button></span></div>
      <p class="mo" style="margin:0 0 10px">Ca đang hậu kỳ (chụp trong 45 ngày) mà chưa có ngày hẹn — máy không đo được trễ hạn. Điền ngày đã hứa với khách; chưa rõ thì bấm <b>gợi ý</b> (ngày chụp + số ngày trả ảnh của gói) rồi sửa nếu cần. Ô để trống thì bỏ qua.</p>
      <div style="overflow-x:auto"><table><tr><th>Khách</th><th>Gói</th><th>Chụp</th><th>Đang ở</th><th>Hẹn trả ảnh</th></tr>
      ${thieu.map((x) => `<tr><td><a href="#/ca/${x.id}">${c.esc(x.khach)}</a></td><td>${c.esc(x.goi)}</td><td>${c.ngayVN(x.ngay_chup)}</td><td class="mo">${c.esc(x.trang_thai_ten)}</td>
        <td style="white-space:nowrap"><input type="date" data-hen="${x.id}" style="width:auto"> <a href="#" class="mo" data-goiy="${x.id}" data-ngay="${x.goi_y}">gợi ý ${c.ngayVN(x.goi_y)}</a></td></tr>`).join('')}
      </table></div></div>` : ''}
    ${theCaCu(c, cu)}
    ${tre.length ? `<div class="the" style="border-color:var(--do)"><h2 style="color:var(--do)">Quá hẹn</h2><div class="luoi-ca">${tre.map((x) => c.theCa({ ...x, tong_hoa_don: null }, `<div><span class="nhan do">trễ ${-x.con_ngay} ngày</span></div>`)).join('')}</div></div>` : ''}
    ${[...Array(14).keys()].map((i) => {
      const d = c.congNgay(tu, i), ds = r.ca.filter((x) => x.hen_tra_anh === d);
      if (!ds.length) return '';
      return `<div class="the"><div class="dau-the"><h2>${c.THU[new Date(d + 'T12:00:00Z').getUTCDay()]} ${c.ngayVN(d)}${i === 0 ? ' · hôm nay' : ''}</h2><span class="phai mo">${ds.length} ca</span></div>
        <div class="luoi-ca">${ds.map((x) => c.theCa({ ...x, tong_hoa_don: null }, x.tra_that ? `<div><span class="nhan xanh">đã trả ${c.ngayVN(x.tra_that)}</span></div>` : '')).join('')}</div></div>`;
    }).join('') || (tre.length ? '' : '<div class="trong">14 ngày tới chưa có ca nào hẹn trả ảnh.</div>')}`;
  if (thieu.length) {
    c.trang.querySelectorAll('[data-goiy]').forEach((a) => (a.onclick = (e) => {
      e.preventDefault(); c.trang.querySelector(`[data-hen="${a.dataset.goiy}"]`).value = a.dataset.ngay;
    }));
    c.$('#th-luu').onclick = () => c.chay(async () => {
      const ds = [...c.trang.querySelectorAll('[data-hen]')].filter((i) => i.value).map((i) => ({ id: Number(i.dataset.hen), hen: i.value }));
      if (!ds.length) { c.bao('Chưa điền ô nào', true); return; }
      const n = await c.kho.ham('crm_dat_hen', { p_ds: ds, p_ai: c.toi });
      c.bao('Đã lưu hẹn cho ' + n + ' ca'); trangHanGiao(c);
    });
  }
  if (cu) ganCaCu(c, cu);
}

// Ca sổ cũ còn "đang mở" (024) — chỉ chủ. Sổ không ghi tiến độ nên 006 đoán trạng thái theo ngày ⇒ ca giao từ lâu vẫn treo.
function theCaCu(c, cu) {
  if (!cu || (!cu.dong_duoc.length && !cu.con_no.length && !cu.lan_dong.length)) return '';
  const nhom = {};
  cu.dong_duoc.forEach((x) => { nhom[x.trang_thai_ten] = (nhom[x.trang_thai_ten] || 0) + 1; });
  const dong = (x) => `<tr><td><a href="#/ca/${x.id}">${c.esc(x.khach)}</a></td><td>${c.esc(x.goi)}</td>
    <td>${x.ngay_chup ? c.ngayVN(x.ngay_chup) : `<span class="mo">sổ ${x.thang_so ? 'tháng ' + x.thang_so : 'không ghi ngày'}</span>`}</td><td class="mo">${c.esc(x.trang_thai_ten)}</td>
    <td style="text-align:right">${c.tien(x.con_lai > 0 ? x.con_lai : x.tong_hoa_don)}</td></tr>`;
  return `<div class="the" id="ca-cu">
    <div class="dau-the"><h2>Ca sổ cũ còn mở · ${cu.tong} ca</h2></div>
    <p class="mo" style="margin:0 0 10px">Sổ Sheet không ghi tiến độ nên khi nhập máy đoán trạng thái theo ngày chụp — ca giao từ lâu vẫn treo ở "Đã chụp", "Chờ in/giao"… và làm nhiễu hậu kỳ, việc của tôi. Ca còn nợ <b>không</b> đóng.</p>
    ${cu.dong_duoc.length ? `<p style="margin:0 0 8px"><b>${cu.dong_duoc.length} ca</b> chụp quá 45 ngày (hoặc sổ không ghi ngày), <b>đã thu đủ</b>: ${Object.entries(nhom).map(([k, v]) => `${c.esc(k)} ${v}`).join(' · ')}.</p>
      <details style="margin:0 0 10px"><summary class="mo">Xem danh sách</summary><div style="overflow-x:auto;max-height:420px"><table><tr><th>Khách</th><th>Gói</th><th>Chụp</th><th>Đang ở</th><th style="text-align:right">Tổng</th></tr>${cu.dong_duoc.map(dong).join('')}</table></div></details>
      <button class="nut" id="cc-dong">Chuyển ${cu.dong_duoc.length} ca sang "8. Hoàn thành"</button> <span class="mo">— hẹn trả ảnh giữ nguyên, hoàn tác được</span>` : ''}
    ${cu.con_no.length ? `<h3 style="margin:16px 0 6px">Còn nợ · ${cu.con_no.length} ca · ${c.tien(cu.con_no.reduce((s, x) => s + Number(x.con_lai), 0))}</h3>
      <p class="mo" style="margin:0 0 8px">Nợ thật thì nhắc khách; sổ quên ghi đã thu thì mở ca ghi phiếu thu rồi đóng tay.</p>
      <details><summary class="mo">Xem danh sách</summary><div style="overflow-x:auto;max-height:420px"><table><tr><th>Khách</th><th>Gói</th><th>Chụp</th><th>Đang ở</th><th style="text-align:right">Còn nợ</th></tr>${cu.con_no.map(dong).join('')}</table></div></details>` : ''}
    ${cu.gan_day ? `<p class="mo" style="margin:12px 0 0">${cu.gan_day} ca chụp trong 45 ngày để nguyên — đang làm thật.</p>` : ''}
    ${cu.lan_dong.map((l) => `<p class="mo" style="margin:10px 0 0">Đã đóng ${l.so} ca lúc ${l.luc} · <a href="#" data-mo-lai="${l.id}">hoàn tác</a></p>`).join('')}
  </div>`;
}
function ganCaCu(c, cu) {
  const nut = c.$('#cc-dong');
  if (nut) nut.onclick = () => c.chay(async () => {
    if (!confirm(`Chuyển ${cu.dong_duoc.length} ca sổ cũ sang "8. Hoàn thành"?\nCa còn nợ không bị đụng. Hoàn tác được.`)) return;
    const kq = await c.kho.ham('crm_dong_ca_cu', { p_ids: cu.dong_duoc.map((x) => x.id), p_ai: c.toi });
    c.bao(`Đã đóng ${kq.so} ca` + (kq.bo_qua ? ` · bỏ qua ${kq.bo_qua} ca vừa đổi` : '')); trangHanGiao(c);
  });
  c.trang.querySelectorAll('[data-mo-lai]').forEach((a) => (a.onclick = (e) => {
    e.preventDefault();
    c.chay(async () => {
      if (!confirm('Trả các ca của lần đóng này về trạng thái cũ?')) return;
      const n = await c.kho.ham('crm_mo_lai_ca_cu', { p_nhat_ky: Number(a.dataset.moLai), p_ai: c.toi });
      c.bao('Đã trả ' + n + ' ca về trạng thái cũ'); trangHanGiao(c);
    });
  }));
}

// ═════════ VIDEO KHÁCH ═════════
const TT_VIDEO = { can_lam: ['Cần làm', 'tt5'], cho_bao_khach: ['Chờ báo khách', 'tt3'], da_gui: ['Đã gửi', 'tt2'], khong_lam: ['Không làm', 'tt1'] };
export async function trangVideo(c, loc = 'can_lam') {
  const ds = await c.kho.ham('crm_video', { p_so_ngay: 30 });
  const dem = (k) => ds.filter((v) => v.tinh_trang === k).length;
  const tre = ds.filter((v) => v.tinh_trang === 'can_lam' && v.con_gio < 0).length;
  c.trang.innerHTML = c.dauTrang('Chụp & hậu kỳ', 'Video khách', 'Mỗi ca 2 clip (hậu trường + video dựng) trong 24 giờ sau buổi chụp · người quay dán link → CSKH báo khách. Ca 30 ngày gần đây.') + `
    <div class="the" style="padding:12px 14px">${Object.entries(TT_VIDEO).map(([k, [t]]) => `<a class="chip ${loc === k ? 'chon' : ''}" href="#/video/${k}">${t} <span class="so">${dem(k)}${k === 'can_lam' && tre ? ` · ${tre} trễ` : ''}</span></a>`).join('')}</div>
    <div class="luoi-ca">${ds.filter((v) => v.tinh_trang === loc).map((v) => `<div class="the-ca" style="border-left-color:var(--${TT_VIDEO[v.tinh_trang][1]}c)">
      <div class="hang"><span class="gio">${v.gio_chup || ''} ${c.THU[new Date(v.ngay_chup + 'T12:00:00Z').getUTCDay()]}, ${c.ngayVN(v.ngay_chup)}</span><span class="nhan ${TT_VIDEO[v.tinh_trang][1]}" style="margin-left:auto">${TT_VIDEO[v.tinh_trang][0]}</span></div>
      <a class="ten" href="#/ca/${v.id}" style="text-decoration:none">${c.esc(v.khach)}</a>
      <div class="phu">${c.esc(v.goi)}${v.tho_chup ? ' · thợ chụp: ' + c.esc(v.tho_chup) : ''}</div>
      ${v.tinh_trang === 'can_lam' ? `<div class="phu"><b style="color:${v.con_gio < 0 ? 'var(--do)' : 'inherit'}">${v.con_gio < 0 ? `Hạn 24 giờ: trễ ${-v.con_gio < 48 ? -v.con_gio + ' giờ' : Math.round(-v.con_gio / 24) + ' ngày'}` : `Hạn 24 giờ: còn ${v.con_gio} giờ`}</b></div>` : ''}
      <div class="phu">🎞 Hậu trường: ${v.link_hau_truong ? `<a href="${c.esc(v.link_hau_truong)}" target="_blank" rel="noopener">mở</a>` : 'chưa có'} · 🎬 Video dựng: ${v.link_video ? `<a href="${c.esc(v.link_video)}" target="_blank" rel="noopener">mở</a>` : 'chưa có'}</div>
      ${v.khong_lam ? `<div class="phu">Không làm vì: ${c.esc(v.ly_do_khong)}</div>` : ''}
      <div class="hang-nut">${c.sdtHtml(v.sdt)}<button class="nut nho" data-vd="${v.id}">${v.tinh_trang === 'can_lam' ? '+ Dán link video' : 'Sửa'}</button></div>
    </div>`).join('') || '<div class="trong">Không có ca nào ở mục này.</div>'}</div>`;
  document.querySelectorAll('[data-vd]').forEach((b) => (b.onclick = () => moVideo(c, ds.find((x) => x.id === Number(b.dataset.vd)), () => trangVideo(c, loc))));
}
export function moVideo(c, v, xong) {
  const h = hop(c, 'Video khách · ' + v.khach, `
    <label>Link clip hậu trường<input id="v-ht" value="${c.esc(v.link_hau_truong || '')}" placeholder="https://…"></label>
    <label style="margin-top:10px">Link video dựng<input id="v-vd" value="${c.esc(v.link_video || '')}" placeholder="https://…"></label>
    <label style="margin-top:10px;flex-direction:row;display:flex;gap:8px;align-items:center"><input id="v-bao" type="checkbox" style="width:auto" ${v.da_bao_khach ? 'checked' : ''}> CSKH đã gửi video cho khách</label>
    <label style="margin-top:10px;flex-direction:row;display:flex;gap:8px;align-items:center"><input id="v-kl" type="checkbox" style="width:auto" ${v.khong_lam ? 'checked' : ''}> Ca này không làm video</label>
    <label style="margin-top:6px">Lý do không làm<input id="v-ly" value="${c.esc(v.ly_do_khong || '')}" placeholder="Khách không đồng ý quay · ca ảnh thẻ…"></label>
    <div class="hang-nut" style="margin-top:12px"><button class="nut" id="v-luu">Lưu</button></div>`);
  h.g.querySelector('#v-luu').onclick = () => c.chay(async () => {
    await c.kho.ham('crm_luu_video', { p_hop_dong: v.id ?? v.hop_dong_id, d: { link_hau_truong: giaTri(h.g, '#v-ht'), link_video: giaTri(h.g, '#v-vd'),
      da_bao_khach: h.g.querySelector('#v-bao').checked, khong_lam: h.g.querySelector('#v-kl').checked, ly_do_khong: giaTri(h.g, '#v-ly') }, p_ai: c.toi });
    h.dong(); c.bao('Đã lưu'); xong();
  });
}

// ═════════ CHĂM SÓC KHÁCH ═════════
export async function trangCskh(c) {
  const r = await c.kho.ham('crm_cskh', {});
  c.trang.innerHTML = c.dauTrang('Sau chụp', 'Chăm sóc khách', 'Máy tự sinh việc từ ca thật: nhắc chọn ảnh, xin đánh giá, sinh nhật bé, mẹ bầu sắp sinh, khách cũ sắp tròn năm (đo sổ 2023–2026: chỉ 6% khách quay lại, phần lớn quanh mốc 1 năm). Gọi/nhắn xong bấm "Đã liên hệ" để ghi kết quả — việc tự ẩn.') + `
    <div class="hai-cot deu">${Object.entries(CSKH).map(([k, [ten, mo]]) => {
      const ds = r.viec.filter((v) => v.loai === k);
      return `<div class="bo-phan"><div class="dau-bp"><div><b>${ten}</b><div class="mo nho">${mo}</div></div><span class="tong-bp">${ds.length}</span></div>
        ${ds.map((v) => `<div class="nhom-viec"><div class="hang-nut"><a href="#/ca/${v.id}" style="text-decoration:none"><b>${c.esc(v.khach)}</b> <span class="mo nho">${c.esc(v.goi)}</span></a></div>
          <div class="mo nho" style="margin:2px 0 6px">${c.esc(v.ly_do)}</div>
          <div class="hang-nut">${c.sdtHtml(v.sdt)}${v.sdt ? `<a class="nut phu nho" href="https://zalo.me/${c.esc(v.sdt)}" target="_blank" rel="noopener">Zalo</a>` : ''}
            <button class="nut nho" data-lh="${k}|${v.id}|${v.khach_id}">Đã liên hệ</button>${k === 'xin_danh_gia' ? `<button class="nut phu nho" data-dg="${v.id}">Ghi đánh giá</button>` : ''}</div></div>`).join('')
          || '<div class="nhom-viec mo">Không có việc ✓</div>'}</div>`;
    }).join('')}</div>
    <div class="the"><h2>Nhật ký chăm sóc</h2><div class="cuon-doc" style="max-height:360px">${r.nhat_ky.map((x) => `<div class="gd"><span><b style="font-weight:600">${c.esc(x.khach || '')}</b> <span class="mo nho">${x.ma || ''}</span><br>
      <span class="mo nho">${(CSKH[x.loai] || TEN_CSKH_KHAC[x.loai] || [x.loai])[0]}${x.ket_qua ? ' · ' + c.esc(x.ket_qua) : ''}</span></span><span class="mo nho">${c.esc(x.ai)} · ${x.luc}</span></div>`).join('') || '<div class="mo">Chưa có.</div>'}</div></div>`;
  document.querySelectorAll('[data-lh]').forEach((b) => (b.onclick = () => {
    const [loai, id, khach] = b.dataset.lh.split('|');
    const h = hop(c, 'Ghi kết quả liên hệ', `<label>Kết quả<input id="lh-kq" placeholder="Khách hẹn tối chọn · khách đặt lịch 20/12 · không nghe máy…"></label>
      <div class="hang-nut" style="margin-top:12px"><button class="nut" id="lh-luu">Lưu</button></div>`);
    h.g.querySelector('#lh-luu').onclick = () => c.chay(async () => {
      await c.kho.ham('crm_ghi_cskh', { d: { loai, hop_dong_id: id, khach_id: khach, ket_qua: giaTri(h.g, '#lh-kq') }, p_ai: c.toi });
      h.dong(); c.bao('Đã ghi'); trangCskh(c);
    });
  }));
  document.querySelectorAll('[data-dg]').forEach((b) => (b.onclick = () => moDanhGia(c, Number(b.dataset.dg), () => trangCskh(c))));
}
// ═════════ CHỜ KHÁCH LẤY ẢNH (025) ═════════
// Mọi ca đang "7. Chờ in / giao", kể cả ca cũ — các màn khác chỉ xét 45–90 ngày nên khách lâu chưa lấy không ai nhắc.
const NHOM_CHO = [['Trong 30 ngày', (x) => x.cho_ngay != null && x.cho_ngay <= 30], ['1–3 tháng', (x) => x.cho_ngay > 30 && x.cho_ngay <= 90],
  ['3–12 tháng', (x) => x.cho_ngay > 90 && x.cho_ngay <= 365], ['Hơn 1 năm', (x) => x.cho_ngay > 365], ['Sổ không ghi ngày chụp', (x) => x.cho_ngay == null]];
export async function trangChoLay(c, loc = '') {
  const ds = await c.kho.ham('crm_cho_lay_anh', {});
  const chuaNhac = ds.filter((x) => !x.nhac_gan_day).length, no = ds.filter((x) => Number(x.con_lai) > 0);
  const hien = loc === 'no' ? no : loc === 'chua-nhac' ? ds.filter((x) => !x.nhac_gan_day) : ds;
  c.trang.innerHTML = c.dauTrang('Sau chụp', 'Chờ khách lấy ảnh', 'Mọi ca đang ở "7. Chờ in / giao" — ảnh in xong, khách chưa đến lấy. Gọi/Zalo nhắc rồi bấm <b>Đã nhắc</b> (ghi khách nói gì); khách đến lấy thì bấm <b>Đã lấy</b> — còn nợ thì ghi phiếu thu trước.') + `
    <div class="the" style="padding:12px 14px">
      <a class="chip ${!loc ? 'chon' : ''}" href="#/cho-lay">Tất cả <span class="so">${ds.length}</span></a>
      <a class="chip ${loc === 'chua-nhac' ? 'chon' : ''}" href="#/cho-lay/chua-nhac">Chưa nhắc 7 ngày qua <span class="so">${chuaNhac}</span></a>
      <a class="chip ${loc === 'no' ? 'chon' : ''}" href="#/cho-lay/no">Còn nợ <span class="so">${no.length} · ${c.tien(no.reduce((s, x) => s + Number(x.con_lai), 0))}</span></a>
    </div>
    ${NHOM_CHO.map(([ten, f]) => {
      const nh = hien.filter(f);
      if (!nh.length) return '';
      return `<div class="the"><div class="dau-the"><h2>${ten}</h2><span class="phai mo">${nh.length} ca</span></div>
        ${nh.map((x) => `<div class="nhom-viec" style="border-left:3px solid ${x.nhac_gan_day ? 'var(--xanh)' : 'var(--vang, #C98A00)'};padding-left:10px">
          <div class="hang-nut"><a href="#/ca/${x.id}" style="text-decoration:none"><b>${c.esc(x.khach)}</b></a> <span class="mo nho">${c.esc(x.goi)} · ${x.ma}</span>
            ${Number(x.con_lai) > 0 ? `<span class="nhan do">còn ${c.tien(x.con_lai)}</span>` : ''}</div>
          <div class="mo nho" style="margin:2px 0 6px">${x.ngay_chup ? `Chụp ${c.ngayVN(x.ngay_chup)}${x.ngay_chup.slice(0, 4) !== c.homNay().slice(0, 4) ? '/' + x.ngay_chup.slice(0, 4) : ''} · chờ ${x.cho_ngay} ngày` : `Sổ không ghi ngày${x.thang_so ? ' · tháng ' + x.thang_so : ''}`}
            · ${x.lan_nhac ? `đã nhắc ${x.lan_nhac} lần, lần cuối ${c.ngayVN(x.nhac_cuoi)}${x.nhac_ai ? ' (' + c.esc(x.nhac_ai) + ')' : ''}${x.nhac_ket_qua ? ': “' + c.esc(x.nhac_ket_qua) + '”' : ''}` : 'chưa nhắc lần nào'}</div>
          <div class="hang-nut">${c.sdtHtml(x.sdt)}${x.sdt ? `<a class="nut phu nho" href="https://zalo.me/${c.esc(x.sdt)}" target="_blank" rel="noopener">Zalo</a>` : ''}
            <button class="nut phu nho" data-nhac="${x.id}">Đã nhắc</button><button class="nut nho" data-lay="${x.id}" data-no="${Number(x.con_lai) || 0}">Đã lấy</button></div></div>`).join('')}</div>`;
    }).join('') || '<div class="trong">Không có ca nào đang chờ khách lấy ảnh ✓</div>'}`;
  c.trang.querySelectorAll('[data-nhac]').forEach((b) => (b.onclick = () => {
    const h = hop(c, 'Ghi lần nhắc lấy ảnh', `<label>Khách nói gì<input id="nl-kq" placeholder="Hẹn thứ 7 qua lấy · nhờ gửi xe ôm · không nghe máy…"></label>
      <div class="hang-nut" style="margin-top:12px"><button class="nut" id="nl-luu">Lưu</button></div>`);
    h.g.querySelector('#nl-luu').onclick = () => c.chay(async () => {
      await c.kho.ham('crm_nhac_lay_anh', { p_id: Number(b.dataset.nhac), p_ket_qua: giaTri(h.g, '#nl-kq'), p_ai: c.toi });
      h.dong(); c.bao('Đã ghi lần nhắc'); trangChoLay(c, loc);
    });
  }));
  c.trang.querySelectorAll('[data-lay]').forEach((b) => (b.onclick = () => c.chay(async () => {
    if (Number(b.dataset.no) > 0) { c.bao('Khách còn nợ ' + c.tien(b.dataset.no) + ' — mở ca ghi phiếu thu trước', true); location.hash = '#/ca/' + b.dataset.lay; return; }
    if (!confirm('Khách đã đến lấy ảnh in? Ca chuyển sang "8. Hoàn thành".')) return;
    await c.kho.ham('crm_khach_da_lay', { p_id: Number(b.dataset.lay), p_ai: c.toi });
    c.bao('Đã chuyển sang Hoàn thành'); trangChoLay(c, loc);
  })));
}

export function moDanhGia(c, hopDong, xong) {
  const h = hop(c, 'Đánh giá sau chụp', `
    <div class="mo">Hỏi khách chấm 1–5 sao và điều chưa hài lòng — ghi đúng lời khách, đừng làm đẹp.</div>
    <div id="dg-sao" style="font-size:30px;margin:8px 0;cursor:pointer">${[1, 2, 3, 4, 5].map((i) => `<span data-s="${i}">☆</span>`).join('')}</div>
    <div class="mo">Chưa hài lòng điều gì?</div><div id="dg-vd">${Object.entries(VAN_DE).map(([k, t]) => `<span class="chip" data-v="${k}">${t}</span>`).join('')}</div>
    <label style="margin-top:8px">Lời khách<textarea id="dg-nx" rows="2"></textarea></label>
    <label style="margin-top:8px">Nguồn<select id="dg-ng"><option value="sale_hoi">Sale hỏi</option><option value="google">Đánh giá Google</option><option value="facebook">Đánh giá Facebook</option><option value="khach_tu_gui">Khách tự nhắn</option></select></label>
    <div class="hang-nut" style="margin-top:12px"><button class="nut" id="dg-luu">Lưu</button></div>`);
  let diem = 0;
  h.g.querySelectorAll('[data-s]').forEach((s) => (s.onclick = () => { diem = Number(s.dataset.s); h.g.querySelectorAll('[data-s]').forEach((x) => (x.textContent = Number(x.dataset.s) <= diem ? '★' : '☆')); }));
  h.g.querySelectorAll('[data-v]').forEach((x) => (x.onclick = () => x.classList.toggle('chon')));
  h.g.querySelector('#dg-luu').onclick = () => c.chay(async () => {
    if (!diem) throw new Error('Chọn số sao.');
    await c.kho.ham('crm_ghi_danh_gia', { d: { hop_dong_id: hopDong, diem, nhan_xet: giaTri(h.g, '#dg-nx'), nguon: giaTri(h.g, '#dg-ng'),
      van_de: [...h.g.querySelectorAll('[data-v].chon')].map((x) => x.dataset.v) }, p_ai: c.toi });
    h.dong(); c.bao('Đã ghi đánh giá'); xong();
  });
}

// ═════════ CHẤT LƯỢNG DỊCH VỤ ═════════
export async function trangChatLuong(c, chu) {
  const hn = c.homNay(), k = kh.docKhoang(chu, hn), nhan = kh.nhanKhoang(k, hn);
  const r = await c.kho.ham('crm_chat_luong_khoang', { p_tu: k.tu, p_den: k.den });
  const ta = r.tra_anh;
  const maxSao = Math.max(1, ...Object.values(r.phan_bo).map(n));
  c.trang.innerHTML = c.dauTrang('Sau chụp', 'Chất lượng dịch vụ', `Điểm khách chấm, điều khách chưa hài lòng, và trả ảnh có đúng hẹn không · ${nhan} — đo bằng số thật, không đoán.`, kh.cumKhoang(k, hn, (x) => '#/chat-luong/' + x)) + `
    <div class="so-lieu">
      ${c.theSo('#/chat-luong', 'tien', ['var(--vang-nhat)', '#8A5A00'], 'Điểm trung bình', r.tb != null ? r.tb + ' ★' : '—', r.so + ' đánh giá trong kỳ')}
      ${c.theSo('#/han-giao', 'lich', ['var(--xanh-nhat)', 'var(--xanh)'], 'Trả ảnh đúng hạn', ta.so ? Math.round((100 * ta.dung_han) / ta.so) + '%' : '—', ta.so ? `${ta.dung_han}/${ta.so} ca trả trong kỳ` : 'chưa có ca trả (đo từ 09/11)')}
      ${c.theSo('#/han-giao', 'may', ['var(--tt8n)', 'var(--tt8c)'], 'Chụp → trả ảnh', ta.tb_ngay != null ? ta.tb_ngay + ' ngày' : '—', 'trung bình')}
      ${c.theSo('#/hau-ky', 'canh', ['var(--do-nhat)', 'var(--do)'], 'Ca cần sửa lại', r.can_sua, 'đang mở')}
      ${c.theSo('#/cskh', 'nha', ['var(--nhan-nhat)', 'var(--nhan-dam)'], 'Xin đánh giá', 'CSKH', 'việc tự sinh sau khi trả ảnh')}
    </div>
    <div class="hai-cot deu">
      <div class="the"><h2>Phân bố sao</h2>${[5, 4, 3, 2, 1].map((s) => `<div class="hang-nut" style="flex-wrap:nowrap"><span style="width:34px">${s} ★</span>
        <div style="flex:1">${thanh((100 * n(r.phan_bo[s])) / maxSao, s >= 4 ? 'var(--xanh)' : s === 3 ? '#C9A227' : 'var(--do)')}</div><b style="width:30px;text-align:right">${n(r.phan_bo[s])}</b></div>`).join('')}</div>
      <div class="the"><h2>Khách chưa hài lòng điều gì</h2>${Object.entries(r.van_de).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<div class="gd"><span>${VAN_DE[k] || k}</span><b>${v}</b></div>`).join('') || '<div class="mo">Chưa ghi nhận vấn đề nào.</div>'}</div>
    </div>
    <div class="the"><h2>Đánh giá · ${nhan}</h2>${r.ds.map((d) => `<a class="gd" href="#/ca/${d.hop_dong_id}" style="text-decoration:none"><span><b style="font-weight:600">${c.esc(d.khach)}</b> <span class="mo nho">${d.ma} · ${c.esc(d.goi)} · ${d.luc}</span>
      ${d.nhan_xet ? `<br><span class="mo">"${c.esc(d.nhan_xet)}"</span>` : ''}${d.van_de.length ? `<br>${d.van_de.map((v) => `<span class="nhan do">${VAN_DE[v] || v}</span>`).join(' ')}` : ''}</span>
      <b style="color:${d.diem >= 4 ? 'var(--xanh)' : 'var(--do)'}">${'★'.repeat(d.diem)}</b></a>`).join('') || '<div class="trong">Chưa có đánh giá. Ghi ở mục Chăm sóc khách hoặc hồ sơ ca.</div>'}</div>`;
  kh.ganKhoang(k, hn, (x) => '#/chat-luong/' + x);
}

// ═════════ CHI CỬA HÀNG ═════════
export async function trangChi(c, chu) {
  const hn = c.homNay(), k = kh.docKhoang(chu, hn), nhan = kh.nhanKhoang(k, hn), thang = k.chu, motThang = k.kieu === 'thang';
  const r = await c.kho.ham('crm_chi_khoang', { p_tu: k.tu, p_den: k.den });
  const maxK = Math.max(1, ...r.theo_khoan.map((k) => n(k.tien)));
  c.trang.innerHTML = c.dauTrang('Thu chi', 'Chi cửa hàng', `Mỗi khoản chi một phiếu · ${nhan}. Thu trừ chi ra lãi tạm của kỳ — chỉ đúng khi ghi đủ.`, kh.cumKhoang(k, hn, (x) => '#/chi/' + x)) + `
    <div class="so-lieu bon">
      ${c.theSo('#/cong-no/' + thang, 'tien', ['var(--xanh-nhat)', 'var(--xanh)'], 'Thực thu', c.trieu(r.thu), 'từ sổ phiếu thu')}
      ${c.theSo('#/chi/' + thang, 'vi', ['var(--do-nhat)', 'var(--do)'], 'Đã chi', c.trieu(r.tong), r.so + ' phiếu chi')}
      ${c.theSo('#/ke-hoach/' + thang, 'hd', ['var(--tt8n)', 'var(--tt8c)'], 'Lãi tạm (thu − chi)', c.trieu(n(r.thu) - n(r.tong)), 'chưa gồm khoản chưa ghi')}
      ${c.theSo('#/chi/' + thang, 'canh', ['var(--vang-nhat)', '#8A5A00'], 'Khoản chi lớn nhất', r.theo_khoan[0] ? KHOAN[r.theo_khoan[0].khoan_muc] : '—', r.theo_khoan[0] ? c.trieu(r.theo_khoan[0].tien) : 'chưa có phiếu')}
    </div>
    <div class="hai-cot">
      <div>${c.coTien() ? `<div class="the"><h2>Ghi phiếu chi</h2>
        <div class="hai"><label>Ngày<input id="ch-ngay" type="date" value="${c.homNay()}"></label>
          <label>Khoản mục<select id="ch-km">${Object.entries(KHOAN).map(([k, t]) => `<option value="${k}">${t}</option>`).join('')}</select></label>
          <label>Số tiền<input id="ch-tien" type="number" min="0" step="1000"></label>
          <label>Hình thức<select id="ch-ht"><option value="tien_mat">Tiền mặt</option><option value="chuyen_khoan">Chuyển khoản</option></select></label></div>
        <label style="margin-top:10px">Nội dung *<input id="ch-mo" placeholder="Tiền điện tháng 11 · in 10 ảnh UV ca HD-2026-0012…"></label>
        <div class="hang-nut" style="margin-top:10px"><button class="nut nho" id="ch-luu">Ghi phiếu chi</button></div></div>` : '<div class="the mo">Chỉ sale online hoặc anh Thọ ghi phiếu chi.</div>'}
        <div class="the"><h2>Theo khoản mục</h2>${r.theo_khoan.map((k) => `<div class="hang-nut" style="flex-wrap:nowrap"><span style="width:130px">${KHOAN[k.khoan_muc]}</span>
          <div style="flex:1">${thanh((100 * n(k.tien)) / maxK, 'var(--do)')}</div><b style="width:80px;text-align:right">${c.trieu(k.tien)}</b></div>`).join('') || '<div class="mo">Chưa có.</div>'}</div></div>
      <div class="the"><h2>Sổ phiếu chi</h2><div class="cuon-doc">${r.ds.map((x) => `<div class="dong-phieu"><span class="ht ${x.hinh_thuc === 'tien_mat' ? 'tm' : ''}">${x.hinh_thuc === 'tien_mat' ? 'TM' : 'CK'}</span>
        <span><b>${c.esc(x.mo_ta)}</b><br><span class="mo nho">${c.ngayVN(x.ngay)} · ${KHOAN[x.khoan_muc]} · ${c.esc(x.ai)}${x.hop_dong_ma ? ' · ' + x.hop_dong_ma : ''}</span></span>
        <span style="text-align:right"><b style="color:var(--do)">−${c.tien(x.so_tien)}</b>${c.laChu() ? `<br><a href="#" class="mo nho" data-xoa-chi="${x.id}">xoá</a>` : ''}</span></div>`).join('') || '<div class="trong">Chưa có phiếu chi trong kỳ.</div>'}</div></div>
    </div>`;
  kh.ganKhoang(k, hn, (x) => '#/chi/' + x);
  if (c.coTien()) c.$('#ch-luu').onclick = () => c.chay(async () => {
    await c.kho.ham('crm_ghi_chi', { d: { ngay: c.$('#ch-ngay').value, khoan_muc: c.$('#ch-km').value, so_tien: c.$('#ch-tien').value, hinh_thuc: c.$('#ch-ht').value, mo_ta: c.$('#ch-mo').value }, p_ai: c.toi });
    c.bao('Đã ghi'); trangChi(c, thang);
  });
  document.querySelectorAll('[data-xoa-chi]').forEach((a) => (a.onclick = (e) => { e.preventDefault(); c.chay(async () => {
    if (!confirm('Xoá phiếu chi này? Nhật ký vẫn giữ bản cũ.')) return;
    await c.kho.ham('crm_xoa_chi', { p_id: Number(a.dataset.xoaChi), p_ai: c.toi }); trangChi(c, thang);
  }); }));
}

// ═════════ ĐĂNG BÀI FACEBOOK ═════════
export async function trangDangBai(c) {
  const ds = await c.kho.ham('crm_bai_dang', {});
  c.trang.innerHTML = c.dauTrang('Marketing', 'Đăng bài Facebook', 'Soạn bài, xếp lịch, anh Thọ duyệt. App KHÔNG tự đăng: anh Thọ chạy DANG-BAI.ps1 -Crm -That trên máy studio, máy đăng mọi bài "Đã duyệt" tới giờ rồi ghi link về đây.',
    `<button class="nut" id="bd-moi">+ Soạn bài</button>`) + `
    <div class="the" style="padding:12px 14px">${Object.entries(TT_BAI).map(([k, [t]]) => `<span class="chip">${t} <span class="so">${ds.filter((b) => b.trang_thai === k).length}</span></span>`).join('')}</div>
    <div class="luoi-ca">${ds.map((b) => `<div class="the-ca" style="border-left-color:var(--${TT_BAI[b.trang_thai][1]}c)">
      <div class="hang"><span class="nhan ${TT_BAI[b.trang_thai][1]}">${TT_BAI[b.trang_thai][0]}</span><span class="mo nho" style="margin-left:auto">${c.esc(b.trang || '')}</span></div>
      ${xemTruoc(c, b.anh_url)}
      <div style="white-space:pre-wrap;font-size:13.5px;max-height:120px;overflow:hidden">${c.esc(b.noi_dung)}</div>
      <div class="phu">${b.lich_dang ? 'Lịch đăng ' + c.ngayVN(b.lich_dang.slice(0, 10)) + ' ' + b.lich_dang.slice(11) : 'Chưa xếp lịch'} · ${c.esc(b.ai)}${b.hop_dong_ma ? ' · ' + b.hop_dong_ma : ''}</div>
      ${b.link_bai ? `<a class="phu" href="${c.esc(b.link_bai)}" target="_blank" rel="noopener">Mở bài đã đăng</a>` : ''}
      ${b.dang_log ? `<details><summary class="mo nho">Máy đăng ${c.esc(b.dang_luc || '')}${/✖/.test(b.dang_log.split('---').pop()) ? ' · <b style="color:var(--do)">còn lỗi</b>' : ''}</summary><div class="mo nho" style="white-space:pre-wrap">${c.esc(b.dang_log)}</div></details>` : ''}
      <div class="hang-nut"><button class="nut phu nho" data-bd="${b.id}">Sửa</button></div></div>`).join('') || '<div class="trong">Chưa có bài nào. Bấm "+ Soạn bài".</div>'}</div>`;
  const moBai = (b = {}) => {
    const h = hop(c, b.id ? 'Sửa bài' : 'Soạn bài', `
      <div class="hai"><label>Fanpage (nhiều Page: cách dấu phẩy)<input id="bd-trang" list="ds-trang" value="${c.esc(b.trang || FANPAGE[0])}"><datalist id="ds-trang">${FANPAGE.map((f) => `<option>${f}</option>`).join('')}</datalist></label>
        <label>Lịch đăng<input id="bd-lich" type="datetime-local" value="${b.lich_dang || ''}"></label></div>
      <label style="margin-top:10px">Nội dung *<textarea id="bd-nd" rows="8" placeholder="Tiêu đề emoji chữ hoa · 📸/👉 · chân bài địa chỉ/hotline/inbox + hashtag">${c.esc(b.noi_dung || '')}</textarea></label>
      <label style="margin-top:10px">Ảnh / video — mỗi dòng một file<textarea id="bd-anh" rows="3" placeholder="D:\\Video\\2-Video Hoàn Thiện\\ten-video.mp4&#10;https://drive.google.com/file/d/… (Drive để 'Bất kỳ ai có đường liên kết')">${c.esc(b.anh_url || '')}</textarea></label>
      <div class="mo nho" style="margin-top:4px">Có video ⇒ đăng Reel (video đầu tiên). Chỉ ảnh ⇒ bài nhiều ảnh. Đường dẫn D:\\… là file trên máy studio.</div>
      <label style="margin-top:10px">Trạng thái<select id="bd-tt">${Object.entries(TT_BAI).filter(([k]) => c.laChu() || k !== 'da_duyet').map(([k, [t]]) => `<option value="${k}" ${k === (b.trang_thai || 'nhap') ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
      <label style="margin-top:10px">Link bài sau khi đăng<input id="bd-link" value="${c.esc(b.link_bai || '')}"></label>
      <div class="hang-nut" style="margin-top:12px"><button class="nut" id="bd-luu">Lưu</button></div>`);
    h.g.querySelector('#bd-luu').onclick = () => c.chay(async () => {
      await c.kho.ham('crm_luu_bai', { d: { id: b.id || null, trang: giaTri(h.g, '#bd-trang'), lich_dang: giaTri(h.g, '#bd-lich'), noi_dung: h.g.querySelector('#bd-nd').value,
        anh_url: h.g.querySelector('#bd-anh').value.trim(), trang_thai: giaTri(h.g, '#bd-tt'), link_bai: giaTri(h.g, '#bd-link') }, p_ai: c.toi });
      h.dong(); c.bao('Đã lưu'); trangDangBai(c);
    });
  };
  c.$('#bd-moi').onclick = () => moBai();
  document.querySelectorAll('[data-bd]').forEach((x) => (x.onclick = () => moBai(ds.find((b) => b.id === Number(x.dataset.bd)))));
}

// ═════════ ALBUM CHỌN ẢNH trong hồ sơ ca ═════════
// Album chạy ở Apps Script; CRM chỉ lưu mã và đọc tóm tắt (?api=tom). Khách gửi xong ⇒ sale bấm "Đưa vào hoá đơn".
async function docTomAlbum(ma) {
  const r = await fetch(`${ALBUM_URL}?api=tom&a=${encodeURIComponent(ma)}&t=${Date.now()}`, { redirect: 'follow' });
  if (!r.ok) throw new Error('Không đọc được album (HTTP ' + r.status + ')');
  const j = await r.json();
  if (j.loi) throw new Error(j.loi);
  return j;
}
async function veAlbum(c, h, al, el, veLai) {
  if (!el) return;
  // 13/11/2026: link gửi khách là trang bọc trên web (album bản 4) — khách không phải thấy link script.google.com.
  const linkKhach = al.ma ? `https://homestudio247.com/chon-anh/?a=${al.ma}` : '';
  const dauThe = `<div class="dau-the"><h2>Album chọn ảnh</h2><span class="phai"><a class="nut phu nho" href="${ALBUM_URL}?ql" target="_blank" rel="noopener">Tạo / quản lý album</a></span></div>`;
  const oGan = `<div class="hai" style="margin-top:8px"><label>Link album của khách<input id="al-link" value="${c.esc(linkKhach)}" placeholder="Dán link …/exec?a=xxxxxxxxxxxx"></label>
    <div style="align-self:end"><button class="nut phu nho" id="al-gan">${al.ma ? 'Đổi / gỡ' : 'Gắn album'}</button></div></div>`;
  const ganNut = () => {
    const b = el.querySelector('#al-gan');
    if (b) b.onclick = () => c.chay(async () => { await c.kho.ham('crm_gan_album', { p_id: h.id, p_link: el.querySelector('#al-link').value.trim(), p_ai: c.toi }); c.bao('Đã lưu'); veLai(); });
  };
  if (!al.ma) { el.innerHTML = dauThe + '<div class="mo">Chưa gắn album. Tạo album cho khách ở app album rồi dán link vào đây — khách chọn ảnh in xong, bấm một nút là phát sinh vào hoá đơn.</div>' + oGan; ganNut(); return; }
  let t;
  try { t = await docTomAlbum(al.ma); }
  catch (e) { el.innerHTML = dauThe + `<div class="canh">Chưa đọc được album ${al.ma}: ${c.esc(e.message)}</div><a class="nut phu nho" href="${linkKhach}" target="_blank" rel="noopener">Mở album</a>` + oGan; ganNut(); return; }
  const daGui = t.trangThai === 'da_gui';
  el.innerHTML = dauThe + `
    <div class="hang-nut"><span class="nhan ${daGui ? 'tt2' : 'tt3'}">${daGui ? 'Khách đã gửi ' + c.esc(t.guiLuc || '') : 'Khách đang chọn'}</span>
      <span class="mo">${t.sua}${t.quota ? '/' + t.quota : ''} ảnh sửa${t.vuot ? ` · <b style="color:var(--do)">vượt ${t.vuot}</b>` : ''}</span>
      <a class="nut phu nho" href="${linkKhach}" target="_blank" rel="noopener" style="margin-left:auto">Mở album</a></div>
    <table style="margin-top:8px">${t.dsIn.map((x) => `<tr><td>In ${c.esc(x.co)} ${c.esc(x.cl)} × ${x.sl} <span class="mo nho">· ${c.esc(x.ten)}</span></td><td class="so">${c.tien(x.tien)}</td></tr>`).join('')}
      ${t.tienNang ? `<tr><td>Nâng ảnh tặng ${c.esc(t.tang.co)} ${c.esc(t.tang.cl)} → ${c.esc(t.tang.nangLen)}</td><td class="so">${c.tien(t.tienNang)}</td></tr>` : ''}
      ${t.tienAnhThem ? `<tr><td>Ảnh sửa vượt gói × ${t.vuot}</td><td class="so">${c.tien(t.tienAnhThem)}</td></tr>` : t.vuot && t.giaAnhThemChuaChot ? `<tr><td colspan="2" class="mo">Vượt ${t.vuot} ảnh — giá ảnh thêm chưa chốt, báo khách sau.</td></tr>` : ''}
      <tr class="tong"><td>Phát sinh từ album</td><td class="so">${c.tien(t.tongPhatSinh)}</td></tr></table>
    ${(t.chon || []).length ? `<details style="margin-top:8px"${daGui ? ' open' : ''}><summary><b>Ảnh khách chọn (${t.chon.length})</b>${t.chon.some((x) => x.ghiChu) ? ` · ${t.chon.filter((x) => x.ghiChu).length} ảnh có ghi chú sửa` : ''}</summary>
      <table style="margin-top:6px">${t.chon.map((x) => `<tr><td style="white-space:nowrap">${c.esc(x.ten)}</td><td>${x.ghiChu ? c.esc(x.ghiChu) : '<span class="mo">—</span>'}</td></tr>`).join('')}</table>
      <div class="hang-nut" style="margin-top:6px"><button class="nut phu nho" id="al-chep">Chép tên ảnh cho KHACH-CHON.txt</button></div></details>` : ''}
    ${al.nhap_luc ? `<div class="mo" style="margin-top:6px">✓ Đã đưa vào hoá đơn lúc ${al.nhap_luc}.</div>`
      : daGui && t.tongPhatSinh > 0 && c.coTien() ? `<div class="hang-nut" style="margin-top:8px"><button class="nut nho" id="al-nhap">Đưa ${c.tien(t.tongPhatSinh)} vào hoá đơn</button></div>`
      : !daGui ? '<div class="mo" style="margin-top:6px">Chờ khách bấm "Gửi" trong album rồi mới đưa vào hoá đơn.</div>' : ''}` + oGan;
  ganNut();
  const chep = el.querySelector('#al-chep');
  if (chep) chep.onclick = () => navigator.clipboard.writeText(t.khachChonTxt || '').then(() => c.bao(`Đã chép ${t.chon.length} tên ảnh — dán vào _LOC\\KHACH-CHON.txt rồi chạy KHACH-CHON.bat`), () => c.bao('Không chép được, bôi đen danh sách để chép tay'));
  const nut = el.querySelector('#al-nhap');
  if (nut) nut.onclick = () => c.chay(async () => {
    const moi = await docTomAlbum(al.ma);   // đọc lại ngay lúc bấm — không dùng số cũ trên màn hình
    const r = await c.kho.ham('crm_nhap_album', { p_id: h.id, p_tom: moi, p_ai: c.toi });
    c.bao(`Đã thêm ${r.dong} dòng · ${c.tien(r.tien)} vào hoá đơn`);
    location.hash = '#/x'; setTimeout(() => (location.hash = '#/ca/' + h.id), 50);
  });
}

// ═════════ PHẦN THÊM CỦA HỒ SƠ CA ═════════
// Concept + makeup khách chọn · thông tin bé · video · checkout makeup · đánh giá.
// ═════════ HUỶ HỢP ĐỒNG (026) ═════════
// Đã huỷ ⇒ thẻ xám đầu hồ sơ (lý do, ngày cũ, giữ lại/hoàn) + "Mở lại". Chưa huỷ ⇒ nút nhỏ "Huỷ hợp đồng" (chỉ sale online/chủ).
export async function veHuy(c, h, o, xong) {
  if (!o) return;
  if (h.trang_thai === 9) {
    const t = await c.kho.ham('crm_thong_tin_huy', { p_id: h.id });
    o.innerHTML = `<div class="the" style="border-color:var(--tt9c);background:var(--tt9n)">
      <h2 style="margin-top:0">Hợp đồng đã huỷ${t?.luc ? ' · ' + t.luc : ''}</h2>
      <p style="margin:0 0 6px"><b>Lý do:</b> ${c.esc(t?.ly_do || '—')}</p>
      <p class="mo" style="margin:0">${t?.ngay_chup_cu ? 'Lịch cũ: ' + c.ngayVN(t.ngay_chup_cu) + '/' + t.ngay_chup_cu.slice(0, 4) + ' · ' : ''}Studio giữ lại ${c.tien(t?.giu_lai)}${Number(t?.hoan) ? ' · đã hoàn khách ' + c.tien(t.hoan) : ''}</p>
      ${c.coTien() ? '<div class="hang-nut" style="margin-top:10px"><button class="nut phu nho" id="mo-lai">Mở lại hợp đồng</button></div>' : ''}</div>`;
    const n = o.querySelector('#mo-lai');
    if (n) n.onclick = () => c.chay(async () => {
      if (!confirm('Mở lại hợp đồng này? Lịch cũ được trả lại; phiếu hoàn cọc (nếu có) vẫn giữ — thu lại thì ghi phiếu mới.')) return;
      await c.kho.ham('crm_mo_lai_hop_dong', { p_id: h.id, p_ai: c.toi }); c.bao('Đã mở lại'); xong();
    });
    return;
  }
  if (!c.coTien() || h.trang_thai === 8) return;
  const daThu = Number(h.tien?.da_thu || 0);
  o.innerHTML = `<div style="text-align:right;margin:-4px 0 8px"><a href="#" class="mo" id="nut-huy">Khách huỷ? · Huỷ hợp đồng</a></div>`;
  o.querySelector('#nut-huy').onclick = (e) => {
    e.preventDefault();
    const hp = hop(c, 'Huỷ hợp đồng ' + h.ma, `
      ${h.trang_thai >= 3 ? '<p style="color:var(--do);margin:0 0 8px">Ca đã chụp — chỉ anh Thọ huỷ được.</p>' : ''}
      <label>Lý do huỷ (bắt buộc)<input id="h-ly" placeholder="Khách đổi ý · trùng lịch · bé ốm · chuyển sang studio khác…"></label>
      <label style="margin-top:8px">Hoàn cọc cho khách (đã thu ${c.tien(daThu)})<input id="h-hoan" type="number" step="1000" min="0" max="${daThu}" value="0"></label>
      <p class="mo" style="margin:6px 0 0">Không hoàn thì để 0 — số giữ lại tính vào doanh thu. Ca rời lịch; ngày cũ được lưu để mở lại nếu khách quay lại.</p>
      <div class="hang-nut" style="margin-top:12px"><button class="nut" id="h-luu" style="background:var(--do)">Huỷ hợp đồng</button></div>`);
    hp.g.querySelector('#h-luu').onclick = () => c.chay(async () => {
      const ly = giaTri(hp.g, '#h-ly'), hoan = Number(giaTri(hp.g, '#h-hoan') || 0);
      if (!ly) { c.bao('Ghi lý do huỷ', true); return; }
      const r = await c.kho.ham('crm_huy_hop_dong', { p_id: h.id, p_ly_do: ly, p_hoan: hoan, p_ai: c.toi });
      hp.dong(); c.bao('Đã huỷ · giữ lại ' + c.tien(r.giu_lai) + (r.hoan ? ' · hoàn ' + c.tien(r.hoan) : '')); xong();
    });
  };
}

// ═════════ HỒ SƠ KHÁCH (028) ═════════
// #/khach/<id>: mọi lần chụp, tiền, CSKH, lần nhắn hỏi, đánh giá của MỘT khách — khách cũ quay lại thì sale thấy ngay.
export async function trangKhach(c, id) {
  const r = await c.kho.ham('crm_ho_so_khach', { p_khach: id });
  if (!r) { c.trang.innerHTML = '<div class="the">Không thấy khách.</div>'; return; }
  const k = r.khach, t = r.tong, hn = c.homNay();
  const tuoi = (ns) => { const th = (Number(hn.slice(0, 4)) - Number(ns.slice(0, 4))) * 12 + Number(hn.slice(5, 7)) - Number(ns.slice(5, 7)) - (hn.slice(8) < ns.slice(8) ? 1 : 0);
    return th < 24 ? th + ' tháng' : Math.floor(th / 12) + ' tuổi'; };
  const snToi = (ns) => { let d = hn.slice(0, 4) + ns.slice(4); if (d < hn) d = (Number(hn.slice(0, 4)) + 1) + ns.slice(4); return d; };
  const tenCskh = (l) => (CSKH[l] || TEN_CSKH_KHAC[l] || [l])[0];
  const ngay = (d) => (d ? c.ngayVN(d) + '/' + d.slice(0, 4) : '—');
  c.trang.innerHTML = `
    <div class="mo" style="margin-bottom:10px"><a href="javascript:history.back()">‹ Quay lại</a></div>
    <div class="the dau-ca">
      <div class="hang-nut"><span class="mo">Khách từ ${ngay(k.tao_luc)}</span>${c.coTien() ? `<a class="nut nho" style="margin-left:auto" id="hd-moi" href="#/moi">Lên hợp đồng mới cho khách này</a>` : ''}</div>
      <h1 style="margin:8px 0 4px">${c.esc(k.ten)}</h1>
      <div class="hang-nut">${t.so_ca > 1 ? `<span class="nhan">Khách quen · ${t.so_ca} lần chụp</span>` : ''}
        ${k.ten_be ? `<span class="nhan">Bé ${c.esc(k.ten_be)}${k.ngay_sinh_be ? ' · ' + tuoi(k.ngay_sinh_be) + ' · sinh nhật ' + c.ngayVN(snToi(k.ngay_sinh_be)) : ''}</span>` : ''}
        ${Number(t.con_no) ? `<span class="nhan do">còn nợ ${c.tien(t.con_no)}</span>` : ''}</div>
      <div class="hang-nut" style="margin-top:10px">${c.sdtHtml(k.sdt)}${k.sdt ? `<a class="nut phu nho" href="https://zalo.me/${c.esc(k.sdt)}" target="_blank" rel="noopener">Zalo</a>` : ''}</div>
      ${k.dia_chi ? `<p class="mo" style="margin:8px 0 0">${c.esc(k.dia_chi)}</p>` : ''}${k.ghi_chu ? `<p class="mo" style="margin:4px 0 0">${c.esc(k.ghi_chu)}</p>` : ''}
    </div>
    <div class="so-lieu">
      ${c.theSo('#/khach/' + id, 'ca', ['var(--tt6n)', 'var(--tt6c)'], 'Số lần chụp', t.so_ca, t.so_huy ? t.so_huy + ' HĐ đã huỷ' : 'lần đầu ' + ngay(t.lan_dau))}
      ${c.theSo('#/khach/' + id, 'lich', ['var(--tt2n)', 'var(--tt2c)'], t.sap_toi ? 'Lịch sắp tới' : 'Lần chụp gần nhất', t.sap_toi ? ngay(t.sap_toi) : ngay(t.lan_cuoi),
        t.ngay_chua_quay_lai != null ? (t.sap_toi ? 'lần trước ' + ngay(t.lan_cuoi) : t.ngay_chua_quay_lai + ' ngày chưa quay lại') : '')}
      ${c.coTien() ? c.theSo('#/khach/' + id, 'tien', ['var(--xanh-nhat)', 'var(--xanh)'], 'Tổng đã chi', c.trieu(t.tong_hoa_don), 'đã thu ' + c.trieu(t.da_thu))
        + c.theSo('#/khach/' + id, 'canh', ['var(--do-nhat)', 'var(--do)'], 'Còn nợ', c.tien(t.con_no), Number(t.con_no) ? 'thu khi khách đến' : 'đã trả đủ') : ''}
    </div>
    <div class="ho-so">
      <div>
        <div class="the"><h2>Các lần chụp</h2>
          ${r.hop_dong.map((h) => `<a class="the-ca vien-tt${h.trang_thai}" href="#/ca/${h.id}" style="display:block;margin-bottom:8px">
            <div class="hang-nut"><b>${ngay(h.ngay)}</b>${h.ngay_cu ? '<span class="mo">(lịch cũ)</span>' : ''}<span class="nhan tt${h.trang_thai}">${h.trang_thai}. ${c.esc(h.tt_ten)}</span>
              <span class="mo" style="margin-left:auto">${c.esc(h.ma)}</span></div>
            <div class="mo" style="margin-top:4px">${c.esc(h.goi)}${c.coTien() ? ' · ' + c.tien(h.tong) + (Number(h.con_lai) ? ` · <b style="color:var(--do)">còn ${c.tien(h.con_lai)}</b>` : '') : ''}${h.so_cu ? ' · sổ cũ' : ''}</div></a>`).join('') || '<div class="mo">Chưa có hợp đồng.</div>'}
        </div>
        ${r.danh_gia.length ? `<div class="the"><h2>Khách đánh giá</h2>${r.danh_gia.map((d) => `<div style="padding:4px 0"><b>${'★'.repeat(d.diem)}${'☆'.repeat(5 - d.diem)}</b> <span class="mo">${d.luc_vn} · ${c.esc(d.ma)}</span>${d.nhan_xet ? `<div>${c.esc(d.nhan_xet)}</div>` : ''}</div>`).join('')}</div>` : ''}
      </div>
      <div>
        <div class="the"><h2>Chăm sóc khách</h2>
          <div class="cuon-doc" style="max-height:320px">${r.cskh.map((x) => `<div style="padding:4px 0"><span class="mo">${x.luc_vn} · ${c.esc(x.ai)}${x.ma ? ' · ' + c.esc(x.ma) : ''}</span><div><b>${c.esc(tenCskh(x.loai))}</b>${x.noi_dung ? ' — ' + c.esc(x.noi_dung) : ''}${x.ket_qua ? ` <span class="mo">→ ${c.esc(x.ket_qua)}</span>` : ''}</div></div>`).join('') || '<div class="mo">Chưa ghi lần chăm sóc nào.</div>'}</div></div>
        <div class="the"><h2>Các lần nhắn hỏi</h2>
          ${r.lead.map((l) => `<div style="padding:4px 0"><span class="mo">${l.tao_vn} · ${KENH[l.kenh] || c.esc(l.kenh)}${l.nguon_qc ? ' · từ quảng cáo' : ''}</span>${l.nhu_cau ? `<div>${c.esc(l.nhu_cau)}</div>` : ''}</div>`).join('') || '<div class="mo">Không thấy lần nhắn hỏi nào (khách chưa có SĐT trong Khách tiềm năng).</div>'}</div>
      </div>
    </div>`;
  const nut = c.trang.querySelector('#hd-moi');
  if (nut) nut.onclick = () => sessionStorage.setItem('khach-moi', JSON.stringify({ sdt: k.sdt || '', ten: k.ten }));
}

// ═════════ SỬA HỢP ĐỒNG (027) ═════════
// Gói · giá · giảm · sale online · tên/SĐT/địa chỉ khách. Chỉ gửi lên ô THẬT SỰ đổi; máy chủ chặn lại lần nữa.
export function moSuaHd(c, h, chonGoiHtml, xong) {
  const soCu = !!h.ma_cu, sale = c.DM.nhanSu.filter((n) => n.vai.includes('sale_online') || n.vai.includes('chu'));
  const khoaTien = soCu || h.trang_thai === 9 || (h.trang_thai === 8 && !c.laChu());
  const hp = hop(c, 'Sửa hợp đồng ' + h.ma, `
    <h3 style="margin:0 0 6px">Khách</h3>
    <div class="hai"><label>Tên khách<input id="s-ten" value="${c.esc(h.khach || '')}"></label>
      <label>SĐT<input id="s-sdt" inputmode="tel" value="${c.esc(h.sdt || '')}"></label></div>
    <label style="margin-top:8px">Địa chỉ<input id="s-dc" value="${c.esc(h.dia_chi || '')}"></label>
    <p class="mo nho" style="margin:4px 0 12px">Sửa ở đây là sửa hồ sơ khách — mọi hợp đồng của khách này cùng đổi.</p>
    <h3 style="margin:0 0 6px">Gói & giá</h3>
    ${soCu ? '<p class="mo" style="margin:0 0 6px">Ca nhập từ sổ Sheet — đổi gói/giá trên sổ, tối máy đối chiếu sẽ cập nhật.</p>'
      : khoaTien && h.trang_thai === 8 ? '<p class="mo" style="margin:0 0 6px">Ca đã hoàn thành — chỉ anh Thọ sửa giá.</p>' : ''}
    <label>Gói<select id="s-goi" ${khoaTien ? 'disabled' : ''}>${chonGoiHtml(h.goi_ma)}</select></label>
    <div class="hai" style="margin-top:8px"><label>Giá gói<input id="s-gia" type="number" min="0" step="1000" value="${h.gia_goi ?? ''}" ${khoaTien ? 'disabled' : ''}></label>
      <label>Giảm giá<input id="s-giam" type="number" min="0" step="1000" value="${h.giam_gia || 0}" ${khoaTien ? 'disabled' : ''}></label></div>
    <label style="margin-top:8px">Sale chốt (online)<select id="s-sale" ${c.laChu() ? '' : 'disabled'}><option value="">—</option>${sale.map((n) => `<option value="${n.id}" ${n.id === h.sale_online_id ? 'selected' : ''}>${c.esc(n.ten)}</option>`).join('')}</select></label>
    ${c.laChu() ? '' : '<p class="mo nho" style="margin:4px 0 0">Đổi sale online (người hưởng hoa hồng) — chỉ anh Thọ.</p>'}
    <div class="hang-nut" style="margin-top:12px"><button class="nut" id="s-luu">Lưu</button></div>`);
  const g = hp.g;
  g.querySelector('#s-goi').onchange = () => {
    const x = c.DM.goi.find((z) => z.ma === giaTri(g, '#s-goi'));
    if (x) g.querySelector('#s-gia').value = x.gia_ban;
  };
  g.querySelector('#s-luu').onclick = () => c.chay(async () => {
    const d = {};
    if (giaTri(g, '#s-ten') !== (h.khach || '')) d.khach_ten = giaTri(g, '#s-ten');
    if (giaTri(g, '#s-sdt') !== (h.sdt || '')) d.khach_sdt = giaTri(g, '#s-sdt');
    if (giaTri(g, '#s-dc') !== (h.dia_chi || '')) d.khach_dia_chi = giaTri(g, '#s-dc');
    if (!khoaTien) {
      const goi = giaTri(g, '#s-goi');
      if (goi && goi !== h.goi_ma) d.goi_ma = goi;
      if (Number(giaTri(g, '#s-gia')) !== Number(h.gia_goi)) d.gia_goi = giaTri(g, '#s-gia');
      if (Number(giaTri(g, '#s-giam') || 0) !== Number(h.giam_gia || 0)) d.giam_gia = giaTri(g, '#s-giam');
    }
    const so = giaTri(g, '#s-sale');
    if (c.laChu() && (so ? Number(so) : null) !== (h.sale_online_id ?? null)) d.sale_online_id = so ? Number(so) : null;
    if (!Object.keys(d).length) { hp.dong(); return; }
    await c.kho.ham('crm_sua_hop_dong', { p_id: h.id, d, p_ai: c.toi });
    hp.dong(); c.bao('Đã sửa hợp đồng'); xong();
  });
}

// Huỷ phiếu thu ghi nhầm (027): hỏi lý do, máy ghi phiếu đảo cùng thời điểm thu.
export function moHuyPhieu(c, p, xong) {
  const hp = hop(c, 'Huỷ phiếu thu', `
    <p style="margin:0 0 8px">${p.so_tien < 0 ? 'Phiếu hoàn' : 'Phiếu thu'} <b>${c.tien(Math.abs(p.so_tien))}</b> · ${c.esc(p.luc)} · ${p.hinh_thuc === 'tien_mat' ? 'tiền mặt' : 'chuyển khoản'}</p>
    <label>Lý do (bắt buộc)<input id="hp-ly" placeholder="Gõ nhầm số · ghi nhầm ca · khách chưa chuyển…"></label>
    <p class="mo nho" style="margin:6px 0 0">Máy ghi một phiếu đảo đúng số này, cùng ngày thu của phiếu gốc, nên sổ thu ngày đó tự đúng lại. Cả hai phiếu vẫn nằm trong lịch sử. Thu đúng số thì ghi phiếu mới.</p>
    <div class="hang-nut" style="margin-top:12px"><button class="nut" id="hp-luu" style="background:var(--do)">Huỷ phiếu</button></div>`);
  hp.g.querySelector('#hp-luu').onclick = () => c.chay(async () => {
    const ly = giaTri(hp.g, '#hp-ly');
    if (!ly) { c.bao('Ghi lý do huỷ phiếu', true); return; }
    await c.kho.ham('crm_huy_phieu_thu', { p_phieu: p.id, p_ly_do: ly, p_ai: c.toi });
    hp.dong(); c.bao('Đã huỷ phiếu'); xong();
  });
}

export async function veHoSoThem(c, h, chua) {
  const t = await c.kho.ham('crm_ca_them', { p_id: h.id, p_ai: c.toi });
  const am = (loai) => t.anh_mau.filter((a) => a.loai === loai);
  const coMakeup = h.ekip.some((e) => e.vai === 'makeup') || c.vaiToi.includes('makeup');
  const ghiNgoai = c.vaiToi.includes('chu') || c.vaiToi.includes('sale_online');
  chua.innerHTML = `
    <div class="the"><div class="dau-the"><h2>Concept & makeup khách chọn</h2><span class="phai"><button class="nut phu nho" data-chon="concept">Chọn concept</button> <button class="nut phu nho" data-chon="makeup">Chọn makeup</button></span></div>
      <div class="luoi-anh nho">${t.anh_mau.map((a) => `<figure class="o-anh"><img src="${c.esc(anhTrucTiep(a.anh_url))}" alt="" loading="lazy"><figcaption><b>${c.esc(a.ten)}</b><span class="mo nho">${a.loai}</span></figcaption></figure>`).join('') || '<div class="mo">Chưa chọn — sale gửi ảnh mẫu cho khách rồi ghi lại đây để ekip chuẩn bị.</div>'}</div></div>
    <div class="the" id="the-album"><h2>Album chọn ảnh</h2><div class="mo">Đang đọc album…</div></div>
    <div class="the"><h2>Thông tin bé</h2><div class="mo nho" style="margin-bottom:6px">Để CSKH nhắc đúng tên và mời chụp sinh nhật.</div>
      <div class="hai"><label>Tên bé<input id="be-ten" value="${c.esc(t.be?.ten_be || '')}"></label><label>Ngày sinh bé<input id="be-ns" type="date" value="${t.be?.ngay_sinh_be || ''}"></label></div>
      <div class="hang-nut" style="margin-top:8px"><button class="nut phu nho" id="be-luu">Lưu thông tin bé</button></div></div>
    <div class="the"><div class="dau-the"><h2>Video khách</h2><span class="phai"><button class="nut phu nho" id="vd-sua">${t.video ? 'Sửa' : '+ Dán link'}</button></span></div>
      <div class="mo">${t.video ? (t.video.khong_lam ? 'Không làm: ' + c.esc(t.video.ly_do_khong) : `🎞 Hậu trường: ${t.video.link_hau_truong ? `<a href="${c.esc(t.video.link_hau_truong)}" target="_blank" rel="noopener">mở</a>` : 'chưa có'} · 🎬 Video dựng: ${t.video.link_video ? `<a href="${c.esc(t.video.link_video)}" target="_blank" rel="noopener">mở</a>` : 'chưa có'}${t.video.da_bao_khach ? ' · <b style="color:var(--xanh)">đã gửi khách</b>' : ''}`) : 'Chưa có link — hạn 24 giờ sau buổi chụp.'}</div></div>
    ${coMakeup ? `<div class="the"><h2>Checkout makeup</h2>${t.makeup.map((m) => `<div class="gd"><span>${c.esc(m.ten)}</span><b>${m.nguoi_lon} người lớn · ${m.tre_em} trẻ em</b></div>`).join('')}
      <div class="hai" style="margin-top:8px"><label>Thợ makeup<select id="mk-ns">${c.DM.nhanSu.filter((x) => x.vai.includes('makeup')).map((x) => `<option value="${x.id}" ${x.ma === c.toi ? 'selected' : ''}>${c.esc(x.ten)}</option>`).join('')}</select></label>
        <label>Người lớn<input id="mk-nl" type="number" min="0" value="0"></label><label>Trẻ em<input id="mk-te" type="number" min="0" value="0"></label></div>
      <div class="hang-nut" style="margin-top:8px"><button class="nut phu nho" id="mk-luu">Lưu checkout</button></div></div>` : ''}
    ${ghiNgoai ? `<div class="the"><h2>Thợ make cộng tác</h2><div class="mo nho" style="margin-bottom:6px">Thợ ngoài anh Thọ gọi · người lớn 200.000đ · bé 100.000đ một mặt${ghiNgoai ? ' · sale online hoặc anh Thọ ghi' : ''}.</div>
      ${t.make_ngoai.map((m) => `<div class="gd"><span><b style="font-weight:600">${c.esc(m.ten)}</b><br><span class="mo nho">${m.nguoi_lon} người lớn · ${m.tre_em} bé${m.nguoi_ghi ? ' · ' + c.esc(m.nguoi_ghi) + ' ghi' : ''}</span></span>
        <b>${c.tien(m.tien)}${ghiNgoai ? ` <button class="nut phu nho" data-mn-sua="${m.id}">Sửa</button> <button class="nut phu nho" data-mn-xoa="${m.id}">Xoá</button>` : ''}</b></div>`).join('')}
      ${ghiNgoai ? `<div class="hai" style="margin-top:8px"><label>Tên thợ make<input id="mn-ten" list="ds-tho-ngoai" placeholder="vd: Linh make"><datalist id="ds-tho-ngoai">${(t.ten_tho_ngoai || []).map((x) => `<option>${c.esc(x)}</option>`).join('')}</datalist></label>
        <label>Người lớn<input id="mn-nl" type="number" min="0" value="0" inputmode="numeric"></label><label>Bé<input id="mn-te" type="number" min="0" value="0" inputmode="numeric"></label></div>
      <div class="hang-nut" style="margin-top:8px"><button class="nut phu nho" id="mn-luu">+ Thêm thợ make</button></div>` : ''}</div>` : ''}
    <div class="the"><div class="dau-the"><h2>Đánh giá của khách</h2><span class="phai"><button class="nut phu nho" id="dg-moi">+ Ghi đánh giá</button></span></div>
      ${t.danh_gia.map((d) => `<div class="gd"><span>${d.nhan_xet ? '"' + c.esc(d.nhan_xet) + '"' : '<span class="mo">không ghi lời</span>'} ${d.van_de.map((v) => `<span class="nhan do">${VAN_DE[v] || v}</span>`).join(' ')}</span><b>${'★'.repeat(d.diem)} <span class="mo nho">${d.luc}</span></b></div>`).join('') || '<div class="mo">Chưa có.</div>'}</div>`;
  const veLai = () => veHoSoThem(c, h, chua);
  veAlbum(c, h, t.album || {}, chua.querySelector('#the-album'), veLai);
  chua.querySelectorAll('[data-chon]').forEach((b) => (b.onclick = () => c.chay(async () => {
    const loai = b.dataset.chon, ds = await c.kho.ham('crm_anh_mau', { p_loai: loai }), dang = new Set(am(loai).map((a) => a.id));
    const x = hop(c, loai === 'concept' ? 'Concept khách chọn' : 'Kiểu makeup khách chọn', ds.length
      ? `<div class="luoi-anh nho">${ds.map((a) => `<figure class="o-anh chon-duoc ${dang.has(a.id) ? 'chon' : ''}" data-id="${a.id}"><img src="${c.esc(anhTrucTiep(a.anh_url))}" alt="" loading="lazy"><figcaption><b>${c.esc(a.ten)}</b><span class="mo nho">${c.esc(a.hang_muc_ten || '')}</span></figcaption></figure>`).join('')}</div>
         <div class="hang-nut" style="margin-top:12px"><button class="nut" id="am-gan">Lưu lựa chọn</button></div>`
      : `<div class="trong">Thư viện ${loai} còn trống — thêm ảnh ở mục "${loai === 'concept' ? 'Ảnh mẫu concept' : 'Ảnh makeup'}" trước.</div>`);
    x.g.querySelectorAll('.chon-duoc').forEach((f) => (f.onclick = () => f.classList.toggle('chon')));
    const nut = x.g.querySelector('#am-gan');
    if (nut) nut.onclick = () => c.chay(async () => {
      await c.kho.ham('crm_gan_anh_mau', { p_hop_dong: h.id, p_ids: [...x.g.querySelectorAll('.chon-duoc.chon')].map((f) => Number(f.dataset.id)), p_loai: loai, p_ai: c.toi });
      x.dong(); c.bao('Đã lưu'); veLai();
    });
  })));
  chua.querySelector('#be-luu').onclick = () => c.chay(async () => {
    await c.kho.ham('crm_luu_be', { p_khach: t.be.khach_id, p_ten_be: c.$('#be-ten').value, p_ngay_sinh: c.$('#be-ns').value || null, p_ai: c.toi });
    c.bao('Đã lưu');
  });
  chua.querySelector('#vd-sua').onclick = () => moVideo(c, { id: h.id, khach: h.khach, ...(t.video || {}) }, veLai);
  chua.querySelector('#dg-moi').onclick = () => moDanhGia(c, h.id, veLai);
  const mk = chua.querySelector('#mk-luu');
  if (mk) mk.onclick = () => c.chay(async () => {
    await c.kho.ham('crm_checkout_makeup', { p_hop_dong: h.id, p_nhan_su: Number(c.$('#mk-ns').value), p_nguoi_lon: Number(c.$('#mk-nl').value), p_tre_em: Number(c.$('#mk-te').value), p_ghi: null, p_ai: c.toi });
    c.bao('Đã lưu checkout'); veLai();
  });
  // Thợ make cộng tác: thêm mới · sửa (nạp số vào ô, nút đổi thành "Lưu sửa") · xoá.
  let suaId = null;
  const mnLuu = chua.querySelector('#mn-luu');
  if (mnLuu) mnLuu.onclick = () => c.chay(async () => {
    await c.kho.ham('crm_luu_make_ngoai', { p_hop_dong: h.id, p_ten: c.$('#mn-ten').value, p_nguoi_lon: Number(c.$('#mn-nl').value) || 0,
      p_tre_em: Number(c.$('#mn-te').value) || 0, p_id: suaId, p_ghi: null, p_ai: c.toi });
    c.bao(suaId ? 'Đã sửa' : 'Đã thêm thợ make'); veLai();
  });
  chua.querySelectorAll('[data-mn-sua]').forEach((b) => (b.onclick = () => {
    const m = t.make_ngoai.find((x) => x.id === Number(b.dataset.mnSua));
    suaId = m.id; c.$('#mn-ten').value = m.ten; c.$('#mn-nl').value = m.nguoi_lon; c.$('#mn-te').value = m.tre_em;
    mnLuu.textContent = 'Lưu sửa'; c.$('#mn-ten').focus();
  }));
  chua.querySelectorAll('[data-mn-xoa]').forEach((b) => (b.onclick = () => c.chay(async () => {
    if (!confirm('Xoá dòng thợ make này?')) return;
    await c.kho.ham('crm_xoa_make_ngoai', { p_id: Number(b.dataset.mnXoa), p_ai: c.toi });
    c.bao('Đã xoá'); veLai();
  })));
}

// ═════════ LƯƠNG & HOA HỒNG (011, 09/11/2026) ═════════
// Chỉ phần HOA HỒNG tự tính từ ekip của ca. Lương cứng · chấm công · thưởng · tăng ca vẫn ở app lương.
// Chủ xem mọi người; nhân viên chỉ thấy dòng của mình (máy chủ lọc, không phải ẩn).
const TEN_VAI = { sale_online: 'Sale online · giá gói', sale_offline: 'Sale tại studio · phát sinh', chup: 'Chụp · tổng hoá đơn', pts: 'PTS · tổng hoá đơn', stylist: 'Stylist · tổng hoá đơn', gioi_thieu: 'Giới thiệu khách · giá gói' };
export async function trangHoaHong(c, chu) {
  const hn = c.homNay(), k = kh.docKhoang(chu, hn), nhan = kh.nhanKhoang(k, hn), thang = k.chu, motThang = k.kieu === 'thang';
  const r = await c.kho.ham('crm_hoa_hong_khoang', { p_tu: k.tu, p_den: k.den, p_ai: c.toi });
  const mn = await c.kho.ham('crm_make_ngoai_khoang', { p_tu: k.tu, p_den: k.den, p_ai: c.toi });   // null với người không phải chủ/sale
  const theNgoai = !mn ? '' : `<div class="the"><div class="dau-the"><h2>Thợ make cộng tác — phải trả ${c.tien(mn.tong_tien)}</h2></div>
      <div class="mo nho" style="margin-bottom:6px">Tổng số mặt · ${nhan}: <b>${Number(mn.mat.ngoai_lon) + Number(mn.mat.trong_lon)} người lớn · ${Number(mn.mat.ngoai_be) + Number(mn.mat.trong_be)} bé</b>
        (thợ ngoài ${mn.mat.ngoai_lon} + ${mn.mat.ngoai_be} · thợ nhà ${mn.mat.trong_lon} + ${mn.mat.trong_be}). Không cộng vào tổng hoa hồng.</div>
      ${mn.theo_tho.map((x) => `<div class="gd"><span><b style="font-weight:600">${c.esc(x.ten)}</b><br><span class="mo nho">${x.so_ca} ca · ${x.lon} người lớn · ${x.be} bé</span></span><b>${c.tien(x.tien)}</b></div>`).join('') || '<div class="mo">Chưa ghi thợ ngoài nào — ghi ở hồ sơ từng ca, thẻ "Thợ make cộng tác".</div>'}
      ${mn.ds.length ? `<details style="margin-top:8px"><summary class="mo nho">Từng ca (${mn.ds.length})</summary><div class="cuon-doc" style="max-height:260px">${mn.ds.map((x) => `<a class="gd" href="#/ca/${x.hop_dong_id}" style="text-decoration:none"><span>${c.ngayVN(x.ngay)} · ${c.esc(x.khach)}<br><span class="mo nho">${c.esc(x.ten)}</span></span><b>${x.lon}+${x.be} · ${c.tien(x.tien)}</b></a>`).join('')}</div></details>` : ''}</div>`;
  const pt =(x) => (Number(x) * 100).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + '%';
  c.trang.innerHTML = c.dauTrang('Thu chi', 'Lương & hoa hồng', r.la_chu
    ? `Hoa hồng tự tính từ ekip từng ca có ngày chụp trong kỳ · ${nhan}. Lương cứng, chấm công, thưởng, tăng ca vẫn ở app lương.`
    : `Hoa hồng của bạn · ${nhan}, tính từ các ca có tên bạn trong ekip. Thấy thiếu ca nào thì báo sale sửa ekip.`, kh.cumKhoang(k, hn, (x) => '#/hoa-hong/' + x)) + `
    ${r.la_chu ? `<div class="so-lieu bon">
      ${c.theSo('#/hoa-hong/' + thang, 'tien', ['var(--xanh-nhat)', 'var(--xanh)'], 'Tổng hoa hồng phải trả', c.trieu(r.tong_hoa_hong), 'không gồm lương cố định của anh')}
      ${c.theSo('#/hoa-hong/' + thang, 'lich', ['var(--tt8n)', 'var(--tt8c)'], 'Ca trong kỳ', r.so_ca, c.trieu(r.tong_hoa_don) + ' tổng hoá đơn')}
      ${c.theSo('#/hoa-hong/' + thang, 'hd', ['var(--nhan-nhat)', 'var(--nhan-dam)'], 'Tỉ lệ trên doanh thu', Number(r.tong_hoa_don) ? pt(Number(r.tong_hoa_hong) / Number(r.tong_hoa_don)) : '—', 'hoa hồng / tổng hoá đơn')}
      ${c.theSo('#/hoa-hong/' + thang, 'canh', ['var(--do-nhat)', 'var(--do)'], 'Ca thiếu ekip / tiền', (r.thieu || []).length, 'hoa hồng có thể bị sót')}
    </div>` : ''}
    <div class="luoi-ca" style="grid-template-columns:repeat(auto-fill,minmax(330px,1fr))">${r.nguoi.map((x) => `<div class="the-ca" style="border-left-color:${x.nhan_hoa_hong ? 'var(--xanh)' : 'var(--vien)'}">
      <div class="hang"><span class="ten">${c.esc(x.ten)}</span><span class="tien">${x.nhan_hoa_hong ? c.tien(x.tong) : '<span class="mo">lương cố định</span>'}</span></div>
      ${!x.nhan_hoa_hong ? `<div class="phu">Tham khảo: ${c.tien(x.tong)} nếu tính hoa hồng — không cộng vào tổng.</div>` : ''}
      <table>${x.vai.map((v) => `<tr><td>${TEN_VAI[v.vai] || v.vai}<br><span class="mo nho">${v.so_ca} ca · ${c.tien(v.mau)} × ${pt(v.ti_le)}</span></td><td class="so">${c.tien(v.tien)}</td></tr>`).join('')}
        ${x.make ? `<tr><td>Makeup<br><span class="mo nho">${x.make.lon} người lớn · ${x.make.be} trẻ em · ${x.make.so_ca} ca</span></td><td class="so">${x.make.tien == null ? '<span class="mo">chưa có đơn giá</span>' : c.tien(x.make.tien)}</td></tr>` : ''}</table>
    </div>`).join('') || '<div class="trong">Chưa có ca nào có tên trong ekip trong kỳ này.</div>'}</div>
    ${theNgoai}
    ${r.la_chu && (r.thieu || []).length ? `<div class="the"><h2>Ca thiếu dữ liệu — hoa hồng có thể bị sót</h2><div class="mo nho" style="margin-bottom:6px">Ô trống có thể là anh tự làm (không tính) — chỉ cần soát cho chắc.</div>
      <div class="cuon-doc" style="max-height:320px">${r.thieu.map((t) => `<a class="gd" href="#/ca/${t.id}" style="text-decoration:none"><span>${c.ngayVN(t.ngay)} · ${t.ma}</span><span class="mo nho">${c.esc(t.ly_do)}</span></a>`).join('')}</div></div>` : ''}
    ${r.la_chu ? `<div class="the mo">Tỉ lệ đang dùng: ${Object.entries(r.ti_le || {}).map(([k, v]) => `${(TEN_VAI[k] || k).split(' · ')[0]} ${pt(v)}`).join(' · ')} · Mai stylist 2,5% · nhiều người cùng vai trong một ca ⇒ mỗi người 1/N (anh chốt 06/11). Đổi tỉ lệ thì nhắn trợ lý.</div>` : ''}`;
  kh.ganKhoang(k, hn, (x) => '#/hoa-hong/' + x);
}

// ═════════ VIỆC CỦA TÔI — chế độ xem nhân viên (015, 09/11/2026) ═════════
// Nhân viên mở app vào thẳng đây. Chủ xem được qua nút "Việc của tôi" ở Trang chủ.
// Việc = ca có tên mình đang dừng ở KHÂU CỦA VAI mình (trang_thai.vai_chiu) — máy chủ lọc, không phải ẩn.
const TEN_VAI_TOI = { chup: 'Chụp', pts: 'PTS', stylist: 'Stylist', makeup: 'Makeup', sale_offline: 'Sale tại studio', sale_online: 'Sale online', chu: 'Duyệt', gioi_thieu: 'Giới thiệu khách' };
const VIEC_CUA_VAI = { chup: 'Gửi ảnh gốc cho khách', pts: 'Chỉnh ảnh', sale_online: 'Chốt lịch · nhắc chọn ảnh · giao ảnh', chu: 'Duyệt ảnh trước khi giao' };
export async function trangCuaToi(c) {
  const [v, hh] = await Promise.all([
    c.kho.ham('crm_viec_cua_toi', { p_ai: c.toi }),
    c.kho.ham('crm_hoa_hong', { p_thang: c.homNay().slice(0, 8) + '01', p_ai: c.toi }).catch(() => null),
  ]);
  const toi = v.toi || { ten: c.toi, vai: c.vaiToi };
  const minh = hh && hh.nguoi ? hh.nguoi.find((x) => x.ma === toi.ma) : null;
  const gap = v.viec.filter((x) => x.gap).length;
  const theoKhau = {};
  for (const x of v.viec) (theoKhau[x.vai_chiu] ||= []).push(x);
  const homNay = v.ca_sap.filter((x) => x.ngay === v.hom_nay), sapToi = v.ca_sap.filter((x) => x.ngay !== v.hom_nay);
  const dongCa = (x) => `<a class="dong-ca" href="#/ca/${x.id}"><span class="gio">${x.ngay === v.hom_nay ? (x.gio || '--:--') : c.THU[new Date(x.ngay + 'T12:00:00').getDay()] + ' ' + c.ngayVN(x.ngay)}</span>
      <span><span class="ten">${c.esc(x.khach)}</span><br><span class="phu">${c.esc(x.goi)} · bạn: <b>${x.vai.map((k) => TEN_VAI_TOI[k] || k).join(', ')}</b>${x.ekip.length ? ' · ' + x.ekip.map((e) => c.esc(e.ten)).join(', ') : ''}</span></span>
      <span style="text-align:right">${x.ngay !== v.hom_nay && x.gio ? `<span class="phu">${x.gio}</span>` : ''}</span></a>`;
  c.trang.innerHTML = c.dauTrang(`Việc của tôi · ${c.esc(toi.ten)}`, gap ? `${gap} việc cần làm ngay` : v.viec.length ? `${v.viec.length} việc đang chờ bạn` : 'Không có việc nào đang chờ bạn ✓',
    'Chỉ những ca có tên bạn và đang dừng ở khâu của bạn. Thấy thiếu ca nào thì báo sale sửa ekip.',
    c.laChu() ? '<a class="nut phu" href="#/">Xem cả studio</a>' : '') + `
    <div class="so-lieu bon">
      ${c.theSo('#/toi', 'canh', ['var(--do-nhat)', 'var(--do)'], 'Việc gấp', gap, 'trễ hẹn hoặc khách đòi sửa')}
      ${c.theSo('#/toi', 'ca', ['var(--nhan-nhat)', 'var(--nhan-dam)'], 'Việc đang chờ bạn', v.viec.length, Object.keys(theoKhau).map((k) => TEN_VAI_TOI[k] || k).join(' · ') || '—')}
      ${c.theSo('#/lich', 'lich', ['var(--tt8n)', 'var(--tt8c)'], 'Ca của bạn tháng này', v.thang.so, v.thang.xong + ' ca đã hoàn thành')}
      ${c.theSo('#/hoa-hong', 'tien', ['var(--xanh-nhat)', 'var(--xanh)'], 'Hoa hồng tạm tính', minh ? (minh.nhan_hoa_hong ? c.tien(minh.tong) : 'lương cố định') : '—', 'tháng này, theo ekip từng ca')}
    </div>
    <div class="hai-cot">
      <div class="the"><div class="dau-the"><div><div class="nhan-nho mo" style="font-weight:700;color:var(--nhan);font-size:11px">CA CỦA BẠN</div><h2>Hôm nay ${homNay.length} ca · 7 ngày tới ${sapToi.length} ca</h2></div><a class="phai mo" href="#/lich">Lịch cả studio ›</a></div>
        ${homNay.map(dongCa).join('') || '<div class="trong">Hôm nay bạn không có ca chụp.</div>'}
        ${sapToi.length ? `<div class="nhan-nho mo" style="margin:12px 0 4px;font-weight:700">SẮP TỚI</div>${sapToi.map(dongCa).join('')}` : ''}
      </div>
      <div>${Object.keys(theoKhau).length ? Object.entries(theoKhau).map(([k, ds]) => `<div class="bo-phan"><div class="dau-bp"><div><b>${TEN_VAI_TOI[k] || k}</b><div class="mo nho">${VIEC_CUA_VAI[k] || ''}</div></div><span class="tong-bp">${ds.length}</span></div>
          <div class="nhom-viec">${ds.slice(0, 30).map((x) => `<a class="viec ${x.gap ? 'gap' : ''}" href="#/ca/${x.id}"><span class="ten">${c.esc(x.khach)}</span><span class="mo nho">${c.esc(x.goi)} · ${c.esc(x.tt_ten)}</span><span class="ly-do">${c.esc(x.ly_do)}</span></a>`).join('')}
          ${ds.length > 30 ? `<div class="con-nua">… và ${ds.length - 30} việc nữa</div>` : ''}</div></div>`).join('')
        : '<div class="the"><div class="trong">Không có ca nào đang chờ khâu của bạn ✓</div></div>'}</div>
    </div>`;
}

// ═════════ CHI TIẾT PHÁT SINH CA NHẬP SỔ — sale soát trước khi dựng phiếu (anh Thọ 11/11/2026) ═════════
// Sổ chỉ có tổng tiền phát sinh; máy tách sẵn từ cột Ghi chú của sổ, sale soát/sửa (mỗi dòng một món) rồi mới dựng phiếu.
// Bản sale sửa LƯU CHUNG (029 · hop_dong.ps_in_khach, anh Thọ "Có, lưu chung") ⇒ máy nào mở cũng thấy, lần sau khỏi gõ lại.
// daLuu = bản đã lưu (null nếu chưa). Trả về mảng dòng, hoặc null nếu đóng hộp.
export function hoiPsSoCu(c, h, tachSan, daLuu) {
  const coLuu = Array.isArray(daLuu) && daLuu.length > 0;
  const dong = coLuu ? daLuu : tachSan;
  const tong = h.phatSinh.reduce((a, p) => a + Number(p.thanh_tien || 0), 0);
  return new Promise((xong) => {
    const { g, dong: tat } = hop(c, 'Chi tiết phát sinh in lên phiếu', `
      <p class="mo" style="margin-top:0">Ca nhập từ sổ chỉ có tổng phát sinh <b>${c.esc(tong.toLocaleString('vi-VN'))}đ</b>.
      ${coLuu ? 'Đây là bản đã lưu lần trước.' : 'Máy tách sẵn từ cột Ghi chú của sổ — anh/chị sửa cho khách đọc được.'}
      <b>Mỗi dòng một món.</b> Để trống thì phiếu in "In ảnh, dịch vụ ngoài gói". Bấm nút dưới là lưu chung cho mọi máy.</p>
      <textarea id="ps-so-in" rows="7" style="width:100%">${c.esc(dong.join('\n'))}</textarea>
      <div class="hang-nut" style="margin-top:10px;justify-content:flex-end"><button class="nut nho" id="ps-dung">Lưu và dựng phiếu</button></div>`);
    let daXong = false;
    const ra = (v) => { if (!daXong) { daXong = true; xong(v); } };
    new MutationObserver((_, o) => { if (!g.isConnected) { o.disconnect(); ra(null); } }).observe(document.body, { childList: true });
    const nut = g.querySelector('#ps-dung');
    nut.onclick = async () => {
      const v = g.querySelector('#ps-so-in').value.split('\n').map((s) => s.trim()).filter(Boolean);
      nut.disabled = true;
      try { await c.kho.ham('crm_luu_ps_in', { p_id: h.id, p_dong: v, p_ai: c.toi }); }
      catch (e) { nut.disabled = false; c.bao(e.message || String(e), true); return; }
      ra(v); tat();
    };
  });
}

// ═════════ KPI TỪNG NHÂN VIÊN (030, 11/11/2026) ═════════
// Một tháng (theo ngày chụp). Gom từ dữ liệu sẵn có: ca tham gia, doanh số sale, bán thêm, đánh giá khách, trả ảnh đúng hẹn,
// makeup, khách tiềm năng, hoa hồng (lấy nguyên từ crm_hoa_hong). Chỗ chưa đủ dữ liệu in "chưa đo được", không in 0.
// Chủ xem mọi người + tổng đội; nhân viên chỉ thấy thẻ của mình (máy chủ lọc).
const TEN_VAI_KPI = { sale_online: 'sale online', sale_offline: 'bán thêm', chup: 'chụp', pts: 'PTS', stylist: 'stylist', makeup: 'makeup', gioi_thieu: 'giới thiệu khách' };
export async function trangKpi(c, thangChon) {
  const thang = /^\d{4}-\d{2}$/.test(thangChon || '') ? thangChon : c.homNay().slice(0, 7);
  const r = await c.kho.ham('crm_kpi', { p_thang: thang + '-01', p_ai: c.toi });
  const doiThang = (n) => { const d = new Date(thang + '-01T12:00:00Z'); d.setUTCMonth(d.getUTCMonth() + n); return d.toISOString().slice(0, 7); };
  const ssNhan = r.den_nay ? `cùng kỳ tháng trước (tới ngày ${Number(r.den_nay.slice(8))})` : 'tháng trước';
  const nhan = `tháng ${Number(thang.slice(5))}/${thang.slice(0, 4)}`;
  const tp = (x) => Number(x).toLocaleString('vi-VN', { maximumFractionDigits: 1 });
  const pt = (a, b) => (Number(b) ? Math.round((100 * Number(a)) / Number(b)) + '%' : '—');
  const lech = (nay, truoc) => { const a = Number(nay), b = Number(truoc); if (!b) return ''; const d = a - b;
    return ` <span class="mo nho" style="color:${d > 0 ? 'var(--xanh)' : d < 0 ? 'var(--do)' : 'inherit'}">${d > 0 ? '▲' : d < 0 ? '▼' : '='} ${Math.abs(d)} so với ${ssNhan}</span>`; };
  const dong = (ten, gt, phu = '') => `<tr><td>${ten}${phu ? `<br><span class="mo nho">${phu}</span>` : ''}</td><td class="so">${gt}</td></tr>`;
  const the = (x) => {
    const d = [];
    d.push(dong('Ca tham gia', `<b>${x.so_ca}</b>`, Object.entries(x.theo_vai || {}).map(([v, n]) => `${TEN_VAI_KPI[v] || v} ${n}`).join(' · ') + lech(x.so_ca_ss, x.so_ca_truoc)));
    if (x.sale) d.push(dong('Sale online · doanh số', c.tien(x.sale.doanh_so),
      `${x.sale.so_hd} HĐ · ${tp(x.sale.ti_le_co_ps)}% ca có phát sinh · phát sinh TB ${c.tien(x.sale.ps_tb)}/ca${Number(x.sale.giam_tb_pt) ? ` · giảm giá TB ${tp(x.sale.giam_tb_pt)}%` : ''}`));
    if (x.ban_them) d.push(dong('Bán thêm tại studio', c.tien(x.ban_them.phat_sinh_phan_minh),
      `${x.ban_them.so_ca} ca${Number(x.ban_them.ca_khong_ps) ? ` · <span style="color:var(--do)">${x.ban_them.ca_khong_ps} ca không bán được gì</span>` : ''} · phần của bạn khi nhiều người cùng ca`));
    if (x.tho) d.push(dong('Doanh thu các ca đã làm', c.tien(x.tho.doanh_thu_ca),
      `${x.tho.so_danh_gia ? `khách chấm TB <b>${tp(x.tho.diem_tb)} ★</b> (${x.tho.so_danh_gia} đánh giá${Number(x.tho.danh_gia_thap) ? `, <span style="color:var(--do)">${x.tho.danh_gia_thap} đánh giá ≤ 3 sao</span>` : ''})` : 'chưa có đánh giá của khách'}${Number(x.tho.can_sua_lai) ? ` · <span style="color:var(--do)">${x.tho.can_sua_lai} ca cần sửa lại</span>` : ''}`));
    if (x.tra_anh) {
      const t = x.tra_anh, ok = Number(t.do_duoc) > 0;
      d.push(dong('Trả ảnh đúng hẹn (PTS)', ok ? `<b>${pt(t.dung_hen, t.do_duoc)}</b>` : '<span class="mo">chưa đo được</span>',
        `${ok ? `${t.dung_hen}/${t.do_duoc} ca đúng hẹn${Number(t.tre) ? ` · <span style="color:var(--do)">${t.tre} trễ</span>` : ''} · ` : 'cần cả hẹn trả ảnh và lúc trả thật (có từ 09/11) · '}`
        + `${t.so_ca} ca PTS${Number(t.dang_qua_hen) ? ` · <span style="color:var(--do)">${t.dang_qua_hen} đang quá hẹn</span>` : ''}${Number(t.chua_co_hen) ? ` · ${t.chua_co_hen} ca chưa ghi hẹn` : ''}`));
    }
    if (x.make) d.push(dong('Makeup', `${Number(x.make.lon) + Number(x.make.be)} mặt`, `${x.make.lon} người lớn · ${x.make.be} bé · ${x.make.so_ca} ca`));
    if (x.lead) d.push(dong('Khách tiềm năng được giao', `<b>${pt(x.lead.chot, Number(x.lead.chot) + Number(x.lead.mat))}</b> chốt`,
      `${x.lead.so} khách mới trong tháng · ${x.lead.chot} chốt · ${x.lead.mat} mất · ${x.lead.dang_mo} đang tư vấn`));
    if (x.hoa_hong != null) d.push(dong('Hoa hồng', x.nhan_hoa_hong ? c.tien(x.hoa_hong) : '<span class="mo">lương cố định</span>', '<a href="#/hoa-hong">xem chi tiết từng vai</a>'));
    return `<div class="the-ca" style="border-left-color:var(--nhan)"><div class="hang"><span class="ten">${c.esc(x.ten)}</span>
      <span class="phu" style="margin-left:auto">${(x.vai_chinh || []).filter((v) => v !== 'chu').map((v) => TEN_VAI_KPI[v] || v).join(' · ')}</span></div>
      <table>${d.join('')}</table></div>`;
  };
  const o = r.doi;
  c.trang.innerHTML = c.dauTrang('Thu chi', r.la_chu ? 'KPI nhân viên' : 'KPI của tôi',
    `${r.la_chu ? 'Mỗi người một thẻ' : 'Số của riêng bạn'} · ${nhan}, tính theo ngày chụp, bỏ hợp đồng đã huỷ. Gom từ dữ liệu đang có trong app — không ai phải nhập thêm.`,
    `<a class="nut phu nho" href="#/kpi/${doiThang(-1)}">‹ Tháng trước</a> <a class="nut phu nho" href="#/kpi/${doiThang(1)}">Tháng sau ›</a>`) + `
    ${o ? `<div class="so-lieu bon">
      ${c.theSo('#/kpi/' + thang, 'lich', ['var(--tt8n)', 'var(--tt8c)'], 'Ca trong tháng', o.so_ca, r.den_nay ? `tới hôm nay ${o.so_ca_ss} · cùng kỳ tháng trước ${o.so_ca_truoc}` : `tháng trước ${o.so_ca_truoc}`)}
      ${c.theSo('#/kpi/' + thang, 'tien', ['var(--xanh-nhat)', 'var(--xanh)'], 'Doanh thu ca', c.trieu(o.doanh_thu), `phát sinh ${pt(o.phat_sinh, o.tien_goi)} tiền gói`)}
      ${c.theSo('#/chat-luong', 'sao', ['var(--vang-nhat)', '#8A5A00'], 'Khách chấm TB', o.diem_tb != null ? tp(o.diem_tb) + ' ★' : '—', `${o.so_danh_gia} đánh giá`)}
      ${c.theSo('#/hoa-hong/' + thang, 'canh', ['var(--do-nhat)', 'var(--do)'], 'Ca thiếu người', Number(o.ca_thieu_sale) + Number(o.ca_thieu_tho), `${o.ca_thieu_sale} thiếu sale · ${o.ca_thieu_tho} thiếu thợ chụp — KPI sẽ sót`)}
    </div>` : ''}
    <div class="luoi-ca" style="grid-template-columns:repeat(auto-fill,minmax(340px,1fr))">${r.nguoi.map(the).join('') || '<div class="trong">Chưa có ca nào có tên bạn trong tháng này.</div>'}</div>
    <div class="the mo">Cách đo: <b>doanh số sale</b> = tổng hoá đơn các HĐ mình là sale online · <b>bán thêm</b> = phát sinh của ca mình tick sale tại studio (chia đều khi nhiều người) ·
      <b>đánh giá</b> = điểm khách chấm ở màn Chất lượng dịch vụ · <b>trả ảnh đúng hẹn</b> = ngày chuyển "Hoàn thành" so với hẹn trả ảnh, chỉ ca có đủ hai mốc ·
      <b>hoa hồng</b> = đúng số của màn Lương & hoa hồng.</div>`;
}

// ═════════ BÁN THÊM IN SAU CHỤP (031, 11/11/2026) ═════════
// Ca đã chụp → chờ in/giao trong 60 ngày; ca CHƯA bán gì lên đầu, khâu "khách đang chọn ảnh" trước. Gợi ý nâng chất liệu
// ảnh tặng / phóng thêm theo bảng giá in. App KHÔNG tự nhắn khách, KHÔNG tự thêm phát sinh: sale nhắn, ghi lại lần mời;
// khách đồng ý thì thêm phát sinh ở hồ sơ ca như cũ.
export async function trangBanThem(c, loc = '') {
  const r = await c.kho.ham('crm_ban_them', { p_ai: c.toi });
  if (!r) { c.trang.innerHTML = c.dauTrang('Bán hàng', 'Bán thêm in', 'Màn này dành cho sale online và anh Thọ.'); return; }
  const t = r.tong, chi = loc === 'chua' ? r.ca.filter((x) => Number(x.phat_sinh) === 0) : r.ca;
  const pt = (a, b) => (Number(b) ? Math.round((100 * Number(a)) / Number(b)) + '%' : '—');
  const chip = (g) => g.loai === 'nang'
    ? `Nâng ${g.co} ${c.esc(g.tu)} → <b>${c.esc(g.len)}</b> <span class="mo">+${c.tien(g.chenh)}</span>`
    : `Phóng thêm ${g.co} <b>${c.esc(g.len)}</b> <span class="mo">${c.tien(g.gia_moi)}</span>`;
  const the = (x) => `<div class="the-ca vien-tt${x.trang_thai}">
      <div class="hang"><a class="ten" href="#/ca/${x.id}" style="text-decoration:none;color:inherit">${c.esc(x.khach)}</a>
        <span class="phu" style="margin-left:auto">${c.ngayVN(x.ngay)} · ${c.esc(x.tt_ten)}</span></div>
      <div class="phu">${c.esc(x.goi)}${x.tang ? ' · tặng ' + c.esc(x.tang) : ' · gói không tặng ảnh in'} · ${x.ma}</div>
      <div class="phu">${Number(x.phat_sinh) ? `<b style="color:var(--xanh)">Đã bán thêm ${c.tien(x.phat_sinh)}</b>` : '<b style="color:var(--do)">Chưa bán thêm</b>'}
        ${x.co_album ? (x.album_da_nhap ? ' · album đã vào hoá đơn' : ' · có album chọn ảnh') : ''}${Number(x.con_lai) ? ' · còn nợ ' + c.tien(x.con_lai) : ''}</div>
      ${x.goi_y.length ? `<div style="display:flex;flex-direction:column;gap:3px;margin-top:2px">${x.goi_y.slice(0, 3).map((g) => `<span class="phu">• ${chip(g)}</span>`).join('')}</div>` : ''}
      <div class="hang" style="margin-top:4px">${x.moi_luc ? `<span class="phu" style="color:${x.moi_gan ? 'var(--nhan-dam)' : 'inherit'}">Đã mời ${x.moi_luc}${x.moi_ket_qua ? ' · ' + c.esc(x.moi_ket_qua) : ''}</span>` : '<span class="phu">Chưa mời</span>'}
        <button class="nut phu nho" style="margin-left:auto" data-moi="${x.id}">Ghi đã mời</button></div>
    </div>`;
  c.trang.innerHTML = c.dauTrang('Bán hàng', 'Bán thêm in sau chụp',
    'Ca đã chụp tới chờ in/giao trong 60 ngày. Ca chưa bán gì lên đầu, khách đang chọn ảnh là lúc mời tốt nhất. Giá gợi ý là bảng giá in niêm yết — app không tự nhắn khách.',
    `<a class="nut ${loc === 'chua' ? '' : 'phu'} nho" href="#/ban-them/chua">Chỉ ca chưa bán</a> <a class="nut ${loc === 'chua' ? 'phu' : ''} nho" href="#/ban-them">Tất cả</a>`) + `
    <div class="so-lieu bon">
      ${c.theSo('#/ban-them/chua', 'canh', ['var(--do-nhat)', 'var(--do)'], 'Ca chưa bán thêm', t.chua_ban, `trên ${t.so_ca} ca đã chụp trong 60 ngày`)}
      ${c.theSo('#/ban-them', 'tien', ['var(--xanh-nhat)', 'var(--xanh)'], 'Phát sinh đã bán', c.trieu(t.phat_sinh), `${pt(t.phat_sinh, t.tien_goi)} tiền gói · ${t.da_ban} ca`)}
      ${c.theSo('#/ban-them/chua', 'hd', ['var(--nhan-nhat)', 'var(--nhan-dam)'], 'Sàn nếu mỗi ca nâng 1 bậc', c.trieu(t.san_neu_nang), 'mỗi ca chưa bán nhận gợi ý rẻ nhất')}
      ${c.theSo('#/ban-them', 'gui', ['var(--tt8n)', 'var(--tt8c)'], 'Đã mời 7 ngày qua', t.moi_7_ngay, 'không nhắn lại khách vừa mời')}
    </div>
    <div class="luoi-ca" style="grid-template-columns:repeat(auto-fill,minmax(320px,1fr))">${chi.map(the).join('') || '<div class="trong">Không có ca nào trong danh sách.</div>'}</div>`;
  c.trang.querySelectorAll('[data-moi]').forEach((b) => (b.onclick = () => {
    const x = r.ca.find((y) => y.id === Number(b.dataset.moi));
    const { g, dong } = hop(c, 'Ghi lần mời — ' + x.khach, `
      <p class="mo" style="margin-top:0">Ghi sau khi anh/chị đã nhắn khách, để người khác không nhắn trùng. Khách đồng ý thì thêm phát sinh ở hồ sơ ca.</p>
      <label>Đã mời gì<textarea id="moi-nd" rows="2" style="width:100%">${c.esc(x.goi_y[0] ? x.goi_y[0].loai === 'nang' ? `Nâng ${x.goi_y[0].co} ${x.goi_y[0].tu} lên ${x.goi_y[0].len}` : `Phóng thêm ${x.goi_y[0].co} ${x.goi_y[0].len}` : '')}</textarea></label>
      <label>Kết quả<select id="moi-kq"><option value="">Chờ khách trả lời</option><option>Khách đồng ý</option><option>Khách cân nhắc</option><option>Khách không lấy</option></select></label>
      <div class="hang-nut" style="margin-top:10px;justify-content:flex-end"><button class="nut nho" id="moi-luu">Lưu</button></div>`);
    g.querySelector('#moi-luu').onclick = () => c.chay(async () => {
      await c.kho.ham('crm_ghi_moi_in', { p_id: x.id, p_noi_dung: g.querySelector('#moi-nd').value, p_ket_qua: g.querySelector('#moi-kq').value || null, p_ai: c.toi });
      dong(); c.bao('Đã ghi lần mời'); trangBanThem(c, loc);
    });
  }));
}

// ═════════ LÃI LỖ THÁNG (038, 14/11/2026) — chỉ chủ ═════════
// Doanh thu theo ngày chụp − (hoa hồng tự tính + lương cứng + quảng cáo số Meta + khoản định kỳ / phiếu chi thật).
// Mỗi dòng có nhãn nguồn: "tự động" · "phiếu chi" · "ước tính" — số ước tính KHÔNG được trông như số thật.
const NGUON_LL = { tu_dong: ['xanh', 'tự động'], phieu_chi: ['cam', 'phiếu chi'], dinh_ky: ['vang', 'ước tính / định kỳ'] };
export async function trangLaiLo(c, thangChon) {
  if (!c.laChu()) { c.trang.innerHTML = c.dauTrang('Thu chi', 'Lãi lỗ tháng', 'Màn này chỉ anh Thọ xem.'); return; }
  const thang = /^\d{4}-\d{2}$/.test(thangChon || '') ? thangChon : c.homNay().slice(0, 7);
  const r = await c.kho.ham('crm_lai_lo', { p_thang: thang + '-01', p_so_thang: 6, p_ai: c.toi });
  const m = r.thang[0];
  const doiThang = (k) => { const d = new Date(thang + '-01T12:00:00Z'); d.setUTCMonth(d.getUTCMonth() + k); return d.toISOString().slice(0, 7); };
  const tenThang = (t) => `T${Number(t.slice(5))}/${t.slice(0, 4)}`;
  const mauLai = (v) => (n(v) < 0 ? 'var(--do)' : 'var(--xanh)');
  const ptLai = (x) => (x.bien_lai == null ? '—' : Number(x.bien_lai).toLocaleString('vi-VN') + '%');
  const nhanNguon = (k) => { const [mau, chu] = NGUON_LL[k] || ['', k]; return `<span class="nhan ${mau}" style="font-size:11px">${chu}</span>`; };
  // Gom theo khoản mục: lương → quảng cáo → in ấn → mặt bằng → điện nước → còn lại
  const thuTu = ['luong', 'quang_cao', 'in_an', 'mat_bang', 'dien_nuoc'];
  const nhom = [...new Set(m.dong.map((x) => x.khoan))].sort((a, b) => (thuTu.indexOf(a) + 1 || 99) - (thuTu.indexOf(b) + 1 || 99));
  const bangThang = nhom.map((k) => {
    const ds = m.dong.filter((x) => x.khoan === k), tong = ds.reduce((a, x) => a + n(x.tien), 0);
    return `<tr><th colspan="2" style="padding-top:14px">${KHOAN[k] || k}</th><th class="so" style="padding-top:14px">${c.tien(tong)}</th></tr>`
      + ds.map((x) => `<tr><td style="padding-left:18px">${c.esc(x.ten)}</td><td>${nhanNguon(x.nguon)}</td><td class="so">${c.tien(x.tien)}</td></tr>`).join('');
  }).join('');
  const dk = r.dinh_ky.filter((x) => !x.den_thang || x.den_thang >= thang);
  const dkCu = r.dinh_ky.filter((x) => x.den_thang && x.den_thang < thang);
  const giaTri = (x) => (x.ti_le != null ? (Number(x.ti_le) * 100).toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + '% doanh thu' : c.tien(x.so_tien) + '/tháng');
  c.trang.innerHTML = c.dauTrang('Thu chi', 'Lãi lỗ tháng',
    `${tenThang(m.thang)} · doanh thu tính theo ngày chụp (như KPI và hoa hồng). Hoa hồng, quảng cáo máy tự lấy; lương cứng và khoản cố định anh khai một lần ở cuối trang.`,
    `<a class="nut phu nho" href="#/lai-lo/${doiThang(-1)}">‹ Tháng trước</a> <a class="nut phu nho" href="#/lai-lo/${doiThang(1)}">Tháng sau ›</a>`) + `
    ${m.dang_chay ? `<div class="canh">⚠ Tháng đang chạy: doanh thu mới tính tới hôm nay, còn khoản cố định (mặt bằng, lương cứng…) đã tính đủ cả tháng ⇒ lãi sẽ thấp hơn lúc cuối tháng.</div>` : ''}
    ${m.canh_bao.map((s) => `<div class="canh">⚠ ${c.esc(s)}</div>`).join('')}
    <div class="so-lieu bon">
      ${c.theSo('#/kpi/' + m.thang, 'tien', ['var(--xanh-nhat)', 'var(--xanh)'], 'Doanh thu', c.trieu(m.doanh_thu), `${m.so_ca} ca${n(m.doanh_thu_khong_ngay) ? ` · đơn không ngày ${c.trieu(m.doanh_thu_khong_ngay)}` : ''}${n(m.ca_chua_tien) ? ` · ${m.ca_chua_tien} ca chưa có tiền` : ''}`)}
      ${c.theSo('#/chi/' + m.thang, 'vi', ['var(--do-nhat)', 'var(--do)'], 'Tổng chi', c.trieu(m.tong_chi), n(m.uoc_tinh) ? `trong đó ước tính ${c.trieu(m.uoc_tinh)}` : 'toàn số thật')}
      ${c.theSo('#/lai-lo/' + m.thang, 'hd', n(m.lai) < 0 ? ['var(--do-nhat)', 'var(--do)'] : ['var(--tt8n)', 'var(--tt8c)'], n(m.lai) < 0 ? 'Lỗ' : 'Lãi', c.trieu(m.lai), 'biên lãi ' + ptLai(m))}
      ${c.theSo('#/cong-no/' + m.thang, 'tien', ['var(--vang-nhat)', '#8A5A00'], 'Tiền về trong tháng', c.trieu(m.thuc_thu), 'phiếu thu theo ngày tiền về')}
    </div>
    <div class="hai-cot">
      <div class="the"><h2>Chi tiết ${tenThang(m.thang)}</h2>
        <table><tr><th colspan="2">Doanh thu</th><th class="so" style="color:var(--xanh)">${c.tien(m.doanh_thu)}</th></tr>
        ${bangThang || '<tr><td colspan="3" class="mo">Chưa có khoản chi nào.</td></tr>'}
        <tr><th colspan="2" style="padding-top:14px">Tổng chi</th><th class="so" style="padding-top:14px">${c.tien(m.tong_chi)}</th></tr>
        <tr><th colspan="2">${n(m.lai) < 0 ? 'Lỗ' : 'Lãi'}</th><th class="so" style="color:${mauLai(m.lai)}">${c.tien(m.lai)}</th></tr></table>
        <div class="mo nho" style="margin-top:8px">Khoản nào trong tháng đã có phiếu chi thì phiếu chi thay hẳn số ước tính. Quảng cáo lấy số chi tiêu từ Meta (chưa gồm thuế Meta tính thêm nếu có), cập nhật lần cuối ${r.qc_cap_nhat || 'chưa có'}.</div></div>
      <div class="the"><h2>6 tháng gần nhất</h2>
        <table><tr><th>Tháng</th><th class="so">Doanh thu</th><th class="so">Chi</th><th class="so">Lãi</th><th class="so">Biên</th></tr>
        ${r.thang.map((x) => `<tr style="${x.thang === m.thang ? 'background:var(--nhan-nhat)' : ''}"><td><a href="#/lai-lo/${x.thang}">${tenThang(x.thang)}</a>${x.dang_chay ? ' <span class="mo nho">đang chạy</span>' : ''}${x.canh_bao.length ? ` <span title="${c.esc(x.canh_bao.join(' · '))}">⚠</span>` : ''}</td>
          <td class="so">${c.trieu(x.doanh_thu)}</td><td class="so">${c.trieu(x.tong_chi)}</td><td class="so" style="color:${mauLai(x.lai)}"><b>${c.trieu(x.lai)}</b></td><td class="so">${ptLai(x)}</td></tr>`).join('')}</table>
        <div class="mo nho" style="margin-top:8px">⚠ = tháng đó còn thiếu số — bấm vào tháng để xem.</div></div>
    </div>
    <div class="the"><h2>Khoản chi định kỳ</h2>
      <div class="mo nho" style="margin-bottom:8px">Khai một lần, máy tự tính mỗi tháng. Đổi số từ một tháng nào đó thì các tháng trước giữ nguyên số cũ. Lương cứng mỗi người một dòng, khoản mục Lương.</div>
      <table><tr><th>Khoản</th><th>Nội dung</th><th class="so">Mỗi tháng</th><th>Áp từ</th><th></th></tr>
      ${dk.map((x) => `<tr><td>${KHOAN[x.khoan_muc]}</td><td>${c.esc(x.mo_ta)}${x.ghi_chu ? `<br><span class="mo nho">${c.esc(x.ghi_chu)}</span>` : ''}</td><td class="so">${giaTri(x)}</td>
        <td>${tenThang(x.tu_thang)}${x.den_thang ? ' → ' + tenThang(x.den_thang) : ''}</td>
        <td style="white-space:nowrap"><a href="#" class="mo nho" data-sua-dk="${x.id}">sửa</a> · <a href="#" class="mo nho" data-ngung-dk="${x.id}">ngừng</a></td></tr>`).join('') || '<tr><td colspan="5" class="mo">Chưa có khoản nào.</td></tr>'}</table>
      ${dkCu.length ? `<details style="margin-top:8px"><summary class="mo nho">${dkCu.length} khoản đã dừng trước ${tenThang(thang)}</summary><table>${dkCu.map((x) => `<tr><td>${KHOAN[x.khoan_muc]}</td><td>${c.esc(x.mo_ta)}</td><td class="so">${giaTri(x)}</td><td>${tenThang(x.tu_thang)} → ${tenThang(x.den_thang)}</td></tr>`).join('')}</table></details>` : ''}
      <h2 style="margin-top:16px" id="dk-tieu-de">Thêm khoản định kỳ</h2>
      <div class="hai"><label>Khoản mục<select id="dk-km">${Object.entries(KHOAN).map(([k, t]) => `<option value="${k}">${t}</option>`).join('')}</select></label>
        <label>Nội dung *<input id="dk-mo" placeholder="Lương cứng Trang · Tiền nhà · Internet…"></label>
        <label>Số tiền mỗi tháng<input id="dk-tien" type="text" inputmode="numeric" placeholder="vd 6000000"></label>
        <label>hoặc % doanh thu<input id="dk-tl" type="text" inputmode="decimal" placeholder="vd 14,8"></label>
        <label>Áp từ tháng<input id="dk-tu" type="month" value="${thang}"></label>
        <label>Ghi chú<input id="dk-gc"></label></div>
      <div class="hang-nut" style="margin-top:10px"><button class="nut nho" id="dk-luu">Lưu khoản</button> <button class="nut phu nho" id="dk-huy" hidden>Huỷ sửa</button></div>
    </div>`;
  let dangSua = null;
  const so = (s) => String(s || '').replace(/[.\s]/g, '').replace(',', '.');
  c.$('#dk-luu').onclick = () => c.chay(async () => {
    await c.kho.ham('crm_luu_chi_dinh_ky', { d: { id: dangSua, khoan_muc: c.$('#dk-km').value, mo_ta: c.$('#dk-mo').value, so_tien: so(c.$('#dk-tien').value),
      ti_le: so(c.$('#dk-tl').value), tu_thang: c.$('#dk-tu').value + '-01', ghi_chu: c.$('#dk-gc').value }, p_ai: c.toi });
    c.bao('Đã lưu'); trangLaiLo(c, thang);
  });
  c.$('#dk-huy').onclick = () => trangLaiLo(c, thang);
  document.querySelectorAll('[data-sua-dk]').forEach((a) => (a.onclick = (e) => {
    e.preventDefault();
    const x = r.dinh_ky.find((y) => String(y.id) === a.dataset.suaDk); dangSua = x.id;
    c.$('#dk-tieu-de').textContent = 'Sửa: ' + x.mo_ta;
    c.$('#dk-km').value = x.khoan_muc; c.$('#dk-mo').value = x.mo_ta; c.$('#dk-gc').value = x.ghi_chu || '';
    c.$('#dk-tien').value = x.so_tien ?? ''; c.$('#dk-tl').value = x.ti_le != null ? String(Number(x.ti_le) * 100).replace('.', ',') : '';
    c.$('#dk-tu').value = thang > x.tu_thang ? thang : x.tu_thang;   // mặc định: số mới áp từ tháng đang xem
    c.$('#dk-huy').hidden = false; c.$('#dk-mo').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }));
  document.querySelectorAll('[data-ngung-dk]').forEach((a) => (a.onclick = (e) => {
    e.preventDefault();
    const x = r.dinh_ky.find((y) => String(y.id) === a.dataset.ngungDk);
    if (!confirm(`Ngừng tính "${x.mo_ta}" từ ${tenThang(thang)}? Các tháng trước giữ nguyên.`)) return;
    c.chay(async () => { await c.kho.ham('crm_ngung_chi_dinh_ky', { p_id: x.id, p_tu_thang: thang + '-01', p_ai: c.toi }); c.bao('Đã ngừng'); trangLaiLo(c, thang); });
  }));
}

// ═════════ BẢNG LƯƠNG THÁNG (040, 14/11/2026) ═════════
// Theo mẫu bảng lương T10/2026: lương cứng + hoa hồng (tự tính) + tăng ca + phụ cấp/thưởng − phạt − đã ứng = cần thanh toán.
// Chấm công lấy từ máy vân tay, anh Thọ nhập một lần cuối tháng. Chốt ⇒ bản chụp, sửa ca sau đó không đổi lương đã trả.
// Nhân viên chỉ thấy phiếu của mình (máy chủ lọc).
const VAI_LUONG = { sale_online: 'Sale online 3% · giá gói', sale_offline: 'Bán thêm tại studio 3% · phát sinh', chup: 'Chụp 2,5% · tổng hoá đơn', pts: 'Photoshop 2% · tổng hoá đơn',
  stylist: 'Stylist · tổng hoá đơn', gioi_thieu: 'Giới thiệu khách 10% · giá gói', makeup: 'Makeup theo lượt' };
export async function trangBangLuong(c, thangChon) {
  const thang = /^\d{4}-\d{2}$/.test(thangChon || '') ? thangChon : c.homNay().slice(0, 7);
  const r = await c.kho.ham('crm_bang_luong', { p_thang: thang + '-01', p_ai: c.toi });
  const doiThang = (k) => { const d = new Date(thang + '-01T12:00:00Z'); d.setUTCMonth(d.getUTCMonth() + k); return d.toISOString().slice(0, 7); };
  const tenThang = `tháng ${Number(thang.slice(5))}/${thang.slice(0, 4)}`;
  const so = (v) => Number(v || 0).toLocaleString('vi-VN', { maximumFractionDigits: 1 });
  const phieu = (x) => `<div class="the-ca" style="border-left-color:var(--nhan)"><div class="hang"><span class="ten">${c.esc(x.ten)}</span>
      <span class="phu" style="margin-left:auto">${r.chot ? 'đã chốt' : 'chưa chốt'}</span></div>
      <table>
        <tr><td>Lương cứng</td><td class="so">${c.tien(x.luong_cung)}</td></tr>
        ${x.hoa_hong_dong.map((v) => `<tr><td style="padding-left:14px">${VAI_LUONG[v.vai] || v.vai}<br><span class="mo nho">${v.mau != null ? `${v.so_ca} ca · ${c.tien(v.mau)}` : `${v.so_ca} ca · ${v.lon} người lớn · ${v.be} bé`}</span></td><td class="so">${c.tien(v.tien)}</td></tr>`).join('')}
        ${Number(x.tc_trong) || Number(x.tc_ngoai) ? `<tr><td>Tăng ca<br><span class="mo nho">trong giờ ${so(x.tc_trong)}h × ${c.tien(x.don_gia_tc_trong)} · ngoài giờ ${so(x.tc_ngoai)}h × ${c.tien(x.don_gia_tc_ngoai)}</span></td><td class="so">${c.tien(x.tang_ca)}</td></tr>` : ''}
        ${x.phu_cap_dong.map((p) => `<tr><td>${c.esc(p.ten)}<br><span class="mo nho">${so(p.so)} × ${c.tien(p.don_gia)}</span></td><td class="so">${c.tien(p.tien)}</td></tr>`).join('')}
        ${Number(x.thuong) ? `<tr><td>Thưởng khác</td><td class="so">${c.tien(x.thuong)}</td></tr>` : ''}
        <tr><th>Tổng</th><th class="so">${c.tien(x.tong)}</th></tr>
        ${Number(x.phat) ? `<tr><td>Phạt</td><td class="so" style="color:var(--do)">−${c.tien(x.phat)}</td></tr>` : ''}
        ${Number(x.da_ung) ? `<tr><td>Đã ứng</td><td class="so">−${c.tien(x.da_ung)}</td></tr>` : ''}
        <tr><th>Cần thanh toán</th><th class="so" style="color:var(--xanh)">${c.tien(x.can_thanh_toan)}</th></tr>
      </table>${x.ghi_chu ? `<div class="mo nho" style="margin-top:6px">${c.esc(x.ghi_chu)}</div>` : ''}</div>`;
  const nav = `<a class="nut phu nho" href="#/bang-luong/${doiThang(-1)}">‹ Tháng trước</a> <a class="nut phu nho" href="#/bang-luong/${doiThang(1)}">Tháng sau ›</a>`;
  if (!r.la_chu) {
    c.trang.innerHTML = c.dauTrang('Thu chi', 'Phiếu lương của tôi', `${tenThang} · hoa hồng tự tính từ các ca có tên bạn${r.chot ? '' : ' — anh Thọ chưa chốt, số còn có thể đổi'}.`, nav)
      + (r.nguoi.length ? phieu(r.nguoi[0]) : '<div class="the trong">Chưa có phiếu lương tháng này.</div>');
    return;
  }
  const ds = r.nguoi, daNhap = ds.filter((x) => x.da_nhap).length;
  const muc = (r.muc_dm || []).filter((m) => m.ma !== 'an_trua');
  c.trang.innerHTML = c.dauTrang('Thu chi', 'Bảng lương tháng',
    `${tenThang} · lương cứng + hoa hồng máy tự tính; ngày công, tăng ca, thưởng, phạt anh nhập từ máy chấm công. ${r.chot ? `<b>Đã chốt ${r.chot_luc}</b> (${c.esc(r.chot_boi || '')}).` : 'Chưa chốt.'}`,
    nav + (r.chot ? ` <button class="nut phu nho" id="bl-mo">Mở chốt</button>` : ` <button class="nut nho" id="bl-chot">Chốt lương ${tenThang}</button>`)) + `
    ${!r.chot && r.thieu?.length ? `<div class="canh">⚠ ${r.thieu.length} ca trong tháng thiếu ekip / sale online / tiền ⇒ hoa hồng có thể thiếu. <a href="#/hoa-hong/${thang}">Xem các ca</a></div>` : ''}
    <div class="so-lieu bon">
      ${c.theSo('#/bang-luong/' + thang, 'tien', ['var(--xanh-nhat)', 'var(--xanh)'], 'Tổng lương', c.trieu(r.tong), `${ds.length} người`)}
      ${c.theSo('#/bang-luong/' + thang, 'vi', ['var(--tt8n)', 'var(--tt8c)'], 'Cần thanh toán', c.trieu(r.can_thanh_toan), 'sau phạt và đã ứng')}
      ${c.theSo('#/bang-luong/' + thang, 'hd', ['var(--vang-nhat)', '#8A5A00'], 'Đã nhập chấm công', `${daNhap}/${ds.length}`, r.chot ? 'đã chốt' : 'bấm tên để nhập')}
      ${c.theSo('#/lai-lo/' + thang, 'dich', ['var(--nhan-nhat)', 'var(--nhan-dam)'], 'Lãi lỗ tháng', 'Xem', 'lãi lỗ dùng tổng bảng lương')}
    </div>
    <div class="the cuon-ngang"><table style="min-width:760px">
      <tr><th>Nhân viên</th><th class="so">Lương cứng</th><th class="so">Hoa hồng</th><th class="so">Tăng ca</th><th class="so">Phụ cấp</th><th class="so">Thưởng</th><th class="so">Phạt</th><th class="so">Đã ứng</th><th class="so">Cần TT</th></tr>
      ${ds.map((x) => `<tr><td><a href="#" data-bl="${x.id}"><b>${c.esc(x.ten)}</b></a>${x.da_nhap ? '' : ' <span class="nhan vang" style="font-size:11px">chưa nhập</span>'}</td>
        <td class="so">${c.tien(x.luong_cung)}</td><td class="so">${c.tien(x.hoa_hong)}</td><td class="so" style="${Number(x.tang_ca) < 0 ? 'color:var(--do)' : ''}">${c.tien(x.tang_ca)}</td>
        <td class="so">${c.tien(x.phu_cap)}</td><td class="so">${c.tien(x.thuong)}</td><td class="so">${Number(x.phat) ? '−' + c.tien(x.phat) : '—'}</td>
        <td class="so">${Number(x.da_ung) ? '−' + c.tien(x.da_ung) : '—'}</td><td class="so"><b>${c.tien(x.can_thanh_toan)}</b></td></tr>`).join('')}
      <tr><th>Tổng</th><th class="so">${c.tien(ds.reduce((a, x) => a + n(x.luong_cung), 0))}</th><th class="so">${c.tien(ds.reduce((a, x) => a + n(x.hoa_hong), 0))}</th>
        <th class="so">${c.tien(ds.reduce((a, x) => a + n(x.tang_ca), 0))}</th><th class="so">${c.tien(ds.reduce((a, x) => a + n(x.phu_cap), 0))}</th>
        <th class="so">${c.tien(ds.reduce((a, x) => a + n(x.thuong), 0))}</th><th class="so">${c.tien(r.tong_phat)}</th>
        <th class="so">${c.tien(ds.reduce((a, x) => a + n(x.da_ung), 0))}</th><th class="so">${c.tien(r.can_thanh_toan)}</th></tr>
    </table></div>
    <div class="hai-cot"><div id="bl-chi-tiet"><div class="the mo">Bấm tên một người để xem phiếu và nhập chấm công.</div></div>
      <div class="the"><h2>Lương cứng & đơn giá tăng ca</h2><div class="mo nho" style="margin-bottom:6px">Đổi ở đây áp cho các tháng chưa chốt. Tháng đã chốt giữ nguyên.</div>
        <table><tr><th>Người</th><th class="so">Lương cứng</th><th class="so">TC trong giờ /h</th><th class="so">TC ngoài giờ /h</th><th></th></tr>
        ${ds.map((x) => `<tr data-cfg="${x.id}"><td>${c.esc(x.ten)}</td>
          <td><input data-k="luong_cung" inputmode="numeric" value="${x.luong_cung}" style="width:110px;text-align:right"></td>
          <td><input data-k="tc_trong" inputmode="numeric" value="${x.don_gia_tc_trong}" style="width:80px;text-align:right"></td>
          <td><input data-k="tc_ngoai" inputmode="numeric" value="${x.don_gia_tc_ngoai}" style="width:80px;text-align:right"></td>
          <td><button class="nut phu nho" data-luu-cfg="${x.id}">Lưu</button></td></tr>`).join('')}</table>
        <div class="mo nho" style="margin-top:6px">Đơn giá phụ cấp: ${(r.muc_dm || []).map((m) => `${c.esc(m.ten)} ${c.tien(m.don_gia)}`).join(' · ')}. Đổi đơn giá thì nhắn trợ lý.</div></div></div>`;
  // '8,5' / '8.5' / '-60' = số giờ lẻ; '1.000.000' = tiền có dấu chấm nghìn
  const soNhap = (s) => { const t = String(s ?? '').trim().replace(/\s/g, ''); return /^-?\d+[.,]\d{1,2}$/.test(t) ? t.replace(',', '.') : t.replace(/[.,]/g, ''); };
  const moNguoi = (x) => {
    const khoa = r.chot ? 'disabled' : '';
    c.$('#bl-chi-tiet').innerHTML = phieu(x) + `<div class="the"><h2>Nhập chấm công · ${c.esc(x.ten)}</h2>
      ${r.chot ? '<div class="mo">Tháng đã chốt — mở chốt để sửa.</div>' : ''}
      <div class="hai">
        <label>Ngày công (ăn trưa)<input id="bl-nc" inputmode="decimal" value="${x.ngay_cong ?? ''}" ${khoa}></label>
        <label>Tăng ca trong giờ (giờ, âm = thiếu giờ)<input id="bl-t1" inputmode="decimal" value="${x.tc_trong || ''}" ${khoa}></label>
        <label>Tăng ca ngoài giờ (giờ)<input id="bl-t2" inputmode="decimal" value="${x.tc_ngoai || ''}" ${khoa}></label>
        ${muc.map((m) => `<label>${c.esc(m.ten)} <span class="mo nho">× ${c.tien(m.don_gia)}</span><input data-muc="${m.ma}" inputmode="decimal" value="${x.muc?.[m.ma] ?? ''}" placeholder="0" ${khoa}></label>`).join('')}
        <label>Thưởng khác (đồng)<input id="bl-th" inputmode="numeric" value="${x.thuong || ''}" ${khoa}></label>
        <label>Phạt (đồng)<input id="bl-ph" inputmode="numeric" value="${x.phat || ''}" ${khoa}></label>
        <label>Đã ứng (đồng)<input id="bl-ung" inputmode="numeric" value="${x.da_ung || ''}" ${khoa}></label>
        <label>Ghi chú<input id="bl-gc" value="${c.esc(x.ghi_chu || '')}" ${khoa}></label>
      </div>
      ${r.chot ? '' : '<div class="hang-nut" style="margin-top:10px"><button class="nut nho" id="bl-luu">Lưu</button></div>'}</div>`;
    if (r.chot) return;
    c.$('#bl-luu').onclick = () => c.chay(async () => {
      const m = {}; document.querySelectorAll('[data-muc]').forEach((i) => { const v = soNhap(i.value); if (v) m[i.dataset.muc] = Number(v); });
      await c.kho.ham('crm_luu_bang_luong', { p_thang: thang + '-01', d: { nhan_su_id: x.id, ngay_cong: soNhap(c.$('#bl-nc').value), tc_trong: soNhap(c.$('#bl-t1').value),
        tc_ngoai: soNhap(c.$('#bl-t2').value), muc: m, thuong: soNhap(c.$('#bl-th').value), phat: soNhap(c.$('#bl-ph').value), da_ung: soNhap(c.$('#bl-ung').value), ghi_chu: c.$('#bl-gc').value }, p_ai: c.toi });
      c.bao('Đã lưu ' + x.ten); await trangBangLuong(c, thang);
      const moi = document.querySelector(`[data-bl="${x.id}"]`); if (moi) moi.click();
    });
  };
  document.querySelectorAll('[data-bl]').forEach((a) => (a.onclick = (e) => { e.preventDefault(); moNguoi(ds.find((x) => String(x.id) === a.dataset.bl)); c.$('#bl-chi-tiet').scrollIntoView({ behavior: 'smooth', block: 'start' }); }));
  document.querySelectorAll('[data-luu-cfg]').forEach((b) => (b.onclick = () => c.chay(async () => {
    const h = b.closest('tr'), g = (k) => soNhap(h.querySelector(`[data-k="${k}"]`).value);
    await c.kho.ham('crm_luu_luong_nguoi', { d: { id: Number(b.dataset.luuCfg), luong_cung: g('luong_cung'), tc_trong: g('tc_trong'), tc_ngoai: g('tc_ngoai') }, p_ai: c.toi });
    c.bao('Đã lưu'); trangBangLuong(c, thang);
  })));
  const chot = (v) => c.chay(async () => { await c.kho.ham('crm_chot_bang_luong', { p_thang: thang + '-01', p_chot: v, p_ai: c.toi }); c.bao(v ? 'Đã chốt lương' : 'Đã mở chốt'); trangBangLuong(c, thang); });
  if (c.$('#bl-chot')) c.$('#bl-chot').onclick = () => { if (confirm(`Chốt lương ${tenThang}? Sau khi chốt, sửa ca không làm đổi lương nữa.`)) chot(true); };
  if (c.$('#bl-mo')) c.$('#bl-mo').onclick = () => { if (confirm(`Mở chốt lương ${tenThang}? Lương sẽ tính lại theo dữ liệu hiện tại.`)) chot(false); };
}
