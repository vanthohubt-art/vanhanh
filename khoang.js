// khoang.js — CHỌN KHOẢNG NGÀY nhanh (10/11/2026, anh Thọ: "thêm phần ngày, từ ngày bao nhiêu tới ngày bao nhiêu, hoặc năm,
// chọn cho thông minh và nhanh"). Dùng chung cho mọi màn có số theo kỳ.
//
// Khoảng ghi trên địa chỉ trang bằng MỘT chữ (giữ được link cũ "2026-11"):
//   '2026-11'                 → tháng 11/2026
//   '2026'                    → cả năm 2026
//   '2026-11-01_2026-11-10'   → từ ngày đến ngày (tính cả hai đầu)
// ‹ › lùi/tiến đúng ĐỘ DÀI kỳ đang xem: tháng → tháng · năm → năm · quý → quý · 10 ngày → 10 ngày.

const pad = (n) => String(n).padStart(2, '0');
const iso = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
const soNgayThang = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();
const congNgay = (d, n) => new Date(Date.parse(d + 'T12:00:00Z') + n * 864e5).toISOString().slice(0, 10);
const ddmm = (d) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;
const ddmmyy = (d) => `${ddmm(d)}/${d.slice(0, 4)}`;
const soNgay = (tu, den) => Math.round((Date.parse(den) - Date.parse(tu)) / 864e5) + 1;

/** Chữ trên địa chỉ → { tu, den, kieu: 'thang'|'nam'|'quy'|'ngay', chu }. Chữ lạ ⇒ tháng hiện tại. */
export function docKhoang(chu, homNay) {
  let m;
  if ((m = /^(\d{4})-(\d{2})$/.exec(chu || ''))) {
    const y = +m[1], th = +m[2];
    return { tu: iso(y, th, 1), den: iso(y, th, soNgayThang(y, th)), kieu: 'thang', chu };
  }
  if ((m = /^(\d{4})$/.exec(chu || ''))) return { tu: `${m[1]}-01-01`, den: `${m[1]}-12-31`, kieu: 'nam', chu };
  if ((m = /^(\d{4}-\d{2}-\d{2})_(\d{4}-\d{2}-\d{2})$/.exec(chu || ''))) {
    const [tu, den] = m[1] <= m[2] ? [m[1], m[2]] : [m[2], m[1]];
    return lamGon(tu, den);
  }
  return docKhoang(homNay.slice(0, 7), homNay);
}

/** Khoảng ngày → kiểu gọn nhất (trọn tháng ⇒ '2026-11', trọn năm ⇒ '2026', trọn quý ⇒ quý). */
export function lamGon(tu, den) {
  const y = +tu.slice(0, 4), th = +tu.slice(5, 7);
  if (tu.slice(8) === '01' && den === iso(y, th, soNgayThang(y, th))) return { tu, den, kieu: 'thang', chu: tu.slice(0, 7) };
  if (tu === `${y}-01-01` && den === `${y}-12-31`) return { tu, den, kieu: 'nam', chu: String(y) };
  if (tu.slice(8) === '01' && (th - 1) % 3 === 0 && den === iso(y, th + 2, soNgayThang(y, th + 2)))
    return { tu, den, kieu: 'quy', chu: `${tu}_${den}` };
  return { tu, den, kieu: 'ngay', chu: `${tu}_${den}` };
}

export function nhanKhoang(k, homNay) {
  const y = homNay.slice(0, 4);
  if (k.kieu === 'thang') return `Tháng ${k.tu.slice(5, 7)}/${k.tu.slice(0, 4)}`;
  if (k.kieu === 'nam') return `Năm ${k.tu.slice(0, 4)}`;
  if (k.kieu === 'quy') return `Quý ${(+k.tu.slice(5, 7) + 2) / 3}/${k.tu.slice(0, 4)}`;
  if (k.tu === k.den) return k.tu === homNay ? `Hôm nay ${ddmm(k.tu)}` : `Ngày ${k.tu.slice(0, 4) === y ? ddmm(k.tu) : ddmmyy(k.tu)}`;
  const cungNam = k.tu.slice(0, 4) === k.den.slice(0, 4) && k.tu.slice(0, 4) === y;
  return `${cungNam ? ddmm(k.tu) : ddmmyy(k.tu)} – ${cungNam ? ddmm(k.den) : ddmmyy(k.den)} · ${soNgay(k.tu, k.den)} ngày`;
}

/** Kỳ liền trước (huong = -1) / liền sau (+1), cùng độ dài. */
export function dichKhoang(k, huong) {
  if (k.kieu === 'thang') {
    const d = new Date(Date.UTC(+k.tu.slice(0, 4), +k.tu.slice(5, 7) - 1 + huong, 1));
    const y = d.getUTCFullYear(), th = d.getUTCMonth() + 1;
    return lamGon(iso(y, th, 1), iso(y, th, soNgayThang(y, th)));
  }
  if (k.kieu === 'nam') { const y = +k.tu.slice(0, 4) + huong; return lamGon(`${y}-01-01`, `${y}-12-31`); }
  if (k.kieu === 'quy') {
    const d = new Date(Date.UTC(+k.tu.slice(0, 4), +k.tu.slice(5, 7) - 1 + 3 * huong, 1));
    const y = d.getUTCFullYear(), th = d.getUTCMonth() + 1;
    return lamGon(iso(y, th, 1), iso(y, th + 2, soNgayThang(y, th + 2)));
  }
  const n = soNgay(k.tu, k.den);
  return lamGon(congNgay(k.tu, huong * n), congNgay(k.den, huong * n));
}

/** Các nút chọn nhanh. */
export function nutNhanh(homNay) {
  const y = +homNay.slice(0, 4), th = +homNay.slice(5, 7), q0 = th - ((th - 1) % 3);
  const tt = dichKhoang(docKhoang(homNay.slice(0, 7), homNay), -1);
  return [
    ['Hôm nay', lamGon(homNay, homNay)],
    ['Hôm qua', lamGon(congNgay(homNay, -1), congNgay(homNay, -1))],
    ['7 ngày qua', lamGon(congNgay(homNay, -6), homNay)],
    ['30 ngày qua', lamGon(congNgay(homNay, -29), homNay)],
    ['Tháng này', docKhoang(homNay.slice(0, 7), homNay)],
    ['Tháng trước', tt],
    ['Quý này', lamGon(iso(y, q0, 1), iso(y, q0 + 2, soNgayThang(y, q0 + 2)))],
    ['Năm nay', lamGon(`${y}-01-01`, `${y}-12-31`)],
    ['Năm trước', lamGon(`${y - 1}-01-01`, `${y - 1}-12-31`)],
  ];
}

/**
 * Vẽ cụm "‹ [nhãn kỳ] ›" và hộp chọn khi bấm vào nhãn.
 * diaChi(chu) trả địa chỉ trang cho một khoảng, vd (c) => '#/cong-no/' + c.
 * Trả chuỗi HTML; gọi ganKhoang(...) sau khi đã chèn vào trang.
 */
export function cumKhoang(k, homNay, diaChi) {
  return `<span class="cum-khoang"><a class="nut phu nho" href="${diaChi(dichKhoang(k, -1).chu)}" title="Kỳ trước">‹</a>`
    + `<button class="nut phu nho" id="khoang-mo" type="button" title="Chọn ngày, tháng, năm">📅 ${nhanKhoang(k, homNay)}</button>`
    + `<a class="nut phu nho" href="${diaChi(dichKhoang(k, 1).chu)}" title="Kỳ sau">›</a></span>`;
}

export function ganKhoang(k, homNay, diaChi) {
  const nut = document.getElementById('khoang-mo');
  if (!nut) return;
  nut.onclick = () => {
    let nam = +k.tu.slice(0, 4);
    const nen = document.createElement('div');
    nen.className = 'hop-nen';
    const ve = () => {
      const thangNay = homNay.slice(0, 7);
      nen.innerHTML = `<div class="hop hop-khoang" role="dialog" aria-label="Chọn khoảng ngày">
        <div class="dau-the"><h2 style="margin:0">Chọn kỳ xem</h2><button class="nut phu nho" data-k="dong" type="button">Đóng</button></div>
        <div style="margin:10px 0 4px">${nutNhanh(homNay).map(([t, x]) => `<a class="chip ${x.chu === k.chu ? 'chon' : ''}" href="${diaChi(x.chu)}">${t}</a>`).join('')}</div>
        <div class="dau-the" style="margin-top:8px"><b>Theo tháng</b><span class="phai">
          <button class="nut phu nho" data-k="nam-truoc" type="button">‹</button>
          <a class="nut phu nho" href="${diaChi(String(nam))}" title="Xem cả năm">Năm ${nam}</a>
          <button class="nut phu nho" data-k="nam-sau" type="button">›</button></span></div>
        <div class="luoi-thang">${[...Array(12).keys()].map((i) => {
          const c = `${nam}-${pad(i + 1)}`;
          return `<a class="chip ${c === k.chu ? 'chon' : ''} ${c > thangNay ? 'mo' : ''}" href="${diaChi(c)}">T${i + 1}</a>`;
        }).join('')}</div>
        <div class="luoi-thang" style="grid-template-columns:repeat(4,1fr)">${[1, 2, 3, 4].map((q) => {
          const x = lamGon(iso(nam, 3 * q - 2, 1), iso(nam, 3 * q, soNgayThang(nam, 3 * q)));
          return `<a class="chip ${x.chu === k.chu ? 'chon' : ''}" href="${diaChi(x.chu)}">Quý ${q}</a>`;
        }).join('')}</div>
        <div style="margin-top:10px"><b>Từ ngày … đến ngày …</b></div>
        <div class="hai" style="margin-top:6px">
          <label>Từ ngày<input type="date" id="kh-tu" value="${k.tu}"></label>
          <label>Đến ngày<input type="date" id="kh-den" value="${k.den}"></label>
        </div>
        <div class="hang-nut" style="margin-top:10px;justify-content:flex-end"><button class="nut nho" data-k="xem" type="button">Xem khoảng này</button></div>
      </div>`;
      nen.querySelector('[data-k=dong]').onclick = () => nen.remove();
      nen.querySelector('[data-k=nam-truoc]').onclick = () => { nam--; ve(); };
      nen.querySelector('[data-k=nam-sau]').onclick = () => { nam++; ve(); };
      nen.querySelector('[data-k=xem]').onclick = () => {
        const tu = nen.querySelector('#kh-tu').value, den = nen.querySelector('#kh-den').value;
        if (!tu || !den) return;
        location.hash = diaChi(lamGon(tu <= den ? tu : den, tu <= den ? den : tu).chu);
      };
      nen.querySelectorAll('a[href]').forEach((a) => a.addEventListener('click', () => nen.remove()));
    };
    nen.onclick = (e) => { if (e.target === nen) nen.remove(); };
    ve();
    document.body.appendChild(nen);
  };
}
