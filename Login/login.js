import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA4fg_x-GFnD5TTsDJhdcgPzkiClfnpLh4",
  authDomain: "project1-1a12a.firebaseapp.com",
  databaseURL: "https://project1-1a12a-default-rtdb.firebaseio.com",
  projectId: "project1-1a12a",
  storageBucket: "project1-1a12a.appspot.com",
  messagingSenderId: "503658861390",
  appId: "1:503658861390:web:0ca201b7574cc71004041f",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);
const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const userId = userCredential.user.uid;

    console.log(userId);

    const adminDocRef = doc(collection(firestore, "admin"), userId);
    const adminDoc = await getDoc(adminDocRef);

    const teacherDocRef = doc(collection(firestore, "teachers"), userId);
    const teacherDoc = await getDoc(teacherDocRef);

    const studentDocRef = doc(collection(firestore, "students"), userId);
    const studentDoc = await getDoc(studentDocRef);

    let userDetails = {};

    if (teacherDoc.exists()) {
      userDetails = {
        userId: userId,
        userType: "teacher",
      };
      localStorage.setItem("userD", JSON.stringify(userDetails));
      localStorage.setItem("uid", userId);

      alert("Login successful as a teacher!");
    } else if (adminDoc.exists()) {
      userDetails = {
        userId: userId,
        userType: "admin",
      };
      localStorage.setItem("userD", JSON.stringify(userDetails));
      localStorage.setItem("uid", userId);

      alert("Login successful as a admin!");
    } else if (studentDoc.exists()) {
      userDetails = {
        userId: userId,
        userType: "student",
      };
      localStorage.setItem("userD", JSON.stringify(userDetails));
      localStorage.setItem("uid", userId);

      alert("Login successful as a student!");
    } else {
      alert("User not found in teacher or student collection. Login failed.");
      return;
    }

    window.location.href = "../Dashboard/dashboard.html";
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
});
