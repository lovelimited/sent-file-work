import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBMWEm_a0bwPMaBZfMXQhSyF9leFmRDgtQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "send-file-51069.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://send-file-51069-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "send-file-51069",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "send-file-51069.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "256461965778",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:256461965778:web:5b67c143971d9faf45600b"
};

// Initialize Firebase safely
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider };
