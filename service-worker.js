// service-worker.js

const CACHE_NAME = "suenodetransilvania-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/quien.html",
  "/contacto.html",
  "/style.css",
  "/assets/logo-512.png"
];

// Instalar y guardar en caché archivos necesarios
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Activar y limpiar cachés antiguas
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Interceptar peticiones solo del mismo origen (no de dominios externos)
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  if (url.origin !== location.origin) return; // Ignora peticiones externas

  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).catch(() => {
        return new Response("Recurso no disponible sin conexión", {
          status: 503,
          statusText: "Offline"
        });
      });
    })
  );
});
