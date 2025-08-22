// Service Worker for Lulu Kitchen PWA
const CACHE_NAME = 'lulu-kitchen-v1.0.0';
const STATIC_CACHE = 'lulu-kitchen-static-v1';
const DYNAMIC_CACHE = 'lulu-kitchen-dynamic-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/style.css', 
    '/script.js',
    '/src/services/TranslationService.js',
    '/src/services/MenuService.js',
    '/src/services/CartManager.js',
    '/src/components/ExtrasModal.js',
    '/manifest.json',
    // Add fallback images
    'https://lulu-k.com/images/default-dish.jpg',
    // Add Google Fonts (these will be cached dynamically)
];

// Install event - cache static assets
self.addEventListener('install', event => {
    console.log('Service Worker installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('Static assets cached successfully');
                return self.skipWaiting(); // Force waiting SW to become active
            })
            .catch(error => {
                console.error('Failed to cache static assets:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('Service Worker activating...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(cacheName => {
                            // Delete old cache versions
                            return cacheName !== STATIC_CACHE && 
                                   cacheName !== DYNAMIC_CACHE &&
                                   (cacheName.startsWith('lulu-kitchen-') || 
                                    cacheName.startsWith('lulu-kitchen-static-') ||
                                    cacheName.startsWith('lulu-kitchen-dynamic-'));
                        })
                        .map(cacheName => {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        })
                );
            })
            .then(() => {
                console.log('Service Worker activated successfully');
                return self.clients.claim(); // Claim all clients immediately
            })
    );
});

// Fetch event - serve cached content and cache new content
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip Chrome extension requests
    if (url.protocol === 'chrome-extension:') {
        return;
    }
    
    // Handle different types of requests
    if (url.origin === location.origin) {
        // Same origin requests (our app files)
        event.respondWith(cacheFirstStrategy(request));
    } else if (url.hostname === 'docs.google.com') {
        // Google Sheets CSV - always try network first, fallback to cache
        event.respondWith(networkFirstStrategy(request));
    } else if (url.hostname === 'lulu-k.com') {
        // Images from lulu-k.com - cache first with long expiry
        event.respondWith(cacheFirstStrategy(request, DYNAMIC_CACHE, 24 * 60 * 60 * 1000)); // 24 hours
    } else if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
        // Google Fonts - cache first with long expiry
        event.respondWith(cacheFirstStrategy(request, DYNAMIC_CACHE, 30 * 24 * 60 * 60 * 1000)); // 30 days
    } else {
        // Other external resources - network first
        event.respondWith(networkFirstStrategy(request));
    }
});

// Cache First Strategy - for static assets and images
async function cacheFirstStrategy(request, cacheName = STATIC_CACHE, maxAge = null) {
    try {
        const cache = await caches.open(cacheName);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            // Check if cache is still valid (if maxAge is specified)
            if (maxAge) {
                const cachedDate = cachedResponse.headers.get('sw-cache-date');
                if (cachedDate) {
                    const age = Date.now() - parseInt(cachedDate);
                    if (age > maxAge) {
                        // Cache expired, try to fetch fresh version
                        try {
                            const networkResponse = await fetch(request);
                            if (networkResponse.ok) {
                                const responseClone = networkResponse.clone();
                                const headers = new Headers(responseClone.headers);
                                headers.append('sw-cache-date', Date.now().toString());
                                
                                const modifiedResponse = new Response(responseClone.body, {
                                    status: responseClone.status,
                                    statusText: responseClone.statusText,
                                    headers: headers
                                });
                                
                                cache.put(request, modifiedResponse.clone());
                                return networkResponse;
                            }
                        } catch (error) {
                            console.log('Network failed, serving stale cache:', error);
                        }
                    }
                }
            }
            
            return cachedResponse;
        }
        
        // Not in cache, fetch from network
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const responseClone = networkResponse.clone();
            const headers = new Headers(responseClone.headers);
            headers.append('sw-cache-date', Date.now().toString());
            
            const modifiedResponse = new Response(responseClone.body, {
                status: responseClone.status,
                statusText: responseClone.statusText,
                headers: headers
            });
            
            cache.put(request, modifiedResponse);
        }
        
        return networkResponse;
        
    } catch (error) {
        console.error('Cache First Strategy failed:', error);
        
        // If all fails, try to serve from cache without age check
        try {
            const cache = await caches.open(cacheName);
            const cachedResponse = await cache.match(request);
            if (cachedResponse) {
                return cachedResponse;
            }
        } catch (cacheError) {
            console.error('Failed to serve from cache:', cacheError);
        }
        
        // Return offline page or error response
        if (request.destination === 'document') {
            return caches.match('/index.html');
        }
        
        return new Response('Network Error', {
            status: 408,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}

// Network First Strategy - for dynamic content like CSV data
async function networkFirstStrategy(request, cacheName = DYNAMIC_CACHE) {
    try {
        // Try network first
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
            return networkResponse;
        }
        throw new Error(`Network response not ok: ${networkResponse.status}`);
        
    } catch (error) {
        console.log('Network failed, trying cache:', error);
        
        // Network failed, try cache
        try {
            const cache = await caches.open(cacheName);
            const cachedResponse = await cache.match(request);
            if (cachedResponse) {
                return cachedResponse;
            }
        } catch (cacheError) {
            console.error('Cache lookup failed:', cacheError);
        }
        
        // Both network and cache failed
        return new Response('Offline - Content not available', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}

// Background sync for orders (future enhancement)
self.addEventListener('sync', event => {
    if (event.tag === 'order-sync') {
        event.waitUntil(syncOrders());
    }
});

async function syncOrders() {
    try {
        // Get pending orders from IndexedDB
        const pendingOrders = await getPendingOrders();
        
        for (const order of pendingOrders) {
            try {
                // Try to send order
                const response = await fetch('/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(order)
                });
                
                if (response.ok) {
                    // Order sent successfully, remove from pending
                    await removePendingOrder(order.id);
                    
                    // Notify user
                    self.registration.showNotification('הזמנה נשלחה!', {
                        body: `הזמנה מספר ${order.id} נשלחה בהצלחה`,
                        icon: '/icons/icon-192x192.png',
                        tag: 'order-sent'
                    });
                }
            } catch (error) {
                console.error('Failed to sync order:', order.id, error);
            }
        }
    } catch (error) {
        console.error('Background sync failed:', error);
    }
}

// Push notifications (future enhancement)
self.addEventListener('push', event => {
    const options = {
        body: event.data ? event.data.text() : 'הזמנה חדשה זמינה!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: '1'
        },
        actions: [
            {
                action: 'explore',
                title: 'צפה בהזמנה',
                icon: '/icons/checkmark.png'
            },
            {
                action: 'close', 
                title: 'סגור',
                icon: '/icons/xmark.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('מטבח לולו', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Message handler for communication with main thread
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Helper functions for IndexedDB operations (for background sync)
async function getPendingOrders() {
    // This would use IndexedDB to get pending orders
    // For now, return empty array
    return [];
}

async function removePendingOrder(orderId) {
    // This would remove the order from IndexedDB
    console.log('Removing pending order:', orderId);
}