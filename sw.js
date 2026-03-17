// =============================================
//  QUIZPREP — Service Worker
//  v3: auth pages removed
// =============================================

const CACHE_VERSION = 'quizprep-v3';

const FILES_TO_CACHE = [
  './',
  './index.html',
  './quiz-select.html',
  './quiz.html',
  './results.html',
  './history.html',
  './404.html',
  './css/style.css',
  './css/quiz-select.css',
  './css/quiz.css',
  './css/results.css',
  './css/history.css',
  './js/app.js',
  './js/quiz-select.js',
  './js/quiz.js',
  './js/results.js',
  './js/history.js',
  './data/questions.js',
  './manifest.json',
  './icons/icon-192.svg',
  './icons/icon-512.svg'
];

// ── Install ──────────────────────────────────
self.addEventListener('install', function(event) {
  console.log('[SW] Installing v3...');
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(function(cache) {
        return cache.addAll(FILES_TO_CACHE);
      })
      .then(function() {
        return self.skipWaiting();
      })
  );
});

// ── Activate ─────────────────────────────────
self.addEventListener('activate', function(event) {
  console.log('[SW] Activating v3...');
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names
          .filter(function(name) { return name !== CACHE_VERSION; })
          .map(function(old) {
            console.log('[SW] Deleting old cache:', old);
            return caches.delete(old);
          })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// ── Fetch — Cache First ───────────────────────
self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) return cached;

      return fetch(event.request)
        .then(function(response) {
          if (!response || response.status !== 200) return response;

          var clone = response.clone();
          caches.open(CACHE_VERSION)
            .then(function(cache) {
              cache.put(event.request, clone);
            });

          return response;
        })
        .catch(function() {
          return new Response(
            '<!DOCTYPE html>' +
            '<html lang="en"><head>' +
            '<meta charset="UTF-8">' +
            '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
            '<title>Offline | QuizPrep</title>' +
            '<style>' +
            'body{font-family:system-ui,sans-serif;display:flex;flex-direction:column;' +
            'align-items:center;justify-content:center;min-height:100vh;margin:0;' +
            'background:#0d1117;color:#e6edf3;text-align:center;padding:1rem;}' +
            '.icon{font-size:4rem;margin-bottom:1rem;}' +
            'h1{font-size:1.5rem;color:#3fb950;margin-bottom:0.5rem;}' +
            'p{color:#8b949e;max-width:360px;line-height:1.6;}' +
            'button{margin-top:1.5rem;padding:0.75rem 2rem;background:#238636;' +
            'color:#fff;border:none;border-radius:10px;font-size:1rem;cursor:pointer;}' +
            '</style></head><body>' +
            '<div class="icon">📡</div>' +
            '<h1>You\'re offline</h1>' +
            '<p>No internet connection detected. Connect and try again, ' +
            'or return to a page you\'ve already visited.</p>' +
            '<button onclick="window.history.back()">Go Back</button>' +
            '</body></html>',
            { headers: { 'Content-Type': 'text/html' } }
          );
        });
    })
  );
});

// ── Message ───────────────────────────────────
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});