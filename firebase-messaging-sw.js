importScripts("https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCTwvoS5pM-f-9qZ8gQgg727OXHpjdoLmg",
  authDomain: "app-move-motorista.firebaseapp.com",
  projectId: "app-move-motorista",
  storageBucket: "app-move-motorista.appspot.com",
  messagingSenderId: "746812406976",
  appId: "1:746812406976:web:110a4c6406f67140b34125",
  measurementId: "G-QWHJM4S6NX"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || "Nova mensagem";
  const notificationOptions = {
    body: payload.notification?.body,
    icon: "/vite.svg"
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) return client.focus();
      }

      return clients.openWindow("/");
    })
  );
});
