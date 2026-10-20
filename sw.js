/*
  Limo ai — Service Worker
  مهم: كل ما تعدّل index.html وترفعه من جديد، غيّر رقم CACHE_VERSION
  بالأسفل (مثلاً من v1 إلى v2) عشان المستخدمين ياخذوا آخر نسخة.
  لو ما غيّرت الرقم، بعض المستخدمين راح تضل عندهم نسخة قديمة مخزنة.
*/
const CACHE_VERSION = 'v2';
const CACHE_NAME = 'limoai-' + CACHE_VERSION;

const CORE_ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // سيب طلبات Gemini/Groq/Tavily وغيرها تروح للنت مباشرة
  if (url.pathname.endsWith('/dev.html')) return; // صفحة المطور: دايماً من النت مباشرة، بدون تخزين مؤقت

  // صفحة التطبيق نفسها: جرّب النت أول (آخر نسخة)، ولو ما فيه نت ارجع للمخزن
  if (req.mode === 'navigate' || url.pathname.endsWith('/index.html') || url.pathname === '/' ) {
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
    );
    return;
  }

  // باقي الملفات الثابتة (الأيقونات، manifest): من المخزن أول، وإلا من النت
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => cached))
  );
});
