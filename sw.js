const CACHE_NAME = 'toan-ai-games-v2';
const ASSETS = [
  './index.html',
  './index.css',
  './app.js',
  './manifest.json',
  './bg_secret.png',
  './tug-of-war.js',
  './flip-puzzle.js',
  './ninja-toan.js',
  './quiz-climb.js',
  './gold-miner.js',
  './archery-math.js',
  './memory-match.js',
  './flappy-math.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (!e.request.url.startsWith('http')) return;

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request).then((networkResponse) => {
        // Cache MediaPipe hands libraries dynamically when loaded
        if (e.request.url.includes('cdn.jsdelivr.net')) {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, networkResponse.clone());
            return networkResponse;
          });
        }
        return networkResponse;
      }).catch(() => {
        return null;
      });
    })
  );
});
