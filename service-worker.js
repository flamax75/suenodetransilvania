const CACHE_NAME = "suenodetransilvania-cache-v2";
const urlsToCache = [
  "/",
  "/index.html",
  "/quien.html",
  "/contacto.html",
  "/politica.html",
  "/style.css",
  "/main.js",
  "/manifest.json",
  "/favicon.ico",
  "/assets/logo-suenodetransilvania.png",
  "/assets/logo-512.png",
  "/assets/logo-192.png",
  "/assets/castillo-transilvania.jpg"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames => Promise.all(
      cacheNames
        .filter(cacheName => cacheName !== CACHE_NAME)
        .map(cacheName => caches.delete(cacheName))
    ))
  );
});

self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  if (url.origin !== location.origin) return;
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      return cachedResponse || fetch(event.request).catch(() => {
        if (event.request.mode === "navigate") {
          return caches.match("/index.html");
        }

        return new Response("Recurso no disponible sin conexión", {
          status: 503,
          statusText: "Offline",
          headers: { "Content-Type": "text/plain; charset=utf-8" }
        });
      });
    })
  );
});
