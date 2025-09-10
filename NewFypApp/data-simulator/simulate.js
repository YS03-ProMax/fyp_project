const csv = require("csv-parser");
const { initializeApp } = require("firebase/app");
const { getAuth, signInAnonymously } = require("firebase/auth");
const { addDoc, collection, getFirestore, serverTimestamp } = require("firebase/firestore");
const fs = require("fs");

const firebaseConfig = {
  apiKey: "AIzaSyDHoLe1uuk1EwrnrIIT8mt2WSrnpKh9M6E",
  authDomain: "aquasense-e2362.firebaseapp.com",
  projectId: "aquasense-e2362",
  storageBucket: "aquasense-e2362.firebasestorage.app",
  messagingSenderId: "944762180545",
  appId: "1:944762180545:web:16f47ac3cd0f6872ea9540"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- Sign in first ---
signInAnonymously(auth)
  .then(() => {
    console.log("✅ Signed in anonymously, starting simulation...");
    startSimulation();
  })
  .catch((error) => {
    console.error("❌ Auth error:", error);
  });

function startSimulation() {
  let rows = [];
  fs.createReadStream("klangRiver.csv")
    .pipe(csv())
    .on("data", (data) => rows.push(data))
    .on("end", () => {
      console.log(`Loaded ${rows.length} rows from CSV`);
      simulateUpload(rows);
    });
}

let index = 0;
function simulateUpload(rows) {
  setInterval(async () => {
    if (index < rows.length) {
      const parsedRow = {
        ...rows[index],
        DO_SAT: parseFloat(rows[index].DO_SAT),
        DO: parseFloat(rows[index].DO),
        BOD: parseFloat(rows[index].BOD),
        COD: parseFloat(rows[index].COD),
        SS: parseFloat(rows[index].SS),
        pH: parseFloat(rows[index].pH),
        NH3N: parseFloat(rows[index].NH3N),
        WQI: parseFloat(rows[index].WQI),
        TEMP: parseFloat(rows[index].TEMP),
        timestamp: serverTimestamp(),
      };

      try {
        await addDoc(collection(db, "sensorData"), parsedRow);
        console.log(`Uploaded row ${index + 1}:`, parsedRow);
        index++;
      } catch (error) {
        console.error("Error uploading:", error);
      }
    } else {
      console.log("Simulation complete!");
      process.exit();
    }
  }, 5000);
}
