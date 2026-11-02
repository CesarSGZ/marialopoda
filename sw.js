// Guarda la app en el móvil para que abra al momento y sin cobertura. Sube VERSION al publicar cambios.
const VERSION = 'marialopoda-3';
const FICHEROS = ['./', './index.html', './styles.css', './app.js', './frases.js', './manifest.webmanifest',
  './icons/mascota.svg', './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png',
  './fonts/bagel.woff2', './fonts/figtree.woff2'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FICHEROS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((r) => r || fetch(e.request)));
});
