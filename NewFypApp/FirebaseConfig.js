// FirebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDHoLe1uuk1EwrnrIIT8mt2WSrnpKh9M6E",
  authDomain: "aquasense-e2362.firebaseapp.com",
  projectId: "aquasense-e2362",
  storageBucket: "aquasense-e2362.appspot.com",
  messagingSenderId: "944762180545",
  appId: "1:944762180545:web:16f47ac3cd0f6872ea9540"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);   // 👈 add this
