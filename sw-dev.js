const V = 'limo-dev-v1';
const SHELL = ['./dev.html', './manifest-dev.json', './icon-dev-192.png', './icon-dev-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('limo-dev-') && k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  if (r.mode === 'navigate') { e.respondWith(fetch(r).then(res => { const cp = res.clone(); caches.open(V).then(c => c.put('./dev.html', cp)); return res; }).catch(() => caches.match('./dev.html'))); return; }
  if (SHELL.some(p => u.pathname.endsWith(p.slice(1)))) e.respondWith(caches.match(r).then(h => h || fetch(r)));
});
