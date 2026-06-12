const CACHE = 'gear-vault-v4';
const IMMUTABLE = ['/shift-and-shutter/icons/icon-192.png', '/shift-and-shutter/icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(IMMUTABLE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Always fetch HTML and JS fresh from network; only cache icons
  if (url.pathname.endsWith('.png') || url.pathname.endsWith('.ico')) {
    e.respondWith(caches.match(e.request).then(c => c || fetch(e.request)));
    return;
  }
  // Network-first for everything else
  e.respondWith(
    fetch(e.request).then(res => {
      if (res && res.status === 200 && res.type === 'basic') {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }).catch(() => caches.match(e.request))
  );
});
