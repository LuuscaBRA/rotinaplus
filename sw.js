const CACHE_NAME = 'rotina-plus-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './script.js',
    'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js',
    'https://api.dicebear.com/7.x/pixel-art/png?seed=RotinaPlus'
];

// Instala o Service Worker e guarda os arquivos no cache
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// Intercepta os pedidos para funcionar Offline
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
        .then(response => {
            // Retorna o arquivo do cache se existir, senão busca na internet
            return response || fetch(event.request);
        })
    );
});