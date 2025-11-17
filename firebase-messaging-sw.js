// Import Firebase compatibility scripts
importScripts("https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js");

// Firebase configuration provided by the user
const firebaseConfig = {
  apiKey: "AIzaSyCTwvoS5pM-f-9qZ8gQgg727OXHpjdoLmg",
  authDomain: "app-move-motorista.firebaseapp.com",
  projectId: "app-move-motorista",
  storageBucket: "app-move-motorista.appspot.com",
  messagingSenderId: "746812406976",
  appId: "1:746812406976:web:110a4c6406f67140b34125",
  measurementId: "G-QWHJM4S6NX"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Retrieve an instance of Firebase Messaging to handle background messages
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Mensagem recebida em segundo plano: ', payload);

  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/vite.svg' // You can change this to your app icon
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notificação clicada.');
  event.notification.close();

  // This focuses on an existing tab if it's open or opens a new one
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there is a window open with the target URL
      for (const client of clientList) {
        if (client.url === self.origin + '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window is found, open a new one
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
