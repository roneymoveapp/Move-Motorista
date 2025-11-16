// Import the Firebase scripts
importScripts("https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js");

// Fallback configuration in case the query parameter is not passed.
const fallbackConfig = {
  apiKey: "AIzaSyCTwvoS5pM-f-9qZ8gQgg727OXHpjdoLmg",
  authDomain: "app-move-motorista.firebaseapp.com",
  projectId: "app-move-motorista",
  storageBucket: "app-move-motorista.appspot.com",
  messagingSenderId: "746812406976",
  appId: "1:746812406976:web:110a4c6406f67140b34125",
  measurementId: "G-QWHJM4S6NX"
};

// The configuration is passed from the main app via a URL query parameter.
// This is the recommended way for Vite projects to provide env variables to a service worker.
const params = new URL(location).searchParams;
const encodedConfig = params.get('firebaseConfig');

let firebaseConfig;

if (encodedConfig) {
    try {
        firebaseConfig = JSON.parse(decodeURIComponent(encodedConfig));
    } catch (e) {
        console.error("Failed to parse firebase config from URL, using fallback.", e);
        firebaseConfig = fallbackConfig;
    }
} else {
    console.warn("Firebase config not found in URL, using fallback.");
    firebaseConfig = fallbackConfig;
}


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