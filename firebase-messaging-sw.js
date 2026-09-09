importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCdirgJN6zJWHrU4FlFdAmPTfmBbPyzvkg",
  authDomain: "home-line-9fefb.firebaseapp.com",
  projectId: "home-line-9fefb",
  storageBucket: "home-line-9fefb.firebasestorage.app",
  messagingSenderId: "369065057975",
  appId: "1:369065057975:web:8f972c468b7c7542f73732"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: 'imegs/log.png'
  });
});