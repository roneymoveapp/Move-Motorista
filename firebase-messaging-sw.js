// Import the Firebase scripts
importScripts("https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js");

// AVISO IMPORTANTE: As configurações do Firebase agora são injetadas
// pelo processo de build do Vite, lendo as variáveis de ambiente (VITE_*).
// A sintaxe direta `import.meta.env.VITE_*` é necessária para que a substituição estática funcione.
// O fallback `|| 'valor'` garante que o Service Worker não quebre em ambientes onde
// as variáveis não são injetadas, embora a notificação push só funcione corretamente em produção.

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCTwvoS5pM-f-9qZ8gQgg727OXHpjdoLmg",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "app-move-motorista.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "app-move-motorista",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "app-move-motorista.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "746812406976",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:746812406976:web:110a4c6406f67140b34125",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-QWHJM4S6NX"
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