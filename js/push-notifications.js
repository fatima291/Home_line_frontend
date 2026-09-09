const firebaseConfig = {
  apiKey: "AIzaSyCdirgJN6zJWHrU4FlFdAmPTfmBbPyzvkg",
  authDomain: "home-line-9fefb.firebaseapp.com",
  projectId: "home-line-9fefb",
  storageBucket: "home-line-9fefb.firebasestorage.app",
  messagingSenderId: "369065057975",
  appId: "1:369065057975:web:8f972c468b7c7542f73732"
};

const VAPID_KEY = "BK_fmsp7igKNWv_rvNWinshxQDppZxgC18gMaIR761hH-dS2UlK7XFixAMZoOnEsH6X6HKe4QCqPS5I3fUUr80U";
const PUSH_API_BASE_URL = 'http://127.0.0.1:8000/api';

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

document.addEventListener('DOMContentLoaded', function () {
    const authToken = localStorage.getItem('auth_token');
    if (!authToken) return;

    initPushNotifications(authToken);
});

function initPushNotifications(authToken) {
    Notification.requestPermission().then(function (permission) {
        if (permission !== 'granted') {
            console.log('لم يتم منح إذن الإشعارات');
            return;
        }

        const swPath = window.location.pathname.includes('/html/') || window.location.pathname.includes('/admin/')
            ? '../firebase-messaging-sw.js'
            : 'firebase-messaging-sw.js';

        navigator.serviceWorker.register(swPath).then(function (registration) {
            messaging.getToken({ vapidKey: VAPID_KEY, serviceWorkerRegistration: registration })
                .then(function (deviceToken) {
                    if (!deviceToken) return;

                    fetch(`${PUSH_API_BASE_URL}/device-token`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'Authorization': `Bearer ${authToken}`,
                        },
                        body: JSON.stringify({ token: deviceToken }),
                    });
                })
                .catch(function (err) {
                    console.log('فشل الحصول على رمز الجهاز:', err);
                });
        });
    });

    messaging.onMessage(function (payload) {
        alert(payload.notification.title + '\n' + payload.notification.body);
    });
}