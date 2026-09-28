// Service worker: funcționare offline + afișarea notificărilor push.
const VERSION = 'orar-1104a-v7';
const ASSETS = ['./', 'index.html', 'app.css', 'app.js', 'schedule.js', 'manifest.webmanifest',
  'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Offline întâi: totul se servește din memoria telefonului, iar internetul doar actualizează în fundal.
// Dacă site-ul dispare (repo șters, fără net), aplicația rămâne cu ultima versiune bună.
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  const isPage = e.request.mode === 'navigate';
  e.respondWith(caches.open(VERSION).then(async (cache) => {
    const cached = isPage
      ? (await cache.match('index.html')) || (await cache.match('./'))
      : await cache.match(e.request, { ignoreSearch: true });
    const network = fetch(e.request).then((res) => {
      // se salvează doar răspunsurile bune; un 404 nu strică niciodată ce e deja în memorie
      if (res.ok && res.type === 'basic') cache.put(isPage ? 'index.html' : e.request, res.clone());
      return res;
    }).catch(() => null);
    if (cached) { e.waitUntil(network); return cached; }
    return (await network) || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }));
});

self.addEventListener('push', (e) => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch { data = { title: 'Orar 1104A', body: e.data?.text() }; }
  e.waitUntil(self.registration.showNotification(data.title || 'Orar 1104A', {
    body: data.body || '',
    tag: data.tag,
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    silent: false,
    renotify: !!data.tag,
    data: { url: data.url || './' },
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const target = new URL(e.notification.data?.url || './', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    for (const c of list) if (c.url.startsWith(self.registration.scope) && 'focus' in c) return c.focus();
    return self.clients.openWindow(target);
  }));
});
