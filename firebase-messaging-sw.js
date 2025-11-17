importScripts("https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js");

// This configuration must be available to the service worker.
// Since service workers run in a different context, they can't access `window` or
// variables from the main app script. We use environment variables injected at build time,
// with fallbacks for development environments.
const apiKey = import.meta.env?.VITE_FIREBASE_API_KEY || "YOUR_API_KEY_HERE";

if (apiKey && apiKey !== "YOUR_API_KEY_HERE") {
  const firebaseConfig = {
    apiKey: apiKey,
    authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN_HERE",
    projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID_HERE",
    storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET_HERE",
    messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_SENDER_ID_HERE",
    appId: import.meta.env?.VITE_FIREBASE_APP_ID || "YOUR_APP_ID_HERE",
  };

  // Initialize Firebase
  if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
  }

  // Retrieve an instance of Firebase Messaging so that it can handle background messages.
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Mensagem recebida em segundo plano: ', payload);

    // Customize notification here
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
      body: payload.notification.body,
      icon: '/vite.svg' // Você pode alterar para o ícone do seu app
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} else {
  console.log('[firebase-messaging-sw.js] Configuração do Firebase não encontrada, o service worker de notificações não será inicializado.');
}