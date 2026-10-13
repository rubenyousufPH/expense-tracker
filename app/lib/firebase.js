import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAc8um7mKYczWN9jfc6ryHW4AUPq_yQndA",
  authDomain: "expense-tracker-5b934.firebaseapp.com",
  projectId: "expense-tracker-5b934",
  storageBucket: "expense-tracker-5b934.firebasestorage.app",
  messagingSenderId: "737510527115",
  appId: "1:737510527115:web:9aeac7910580c33a50448e",
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);


