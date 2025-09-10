import csv from "csv-parser";
import { signInAnonymously } from "firebase/auth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import fs from "fs";
import { auth, db } from "../FirebaseConfig.js";


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
