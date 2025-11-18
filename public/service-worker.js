const CACHE_NAME = 'pwa-consultas-v4'; // Updated with custom install banner and fixed notification icons
const urlsToCache = [
    '/',
    '/css/style.css',
    '/css/magic-ui-system.css',
    '/css/magic-card.css',
    '/css/magic-login.css',
    '/css/magic-notifications.css',
    '/css/simplified-notifications.css',
    '/js/service-worker-register.js',
    '/js/magic-notifications.js',
    '/js/simplified-notifications.js',
    '/js/magic-ui.js',
    '/js/install-prompt.js',
    '/js/appointment-actions.js',
    '/js/navigation.js',
    '/js/notification-handler.js',
    '/login',
    '/perfil',
    '/consultas',
    '/notificacoes',
    '/add-appointment',
    '/forgot-password',
    '/uploads/default_avatar.png',
    '/manifest.json',
    '/icons/android-launchericon-48-48.png',
    '/icons/android-launchericon-72-72.png',
    '/icons/android-launchericon-96-96.png',
    '/icons/android-launchericon-144-144.png',
    '/icons/android-launchericon-192-192.png',
    '/icons/android-launchericon-512-512.png',
    '/icons/apple-touch-icon-152x152.png',
    '/icons/apple-touch-icon-167x167.png',
    '/icons/apple-touch-icon-180x180.png'
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
    // Sempre usar a rede para rotas de logout
    if (event.request.url.includes('/logout')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    return response;
                })
                .catch(error => {
                    console.error('Erro ao processar logout:', error);
                    // Redirecionar para a página de login em caso de erro
                    return Response.redirect('/login', 302);
                })
        );
        return;
    }
    
    // Network-first for navigation requests
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // IMPORTANT: Check for valid response and exclude redirects
                    // Don't cache redirects (3xx status codes) or error responses
                    if (!response || response.status < 200 || response.status >= 300 || response.type !== 'basic') {
                        // Allow redirects to pass through naturally
                        if (response && response.status >= 300 && response.status < 400) {
                            return response;
                        }
                        // For other non-200 responses, fallback to cache
                        return caches.match(event.request);
                    }
                    
                    // Only cache successful responses (200 OK)
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
        icon: data.icon || '/icons/android-launchericon-192-192.png',
        badge: data.badge || '/icons/android-launchericon-96-96.png',
        data: {
            url: data.data && data.data.url ? data.data.url : '/notificacoes'
        },
        vibrate: [100, 50, 100],
        requireInteraction: true,
        tag: 'pwa-consultas-notification',
        renotify: true
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
