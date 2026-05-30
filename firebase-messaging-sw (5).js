/* =============================================
   firebase-messaging-sw.js  — SRICART
   REQUIRED by Firebase FCM for background push.
   Upload to ROOT of your website — same folder as index.html
   ============================================= */

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            "AIzaSyAp-g1syTD9Q8ZRgjdxQDbFF6D9l9zHISY",
  authDomain:        "fir-v1-a695a.firebaseapp.com",
  projectId:         "fir-v1-a695a",
  storageBucket:     "fir-v1-a695a.firebasestorage.app",
  messagingSenderId: "50283321145",
  appId:             "1:50283321145:web:94c4c204309c0914ff7ae8"
});

const messaging = firebase.messaging();

/* Background push — fires when tab is closed or in background */
messaging.onBackgroundMessage(function(payload) {
  const data  = payload.data        || {};
  const notif = payload.notification || {};
  const title   = notif.title || data.title || 'SRICART';
  const body    = notif.body  || data.body  || 'You have a new update!';
  const role    = data.role   || 'customer';
  const url     = data.url    || '/';

  const vibrate = (role === 'admin' || role === 'delivery')
    ? [300,100,300,100,300,100,600,200,800]
    : [200,100,200];

  return self.registration.showNotification(title, {
    body,
    icon:               '/icons/icon-192.png',
    badge:              '/icons/icon-192.png',
    vibrate,
    tag:                'sricart-' + role,
    renotify:           true,
    requireInteraction: role === 'admin' || role === 'delivery',
    data:               { url, role }
  });
});

/* Tap notification — open correct page */
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data?.url || '/';
  e.waitUntil(
    clients.matchAll({ type:'window', includeUncontrolled:true }).then(wins => {
      for (const win of wins) {
        if (win.url.includes(url) && 'focus' in win) return win.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

console.log('[FCM-SW] firebase-messaging-sw.js loaded ✅');
