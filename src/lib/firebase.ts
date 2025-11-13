import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCN-3foF88tiQ-IXs7jOekpQfqSfN9cyw4",
  authDomain: "medify-850f3.firebaseapp.com",
  projectId: "medify-850f3",
  storageBucket: "medify-850f3.firebasestorage.app",
  messagingSenderId: "580228292877",
  appId: "1:580228292877:web:e29f241aa5450fd3015044",
  measurementId: "G-QDT2SX0S35"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);