const CACHE_NAME = 'pwa-consultas-cache-v2'; // Incremented cache version
const urlsToCache = [
    '/',
    '/css/style.css',
    '/js/service-worker-register.js',
    '/login',
    '/perfil',
    '/consultas',
    '/notificacoes'
    // Adicionar outras URLs de assets para cache aqui
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache aberto: ' + CACHE_NAME);
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                return self.skipWaiting(); // Force activation of new service worker
            })
    );
});

self.addEventListener('fetch', event => {
    // Network-first for navigation requests
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // IMPORTANT: Check for valid response, as fetch() will not reject on HTTP error status codes (e.g. 404, 500)
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        // If the response is not valid, or an error page, don't cache it.
                        // Fallback to cache if network fails or returns an error.
                        // This prevents caching of error pages like 404.
                        return caches.match(event.request);
                    }
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });
                    return response;
                })
                .catch(() => {
                    // Network request failed, try to get it from the cache.
                    return caches.match(event.request);
                })
        );
        return; // End execution for navigate requests
    }

    // Cache-first for other requests (assets)
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request).then(networkResponse => {
                // Cache the new asset
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseToCache);
                });
                return networkResponse;
            });
        })
    );
});

self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('Deletando cache antigo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            return self.clients.claim(); // Take control of open clients
        })
    );
});

self.addEventListener('push', event => {
    console.log('Push recebido:', event);
    
    let data;
    try {
        data = event.data.json();
        console.log('Dados da notificação push:', data);
    } catch (e) {
        console.error('Erro ao processar dados da notificação:', e);
        data = {
            title: 'Nova notificação',
            body: 'Você tem uma nova notificação.',
            icon: 'https://cdn-icons-png.flaticon.com/512/2107/2107957.png',
            badge: 'https://cdn-icons-png.flaticon.com/512/1040/1040216.png',
            data: { url: '/notificacoes' }
        };
    }

    const title = data.title || 'PWA Consultas';
    const options = {
        body: data.body,
        icon: data.icon || 'https://cdn-icons-png.flaticon.com/512/2107/2107957.png',
        badge: data.badge || 'https://cdn-icons-png.flaticon.com/512/1040/1040216.png',
        data: {
            url: data.data && data.data.url ? data.data.url : '/notificacoes'
        },
        vibrate: [100, 50, 100],
        requireInteraction: true
    };

    console.log('Exibindo notificação:', title, options);
    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
    event.notification.close(); // Close the notification

    const urlToOpen = event.notification.data.url;

    event.waitUntil(
        clients.openWindow(urlToOpen) // Open the specified URL
    );
});
