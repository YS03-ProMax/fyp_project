const { initializeApp } = require("firebase/app");
const { getFirestore } = require("firebase/firestore");
const { getAuth } = require("firebase/auth"); // 👈 use plain getAuth in Node

const firebaseConfig = {
  apiKey: "AIzaSyDHoLe1uuk1EwrnrIIT8mt2WSrnpKh9M6E",
  authDomain: "aquasense-e2362.firebaseapp.com",
  projectId: "aquasense-e2362",
  storageBucket: "aquasense-e2362.appspot.com",
  messagingSenderId: "944762180545",
  appId: "1:944762180545:web:16f47ac3cd0f6872ea9540"
};

const app = initializeApp(firebaseConfig);

// Node.js → just getAuth
const auth = getAuth(app);

const db = getFirestore(app);

module.exports = { db, auth };
