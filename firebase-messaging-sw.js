importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCtuK5pb4JKkzwKQlskh4i49l1Os4YUOpI",
  authDomain: "cloud-chat-app-34362.firebaseapp.com",
  databaseURL: "https://cloud-chat-app-34362-default-rtdb.firebaseio.com/",
  projectId: "cloud-chat-app-34362",
  storageBucket: "cloud-chat-app-34362.appspot.com",
  messagingSenderId: "914636111049",
  appId: "1:914636111049:web:9239bcce6380684be8a118"
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
