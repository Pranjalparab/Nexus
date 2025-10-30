const CACHE_NAME = 'flowgenix-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/sounds/kpop-bg.mp3',
  '/sounds/anime-bg.mp3',
  '/sounds/car-bg.mp3',
  '/sounds/music-bg.mp3',
  '/sounds/notification.mp3',
  '/sounds/timer-complete.mp3'
];

// Install Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch Event
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      }
    )
  );
});

// Activate Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background Sync for notifications
self.addEventListener('sync', event => {
  if (event.tag === 'focus-reminder') {
    event.waitUntil(
      // Handle background focus reminders
      handleFocusReminder()
    );
  }
});

// Push Notifications
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'FlowGenix notification',
    icon: '/logo192.png',
    badge: '/badge.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open FlowGenix',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('FlowGenix', options)
  );
});

// Notification Click
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'explore') {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Handle focus reminders
async function handleFocusReminder() {
  try {
    // Check if user has active focus sessions
    const clients = await self.clients.matchAll();
    if (clients.length === 0) {
      // Show reminder notification
      await self.registration.showNotification('FlowGenix Reminder', {
        body: 'Time for your focus session!',
        icon: '/logo192.png',
        tag: 'focus-reminder'
      });
    }
  } catch (error) {
    console.error('Error handling focus reminder:', error);
  }
}
