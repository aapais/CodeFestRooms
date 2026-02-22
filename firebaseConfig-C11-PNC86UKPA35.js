// Firebase Configuration
// Este ficheiro é partilhado por todas as equipas
// Todas escrevem no mesmo Firestore centralizado

const firebaseConfig = {
  apiKey: "AIzaSyD_PLACEHOLDER", // Substitui com a tua API Key
  authDomain: "codefestrooms-487913.firebaseapp.com",
  projectId: "codefestrooms-487913",
  storageBucket: "codefestrooms-487913.appspot.com",
  messagingSenderId: "PLACEHOLDER",
  appId: "PLACEHOLDER"
};

// Initialize Firebase (apenas se ainda não foi inicializado)
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Export Firestore instance
const db = firebase.firestore();

// Export para uso global
window.db = db;
window.firebase = firebase;
