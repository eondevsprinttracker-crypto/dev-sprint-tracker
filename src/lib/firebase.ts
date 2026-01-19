import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyCeryTn3kOK0Ueg3uuzsrBsDOzRNRzwuUE",
    authDomain: "eon-dev-sprint.firebaseapp.com",
    projectId: "eon-dev-sprint",
    storageBucket: "eon-dev-sprint.firebasestorage.app",
    messagingSenderId: "901299195044",
    appId: "1:901299195044:web:3fb5a316af0b0016c46a31",
    measurementId: "G-EYNFC5B0CY"
};

// Singleton pattern to avoid re-initialization
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider, signInWithPopup };
