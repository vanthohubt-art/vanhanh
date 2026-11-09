// Màn hình mở rộng cho đủ menu như hệ Sky (anh Thọ yêu cầu 09/11/2026):
// Kế hoạch tháng · Khách tiềm năng · Ảnh mẫu concept · Ảnh makeup · Hạn giao ảnh · Video khách ·
// Chăm sóc khách · Chất lượng dịch vụ · Chi cửa hàng · Đăng bài Facebook · và phần thêm của hồ sơ ca.
// Mỗi hàm nhận `c` (ngữ cảnh từ app.js): kho, DM, toi, vaiToi, coTien, laChu và các hàm định dạng.

const KENH = { facebook: 'Facebook', zalo: 'Zalo', tiktok: 'TikTok', instagram: 'Instagram', gioi_thieu: 'Người quen giới thiệu', vang_lai: 'Vãng lai', website: 'Website', khac: 'Khác' };
const TT_LEAD = { moi: ['Mới', 'tt1'], dang_tu_van: ['Đang tư vấn', 'tt3'], da_bao_gia: ['Đã báo giá', 'tt4'], hen_den: ['Hẹn đến studio', 'tt6'], da_chot: ['Đã chốt', 'tt2'], mat: ['Mất', 'tt5'] };
const KHOAN = { mat_bang: 'Mặt bằng', dien_nuoc: 'Điện nước', luong: 'Lương', quang_cao: 'Quảng cáo', in_an: 'In ấn', dao_cu_trang_phuc: 'Đạo cụ · trang phục', thiet_bi: 'Thiết bị', van_phong_pham: 'Văn phòng phẩm', an_uong: 'Ăn uống', van_chuyen: 'Vận chuyển', sua_chua: 'Sửa chữa', khac: 'Khác' };
const VAN_DE = { chup_lau: 'Chụp lâu', anh_xau: 'Ảnh chưa đẹp', tra_tre: 'Trả ảnh trễ', thai_do: 'Thái độ', gia: 'Giá cao', phat_sinh: 'Phát sinh bất ngờ', khac: 'Khác' };
const CSKH = { nhac_chon_anh: ['Nhắc khách chọn ảnh', 'Đã gửi ảnh gốc mà khách chưa chọn'], xin_danh_gia: ['Xin đánh giá sau chụp', 'Trả ảnh 2–14 ngày, chưa có đánh giá'],
  sinh_nhat: ['Sinh nhật bé sắp tới', 'Mời chụp sinh nhật — trong 30 ngày tới'], ky_niem: ['Tròn 1 năm từ lần chụp', 'Mời chụp kỷ niệm — chưa đặt ca mới'] };
const TT_BAI = { nhap: ['Nháp', 'tt1'], cho_duyet: ['Chờ anh Thọ duyệt', 'tt3'], da_duyet: ['Đã duyệt — chờ đăng', 'tt4'], da_dang: ['Đã đăng', 'tt2'], huy: ['Huỷ', 'tt5'] };
const FANPAGE = ['Home Studio', 'Home Studio – Chụp ảnh cho bé', 'Home Studio – Gia đình', 'Home Studio – Newborn', 'Home Studio – Kỷ yếu', 'Home Studio – Cưới'];

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
export async function trangKeHoach(c, thang = c.homNay().slice(0, 7)) {
  const r = await c.kho.ham('crm_ke_hoach', { p_thang: thang + '-01' });
  const mt = r.muc_tieu || {}, tt = r.thuc_te;
  const tl = (a, b) => (n(b) ? Math.round((100 * n(a)) / n(b)) : null);
  const duBao = r.ngay_da_qua ? Math.round((n(tt.doanh_thu_da_chup) / r.ngay_da_qua) * r.so_ngay) : null;
  const laiTam = n(r.thuc_thu) - n(r.chi);
  const cot = (ten, thuc, muc, phu, mau) => `<div class="the"><div class="mo">${ten}</div><div class="so-to" style="color:${mau}">${thuc}</div>
    ${muc != null ? `${thanh(muc, mau)}<div class="mo">${muc}% mục tiêu · ${phu}</div>` : `<div class="mo">${phu}</div>`}</div>`;
  const maxNgay = Math.max(1, ...r.theo_ngay.map((d) => n(d.doanh_thu)));
  c.trang.innerHTML = c.dauTrang('Điều hành', 'Kế hoạch tháng', `Mục tiêu và tiến độ tháng ${thang.slice(5)}/${thang.slice(0, 4)} · đã qua ${r.ngay_da_qua}/${r.so_ngay} ngày.`, navThang('#/ke-hoach', thang)) + `
    <div class="ba-the">
      ${cot('Doanh thu ca chụp trong tháng', c.trieu(tt.doanh_thu), mt.doanh_thu ? tl(tt.doanh_thu, mt.doanh_thu) : null,
        mt.doanh_thu ? `mục tiêu ${c.trieu(mt.doanh_thu)}${duBao != null ? ` · dự báo cuối tháng ${c.trieu(duBao)}` : ''}` : 'chưa đặt mục tiêu', 'var(--xanh)')}
      ${cot('Số ca chụp', tt.so_ca + ' ca', mt.so_ca ? tl(tt.so_ca, mt.so_ca) : null, `${tt.so_ca_da_chup} đã chụp${mt.so_ca ? ' · mục tiêu ' + mt.so_ca : ''}`, 'var(--tt8c)')}
      ${cot('Tỉ lệ bán thêm (phát sinh / tiền gói)', tt.upsell_pt != null ? tt.upsell_pt + '%' : '—', mt.upsell_pt && tt.upsell_pt != null ? tl(tt.upsell_pt, mt.upsell_pt) : null,
        `${tt.ca_co_upsell}/${tt.so_ca} ca có phát sinh · ${c.trieu(tt.phat_sinh)}`, 'var(--nhan)')}
    </div>
    <div class="ba-the">
      <div class="the"><div class="mo">Dòng tiền tháng</div>
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
    <div class="the"><h2>Doanh thu theo ngày chụp</h2>
      <div class="cuon-ngang"><div style="display:flex;gap:4px;align-items:flex-end;height:150px;min-width:${r.theo_ngay.length * 26}px">
        ${r.theo_ngay.map((d) => `<a href="#/lich/${d.ngay}/ngay" title="${c.ngayVN(d.ngay)} · ${d.so_ca} ca · ${c.tien(d.doanh_thu)}" style="flex:1;min-width:20px;text-align:center;text-decoration:none">
          <div style="height:${Math.round((n(d.doanh_thu) / maxNgay) * 120)}px;background:${d.ngay <= c.homNay() ? 'var(--nhan)' : 'var(--nhan-nhat)'};border-radius:5px 5px 0 0"></div>
          <div class="mo" style="font-size:10px">${Number(d.ngay.slice(8))}</div></a>`).join('') || '<div class="mo">Chưa có ca trong tháng.</div>'}
      </div></div><div class="mo nho">Cột đậm: đã chụp · cột nhạt: lịch đã chốt sắp tới.</div></div>
    ${c.laChu() ? `<div class="the"><h2>Đặt mục tiêu tháng ${thang.slice(5)}/${thang.slice(0, 4)}</h2>
      <div class="hai"><label>Doanh thu mục tiêu (đ)<input id="mt-dt" type="number" step="1000000" value="${mt.doanh_thu ?? ''}"></label>
        <label>Số ca mục tiêu<input id="mt-ca" type="number" value="${mt.so_ca ?? ''}"></label>
        <label>Tỉ lệ bán thêm mục tiêu (%)<input id="mt-up" type="number" step="0.5" value="${mt.upsell_pt ?? ''}"></label>
        <label>Ghi chú<input id="mt-ghi" value="${c.esc(mt.ghi_chu || '')}" placeholder="Chiến dịch tháng, ngày nghỉ…"></label></div>
      <div class="hang-nut" style="margin-top:10px"><button class="nut nho" id="mt-luu">Lưu mục tiêu</button></div></div>` : ''}`;
  if (c.laChu()) c.$('#mt-luu').onclick = () => c.chay(async () => {
    await c.kho.ham('crm_luu_muc_tieu', { p_thang: thang + '-01', d: { doanh_thu: c.$('#mt-dt').value, so_ca: c.$('#mt-ca').value, upsell_pt: c.$('#mt-up').value, ghi_chu: c.$('#mt-ghi').value }, p_ai: c.toi });
    c.bao('Đã lưu mục tiêu'); trangKeHoach(c, thang);
  });
}

// ═════════ KHÁCH TIỀM NĂNG ═════════
export async function trangLead(c, loc = '') {
  const r = await c.kho.ham('crm_ds_lead', { p_trang_thai: loc || null, p_tim: null });
  const dem = r.dem || {};
  const dangMo = ['moi', 'dang_tu_van', 'da_bao_gia', 'hen_den'].reduce((s, k) => s + n(dem[k]), 0);
  c.trang.innerHTML = c.dauTrang('Bán hàng', 'Khách tiềm năng', 'Khách hỏi chưa chốt. Mỗi khách có ngày hẹn liên hệ lại — quá hẹn thì lên đầu. Chốt xong bấm "Lên hợp đồng".',
    `<button class="nut" id="lead-moi">+ Thêm khách</button>`) + `
    <div class="so-lieu">
      ${c.theSo('#/lead', 'ca', ['var(--nhan-nhat)', 'var(--nhan-dam)'], 'Khách mới hôm nay', r.hom_nay, 'nhập tay từ Pancake/Zalo')}
      ${c.theSo('#/lead', 'canh', ['var(--do-nhat)', 'var(--do)'], 'Quá hẹn liên hệ', r.qua_hen, r.qua_hen ? 'nhắn lại ngay' : 'không ai bị bỏ quên')}
      ${c.theSo('#/lead', 'tim', ['var(--tt4n)', 'var(--tt4c)'], 'Đang theo', dangMo, 'chưa chốt, chưa mất')}
      ${c.theSo('#/lead/da_chot', 'hd', ['var(--xanh-nhat)', 'var(--xanh)'], 'Đã chốt', n(dem.da_chot), n(dem.mat) + ' mất')}
      ${c.theSo('#/lead', 'nha', ['var(--tt8n)', 'var(--tt8c)'], 'Nguồn 30 ngày', Object.values(r.theo_kenh || {}).reduce((s, x) => s + n(x), 0), Object.entries(r.theo_kenh || {}).map(([k, v]) => `${KENH[k] || k} ${v}`).join(' · ') || 'chưa có')}
    </div>
    <div class="the" style="padding:12px 14px"><a class="chip ${!loc ? 'chon' : ''}" href="#/lead">Tất cả</a>${Object.entries(TT_LEAD).map(([k, [t]]) => `<a class="chip ${loc === k ? 'chon' : ''}" href="#/lead/${k}">${t} <span class="so">${n(dem[k])}</span></a>`).join('')}</div>
    <div class="luoi-ca">${r.ds.map((l) => `<div class="the-ca" style="border-left-color:var(--${TT_LEAD[l.trang_thai][1]}c)">
      <div class="hang"><span class="nhan ${TT_LEAD[l.trang_thai][1]}">${TT_LEAD[l.trang_thai][0]}</span><span class="mo nho">${KENH[l.kenh] || l.kenh} · ${l.tao}</span></div>
      <div class="hang"><span class="ten">${c.esc(l.ten)}</span>${l.hang_muc_ten ? `<span class="nhan" style="margin-left:auto">${c.esc(l.hang_muc_ten)}</span>` : ''}</div>
      ${l.nhu_cau ? `<div class="phu">${c.esc(l.nhu_cau)}</div>` : ''}
      <div class="phu">${l.du_kien_chup ? 'dự kiến chụp ' + c.ngayVN(l.du_kien_chup) + ' · ' : ''}${l.hen_lien_he ? `<b style="color:${l.hen_lien_he <= c.homNay() && !['da_chot', 'mat'].includes(l.trang_thai) ? 'var(--do)' : 'inherit'}">hẹn nhắn lại ${c.ngayVN(l.hen_lien_he)}</b>` : ''}${l.sale ? ' · ' + c.esc(l.sale) : ''}</div>
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
  const r = await c.kho.ham('crm_han_giao', { p_tu: tu, p_den: den });
  const tre = r.ca.filter((x) => x.con_ngay < 0 && x.trang_thai < 8);
  const dh = r.dung_han;
  c.trang.innerHTML = c.dauTrang('Chụp & hậu kỳ', 'Hạn giao ảnh', 'Lịch hẹn trả ảnh 14 ngày tới và các ca đã quá hẹn. Chuyển ca sang "8. Hoàn thành" là máy ghi ngày trả thật để đo đúng hạn.') + `
    <div class="so-lieu bon">
      ${c.theSo('#/han-giao', 'canh', ['var(--do-nhat)', 'var(--do)'], 'Quá hẹn trả ảnh', tre.length, tre.length ? 'xử lý trước tiên' : 'không ca nào trễ')}
      ${c.theSo('#/han-giao', 'lich', ['var(--vang-nhat)', '#8A5A00'], 'Đến hạn trong 2 ngày', r.ca.filter((x) => x.con_ngay >= 0 && x.con_ngay <= 2 && x.trang_thai < 8).length, 'chuẩn bị giao')}
      ${c.theSo('#/chat-luong', 'tien', ['var(--xanh-nhat)', 'var(--xanh)'], 'Trả đúng hạn (60 ngày)', dh.so ? Math.round((100 * dh.dung) / dh.so) + '%' : '—', dh.so ? `${dh.dung}/${dh.so} ca` : 'đo từ 09/11/2026 — chưa có ca trả')}
      ${c.theSo('#/chat-luong', 'may', ['var(--tt8n)', 'var(--tt8c)'], 'Chụp → trả ảnh trung bình', dh.tb_ngay != null ? dh.tb_ngay + ' ngày' : '—', 'cam kết 7–10 ngày')}
    </div>
    ${tre.length ? `<div class="the" style="border-color:var(--do)"><h2 style="color:var(--do)">Quá hẹn</h2><div class="luoi-ca">${tre.map((x) => c.theCa({ ...x, tong_hoa_don: null }, `<div><span class="nhan do">trễ ${-x.con_ngay} ngày</span></div>`)).join('')}</div></div>` : ''}
    ${[...Array(14).keys()].map((i) => {
      const d = c.congNgay(tu, i), ds = r.ca.filter((x) => x.hen_tra_anh === d);
      if (!ds.length) return '';
      return `<div class="the"><div class="dau-the"><h2>${c.THU[new Date(d + 'T12:00:00Z').getUTCDay()]} ${c.ngayVN(d)}${i === 0 ? ' · hôm nay' : ''}</h2><span class="phai mo">${ds.length} ca</span></div>
        <div class="luoi-ca">${ds.map((x) => c.theCa({ ...x, tong_hoa_don: null }, x.tra_that ? `<div><span class="nhan xanh">đã trả ${c.ngayVN(x.tra_that)}</span></div>` : '')).join('')}</div></div>`;
    }).join('') || (tre.length ? '' : '<div class="trong">14 ngày tới chưa có ca nào hẹn trả ảnh.</div>')}`;
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
  c.trang.innerHTML = c.dauTrang('Sau chụp', 'Chăm sóc khách', 'Máy tự sinh việc từ ca thật: nhắc chọn ảnh, xin đánh giá, sinh nhật bé, tròn 1 năm. Gọi/nhắn xong bấm "Đã liên hệ" để ghi kết quả — việc tự ẩn.') + `
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
      <span class="mo nho">${(CSKH[x.loai] || [x.loai])[0]}${x.ket_qua ? ' · ' + c.esc(x.ket_qua) : ''}</span></span><span class="mo nho">${c.esc(x.ai)} · ${x.luc}</span></div>`).join('') || '<div class="mo">Chưa có.</div>'}</div></div>`;
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
export async function trangChatLuong(c, thang = c.homNay().slice(0, 7)) {
  const r = await c.kho.ham('crm_chat_luong', { p_thang: thang + '-01' });
  const ta = r.tra_anh;
  const maxSao = Math.max(1, ...Object.values(r.phan_bo).map(n));
  c.trang.innerHTML = c.dauTrang('Sau chụp', 'Chất lượng dịch vụ', 'Điểm khách chấm, điều khách chưa hài lòng, và trả ảnh có đúng hẹn không — đo bằng số thật, không đoán.', navThang('#/chat-luong', thang)) + `
    <div class="so-lieu">
      ${c.theSo('#/chat-luong', 'tien', ['var(--vang-nhat)', '#8A5A00'], 'Điểm trung bình', r.tb != null ? r.tb + ' ★' : '—', r.so + ' đánh giá trong tháng')}
      ${c.theSo('#/han-giao', 'lich', ['var(--xanh-nhat)', 'var(--xanh)'], 'Trả ảnh đúng hạn', ta.so ? Math.round((100 * ta.dung_han) / ta.so) + '%' : '—', ta.so ? `${ta.dung_han}/${ta.so} ca trả trong tháng` : 'chưa có ca trả (đo từ 09/11)')}
      ${c.theSo('#/han-giao', 'may', ['var(--tt8n)', 'var(--tt8c)'], 'Chụp → trả ảnh', ta.tb_ngay != null ? ta.tb_ngay + ' ngày' : '—', 'trung bình')}
      ${c.theSo('#/hau-ky', 'canh', ['var(--do-nhat)', 'var(--do)'], 'Ca cần sửa lại', r.can_sua, 'đang mở')}
      ${c.theSo('#/cskh', 'nha', ['var(--nhan-nhat)', 'var(--nhan-dam)'], 'Xin đánh giá', 'CSKH', 'việc tự sinh sau khi trả ảnh')}
    </div>
    <div class="hai-cot deu">
      <div class="the"><h2>Phân bố sao</h2>${[5, 4, 3, 2, 1].map((s) => `<div class="hang-nut" style="flex-wrap:nowrap"><span style="width:34px">${s} ★</span>
        <div style="flex:1">${thanh((100 * n(r.phan_bo[s])) / maxSao, s >= 4 ? 'var(--xanh)' : s === 3 ? '#C9A227' : 'var(--do)')}</div><b style="width:30px;text-align:right">${n(r.phan_bo[s])}</b></div>`).join('')}</div>
      <div class="the"><h2>Khách chưa hài lòng điều gì</h2>${Object.entries(r.van_de).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<div class="gd"><span>${VAN_DE[k] || k}</span><b>${v}</b></div>`).join('') || '<div class="mo">Chưa ghi nhận vấn đề nào.</div>'}</div>
    </div>
    <div class="the"><h2>Đánh giá trong tháng</h2>${r.ds.map((d) => `<a class="gd" href="#/ca/${d.hop_dong_id}" style="text-decoration:none"><span><b style="font-weight:600">${c.esc(d.khach)}</b> <span class="mo nho">${d.ma} · ${c.esc(d.goi)} · ${d.luc}</span>
      ${d.nhan_xet ? `<br><span class="mo">"${c.esc(d.nhan_xet)}"</span>` : ''}${d.van_de.length ? `<br>${d.van_de.map((v) => `<span class="nhan do">${VAN_DE[v] || v}</span>`).join(' ')}` : ''}</span>
      <b style="color:${d.diem >= 4 ? 'var(--xanh)' : 'var(--do)'}">${'★'.repeat(d.diem)}</b></a>`).join('') || '<div class="trong">Chưa có đánh giá. Ghi ở mục Chăm sóc khách hoặc hồ sơ ca.</div>'}</div>`;
}

// ═════════ CHI CỬA HÀNG ═════════
export async function trangChi(c, thang = c.homNay().slice(0, 7)) {
  const r = await c.kho.ham('crm_chi', { p_thang: thang + '-01' });
  const maxK = Math.max(1, ...r.theo_khoan.map((k) => n(k.tien)));
  c.trang.innerHTML = c.dauTrang('Thu chi', 'Chi cửa hàng', 'Mỗi khoản chi một phiếu. Thu trừ chi ra lãi tạm của tháng — chỉ đúng khi ghi đủ.', navThang('#/chi', thang)) + `
    <div class="so-lieu bon">
      ${c.theSo('#/cong-no/' + thang, 'tien', ['var(--xanh-nhat)', 'var(--xanh)'], 'Thực thu tháng', c.trieu(r.thu), 'từ sổ phiếu thu')}
      ${c.theSo('#/chi/' + thang, 'vi', ['var(--do-nhat)', 'var(--do)'], 'Đã chi tháng', c.trieu(r.tong), r.so + ' phiếu chi')}
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
        <span style="text-align:right"><b style="color:var(--do)">−${c.tien(x.so_tien)}</b>${c.laChu() ? `<br><a href="#" class="mo nho" data-xoa-chi="${x.id}">xoá</a>` : ''}</span></div>`).join('') || '<div class="trong">Chưa có phiếu chi trong tháng.</div>'}</div></div>
    </div>`;
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
  c.trang.innerHTML = c.dauTrang('Marketing', 'Đăng bài Facebook', 'Soạn bài, xếp lịch, anh Thọ duyệt. App KHÔNG tự đăng — bấm đăng thật vẫn là anh Thọ (luật bộ não mục 6).',
    `<button class="nut" id="bd-moi">+ Soạn bài</button>`) + `
    <div class="the" style="padding:12px 14px">${Object.entries(TT_BAI).map(([k, [t]]) => `<span class="chip">${t} <span class="so">${ds.filter((b) => b.trang_thai === k).length}</span></span>`).join('')}</div>
    <div class="luoi-ca">${ds.map((b) => `<div class="the-ca" style="border-left-color:var(--${TT_BAI[b.trang_thai][1]}c)">
      <div class="hang"><span class="nhan ${TT_BAI[b.trang_thai][1]}">${TT_BAI[b.trang_thai][0]}</span><span class="mo nho" style="margin-left:auto">${c.esc(b.trang || '')}</span></div>
      ${b.anh_url ? `<img src="${c.esc(anhTrucTiep(b.anh_url))}" alt="" style="width:100%;max-height:180px;object-fit:cover;border-radius:8px">` : ''}
      <div style="white-space:pre-wrap;font-size:13.5px;max-height:120px;overflow:hidden">${c.esc(b.noi_dung)}</div>
      <div class="phu">${b.lich_dang ? 'Lịch đăng ' + c.ngayVN(b.lich_dang.slice(0, 10)) + ' ' + b.lich_dang.slice(11) : 'Chưa xếp lịch'} · ${c.esc(b.ai)}${b.hop_dong_ma ? ' · ' + b.hop_dong_ma : ''}</div>
      ${b.link_bai ? `<a class="phu" href="${c.esc(b.link_bai)}" target="_blank" rel="noopener">Mở bài đã đăng</a>` : ''}
      <div class="hang-nut"><button class="nut phu nho" data-bd="${b.id}">Sửa</button></div></div>`).join('') || '<div class="trong">Chưa có bài nào. Bấm "+ Soạn bài".</div>'}</div>`;
  const moBai = (b = {}) => {
    const h = hop(c, b.id ? 'Sửa bài' : 'Soạn bài', `
      <div class="hai"><label>Fanpage<input id="bd-trang" list="ds-trang" value="${c.esc(b.trang || 'Home Studio')}"><datalist id="ds-trang">${FANPAGE.map((f) => `<option>${f}</option>`).join('')}</datalist></label>
        <label>Lịch đăng<input id="bd-lich" type="datetime-local" value="${b.lich_dang || ''}"></label></div>
      <label style="margin-top:10px">Nội dung *<textarea id="bd-nd" rows="8" placeholder="Tiêu đề emoji chữ hoa · 📸/👉 · chân bài địa chỉ/hotline/inbox + hashtag">${c.esc(b.noi_dung || '')}</textarea></label>
      <label style="margin-top:10px">Link ảnh<input id="bd-anh" value="${c.esc(b.anh_url || '')}"></label>
      <label style="margin-top:10px">Trạng thái<select id="bd-tt">${Object.entries(TT_BAI).filter(([k]) => c.laChu() || k !== 'da_duyet').map(([k, [t]]) => `<option value="${k}" ${k === (b.trang_thai || 'nhap') ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
      <label style="margin-top:10px">Link bài sau khi đăng<input id="bd-link" value="${c.esc(b.link_bai || '')}"></label>
      <div class="hang-nut" style="margin-top:12px"><button class="nut" id="bd-luu">Lưu</button></div>`);
    h.g.querySelector('#bd-luu').onclick = () => c.chay(async () => {
      await c.kho.ham('crm_luu_bai', { d: { id: b.id || null, trang: giaTri(h.g, '#bd-trang'), lich_dang: giaTri(h.g, '#bd-lich'), noi_dung: h.g.querySelector('#bd-nd').value,
        anh_url: giaTri(h.g, '#bd-anh'), trang_thai: giaTri(h.g, '#bd-tt'), link_bai: giaTri(h.g, '#bd-link') }, p_ai: c.toi });
      h.dong(); c.bao('Đã lưu'); trangDangBai(c);
    });
  };
  c.$('#bd-moi').onclick = () => moBai();
  document.querySelectorAll('[data-bd]').forEach((x) => (x.onclick = () => moBai(ds.find((b) => b.id === Number(x.dataset.bd)))));
}

// ═════════ PHẦN THÊM CỦA HỒ SƠ CA ═════════
// Concept + makeup khách chọn · thông tin bé · video · checkout makeup · đánh giá.
export async function veHoSoThem(c, h, chua) {
  const t = await c.kho.ham('crm_ca_them', { p_id: h.id });
  const am = (loai) => t.anh_mau.filter((a) => a.loai === loai);
  const coMakeup = h.ekip.some((e) => e.vai === 'makeup') || c.vaiToi.includes('makeup');
  chua.innerHTML = `
    <div class="the"><div class="dau-the"><h2>Concept & makeup khách chọn</h2><span class="phai"><button class="nut phu nho" data-chon="concept">Chọn concept</button> <button class="nut phu nho" data-chon="makeup">Chọn makeup</button></span></div>
      <div class="luoi-anh nho">${t.anh_mau.map((a) => `<figure class="o-anh"><img src="${c.esc(anhTrucTiep(a.anh_url))}" alt="" loading="lazy"><figcaption><b>${c.esc(a.ten)}</b><span class="mo nho">${a.loai}</span></figcaption></figure>`).join('') || '<div class="mo">Chưa chọn — sale gửi ảnh mẫu cho khách rồi ghi lại đây để ekip chuẩn bị.</div>'}</div></div>
    <div class="the"><h2>Thông tin bé</h2><div class="mo nho" style="margin-bottom:6px">Để CSKH nhắc đúng tên và mời chụp sinh nhật.</div>
      <div class="hai"><label>Tên bé<input id="be-ten" value="${c.esc(t.be?.ten_be || '')}"></label><label>Ngày sinh bé<input id="be-ns" type="date" value="${t.be?.ngay_sinh_be || ''}"></label></div>
      <div class="hang-nut" style="margin-top:8px"><button class="nut phu nho" id="be-luu">Lưu thông tin bé</button></div></div>
    <div class="the"><div class="dau-the"><h2>Video khách</h2><span class="phai"><button class="nut phu nho" id="vd-sua">${t.video ? 'Sửa' : '+ Dán link'}</button></span></div>
      <div class="mo">${t.video ? (t.video.khong_lam ? 'Không làm: ' + c.esc(t.video.ly_do_khong) : `🎞 Hậu trường: ${t.video.link_hau_truong ? `<a href="${c.esc(t.video.link_hau_truong)}" target="_blank" rel="noopener">mở</a>` : 'chưa có'} · 🎬 Video dựng: ${t.video.link_video ? `<a href="${c.esc(t.video.link_video)}" target="_blank" rel="noopener">mở</a>` : 'chưa có'}${t.video.da_bao_khach ? ' · <b style="color:var(--xanh)">đã gửi khách</b>' : ''}`) : 'Chưa có link — hạn 24 giờ sau buổi chụp.'}</div></div>
    ${coMakeup ? `<div class="the"><h2>Checkout makeup</h2>${t.makeup.map((m) => `<div class="gd"><span>${c.esc(m.ten)}</span><b>${m.nguoi_lon} người lớn · ${m.tre_em} trẻ em</b></div>`).join('')}
      <div class="hai" style="margin-top:8px"><label>Thợ makeup<select id="mk-ns">${c.DM.nhanSu.filter((x) => x.vai.includes('makeup')).map((x) => `<option value="${x.id}" ${x.ma === c.toi ? 'selected' : ''}>${c.esc(x.ten)}</option>`).join('')}</select></label>
        <label>Người lớn<input id="mk-nl" type="number" min="0" value="0"></label><label>Trẻ em<input id="mk-te" type="number" min="0" value="0"></label></div>
      <div class="hang-nut" style="margin-top:8px"><button class="nut phu nho" id="mk-luu">Lưu checkout</button></div></div>` : ''}
    <div class="the"><div class="dau-the"><h2>Đánh giá của khách</h2><span class="phai"><button class="nut phu nho" id="dg-moi">+ Ghi đánh giá</button></span></div>
      ${t.danh_gia.map((d) => `<div class="gd"><span>${d.nhan_xet ? '"' + c.esc(d.nhan_xet) + '"' : '<span class="mo">không ghi lời</span>'} ${d.van_de.map((v) => `<span class="nhan do">${VAN_DE[v] || v}</span>`).join(' ')}</span><b>${'★'.repeat(d.diem)} <span class="mo nho">${d.luc}</span></b></div>`).join('') || '<div class="mo">Chưa có.</div>'}</div>`;
  const veLai = () => veHoSoThem(c, h, chua);
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
}
