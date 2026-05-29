/* =============================================
   SRICART — Service Worker v3
   Fixed version — safe Firebase import with error handling
   ============================================= */

/* ── Try to import Firebase for FCM (safe — won't crash if it fails) ── */
try {
  importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

  firebase.initializeApp({
    apiKey: "AIzaSyAp-g1syTD9Q8ZRgjdxQDbFF6D9l9zHISY",
    authDomain: "fir-v1-a695a.firebaseapp.com",
    projectId: "fir-v1-a695a",
    storageBucket: "fir-v1-a695a.firebasestorage.app",
    messagingSenderId: "50283321145",
    appId: "1:50283321145:web:94c4c204309c0914ff7ae8"
  });

  const messaging = firebase.messaging();

  /* ── Background FCM push (when browser/tab is closed) ── */
  messaging.onBackgroundMessage(function(payload) {
    const data  = payload.data || {};
    const notif = payload.notification || {};
    const title = notif.title || data.title || 'SRICART';
    const body  = notif.body  || data.body  || 'You have a new update!';
    const role  = data.role   || 'customer';
    const url   = data.url    || '/';

    const vibrate = (role === 'admin' || role === 'delivery')
      ? [300, 100, 300, 100, 300, 100, 600]
      : [200, 100, 200];

    return self.registration.showNotification(title, {
      body,
      icon:               './icons/icon-192.png',
      badge:              './icons/icon-192.png',
      vibrate,
      tag:                'sricart-' + role,
      renotify:           true,
      requireInteraction: role === 'admin' || role === 'delivery',
      data: { url, role }
    });
  });

  console.log('[SW] Firebase Messaging loaded ✅');

} catch(e) {
  console.warn('[SW] Firebase import failed (offline or blocked):', e.message);
}

/* ── Notification click — open correct URL ── */
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data?.url || '/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(wins => {
      for (const win of wins) {
        if (win.url.includes(url) && 'focus' in win) return win.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

/* ── Cache layer ── */
const CACHE    = 'sricart-v3';
const PRECACHE = ['./index.html', './manifest.json'];

self.addEventListener('install', e => {
  console.log('[SW] Installing SRICART v3');
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      cache.addAll(PRECACHE).catch(err =>
        console.log('[SW] Pre-cache skipped:', err.message)
      )
    )
  );
});

self.addEventListener('activate', e => {
  console.log('[SW] Activating SRICART v3');
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
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
          return new Response('Offline', { status: 503 });
        })
      )
  );
});

console.log('[SW] SRICART Service Worker v3 ready ✅');
