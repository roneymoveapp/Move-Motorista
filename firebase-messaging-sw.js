// Import the Firebase scripts
importScripts("https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js");

// AVISO IMPORTANTE: A sintaxe foi atualizada para usar "optional chaining" (?.)
// Isso garante que o código funcione tanto no ambiente de preview (onde import.meta.env não existe)
// quanto no deploy do Netlify (onde Vite substitui a variável).

const firebaseConfig = {
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || "AIzaSyCTwvoS5pM-f-9qZ8gQgg727OXHpjdoLmg",
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || "app-move-motorista.firebaseapp.com",
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID || "app-move-motorista",
  storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || "app-move-motorista.appspot.com",
  messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "746812406976",
  appId: import.meta.env?.VITE_FIREBASE_APP_ID || "1:746812406976:web:110a4c6406f67140b34125",
  measurementId: import.meta.env?.VITE_FIREBASE_MEASUREMENT_ID || "G-QWHJM4S6NX"
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