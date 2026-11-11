// Service worker tối giản để điện thoại cho "cài" app lên màn hình chính (11/11/2026).
// KHÔNG lưu dữ liệu khách: mọi yêu cầu tới Supabase đi thẳng mạng. Tệp của app cũng lấy mạng trước (mỗi bản có ?v= riêng),
// chỉ khi mất mạng mới trả bản đã có để màn hình không trắng.
const KHO = 'vanhanh-v1';
self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== KHO) await caches.delete(k);
  await self.clients.claim();
})()));
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== self.location.origin) return;   // Supabase, CDN, phông: không đụng
  e.respondWith((async () => {
    try {
      const r = await fetch(e.request);
      if (r.ok) (await caches.open(KHO)).put(e.request, r.clone());
      return r;
    } catch {
      return (await caches.match(e.request)) || (await caches.match('./')) || Response.error();
    }
  })());
});
