// Guarda la app en el móvil para que funcione sin cobertura. Sube VERSION al publicar cambios.
const VERSION = 'marialopoda-22';
const FICHEROS = ['./', './index.html', './styles.css', './app.js', './mundo.js', './fuerza.js', './pique.js', './bosque.js', './vida.js', './circuito.js', './frases.js', './manifest.webmanifest',
  './icons/mascota.svg', './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png',
  './fonts/bagel.woff2', './fonts/figtree.woff2'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FICHEROS.map((f) => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

// Al activarse una versión nueva, las pantallas abiertas se recargan para usarla ya.
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const claves = await caches.keys();
    const habiaOtra = claves.some((k) => k !== VERSION);
    await Promise.all(claves.filter((k) => k !== VERSION).map((k) => caches.delete(k)));
    await self.clients.claim();
    if (habiaOtra) (await self.clients.matchAll({ type: 'window' })).forEach((c) => { if (c.navigate) c.navigate(c.url).catch(() => {}); });
  })());
});

// Primero la red, para abrir siempre lo último; sin cobertura o con red muy lenta, lo guardado.
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const guardado = await cache.match(e.request, { ignoreSearch: true });
    const red = fetch(e.request).then((r) => { if (r.ok) cache.put(e.request, r.clone()); return r; });
    if (!guardado) return red;
    const limite = new Promise((res) => setTimeout(() => res(guardado), 2500));
    return Promise.race([red.catch(() => guardado), limite]);
  })());
});
