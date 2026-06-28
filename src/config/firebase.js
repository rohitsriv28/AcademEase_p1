import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCca7OiR4RXSy9Lf15vR7ISdGpnpM_emUc",
  authDomain: "project1-sem4.firebaseapp.com",
  projectId: "project1-sem4",
  storageBucket: "project1-sem4.firebasestorage.app",
  messagingSenderId: "770567109759",
  appId: "1:770567109759:web:f7f3600b7cb2c86a38d34a",
  measurementId: "G-6YFLJR6PPG",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export { firebaseConfig };
