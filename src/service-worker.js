const SHELL = 'brisa-shell-__BUILD_ID__';
const MEDIA = 'brisa-media-v1';
const FILES = __PRECACHE__;
self.addEventListener('install', event => event.waitUntil(caches.open(SHELL).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil((async () => { for (const key of await caches.keys()) if (key.startsWith('brisa-shell-') && key !== SHELL) await caches.delete(key); await self.clients.claim(); })()));
self.addEventListener('fetch', event => {
  const request = event.request; const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  event.respondWith((async () => {
    // Prefer the current release online; keep the cached shell for offline use.
    if (request.mode === 'navigate') {
      try {
        const response = await fetch(request, { cache: 'no-cache' });
        if (response.ok) return response;
      } catch { /* Continue with the offline shell. */ }
    }
    const cached = await caches.match(url.pathname);
    if (cached) {
      const range = request.headers.get('range');
      if (range && (url.pathname.startsWith('/audio/') || url.pathname.startsWith('/voices/'))) {
        const bytes = await cached.arrayBuffer(); const match = /^bytes=(\d+)-(\d*)$/.exec(range);
        if (!match) return new Response(null, { status:416, headers:{'Content-Range':`bytes */${bytes.byteLength}`} });
        const start = Number(match[1]); const end = Math.min(match[2] ? Number(match[2]) : bytes.byteLength - 1, bytes.byteLength - 1);
        if (start > end) return new Response(null, { status:416, headers:{'Content-Range':`bytes */${bytes.byteLength}`} });
        return new Response(bytes.slice(start, end + 1), { status:206, headers:{'Content-Type':cached.headers.get('content-type') || 'audio/mpeg', 'Content-Range':`bytes ${start}-${end}/${bytes.byteLength}`, 'Content-Length':String(end-start+1), 'Accept-Ranges':'bytes'} });
      }
      return cached;
    }
    try { return await fetch(request); }
    catch { if (request.mode === 'navigate') return await caches.match('/') || Response.error(); return Response.error(); }
  })());
});
