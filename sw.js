// sw.js
const CACHE_NAME = "voolt-cache-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/css/style.css",
  "/js/app.js",
  "/js/studentManager.js",
  "/js/companyManager.js",
  "/js/mockData.js",
  "/manifest.json",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg"
];

// Instalação do Service Worker
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Service Worker: Cache aberto e armazenando arquivos estáticos");
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
            console.log("Service Worker: Limpando cache antigo");
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Captura de requisições de fetch para funcionamento offline básico
self.addEventListener("fetch", (e) => {
  // Ignorar requisições da API de dados para que elas venham do SQLite em tempo real
  if (e.request.url.includes("/api/")) {
    return;
  }
  
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      // Se encontrar no cache, retorna, caso contrário faz a requisição na rede
      return cachedResponse || fetch(e.request).catch(() => {
        // Fallback caso a rede falhe e o recurso não esteja no cache (como index.html)
        if (e.request.mode === "navigate") {
          return caches.match("/index.html");
        }
      });
    })
  );
});
