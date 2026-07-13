import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAhqUEnwVqtrayFrAhdcdCJElGFE83aELE",
  authDomain: "zen-ledger-4e184.firebaseapp.com",
  projectId: "zen-ledger-4e184",
  storageBucket: "zen-ledger-4e184.firebasestorage.app",
  messagingSenderId: "1006008278939",
  appId: "1:1006008278939:web:77f1a2a06ef62c3924cb3e",
  measurementId: "G-E0TSPVS0WN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
