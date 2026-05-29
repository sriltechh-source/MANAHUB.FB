/* =============================================
   SRICART — Service Worker v3
   Handles: Offline caching + Firebase FCM background push
   Upload to same folder as index.html, admin.html, delivery.html
   ============================================= */

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

/* ── Firebase init inside SW ── */
const firebaseConfig = {
  apiKey: "AIzaSyAp-g1syTD9Q8ZRgjdxQDbFF6D9l9zHISY",
  authDomain: "fir-v1-a695a.firebaseapp.com",
  projectId: "fir-v1-a695a",
  storageBucket: "fir-v1-a695a.firebasestorage.app",
  messagingSenderId: "50283321145",
  appId: "1:50283321145:web:94c4c204309c0914ff7ae8"
};

try {
  firebase.initializeApp(firebaseConfig);
} catch(e) {
  // Already initialized
}
const messaging = firebase.messaging();

/* ─────────────────────────────────────────
   BACKGROUND FCM PUSH HANDLER
   Firebase calls this when app is in background/closed.
   The payload comes from your Cloud Function via FCM.
───────────────────────────────────────── */
messaging.onBackgroundMessage(function(payload) {
  console.log('[SW] Background FCM message:', payload);

  const data    = payload.data    || {};
  const notif   = payload.notification || {};
  const title   = notif.title || data.title || 'SRICART';
  const body    = notif.body  || data.body  || 'You have a new update!';
  const icon    = data.icon   || './icons/icon-192.png';
  const badge   = './icons/icon-192.png';
  const url     = data.url    || '/';
  const tag     = data.tag    || 'sricart-push';
  const role    = data.role   || 'customer';   // 'admin' | 'delivery' | 'customer'
  const sound   = data.sound  || 'default';    // 'loud' | 'soft' | 'default'

  /* Vibrate pattern: loud for admin/delivery, gentle for customer */
  const vibrate = (role === 'admin' || role === 'delivery')
    ? [300, 100, 300, 100, 300, 100, 600]   // aggressive 2-sec pattern
    : [200, 100, 200];                       // gentle customer pattern

  const options = {
    body,
    icon,
    badge,
    vibrate,
    tag,
    renotify: true,
    requireInteraction: role === 'admin' || role === 'delivery', // stays on screen for admin/delivery
    silent: false,
    data: { url, role, sound }
  };

  return self.registration.showNotification(title, options);
});

/* ─────────────────────────────────────────
   NOTIFICATION CLICK — open correct URL
───────────────────────────────────────── */
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data?.url || '/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(wins => {
      for (const win of wins) {
        if (win.url.includes(url.replace(/^https?:\/\/[^/]+/, '')) && 'focus' in win) {
          return win.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

/* ─────────────────────────────────────────
   CACHE LAYER (unchanged from v1)
───────────────────────────────────────── */
const CACHE        = 'sricart-v3';
const OFFLINE_PAGE = './index.html';
const PRECACHE     = ['./index.html', './manifest.json'];

self.addEventListener('install', e => {
  console.log('[SW] Installing SRICART v3');
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      cache.addAll(PRECACHE).catch(err =>
        console.log('[SW] Pre-cache error (ok if files missing):', err)
      )
    )
  );
});

self.addEventListener('activate', e => {
  console.log('[SW] Activating SRICART v3');
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE).map(k => {
          console.log('[SW] Deleting old cache:', k);
          return caches.delete(k);
        })
      )
    ).then(() => {
      console.log('[SW] Claiming all clients');
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = e.request.url;
  if (
    !url.startsWith(self.location.origin) &&
    !url.includes('unsplash.com') &&
    !url.includes('fonts.googleapis.com') &&
    !url.includes('fonts.gstatic.com')
  ) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(cache => {
            try { cache.put(e.request, clone); } catch(err) {}
          });
        }
        return res;
      })
      .catch(() =>
        caches.match(e.request).then(cached => {
          if (cached) return cached;
          if (e.request.mode === 'navigate') return caches.match('./index.html');
          return new Response('Offline - Please reconnect', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' }
          });
        })
      )
  );
});

console.log('[SW] SRICART Service Worker v3 loaded ✅');
