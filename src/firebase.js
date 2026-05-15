import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDKE-sdCEw60UlPQqLvMjrHGl6KSG6nUCg",
  authDomain: "brutafrequencia.firebaseapp.com",
  databaseURL: "https://brutafrequencia-default-rtdb.firebaseio.com",
  projectId: "brutafrequencia",
  storageBucket: "brutafrequencia.firebasestorage.app",
  messagingSenderId: "324840070453",
  appId: "1:324840070453:web:861cd59d025ad35f9e007c",
  measurementId: "G-35WXP8FRCP",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
