/* =============================================
   SRICART — Service Worker v1
   Upload this file to same folder as index.html
   on GitHub Pages / Netlify / Firebase Hosting
   ============================================= */

const CACHE = 'sricart-v1';
const OFFLINE_PAGE = './index.html';

// Files to cache on install
const PRECACHE = [
  './index.html',
  './manifest.json'
];

// ── Install ──
self.addEventListener('install', e => {
  console.log('[SW] Installing SRICART v1');
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      cache.addAll(PRECACHE).catch(err => {
        console.log('[SW] Pre-cache error (ok if files missing):', err);
      })
    )
  );
});

// ── Activate — clean old caches ──
self.addEventListener('activate', e => {
  console.log('[SW] Activating SRICART v1');
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE)
          .map(key => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      )
    ).then(() => {
      console.log('[SW] Claiming all clients');
      return self.clients.claim();
    })
  );
});

// ── Fetch — Network first, cache fallback ──
self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;
  if(!e.request.url.startsWith(self.location.origin) &&
     !e.request.url.includes('unsplash.com') &&
     !e.request.url.includes('fonts.googleapis.com') &&
     !e.request.url.includes('fonts.gstatic.com')) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        if(res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(cache => {
            try { cache.put(e.request, clone); } catch(err) {}
          });
        }
        return res;
      })
      .catch(() =>
        caches.match(e.request).then(cached => {
          if(cached) return cached;
          if(e.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          return new Response('Offline - Please reconnect', {
            status: 503,
            headers: {'Content-Type': 'text/plain'}
          });
        })
      )
  );
});

// ── Push Notifications ──
self.addEventListener('push', e => {
  let data = { title: 'SRICART', body: 'You have a new update!' };
  try { data = e.data ? e.data.json() : data; } catch(err) {}

  e.waitUntil(
    self.registration.showNotification(data.title || 'SRICART', {
      body: data.body || 'Check out what\'s new on SRICART!',
      icon: './icons/icon-192.png',
      badge: './icons/icon-192.png',
      vibrate: [200, 100, 200, 100, 200],
      tag: 'sricart-push',
      renotify: true,
      requireInteraction: false,
      data: { url: self.location.origin + '/' }
    })
  );
});

// ── Notification Click ──
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data?.url || '/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(wins => {
      for(const win of wins) {
        if(win.url === url && 'focus' in win) return win.focus();
      }
      if(clients.openWindow) return clients.openWindow(url);
    })
  );
});

console.log('[SW] SRICART Service Worker loaded ✅');
