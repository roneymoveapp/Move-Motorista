// Import the Firebase scripts
importScripts("https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js");

// AVISO IMPORTANTE: A sintaxe foi atualizada para usar variáveis de ambiente
// no padrão do Create React App (REACT_APP_*). O processo de build
// (ex: no Netlify) deve substituir essas variáveis pelos valores reais.
// Se `process` não for definido em tempo de execução, os valores de fallback serão usados.

// NOTE: The `process.env` variables below are intended to be replaced by a build tool
// (like Create React App/Netlify's build process) with static string values.
// The `typeof process` check is a runtime safeguard in case the build substitution fails,
// preventing a "process is not defined" error in the browser.

const firebaseConfig = {
  apiKey: (typeof process !== 'undefined' ? process.env.REACT_APP_FIREBASE_API_KEY : undefined) || "AIzaSyCTwvoS5pM-f-9qZ8gQgg727OXHpjdoLmg",
  authDomain: (typeof process !== 'undefined' ? process.env.REACT_APP_FIREBASE_AUTH_DOMAIN : undefined) || "app-move-motorista.firebaseapp.com",
  projectId: (typeof process !== 'undefined' ? process.env.REACT_APP_FIREBASE_PROJECT_ID : undefined) || "app-move-motorista",
  storageBucket: (typeof process !== 'undefined' ? process.env.REACT_APP_FIREBASE_STORAGE_BUCKET : undefined) || "app-move-motorista.appspot.com",
  messagingSenderId: (typeof process !== 'undefined' ? process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID : undefined) || "746812406976",
  appId: (typeof process !== 'undefined' ? process.env.REACT_APP_FIREBASE_APP_ID : undefined) || "1:746812406976:web:110a4c6406f67140b34125",
  measurementId: (typeof process !== 'undefined' ? process.env.REACT_APP_FIREBASE_MEASUREMENT_ID : undefined) || "G-QWHJM4S6NX"
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