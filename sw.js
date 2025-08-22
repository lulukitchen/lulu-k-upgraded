// Service Worker for PWA Support
const CACHE_NAME = 'lulu-kitchen-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/menu.html',
    '/cart.html',
    '/order.html',
    '/payment.html',
    '/thankyou.html',
    '/about.html',
    '/css/main.css',
    '/css/menu.css',
    '/css/cart.css',
    '/css/responsive.css',
    '/js/main.js',
    '/js/menu.js',
    '/js/extras.js',
    '/js/cart.js',
    '/js/payment.js',
    '/js/utils.js',
    '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Return cached version or fetch from network
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Background sync for orders
self.addEventListener('sync', event => {
    if (event.tag === 'order-sync') {
        event.waitUntil(
            // Sync pending orders when online
            syncPendingOrders()
        );
    }
});

async function syncPendingOrders() {
    try {
        // Get pending orders from IndexedDB
        const pendingOrders = await getPendingOrders();
        
        for (const order of pendingOrders) {
            try {
                await sendOrderToServer(order);
                await removePendingOrder(order.id);
            } catch (error) {
                console.error('Failed to sync order:', error);
            }
        }
    } catch (error) {
        console.error('Background sync failed:', error);
    }
}

// Push notifications for order updates
self.addEventListener('push', event => {
    const options = {
        body: event.data ? event.data.text() : 'הזמנתך התקבלה!',
        icon: '/images/icon-192.png',
        badge: '/images/badge-72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: '2'
        },
        actions: [
            {
                action: 'explore',
                title: 'צפה בהזמנה',
                icon: '/images/checkmark.png'
            },
            {
                action: 'close',
                title: 'סגור',
                icon: '/images/xmark.png'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('מטבח לולו', options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
    event.notification.close();

    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Utility functions for IndexedDB operations
async function getPendingOrders() {
    // Implementation for getting orders from IndexedDB
    return [];
}

async function sendOrderToServer(order) {
    // Implementation for sending order to server
    return fetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify(order),
        headers: { 'Content-Type': 'application/json' }
    });
}

async function removePendingOrder(orderId) {
    // Implementation for removing order from IndexedDB
    return true;
}