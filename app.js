// App vận hành Home Studio — bản thử giai đoạn 1 (hợp đồng · lịch · thu tiền).
// Màn hình chỉ gọi kho.js. Bản thật (Supabase) bắt đăng nhập; bản thử chọn "đang dùng" ở góc trên.
import * as kho from './kho.js?v=20261108c';

const $ = (s, g = document) => g.querySelector(s);
const tien = (n) => (Math.round(Number(n) || 0)).toLocaleString('vi-VN') + 'đ';
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const homNay = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);   // giờ Việt Nam
const congNgay = (d, n) => new Date(new Date(d + 'T12:00:00Z').getTime() + n * 864e5).toISOString().slice(0, 10);
const ngayVN = (d) => (d ? d.slice(8, 10) + '/' + d.slice(5, 7) : '—');
const THU = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const VAI = { chup: 'Chụp', pts: 'PTS', stylist: 'Stylist', makeup: 'Makeup', sale_offline: 'Sale tại studio' };
const NGUON = { quang_cao: 'Quảng cáo', gioi_thieu: 'Người quen giới thiệu', khach_cu: 'Khách cũ', tu_tim: 'Tự tìm (Google, fanpage)', chua_ro: 'Chưa rõ' };
let DM, toi = '', vaiToi = [];
// Chỉ sale online / chủ ghi tiền — máy chủ chặn thật (can_quyen_tien), ở đây chỉ ẩn nút cho đỡ bấm nhầm.
const coTien = () => vaiToi.includes('sale_online') || vaiToi.includes('chu');
const KHONG_TIEN = '<div class="the mo">Chỉ sale online hoặc anh Thọ ghi tiền (phát sinh, thu tiền). Cần thêm khoản nào thì nhắn sale.</div>';

function bao(s, loi) {
  const b = Object.assign(document.createElement('div'), { className: 'bao' + (loi ? ' loi' : ''), textContent: s });
  document.body.appendChild(b); setTimeout(() => b.remove(), loi ? 4500 : 2200);
}
async function chay(fn) { try { await fn(); } catch (e) { console.error(e); bao(e.message || String(e), true); } }
const nhanTrangThai = (so, ten) => `<span class="nhan ${so >= 8 ? 'xanh' : so >= 3 ? 'cam' : ''}">${so}. ${esc(ten)}</span>`;

// ═════════ DANH SÁCH CA ═════════
async function trangDanhSach() {
  const tq = await kho.tongQuan();
  const loc = JSON.parse(sessionStorage.getItem('loc') || '{}');
  $('#trang').innerHTML = `
    <div class="so-lieu">
      <div><b>${tq.hom_nay}</b><span>ca chụp hôm nay</span></div>
      <div><b>${tq.dang_mo}</b><span>ca chưa hoàn thành</span></div>
      <div><b style="color:${tq.tre_hen ? 'var(--do)' : 'inherit'}">${tq.tre_hen}</b><span>ca quá hẹn trả ảnh</span></div>
      <div><b>${tien(tq.con_phai_thu)}</b><span>còn phải thu</span></div>
    </div>
    <div class="the hai">
      <label>Tìm khách, SĐT, mã HĐ<input id="tim" value="${esc(loc.tim || '')}" placeholder="Thu Hà, 0912…, HD-2026-…"></label>
      <label>Trạng thái<select id="loc-tt"><option value="">Tất cả</option>${DM.trangThai.map((t) => `<option value="${t.so}" ${String(loc.trangThai) === String(t.so) ? 'selected' : ''}>${t.so}. ${esc(t.ten)}</option>`).join('')}</select></label>
    </div>
    <div id="ds"></div>`;
  const ve = async () => {
    const l = { tim: $('#tim').value.trim(), trangThai: $('#loc-tt').value };
    sessionStorage.setItem('loc', JSON.stringify(l));
    const ds = await kho.dsHopDong(l);
    $('#ds').innerHTML = ds.length ? ds.map((h) => `
      <a class="the ca" href="#/ca/${h.id}">
        <div class="ten">${esc(h.khach)} <span class="phu">· ${esc(h.goi)}</span></div>
        <div class="tien">${tien(h.tong_hoa_don)}</div>
        <div class="phu">${h.ma} · chụp ${ngayVN(h.ngay_chup)}${h.gio_chup ? ' ' + h.gio_chup : ''}${h.hen_tra_anh ? ' · hẹn trả ' + ngayVN(h.hen_tra_anh) : ''}</div>
        <div class="phu" style="text-align:right">${h.con_lai ? 'còn ' + tien(h.con_lai) : h.tien_thua ? 'thừa ' + tien(h.tien_thua) : '<span style="color:var(--xanh)">đã đủ</span>'}</div>
        <div>${nhanTrangThai(h.trang_thai, h.trang_thai_ten)}${h.can_sua_lai ? ' <span class="nhan do">cần sửa lại</span>' : ''}${h.hen_tra_anh && h.hen_tra_anh < homNay() && h.trang_thai < 8 ? ' <span class="nhan do">quá hẹn</span>' : ''}</div>
      </a>`).join('') : '<div class="the mo">Chưa có ca nào khớp. Bấm "+ Hợp đồng" để tạo ca đầu tiên.</div>';
  };
  $('#tim').oninput = () => chay(ve); $('#loc-tt').onchange = () => chay(ve);
  await ve();
}

// ═════════ TẠO HỢP ĐỒNG ═════════
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

async function trangMoi() {
  if (!coTien()) { $('#trang').innerHTML = '<div class="the">Chỉ sale online hoặc anh Thọ tạo hợp đồng.</div>'; return; }
  const sale = DM.nhanSu.filter((n) => n.vai.includes('sale_online'));
  $('#trang').innerHTML = `
    <h1>Hợp đồng mới</h1>
    <div class="the">
      <h2>Khách</h2>
      <div class="hai">
        <label>Số điện thoại *<input id="sdt" type="tel" inputmode="numeric" placeholder="09xx xxx xxx"></label>
        <label>Tên khách *<input id="ten" placeholder="Mẹ bé Na / chị Thu Hà"></label>
      </div>
      <div id="khach-cu" class="mo" style="margin-top:6px"></div>
      <div class="hai" style="margin-top:10px">
        <label>Khách biết đến bên mình qua<select id="nguon">${Object.entries(NGUON).map(([k, v]) => `<option value="${k}" ${k === 'chua_ro' ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
        <label>Bằng chứng nguồn (câu khách nói, nhãn quảng cáo…)<input id="nguon-bc" placeholder="Để trống nếu chưa rõ — đừng đoán"></label>
      </div>
    </div>
    <div class="the">
      <h2>Gói và lịch</h2>
      <label>Gói *<select id="goi">${chonGoiHtml()}</select></label>
      <div id="goi-mo" class="mo" style="margin:6px 0 10px"></div>
      <div class="hai">
        <label>Giá gói<input id="gia" type="number" min="0" step="1000"></label>
        <label>Giảm giá<input id="giam" type="number" min="0" step="1000" value="0"></label>
        <label>Ngày chụp<input id="ngay" type="date"></label>
        <label>Giờ chụp<input id="gio" type="time" step="900"></label>
      </div>
      <div id="trung" style="margin-top:8px"></div>
    </div>
    <div class="the">
      <h2>Người phụ trách</h2>
      <label style="margin-bottom:10px">Sale chốt (online)<select id="sale"><option value="">—</option>${sale.map((n) => `<option value="${n.id}" ${n.ma === toi ? 'selected' : ''}>${esc(n.ten)}</option>`).join('')}</select></label>
      <div id="ekip">${ekipHtml()}</div>
    </div>
    <div class="the">
      <h2>Đặt cọc</h2>
      <div class="hai">
        <label>Số tiền cọc<input id="coc" type="number" min="0" step="1000" value="0"></label>
        <label>Hình thức<select id="htcoc"><option value="chuyen_khoan">Chuyển khoản</option><option value="tien_mat">Tiền mặt</option></select></label>
      </div>
      <label style="margin-top:10px">Ghi chú<textarea id="ghi" rows="2" placeholder="Bé hay ngủ trưa lúc mấy giờ, đi mấy người…"></textarea></label>
    </div>
    <div class="hang-nut"><button class="nut" id="luu">Lưu hợp đồng</button><a class="nut phu" href="#/">Huỷ</a></div>`;
  batChip($('#ekip'));
  $('#sdt').onblur = () => chay(async () => {
    const k = await kho.timKhach($('#sdt').value);
    $('#khach-cu').innerHTML = k ? `Khách cũ: <b>${esc(k.ten)}</b> · đã có ${k.so_ca} ca. Hợp đồng sẽ gắn vào hồ sơ này.` : '';
    if (k && !$('#ten').value) $('#ten').value = k.ten;
    if (k) { $('#nguon').value = 'khach_cu'; }
  });
  $('#goi').onchange = () => {
    const g = DM.goi.find((x) => x.ma === $('#goi').value);
    $('#gia').value = g ? g.gia_ban : '';
    $('#goi-mo').innerHTML = g ? [g.so_boi_canh, g.so_anh_sua ? g.so_anh_sua + ' ảnh sửa' : '', g.qua_in_co ? `in ${g.qua_in_co}` : '', g.qua_checkin ? `tặng ${g.qua_checkin} khi check-in` : '', g.noi_dung].filter(Boolean).map(esc).join(' · ') : '';
  };
  const kiemTrung = () => chay(async () => {
    const ngay = $('#ngay').value, gio = $('#gio').value;
    if (!ngay || !gio) { $('#trung').innerHTML = ''; return; }
    const ca = await kho.lich(ngay, ngay), ekip = docEkip($('#ekip'));
    const phut = (g) => Number(g.slice(0, 2)) * 60 + Number(g.slice(3, 5));
    const trung = ca.filter((c) => c.gio && Math.abs(phut(c.gio) - phut(gio)) < 120 && c.ekip.some((e) => ekip.some((x) => x.nhan_su_id === e.id)));
    $('#trung').innerHTML = trung.length ? `<div class="canh">⚠ Trùng ekip trong khung 2 giờ: ${trung.map((c) => `${c.gio} ${esc(c.khach)} (${[...new Set(c.ekip.map((e) => e.ten))].map(esc).join(', ')})`).join('; ')}</div>`
      : ca.length ? `<div class="mo">Ngày này đã có ${ca.length} ca: ${ca.map((c) => (c.gio || '?') + ' ' + esc(c.khach)).join(' · ')}</div>` : '';
  });
  $('#ngay').onchange = kiemTrung; $('#gio').onchange = kiemTrung; $('#ekip').addEventListener('click', kiemTrung);
  $('#luu').onclick = () => chay(async () => {
    $('#luu').disabled = true;
    try {
      const h = await kho.taoHopDong({
        sdt: $('#sdt').value, ten: $('#ten').value, nguon: $('#nguon').value, nguon_bang_chung: $('#nguon-bc').value.trim(),
        goi_ma: $('#goi').value, gia_goi: $('#gia').value, giam_gia: $('#giam').value, ngay_chup: $('#ngay').value, gio_chup: $('#gio').value,
        sale_online_id: $('#sale').value ? Number($('#sale').value) : null, ekip: docEkip($('#ekip')),
        coc: $('#coc').value, hinh_thuc_coc: $('#htcoc').value, ghi_chu: $('#ghi').value.trim(),
      }, toi);
      bao('Đã tạo ' + h.ma); location.hash = '#/ca/' + h.id;
    } finally { $('#luu').disabled = false; }
  });
}

// ═════════ CHI TIẾT CA ═════════
async function trangCa(id) {
  const h = await kho.chiTiet(id);
  if (!h) { $('#trang').innerHTML = '<div class="the">Không thấy hợp đồng.</div>'; return; }
  const cos = [...new Set(DM.giaIn.map((g) => g.co))];
  $('#trang').innerHTML = `
    <div class="hang-nut" style="justify-content:space-between"><h1 style="margin:0">${esc(h.khach)}</h1><span class="mo">${h.ma}</span></div>
    <p class="mo" style="margin:4px 0 12px">${esc(h.sdt)} · ${esc(h.goi_ten)} · ${NGUON[h.nguon] || ''}</p>
    <div class="the">
      <h2>Trạng thái</h2>
      <div class="buoc">${DM.trangThai.map((t) => `<button data-tt="${t.so}" class="${t.so < h.trang_thai ? 'qua' : t.so === h.trang_thai ? 'dang' : ''}">${t.so}. ${esc(t.ten)}</button>`).join('')}</div>
      <div class="hai" style="margin-top:10px">
        <label>Ngày chụp<input id="ngay" type="date" value="${h.ngay_chup || ''}"></label>
        <label>Giờ chụp<input id="gio" type="time" step="900" value="${h.gio_chup || ''}"></label>
        <label>Hẹn trả ảnh<input id="hen" type="date" value="${h.hen_tra_anh || ''}"></label>
        <label style="align-self:end;flex-direction:row;display:flex;gap:8px;align-items:center"><input id="sua" type="checkbox" style="width:auto" ${h.can_sua_lai ? 'checked' : ''}> Cần sửa lại</label>
      </div>
      <label style="margin-top:10px">Ghi chú<textarea id="ghi" rows="2">${esc(h.ghi_chu || '')}</textarea></label>
      <div class="hang-nut" style="margin-top:10px"><button class="nut nho" id="luu-tt">Lưu thay đổi</button>
        <span class="mo">Sang "Đã chụp" mà chưa có hẹn trả ảnh thì máy tự hẹn 10 ngày.</span></div>
    </div>
    <div class="the">
      <h2>Tiền</h2>
      <table>
        <tr><td>Gói ${esc(h.goi_ten)}${h.giam_gia ? ` (giảm ${tien(h.giam_gia)})` : ''}</td><td class="so">${tien(h.tien.tien_goi)}</td></tr>
        ${h.phatSinh.map((p) => `<tr><td>${esc(p.mo_ta)}${p.so_luong > 1 ? ' × ' + p.so_luong : ''}${coTien() ? ` <a href="#" data-xoa="${p.id}" class="mo">xoá</a>` : ''}</td><td class="so">${tien(p.thanh_tien)}</td></tr>`).join('')}
        <tr class="tong"><td>Tổng hoá đơn</td><td class="so">${tien(h.tien.tong_hoa_don)}</td></tr>
        ${h.phieuThu.map((p) => `<tr><td class="mo">${p.so_tien < 0 ? 'Hoàn' : 'Đã thu'} ${p.luc} · ${p.hinh_thuc === 'tien_mat' ? 'tiền mặt' : 'chuyển khoản'}${p.ghi_chu ? ' · ' + esc(p.ghi_chu) : ''}</td><td class="so">${tien(-p.so_tien)}</td></tr>`).join('')}
        <tr class="tong"><td>${h.tien.tien_thua ? 'Tiền thừa — hoàn khách hoặc trừ vào in' : 'Còn lại'}</td><td class="so" style="color:${h.tien.con_lai ? 'var(--do)' : 'var(--xanh)'}">${tien(h.tien.tien_thua || h.tien.con_lai)}</td></tr>
      </table>
    </div>
    ${coTien() ? `<div class="the">
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
    </div>
    <div class="the">
      <h2>Thu tiền</h2>
      <div class="hai">
        <label>Số tiền (âm = hoàn khách)<input id="pt-tien" type="number" step="1000" value="${h.tien.con_lai || ''}"></label>
        <label>Hình thức<select id="pt-ht"><option value="chuyen_khoan">Chuyển khoản</option><option value="tien_mat">Tiền mặt</option></select></label>
      </div>
      <label style="margin-top:10px">Ghi chú<input id="pt-ghi" placeholder="Thu nốt sau buổi chụp…"></label>
      <div class="hang-nut" style="margin-top:10px"><button class="nut nho" id="pt-thu">Ghi phiếu thu</button></div>
    </div>` : KHONG_TIEN}
    <div class="the">
      <h2>Ekip</h2>
      ${coTien() ? `<div id="ekip">${ekipHtml(h.ekip)}</div>
      <button class="nut nho phu" id="luu-ekip">Lưu ekip</button>`
        : `<p style="margin:0">${h.ekip.map((e) => esc(e.ten) + " · " + (VAI[e.vai] || e.vai)).join("<br>") || "—"}</p><p class="mo" style="margin:6px 0 0">Chỉ sale online hoặc anh Thọ sửa ekip.</p>`}
    </div>
    <div class="the">
      <h2>Gói gồm</h2>
      <p class="mo" style="margin:0">${[h.so_boi_canh, h.so_anh_sua ? h.so_anh_sua + ' ảnh sửa' : '', h.qua_in_co ? 'in ' + h.qua_in_co : '', h.qua_checkin ? 'tặng ' + h.qua_checkin + ' khi check-in' : '', h.noi_dung].filter(Boolean).map(esc).join(' · ') || '—'}</p>
    </div>
    <div class="the">
      <h2>Lịch sử</h2>
      ${h.lichSu.map((l) => `<div class="mo">${l.luc} · <b>${esc(l.ai)}</b> · ${esc(l.viec)}</div>`).join('') || '<div class="mo">—</div>'}
    </div>`;

  let ttChon = h.trang_thai;
  document.querySelectorAll('[data-tt]').forEach((b) => (b.onclick = () => {
    ttChon = Number(b.dataset.tt);
    document.querySelectorAll('[data-tt]').forEach((x) => (x.className = Number(x.dataset.tt) < ttChon ? 'qua' : Number(x.dataset.tt) === ttChon ? 'dang' : ''));
  }));
  $('#luu-tt').onclick = () => chay(async () => {
    await kho.capNhatHopDong(id, { trang_thai: ttChon, ngay_chup: $('#ngay').value, gio_chup: $('#gio').value, hen_tra_anh: $('#hen').value, can_sua_lai: $('#sua').checked, ghi_chu: $('#ghi').value.trim() }, toi);
    bao('Đã lưu'); trangCa(id);
  });

  if (coTien()) {
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
    bao('Đã ghi phiếu thu'); trangCa(id);
  });
  }
  if (coTien()) batChip($('#ekip'));
  if (coTien()) $('#luu-ekip').onclick = () => chay(async () => { await kho.datEkip(id, docEkip($('#ekip')), toi); bao('Đã lưu ekip'); trangCa(id); });
}

// ═════════ LỊCH ═════════
async function trangLich() {
  const tu = homNay(), den = congNgay(tu, 13);
  const ca = await kho.lich(tu, den);
  let html = `<h1>Lịch 14 ngày tới</h1>`;
  for (let i = 0; i < 14; i++) {
    const d = congNgay(tu, i), trong = ca.filter((c) => c.ngay === d);
    const thu = THU[new Date(d + 'T12:00:00Z').getUTCDay()];
    html += `<div class="ngay-lich">${thu} ${ngayVN(d)}${i === 0 ? ' · hôm nay' : ''} <span class="mo">· ${trong.length} ca</span></div>`;
    html += trong.map((c) => `
      <a class="the ca" href="#/ca/${c.id}" style="margin-bottom:8px">
        <div class="ten">${c.gio || '--:--'} · ${esc(c.khach)}</div><div class="phu">${esc(c.goi)}</div>
        <div class="phu">${c.ekip.length ? c.ekip.map((e) => `${esc(e.ten)} (${VAI[e.vai] || e.vai})`).join(', ') : 'chưa xếp ekip'}</div><div></div>
        ${c.trung.length ? `<div class="canh" style="grid-column:1/-1;margin:6px 0 0">⚠ Trùng ${c.trung.map((t) => `${t.nguoi.join(', ')} với ca ${t.gio}`).join('; ')}</div>` : ''}
      </a>`).join('');
  }
  $('#trang').innerHTML = html;
}

// ═════════ KHUNG ═════════
async function dieuHuong() {
  const h = location.hash.replace(/^#\/?/, '');
  document.querySelectorAll('.menu a').forEach((a) => a.classList.toggle('dang', a.dataset.trang === (h.startsWith('ca/') ? '' : h)));
  window.scrollTo(0, 0);
  await chay(async () => {
    if (h === 'mat-khau' && kho.THAT) trangMatKhau();
    else if (h === 'moi') await trangMoi();
    else if (h === 'lich') await trangLich();
    else if (h.startsWith('ca/')) await trangCa(Number(h.slice(3)));
    else await trangDanhSach();
  });
}

// ═════════ ĐĂNG NHẬP (bản thật) ═════════
function trangDangNhap(loi) {
  $('.menu').hidden = true; $('#toi').hidden = true; $('#nguoi').hidden = true;
  $('#trang').innerHTML = `
    <div class="the" style="max-width:380px;margin:40px auto">
      <h1>Đăng nhập</h1>
      <p class="mo">Tài khoản do anh Thọ cấp. Quên mật khẩu thì nhắn anh Thọ đặt lại.</p>
      <form id="dn" class="hai" style="grid-template-columns:1fr">
        <label>Email<input id="dn-email" type="email" autocomplete="username" required></label>
        <label>Mật khẩu<input id="dn-mk" type="password" autocomplete="current-password" required></label>
        <button class="nut chinh" type="submit">Vào</button>
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
      <form id="mk" class="hai" style="grid-template-columns:1fr">
        <label>Mật khẩu mới (ít nhất 8 ký tự, không dấu)<input id="mk-1" type="password" autocomplete="new-password" minlength="8" required></label>
        <label>Gõ lại<input id="mk-2" type="password" autocomplete="new-password" minlength="8" required></label>
        <button class="nut chinh" type="submit">Lưu</button>
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
    $('#nguoi').innerHTML = `<span>${esc(t.nhan_su?.ten || t.email)}</span> · <a href="#/mat-khau">Đổi MK</a> · <a href="#" id="thoat">Thoát</a>`;
    $('#thoat').onclick = (e) => { e.preventDefault(); chay(async () => { await kho.dangXuat(); trangDangNhap(); }); };
  } else {
    toi = localStorage.getItem('toi') || '';
    $('#toi').onchange = () => { toi = $('#toi').value; localStorage.setItem('toi', toi); vaiToi = DM.nhanSu.find((n) => n.ma === toi)?.vai || []; $('.menu a[data-trang=moi]').hidden = !coTien(); dieuHuong(); };
  }
  $('.menu').hidden = false;
  DM = await kho.danhMuc();
  if (!kho.THAT) $('#toi').innerHTML = '<option value="">Đang dùng: —</option>' + DM.nhanSu.map((n) => `<option value="${n.ma}" ${n.ma === toi ? 'selected' : ''}>${esc(n.ten)}</option>`).join('');
  if (!kho.THAT) vaiToi = DM.nhanSu.find((n) => n.ma === toi)?.vai || [];
  $('.menu a[data-trang=moi]').hidden = !coTien();
  await dieuHuong();
}

(async () => {
  await chay(async () => {
    await kho.moKho();
    window.addEventListener('hashchange', () => { if (DM) dieuHuong(); });
    await vaoApp();
  });
})();
