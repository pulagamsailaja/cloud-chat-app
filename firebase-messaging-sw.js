importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-messaging-compat.js');

firebase.initializeApp({
  /* At $ sign, use your own details of the cloud*/
  apiKey: "$",
  authDomain: "$",
  databaseURL: "$",
  projectId: "$",
  storageBucket: "$",
  messagingSenderId: "$",
  appId: "$"
});
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const { title, body, icon } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: icon || '/icon.png'
  });
});
