// ═════════ ALBUM CHỌN ẢNH — tạo link cho khách ngay trong CRM (22/11/2026, theo mẫu SKY anh Thọ gửi) ═════════
// Album vẫn chạy ở Apps Script (album-agent, vanthohubt@): trang khách, sổ album, ảnh trên Drive. Trang này chỉ là bảng
// điều khiển: gọi POST <ALBUM_URL> kèm access token Supabase của người đang đăng nhập — máy chủ album tự hỏi Supabase
// token là ai (không có mật khẩu/khoá bí mật nào ở đây).
// Tải ảnh từ máy: máy chủ mở PHIÊN TẢI Drive cho từng tệp, trình duyệt PUT thẳng tệp lên Drive (ảnh 20MB không đi qua
// Apps Script). Bản thử (?thu) không có Apps Script ⇒ dùng API giả trong bộ nhớ, đủ để thử giao diện.
import { ALBUM_URL } from './cau-hinh.js?v=20261109h';

const MAU_GIA = [30000, 50000];
let tamGia = null;   // giá chung máy chủ trả về

async function goi(c, d) {
  if (!c.kho.THAT) return gia(d);
  const token = await c.kho.tokenCrm();
  if (!token) throw new Error('Phiên đăng nhập đã hết — tải lại trang.');
  let r;
  try {
    r = await fetch(ALBUM_URL, { method: 'POST', body: JSON.stringify({ ...d, token }), headers: { 'Content-Type': 'text/plain;charset=utf-8' }, redirect: 'follow' });
  } catch { throw new Error('Không nối được máy chủ album — kiểm tra mạng.'); }
  const j = await r.json().catch(() => ({ loi: 'Máy chủ album trả lời lạ (HTTP ' + r.status + ').' }));
  if (j.loi) throw new Error(j.loi);
  return j;
}

// ───────── API giả cho bản thử ─────────
const GIA = { ds: [], tm: 0 };
async function gia(d) {
  await new Promise((r) => setTimeout(r, 150));
  const tim = (ma) => { const a = GIA.ds.find((x) => x.ma === ma && !x.an); if (!a) throw new Error('Không thấy album.'); return a; };
  switch (d.viec) {
    case 'ds': return { ds: GIA.ds.filter((x) => !x.an).map((a) => ({ ...a, giaAnhThem: a.giaRieng || 30000 })).reverse(), giaChung: 30000 };
    case 'tao': {
      if (!String(d.khach || '').trim()) throw new Error('Thiếu tên khách.');
      if (!(Number(d.quota) >= 1)) throw new Error('Điền số ảnh trong gói.');
      if (d.cach === 'drive' && !/folders\//.test(d.thuMuc || '')) throw new Error('Dán link thư mục Drive chứa ảnh gốc.');
      const ma = Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 8);
      const now = new Date(Date.now() + 7 * 3600e3).toISOString();
      GIA.ds.push({ ma, tao: now.slice(0, 10) + ' ' + now.slice(11, 16), khach: d.khach.trim(), sdt: String(d.sdt || '').replace(/\D/g, ''), goi: d.goi || '',
        quota: Number(d.quota), thangChup: d.thangChup, giaRieng: Number(d.giaAnhThem) || 0, soAnh: d.cach === 'drive' ? 24 : 0, sua: 0, vuot: 0,
        trangThai: 'mo', hopDong: d.hopDong || '', coChinh: false, link: 'https://homestudio247.com/chon-anh/?a=' + ma, _goc: 0, _chinh: 0 });
      return { ok: true, ma, link: 'https://homestudio247.com/chon-anh/?a=' + ma, soAnh: 0 };
    }
    case 'sua': { const a = tim(d.ma); for (const k of ['khach', 'sdt', 'thangChup']) if (d[k] !== undefined) a[k] = d[k]; if (d.quota) a.quota = Number(d.quota); if (d.giaAnhThem !== undefined) a.giaRieng = Number(d.giaAnhThem) || 0; return { ok: true }; }
    case 'an': tim(d.ma).an = true; return { ok: true };
    case 'chiTiet': { const a = tim(d.ma); return { ma: a.ma, khach: a.khach, sua: [{ ten: 'DSC03401.jpg', ghiChu: 'Làm mịn da bé' }, { ten: 'DSC03417.jpg', ghiChu: '' }], khachChonTxt: 'DSC03401\nDSC03417', soAnhChinh: a._chinh, tong: { sua: 2, quota: a.quota, vuot: 0, tongPhatSinh: 0 } }; }
    case 'thuMucChinh': tim(d.ma).coChinh = true; return { ok: true, thuMuc: 'tm-chinh' };
    case 'moTai': { const a = tim(d.ma); return { ok: true, phien: d.tep.map((t) => ({ ten: t.ten, url: 'gia:' + a.ma + ':' + d.loai })) }; }
    case 'dongBo': { const a = tim(d.ma); a.soAnh = a._goc; return { ok: true, soAnh: a._goc, soAnhChinh: a._chinh }; }
    default: throw new Error('Không rõ việc');
  }
}

// ───────── tải tệp lên Drive ─────────
// tep: File[] · loai 'goc' | 'chinh' · baoTien(daXong, tong, byteXong, byteTong)
async function taiLen(c, ma, loai, tep, baoTien) {
  const tongByte = tep.reduce((s, f) => s + f.size, 0), daByte = new Array(tep.length).fill(0), loi = [];
  let xong = 0;
  const cap = () => baoTien(xong, tep.length, daByte.reduce((a, b) => a + b, 0), tongByte);
  const hang = [];
  for (let i = 0; i < tep.length; i += 20) {
    const lo = tep.slice(i, i + 20);
    const r = await goi(c, { viec: 'moTai', ma, loai, origin: location.origin, tep: lo.map((f) => ({ ten: f.name, mime: f.type || 'image/jpeg', size: f.size })) });
    r.phien.forEach((p, j) => hang.push({ f: lo[j], i: i + j, url: p.url, loi: p.loi }));
    // Ba luồng song song: đủ nhanh mà không nghẽn mạng studio.
    await Promise.all([0, 1, 2].map(async () => {
      for (let x; (x = hang.shift());) {
        if (x.loi) { loi.push(x.f.name + ': ' + x.loi); continue; }
        try { await put(x.url, x.f, (b) => { daByte[x.i] = b; cap(); }); daByte[x.i] = x.f.size; }
        catch (e) { loi.push(x.f.name + ': ' + e.message); }
        xong++; cap();
      }
    }));
  }
  return loi;
}

function put(url, f, tienDo) {
  if (url.startsWith('gia:')) {   // bản thử: giả tốc độ 25MB/giây
    const [, ma, loai] = url.split(':'), a = GIA.ds.find((x) => x.ma === ma);
    return new Promise((ok) => { let b = 0; const t = setInterval(() => { b = Math.min(f.size, b + 2.5e6); tienDo(b); if (b >= f.size) { clearInterval(t); if (loai === 'chinh') a._chinh++; else a._goc++; ok(); } }, 100); });
  }
  return new Promise((ok, hong) => {
    const x = new XMLHttpRequest();
    x.open('PUT', url);
    x.upload.onprogress = (e) => tienDo(e.loaded);
    x.onload = () => (x.status === 200 || x.status === 201 ? ok() : hong(new Error('Drive ' + x.status)));
    x.onerror = () => hong(new Error('mất mạng'));
    x.send(f);
  });
}

const laAnh = (f) => /^image\/(jpeg|png|webp)$/.test(f.type) || /\.(jpe?g|png|webp)$/i.test(f.name);
const mb = (b) => (b / 1048576).toLocaleString('vi-VN', { maximumFractionDigits: b > 1e9 ? 0 : 1 }) + ' MB';
const dongTien = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ';
let dangTai = false;
window.addEventListener('beforeunload', (e) => { if (dangTai) { e.preventDefault(); e.returnValue = ''; } });

const CSS = `
.al-luoi{display:grid;grid-template-columns:minmax(300px,380px) 1fr;gap:16px;align-items:start}
@media(max-width:900px){.al-luoi{grid-template-columns:1fr}}
.al-luoi label{display:block;margin-top:10px}
.al-tab{display:flex;background:var(--nen-2);border-radius:10px;padding:3px;margin-top:12px}
.al-tab button{flex:1;border:0;background:none;padding:8px;border-radius:8px;cursor:pointer;font:inherit;color:var(--chu-nhat)}
.al-tab button.chon{background:var(--the);color:var(--nhan);font-weight:600;box-shadow:var(--bong)}
.al-tha{border:1.5px dashed var(--vien);border-radius:12px;padding:18px 12px;text-align:center;margin-top:10px;cursor:pointer}
.al-tha.vao{border-color:var(--nhan);background:var(--nhan-nhat)}
.al-thanh{height:8px;background:var(--nen-2);border-radius:99px;overflow:hidden;margin-top:8px}
.al-thanh i{display:block;height:100%;background:var(--nhan);width:0;transition:width .2s}
.al-lich{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}
.al-lich .th{font-size:11px;text-align:center;color:var(--chu-nhat);padding:2px 0}
.al-ngay{min-height:74px;border:1px solid var(--vien);border-radius:8px;padding:4px 5px;font-size:11px;cursor:pointer;overflow:hidden;background:var(--the)}
.al-ngay.ngoai{opacity:.4}.al-ngay.co{background:var(--nhan-nhat)}.al-ngay.nay b.so{background:var(--nhan);color:var(--tren-nhan);border-radius:99px;padding:0 5px}
.al-ngay.chon{outline:2px solid var(--nhan)}
.al-ngay .dem{color:var(--nhan);font-weight:600}.al-ngay .t{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--chu-nhat)}
@media(max-width:600px){.al-ngay{min-height:46px}.al-ngay .t{display:none}}
.al-the{border:1px solid var(--vien);border-radius:12px;padding:12px 14px;margin-top:10px;background:var(--the)}
.al-the .dong-link{display:flex;gap:6px;margin:8px 0}
.al-the .dong-link input{flex:1;min-width:0}
.al-the .hang-nut{display:flex;flex-wrap:wrap;gap:6px}
.al-nhan{font-size:11px;border-radius:99px;padding:2px 9px;font-weight:600;white-space:nowrap}
.al-nhan.mo{background:var(--vang-nhat);color:#8A5A00}.al-nhan.gui{background:var(--xanh-nhat);color:var(--xanh)}
.al-tim-kq{border:1px solid var(--vien);border-radius:10px;margin-top:6px;max-height:220px;overflow:auto}
.al-tim-kq button{display:block;width:100%;text-align:left;border:0;border-bottom:1px solid var(--vien);background:var(--the);padding:8px 10px;cursor:pointer;font:inherit;color:var(--chu)}
.al-tim-kq button:hover{background:var(--nhan-nhat)}`;

export async function trangAlbum(c) {
  if (!document.getElementById('al-css')) document.head.appendChild(Object.assign(document.createElement('style'), { id: 'al-css', textContent: CSS }));
  const homNay = c.homNay();
  const st = { thang: homNay.slice(0, 7), ngay: '', ds: [], cach: 'may', tep: [], hopDong: null };
  c.trang.innerHTML = c.dauTrang('Sau chụp', 'Album chọn ảnh', 'Tạo link cho khách tự xem ảnh, thả tim chọn ảnh, ghi chú chỉnh sửa và tải ảnh về điện thoại.' + (c.kho.THAT ? '' : ' <b>Bản thử: dữ liệu giả, không đụng Drive.</b>')) + `
  <div class="al-luoi">
    <div class="the" id="al-tao">
      <h2>Tạo link cho khách</h2>
      <label>Lấy từ lịch chụp
        <div style="display:flex;gap:6px"><input id="al-tim" placeholder="SĐT, tên khách hoặc mã HĐ"><button class="nut phu" id="al-tim-nut">Tìm</button></div></label>
      <div id="al-tim-kq"></div>
      <div id="al-hd" class="mo nho" style="margin-top:6px"></div>
      <label>Tên khách *<input id="al-khach" placeholder="vd Gia đình chị Nhung"></label>
      <label>Số điện thoại<input id="al-sdt" inputmode="tel" placeholder="0901 234 567"></label>
      <div class="hai"><label>Tháng chụp<input id="al-thang" type="month" value="${homNay.slice(0, 7)}"></label>
        <label>Số ảnh trong gói *<input id="al-quota" type="number" min="1" step="1" value="10"></label></div>
      <label>Giá mỗi ảnh thêm (đồng)<input id="al-gia" inputmode="numeric" placeholder="Để trống = giá chung"></label>
      <div style="margin-top:6px">${MAU_GIA.map((g) => `<span class="chip" data-gia="${g}">${dongTien(g)}</span>`).join('')}<span class="chip" data-gia="">Giá chung</span></div>
      <div class="al-tab"><button class="chon" data-cach="may">Tải ảnh từ máy</button><button data-cach="drive">Dán link Drive</button></div>
      <div id="al-may">
        <div class="al-tha" id="al-tha"><b>Kéo thả ảnh hoặc cả thư mục vào đây</b><div class="mo nho">hoặc bấm để chọn ảnh</div></div>
        <button class="nut phu" id="al-chon-tm" style="width:100%;margin-top:8px">Chọn cả thư mục ảnh</button>
        <input type="file" id="al-file" accept="image/jpeg,image/png,image/webp" multiple hidden>
        <input type="file" id="al-thu-muc" webkitdirectory multiple hidden>
        <div id="al-da-chon" class="mo nho" style="margin-top:6px"></div>
        <div class="mo nho" style="margin-top:6px">Máy tự tạo thư mục Drive "tháng.năm - Tên khách - SĐT/Ảnh gốc", tải ảnh vào đó rồi tạo link cho khách.</div>
      </div>
      <div id="al-drive" hidden>
        <label>Link thư mục Drive chứa ảnh gốc<input id="al-link-drive" placeholder="https://drive.google.com/drive/folders/…"></label>
        <div class="mo nho" style="margin-top:6px">Thư mục phải chia sẻ cho vanthohubt@gmail.com (hoặc "Bất kỳ ai có liên kết").</div>
      </div>
      <button class="nut" id="al-nut-tao" style="width:100%;margin-top:14px">Tạo link và tải ảnh lên</button>
      <div id="al-tien" hidden><div class="al-thanh"><i></i></div><div class="mo nho" id="al-tien-chu" style="margin-top:4px"></div></div>
    </div>
    <div>
      <div class="the">
        <div class="dau-the"><h2 id="al-tieu-de">Album đã tạo</h2>
          <span class="phai"><button class="nut phu nho" id="al-lui">‹</button> <b id="al-thang-chu" style="margin:0 6px"></b> <button class="nut phu nho" id="al-toi">›</button> <button class="nut phu nho" id="al-nay">Hôm nay</button></span></div>
        <div class="al-lich" id="al-lich"></div>
      </div>
      <div id="al-ds"><div class="trong">Đang tải danh sách album…</div></div>
    </div>
  </div>`;
  const $ = (s) => c.trang.querySelector(s);

  // ── form ──
  c.trang.querySelectorAll('[data-gia]').forEach((x) => (x.onclick = () => { $('#al-gia').value = x.dataset.gia; }));
  c.trang.querySelectorAll('[data-cach]').forEach((b) => (b.onclick = () => {
    st.cach = b.dataset.cach;
    c.trang.querySelectorAll('[data-cach]').forEach((y) => y.classList.toggle('chon', y === b));
    $('#al-may').hidden = st.cach !== 'may'; $('#al-drive').hidden = st.cach !== 'drive';
    $('#al-nut-tao').textContent = st.cach === 'may' ? 'Tạo link và tải ảnh lên' : 'Tạo link từ thư mục Drive';
  }));
  const nhanTep = (ds) => {
    const anh = [...ds].filter(laAnh), bo = ds.length - anh.length;
    const daCo = new Set(st.tep.map((f) => f.name + f.size));
    for (const f of anh) if (!daCo.has(f.name + f.size)) st.tep.push(f);
    st.tep.sort((a, b) => a.name.localeCompare(b.name, 'vi', { numeric: true }));
    $('#al-da-chon').innerHTML = st.tep.length ? `Đã chọn <b>${st.tep.length} ảnh</b> · ${mb(st.tep.reduce((s, f) => s + f.size, 0))}${bo ? ` · bỏ qua ${bo} tệp không phải ảnh` : ''} · <a href="#" id="al-bo-chon">bỏ chọn</a>` : '';
    const b = $('#al-bo-chon'); if (b) b.onclick = (e) => { e.preventDefault(); st.tep = []; nhanTep([]); };
  };
  $('#al-tha').onclick = () => $('#al-file').click();
  $('#al-chon-tm').onclick = () => $('#al-thu-muc').click();
  $('#al-file').onchange = (e) => { nhanTep(e.target.files); e.target.value = ''; };
  $('#al-thu-muc').onchange = (e) => { nhanTep(e.target.files); e.target.value = ''; };
  const tha = $('#al-tha');
  tha.ondragover = (e) => { e.preventDefault(); tha.classList.add('vao'); };
  tha.ondragleave = () => tha.classList.remove('vao');
  tha.ondrop = async (e) => { e.preventDefault(); tha.classList.remove('vao'); nhanTep(await tepTuKeoTha(e.dataTransfer)); };

  // Lấy từ lịch chụp (hợp đồng trong CRM): điền tên, SĐT, tháng, số ảnh gói, và gắn album vào hồ sơ ca sau khi tạo.
  const tim = () => c.chay(async () => {
    const q = $('#al-tim').value.trim();
    if (!q) return;
    const ds = (await c.kho.dsHopDong({ tim: q })).slice(0, 12);
    $('#al-tim-kq').innerHTML = ds.length ? `<div class="al-tim-kq">${ds.map((h, i) => `<button data-i="${i}"><b>${c.esc(h.khach)}</b> · ${c.esc(h.sdt || '')}<br><span class="mo nho">${c.esc(h.ma)} · ${c.esc(h.goi || '')}${h.ngay_chup ? ' · chụp ' + c.ngayVN(h.ngay_chup) : ''}</span></button>`).join('')}</div>` : '<div class="mo nho" style="margin-top:6px">Không thấy hợp đồng nào.</div>';
    $('#al-tim-kq').querySelectorAll('[data-i]').forEach((b) => (b.onclick = () => {
      const h = ds[b.dataset.i], g = c.DM.goi.find((x) => x.ten === h.goi);
      st.hopDong = h;
      $('#al-khach').value = h.khach; $('#al-sdt').value = h.sdt || '';
      if (h.ngay_chup) $('#al-thang').value = h.ngay_chup.slice(0, 7);
      if (g && Number(g.so_anh_sua) > 0) $('#al-quota').value = g.so_anh_sua;
      $('#al-tim-kq').innerHTML = '';
      $('#al-hd').innerHTML = `Gắn vào hồ sơ <a href="#/ca/${h.id}">${c.esc(h.ma)}</a> · ${c.esc(h.goi || '')} <a href="#" id="al-bo-hd">(bỏ)</a>`;
      $('#al-bo-hd').onclick = (e) => { e.preventDefault(); st.hopDong = null; $('#al-hd').innerHTML = ''; };
    }));
  });
  $('#al-tim-nut').onclick = tim;
  $('#al-tim').onkeydown = (e) => { if (e.key === 'Enter') tim(); };

  // 23/11: khoá nút trong lúc máy chủ tạo (dán link Drive 455 ảnh mất vài giây — bấm lần hai từng ra 2 album).
  let dangTao = false;
  $('#al-nut-tao').onclick = () => c.chay(async () => {
    if (dangTai) return c.bao('Đang tải ảnh, chờ xong lượt này đã.', true);
    if (dangTao) return;
    const nut = $('#al-nut-tao'), chuCu = nut.textContent;
    dangTao = true; nut.disabled = true; nut.textContent = 'Đang tạo…';
    try { await taoMot(); } finally { dangTao = false; nut.disabled = false; nut.textContent = chuCu; }
  });
  const taoMot = async () => {
    const d = { viec: 'tao', cach: st.cach, khach: $('#al-khach').value.trim(), sdt: $('#al-sdt').value, thangChup: $('#al-thang').value,
      quota: $('#al-quota').value, giaAnhThem: $('#al-gia').value.replace(/\D/g, ''), thuMuc: $('#al-link-drive').value.trim(),
      goi: st.hopDong?.goi || '', hopDong: st.hopDong?.ma || '' };
    if (!d.khach) throw new Error('Điền tên khách.');
    if (st.cach === 'may' && !st.tep.length) throw new Error('Chọn ảnh gốc để tải lên (hoặc chuyển sang "Dán link Drive").');
    const r = await goi(c, d);
    if (st.hopDong) {
      try { await c.kho.ham('crm_gan_album', { p_id: st.hopDong.id, p_link: r.link, p_ai: c.toi }); }
      catch (e) { c.bao('Album đã tạo nhưng chưa gắn được vào hồ sơ: ' + e.message, true); }
    }
    if (r.canhBao) c.bao(r.canhBao, true);
    if (r.trung && st.cach === 'may') { c.bao('Album này vừa tạo rồi — muốn thêm ảnh thì bấm "Thêm ảnh gốc" ở album đó.', true); st.tep = []; nhanTep([]); }
    else if (st.cach === 'may') {
      const tep = st.tep; st.tep = []; nhanTep([]);
      await chayTai(c, r.ma, 'goc', tep, $('#al-tien'), $('#al-tien-chu'));
    } else c.bao('Đã tạo link — ' + r.soAnh + ' ảnh');
    for (const s of ['#al-khach', '#al-sdt', '#al-gia', '#al-link-drive', '#al-tim']) $(s).value = '';
    st.hopDong = null; $('#al-hd').innerHTML = '';
    await napDs(r.ma);
  };

  // ── lịch + danh sách ──
  const napDs = async (moiTao) => {
    const r = await goi(c, { viec: 'ds' });
    st.ds = r.ds; tamGia = r.giaChung;
    $('#al-gia').placeholder = 'Để trống = giá chung ' + dongTien(tamGia);
    if (moiTao) { st.ngay = ''; st.thang = homNay.slice(0, 7); }
    veLich(); veDs(moiTao);
  };
  const veLich = () => {
    const [y, m] = st.thang.split('-').map(Number), dau = new Date(Date.UTC(y, m - 1, 1)), lui = (dau.getUTCDay() + 6) % 7;
    const theoNgay = {};
    for (const a of st.ds) (theoNgay[a.tao.slice(0, 10)] = theoNgay[a.tao.slice(0, 10)] || []).push(a);
    const trongThang = st.ds.filter((a) => a.tao.startsWith(st.thang)).length;
    $('#al-thang-chu').textContent = `Tháng ${m}/${y} · ${trongThang} album`;
    $('#al-tieu-de').textContent = `Album đã tạo (${st.ds.length})`;
    let h = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((t) => `<div class="th">${t}</div>`).join('');
    for (let i = 0; i < 42; i++) {
      const d = new Date(Date.UTC(y, m - 1, 1 - lui + i)), iso = d.toISOString().slice(0, 10), ds = theoNgay[iso] || [];
      if (i >= 35 && d.getUTCMonth() !== m - 1) break;
      h += `<div class="al-ngay${d.getUTCMonth() !== m - 1 ? ' ngoai' : ''}${ds.length ? ' co' : ''}${iso === homNay ? ' nay' : ''}${iso === st.ngay ? ' chon' : ''}" data-ngay="${iso}">
        <b class="so">${d.getUTCDate()}</b>${ds.length ? `<div class="dem">${ds.length} album</div>${ds.slice(0, 2).map((a) => `<div class="t">${a.trangThai === 'da_gui' ? '✓ ' : ''}${c.esc(a.khach)}</div>`).join('')}${ds.length > 2 ? `<div class="t">+${ds.length - 2} album</div>` : ''}` : ''}</div>`;
    }
    $('#al-lich').innerHTML = h;
    $('#al-lich').querySelectorAll('[data-ngay]').forEach((x) => (x.onclick = () => { st.ngay = st.ngay === x.dataset.ngay ? '' : x.dataset.ngay; veLich(); veDs(); }));
  };
  const doiThang = (n) => { const [y, m] = st.thang.split('-').map(Number), d = new Date(Date.UTC(y, m - 1 + n, 1)); st.thang = d.toISOString().slice(0, 7); st.ngay = ''; veLich(); veDs(); };
  $('#al-lui').onclick = () => doiThang(-1); $('#al-toi').onclick = () => doiThang(1);
  $('#al-nay').onclick = () => { st.thang = homNay.slice(0, 7); st.ngay = ''; veLich(); veDs(); };

  const veDs = (noiBat) => {
    const ds = st.ds.filter((a) => (st.ngay ? a.tao.startsWith(st.ngay) : a.tao.startsWith(st.thang)));
    const tieuDe = st.ngay ? `Album tạo ngày ${c.ngayVN(st.ngay)}` : `Album tạo trong tháng ${Number(st.thang.slice(5))}/${st.thang.slice(0, 4)}`;
    $('#al-ds').innerHTML = `<div class="mo" style="margin:14px 2px 0">${tieuDe} · ${ds.length}</div>` + (ds.map((a) => `
      <div class="al-the" data-ma="${a.ma}"${a.ma === noiBat ? ' style="outline:2px solid var(--nhan)"' : ''}>
        <div style="display:flex;justify-content:space-between;gap:8px;align-items:start">
          <div><b style="font-size:16px">${c.esc(a.khach)}</b>
            <div class="mo nho">${a.sdt ? c.esc(a.sdt) + ' · ' : ''}<span data-so-anh>${a.soAnh}</span> ảnh · ${a.sua}/${a.quota} đã chọn · ảnh thêm ${dongTien(a.giaAnhThem)}${a.vuot ? ` · <b style="color:var(--do)">vượt ${a.vuot}</b>` : ''}${a.tongPhatSinh ? ` · phát sinh ${dongTien(a.tongPhatSinh)}` : ''}</div>
            <div class="mo nho">Tạo ${c.esc(a.tao.slice(8, 10) + '/' + a.tao.slice(5, 7) + ' ' + a.tao.slice(11))}${a.hopDong ? ` · HĐ ${c.esc(a.hopDong)}` : ''}${a.goi ? ` · ${c.esc(a.goi)}` : ''}${a.coChinh ? ' · có ảnh chỉnh' : ''}</div></div>
          <span class="al-nhan ${a.trangThai === 'da_gui' ? 'gui' : 'mo'}">${a.trangThai === 'da_gui' ? 'Khách đã gửi' : 'Đang chọn'}</span></div>
        <div class="dong-link"><input readonly value="${c.esc(a.link)}"><button class="nut phu nho" data-v="chep">Copy link</button><a class="nut phu nho" href="${c.esc(a.link)}" target="_blank" rel="noopener">Mở</a></div>
        <div class="hang-nut">
          <button class="nut phu nho" data-v="chon">Khách chọn gì</button>
          <button class="nut phu nho" data-v="goc">⤒ Thêm ảnh gốc</button>
          <button class="nut phu nho" data-v="chinh">⤒ Tải ảnh chỉnh</button>
          <button class="nut phu nho" data-v="dongBo">↻ Đồng bộ Drive</button>
          <button class="nut phu nho" data-v="sua">✎ Sửa</button>
          <button class="nut phu nho" data-v="an" style="color:var(--do)">Xoá</button>
        </div>
        <div class="tien-the" hidden><div class="al-thanh"><i></i></div><div class="mo nho chu-the" style="margin-top:4px"></div></div>
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden>
      </div>`).join('') || '<div class="trong" style="margin-top:10px">Chưa có album nào ở đây.</div>');
    $('#al-ds').querySelectorAll('.al-the').forEach((the) => {
      const a = st.ds.find((x) => x.ma === the.dataset.ma), oFile = the.querySelector('input[type=file]');
      let loai = 'goc';
      oFile.onchange = () => c.chay(async () => {
        const tep = [...oFile.files].filter(laAnh); oFile.value = '';
        if (!tep.length) return;
        if (loai === 'chinh') await goi(c, { viec: 'thuMucChinh', ma: a.ma });
        await chayTai(c, a.ma, loai, tep, the.querySelector('.tien-the'), the.querySelector('.chu-the'));
        await napDs();
      });
      the.querySelectorAll('[data-v]').forEach((b) => (b.onclick = () => {
        const v = b.dataset.v;
        if (v === 'chep') return chep(c, a.link);
        if (v === 'goc' || v === 'chinh') { if (dangTai) return c.bao('Đang tải ảnh, chờ xong lượt này đã.', true); loai = v; oFile.click(); return; }
        if (v === 'dongBo') return c.chay(async () => { const r = await goi(c, { viec: 'dongBo', ma: a.ma }); c.bao(`Đã đồng bộ: ${r.soAnh} ảnh gốc${r.soAnhChinh ? ' · ' + r.soAnhChinh + ' ảnh chỉnh' : ''}`); await napDs(); });
        if (v === 'sua') return moSua(c, a, napDs);
        if (v === 'chon') return moChon(c, a);
        if (v === 'an') return c.chay(async () => {
          if (!confirm(`Xoá album "${a.khach}"?\nLink khách sẽ thôi mở. Ảnh trên Drive và lựa chọn của khách VẪN GIỮ.`)) return;
          await goi(c, { viec: 'an', ma: a.ma }); c.bao('Đã xoá album'); await napDs();
        });
      }));
    });
  };
  await napDs();
}

async function chayTai(c, ma, loai, tep, khung, chu) {
  khung.hidden = false; dangTai = true;
  const thanh = khung.querySelector('i'), batDau = Date.now();
  try {
    const loi = await taiLen(c, ma, loai, tep, (xong, tong, b, bt) => {
      thanh.style.width = (bt ? (b / bt) * 100 : 0).toFixed(1) + '%';
      const s = (Date.now() - batDau) / 1000, toc = b / Math.max(s, 1), con = toc > 0 ? (bt - b) / toc : 0;
      chu.textContent = `Đang tải ${loai === 'chinh' ? 'ảnh chỉnh' : 'ảnh gốc'}: ${xong}/${tong} ảnh · ${mb(b)} / ${mb(bt)}` + (s > 3 && con > 5 ? ` · còn khoảng ${con > 90 ? Math.round(con / 60) + ' phút' : Math.round(con) + ' giây'}` : '');
    });
    const r = await goi(c, { viec: 'dongBo', ma });
    chu.textContent = loi.length ? `Xong ${tep.length - loi.length}/${tep.length} ảnh. Lỗi ${loi.length}: ${loi.slice(0, 3).join('; ')}${loi.length > 3 ? '…' : ''} — bấm tải lại những ảnh đó.` : `✓ Đã tải ${tep.length} ảnh. Album có ${loai === 'chinh' ? r.soAnhChinh + ' ảnh chỉnh' : r.soAnh + ' ảnh gốc'}.`;
    c.bao(loi.length ? `Có ${loi.length} ảnh lỗi` : 'Đã tải xong ' + tep.length + ' ảnh', !!loi.length);
  } finally { dangTai = false; }
}

// Kéo thả cả thư mục: duyệt cây thư mục bằng webkitGetAsEntry.
async function tepTuKeoTha(dt) {
  const muc = [...dt.items].map((i) => i.webkitGetAsEntry && i.webkitGetAsEntry()).filter(Boolean);
  if (!muc.length) return [...dt.files];
  const ra = [];
  const di = async (e) => {
    if (e.isFile) ra.push(await new Promise((ok, hong) => e.file(ok, hong)));
    else if (e.isDirectory) {
      const r = e.createReader();
      for (;;) { const lo = await new Promise((ok, hong) => r.readEntries(ok, hong)); if (!lo.length) break; for (const x of lo) await di(x); }
    }
  };
  for (const e of muc) await di(e);
  return ra;
}

async function chep(c, s) {
  try { await navigator.clipboard.writeText(s); c.bao('Đã copy link'); }
  catch { prompt('Copy link này:', s); }
}

function hopNho(c, tieuDe, than) {
  const nen = document.createElement('div'); nen.className = 'hop-nen';
  nen.innerHTML = `<div class="hop" role="dialog" aria-label="${c.esc(tieuDe)}" style="flex-basis:520px"><div class="dau-the"><h2>${c.esc(tieuDe)}</h2><button class="nut phu nho phai" data-dong>Đóng</button></div>${than}</div>`;
  const dong = () => nen.remove();
  nen.onclick = (e) => { if (e.target === nen) dong(); };
  nen.querySelector('[data-dong]').onclick = dong;
  document.body.appendChild(nen);
  return { g: nen, dong };
}

function moSua(c, a, xong) {
  const h = hopNho(c, 'Sửa album', `
    <label>Tên khách<input id="s-khach" value="${c.esc(a.khach)}"></label>
    <label style="margin-top:10px">Số điện thoại<input id="s-sdt" value="${c.esc(a.sdt || '')}"></label>
    <div class="hai" style="margin-top:10px"><label>Tháng chụp<input id="s-thang" type="month" value="${c.esc(a.thangChup || '')}"></label>
      <label>Số ảnh trong gói<input id="s-quota" type="number" min="1" value="${a.quota}"></label></div>
    <label style="margin-top:10px">Giá mỗi ảnh thêm (để trống = giá chung ${dongTien(tamGia)})<input id="s-gia" inputmode="numeric" value="${a.giaRieng || ''}"></label>
    <div class="hang-nut" style="margin-top:12px"><button class="nut" id="s-luu">Lưu</button></div>`);
  const g = (s) => h.g.querySelector(s).value.trim();
  h.g.querySelector('#s-luu').onclick = () => c.chay(async () => {
    await goi(c, { viec: 'sua', ma: a.ma, khach: g('#s-khach'), sdt: g('#s-sdt'), thangChup: g('#s-thang'), quota: g('#s-quota'), giaAnhThem: g('#s-gia').replace(/\D/g, '') });
    h.dong(); c.bao('Đã lưu'); await xong();
  });
}

async function moChon(c, a) {
  const h = hopNho(c, 'Khách chọn gì — ' + a.khach, '<div class="mo">Đang đọc…</div>');
  const than = h.g.querySelector('.hop');
  try {
    const r = await goi(c, { viec: 'chiTiet', ma: a.ma });
    than.insertAdjacentHTML('beforeend', `
      <div class="mo" style="margin-bottom:8px">${r.sua.length}/${r.tong.quota} ảnh đã chọn${r.tong.vuot ? ` · vượt ${r.tong.vuot}` : ''}${r.tong.tongPhatSinh ? ` · phát sinh ${dongTien(r.tong.tongPhatSinh)}` : ''}${r.soAnhChinh ? ` · ${r.soAnhChinh} ảnh chỉnh đã tải` : ''}</div>
      <div class="cuon-doc" style="max-height:320px">${r.sua.map((s) => `<div class="gd"><span><b style="font-weight:600">${c.esc(s.ten)}</b>${s.ghiChu ? `<br><span class="mo nho">✎ ${c.esc(s.ghiChu)}</span>` : ''}</span></div>`).join('') || '<div class="mo">Khách chưa thả tim ảnh nào.</div>'}</div>
      ${r.sua.length ? '<div class="hang-nut" style="margin-top:12px"><button class="nut phu" id="c-chep">Chép tên ảnh cho KHACH-CHON.txt</button></div>' : ''}`);
    than.firstElementChild.nextElementSibling?.remove();
    const b = h.g.querySelector('#c-chep'); if (b) b.onclick = () => chep(c, r.khachChonTxt);
  } catch (e) { than.lastElementChild.textContent = e.message; }
}
