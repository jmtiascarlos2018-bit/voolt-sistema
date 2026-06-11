const CACHE_NAME = "voolt-cache-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/favicon.svg",
  "/manifest.json",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg"
];

// Instalação do Service Worker
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Service Worker VOOLT: Cache aberto e armazenando arquivos estáticos");
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.warn("Alguns arquivos falharam ao serem cacheados durante o install:", err);
      });
    })
  );
  self.skipWaiting();
});

// Ativação do Service Worker
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("Service Worker VOOLT: Limpando cache antigo");
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Captura de requisições
self.addEventListener("fetch", (e) => {
  if (e.request.url.includes("/api/") || !e.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request).catch(() => {
        if (e.request.mode === "navigate") {
          return caches.match("/index.html");
        }
      });
    })
  );
});
