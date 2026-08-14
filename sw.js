/* Fit Journey — service worker
   Guarda la app en el teléfono para que abra sin internet.
   No cachea ningún dato personal: todo eso vive en localStorage. */
const V = 'fitjourney-v5';
const ASSETS = ['./', './index.html', './icon.png', './icon-180.png', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // El HTML se pide primero a la red para que las actualizaciones lleguen solas,
  // con la copia guardada como respaldo cuando no hay internet.
  const isDoc = req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('.html');
  if (isDoc) {
    e.respondWith(
      fetch(req)
        .then(res => { const copy = res.clone(); caches.open(V).then(c => c.put('./index.html', copy)); return res; })
        .catch(() => caches.match('./index.html').then(r => r || caches.match('./')))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(V).then(c => c.put(req, copy));
      return res;
    }).catch(() => hit))
  );
});
