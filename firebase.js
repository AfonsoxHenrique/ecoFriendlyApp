import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCotMsjQ7OCH_e3pl-BBKrXtDpFa8fPfa8",
  authDomain: "web-app-56203.firebaseapp.com",
  projectId: "web-app-56203",
  storageBucket: "web-app-56203.firebasestorage.app",
  messagingSenderId: "253976500131",
  appId: "1:253976500131:web:4e8412911db2535eb86c16",
  measurementId: "G-XNF0JEL7DX"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);