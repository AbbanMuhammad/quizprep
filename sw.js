// =============================================
//  QUIZPREP — Service Worker
//  Stage 8: Offline support + caching
// =============================================

const CACHE_VERSION = 'quizprep-v1';

const FILES_TO_CACHE = [
  './',
  './index.html',
  './quiz-select.html',
  './quiz.html',
  './results.html',
  './login.html',
  './register.html',
  './history.html',
  './css/style.css',
  './css/quiz-select.css',
  './css/quiz.css',
  './css/results.css',
  './css/auth.css',
  './css/history.css',
  './js/app.js',
  './js/auth.js',
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
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(FILES_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// ── Activate ─────────────────────────────────
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(
        names
          .filter(name => name !== CACHE_VERSION)
          .map(old => {
            console.log('[SW] Deleting old cache:', old);
            return caches.delete(old);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch — Cache First ───────────────────────
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request)
        .then(response => {
          if (!response || response.status !== 200) return response;

          const clone = response.clone();
          caches.open(CACHE_VERSION)
            .then(cache => cache.put(event.request, clone));

          return response;
        })
        .catch(() => new Response(
          `<!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Offline | QuizPrep</title>
            <style>
              body {
                font-family: system-ui, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                background: #0f1117;
                color: #e8eaf0;
                text-align: center;
                padding: 1rem;
              }
              .icon { font-size: 4rem; margin-bottom: 1rem; }
              h1    { font-size: 1.5rem; color: #4ade80; margin-bottom: 0.5rem; }
              p     { color: #94a3b8; max-width: 360px; line-height: 1.6; }
              button {
                margin-top: 1.5rem;
                padding: 0.75rem 2rem;
                background: #1A5E3A;
                color: #fff;
                border: none;
                border-radius: 10px;
                font-size: 1rem;
                cursor: pointer;
              }
            </style>
          </head>
          <body>
            <div class="icon">📡</div>
            <h1>You're offline</h1>
            <p>No internet connection detected. Connect and try again,
               or return to a page you've already visited.</p>
            <button onclick="window.history.back()">Go Back</button>
          </body>
          </html>`,
          { headers: { 'Content-Type': 'text/html' } }
        ));
    })
  );
});

// ── Message ───────────────────────────────────
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});