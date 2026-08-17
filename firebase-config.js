// firebase-config.js

// 🔥 CONFIGURACIÓN DE FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyBwH88DBuT-KrtFtkw_wImxzpL8-ZH9dj0",
    authDomain: "tabla-quirurgica.firebaseapp.com",
    databaseURL: "https://tabla-quirurgica-default-rtdb.firebaseio.com",
    projectId: "tabla-quirurgica",
    storageBucket: "tabla-quirurgica.firebasestorage.app",
    messagingSenderId: "202787334487",
    appId: "1:202787334487:web:a6e2b6b2acdec2b1ae7612",
    measurementId: "G-Q6F2HWFG07"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Obtener referencias a los servicios
const database = firebase.database();
const auth = firebase.auth();

// ✅ Hacer firebase accesible globalmente (NUEVA LÍNEA)
window.firebase = firebase;