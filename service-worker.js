
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

// Activar y limpiar cachés viejas
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

// Interceptar peticiones y responder desde caché si está disponible
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).catch(() => {
        // Manejo de error: recurso no disponible
        return new Response("Recurso no disponible sin conexión", {
          status: 503,
          statusText: "Offline"
        });
      });
    })
  );
});
