import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// EJEMPLO de configuración de Firebase
// Copia este archivo a "config.js" y reemplaza con tus propias credenciales

// IMPORTANTE: Ve a https://console.firebase.google.com/
// 1. Crea un nuevo proyecto
// 2. Ve a Configuración del proyecto > Tus apps
// 3. Agrega una app web y copia la configuración aquí
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_AUTH_DOMAIN",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_STORAGE_BUCKET",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar servicios
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
