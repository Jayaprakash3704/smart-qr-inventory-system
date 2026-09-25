import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, signOut } from 'firebase/auth';

const firebaseConfig = {
  // Config matching the existing project
  apiKey: "AIzaSyAzw1aVstKHvWWBMb-b1I7fix6lw2bSLEg",
  authDomain: "qr-app-inventory-sys-24.firebaseapp.com",
  projectId: "qr-app-inventory-sys-24",
  storageBucket: "qr-app-inventory-sys-24.firebasestorage.app",
  messagingSenderId: "1468384610",
  appId: "1:1468384610:web:ec10db4087af90b03a183b"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export { signInWithPopup, signInWithEmailAndPassword, signOut };
