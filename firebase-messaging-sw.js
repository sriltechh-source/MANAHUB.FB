importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');
firebase.initializeApp({
  apiKey:"AIzaSyAp-g1syTD9Q8ZRgjdxQDbFF6D9l9zHISY",
  authDomain:"fir-v1-a695a.firebaseapp.com",
  projectId:"fir-v1-a695a",
  storageBucket:"fir-v1-a695a.firebasestorage.app",
  messagingSenderId:"50283321145",
  appId:"1:50283321145:web:94c4c204309c0914ff7ae8",
  measurementId:"G-XGEQ6DL16H"
});
const messaging = firebase.messaging();
messaging.onBackgroundMessage(payload => {
  const title = payload.notification?.title || payload.data?.title || 'SRICART';
  const body  = payload.notification?.body  || payload.data?.body  || 'You have an update!';
  return self.registration.showNotification(title, {
    body, icon:'/icons/icon-192.png',
    tag:'sricart-fcm', renotify:true,
    data:{ url: payload.data?.url || '/' }
  });
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data?.url || '/';
  e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(wins=>{
    for(const w of wins){if(w.url.includes(self.location.origin)&&'focus'in w){w.navigate(url);return w.focus();}}
    if(clients.openWindow) return clients.openWindow(url);
  }));
});
