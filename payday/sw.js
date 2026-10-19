const CACHE_NAME = 'cal-tracker-v1';
const ASSETS = [
    'index.html',
    'style.css',
    'script.js',
    'manifest.json'
];

// Установка Service Worker и кэширование ресурсов
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('Кэширование ресурсов приложения...');
            return cache.addAll(ASSETS);
        })
    );
});

// Активация и удаление старого кэша
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.map(key => {
                    if (key !== CACHE_NAME) {
                        console.log('Удаление старого кэша', key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
});

// Перехват сетевых запросов и выдача файлов из кэша, если нет сети
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            return cachedResponse || fetch(event.request);
        })
    );
});
