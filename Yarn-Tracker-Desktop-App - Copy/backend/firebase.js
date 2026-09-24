// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAzw1aVstKHvWWBMb-b1I7fix6lw2bSLEg",
    authDomain: "qr-app-inventory-sys-24.firebaseapp.com",
    projectId: "qr-app-inventory-sys-24",
    storageBucket: "qr-app-inventory-sys-24.firebasestorage.app",
    messagingSenderId: "1468384610",
    appId: "1:1468384610:web:ec10db4087af90b03a183b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);