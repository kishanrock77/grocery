importScripts(
  'https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js'
);

importScripts(
  'https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js'
);

firebase.initializeApp({
 



  apiKey: "AIzaSyA-sJaumY8B_E5ZxYKBmV3P-S-s_YuOceY",

  authDomain: "fastbitenewtry.firebaseapp.com",

  projectId: "fastbitenewtry",

  storageBucket: "fastbitenewtry.firebasestorage.app",

  messagingSenderId: "921460225363",

  appId: "1:921460225363:web:abdbbde198509bd09b1da6"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {

  self.registration.showNotification(
    payload.notification.title,
    {
      body: payload.notification.body
    }
  );

});

self.registration.showNotification(title, {
  body: body,
  icon: "/logo.png",
  vibrate: [200, 100, 200],
  requireInteraction: true,
  silent: false,
  tag: "order-alert"
});