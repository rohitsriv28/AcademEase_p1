import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

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
const db = getFirestore(app);
const storage = getStorage(app);

const signupForm = document.getElementById("signupForm");

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;
  const userName = document.getElementById("username").value;
  const role = document.getElementById("role").value;

  let userData = {
    email: email,
    role: role,
  };

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    userData = {
      ...userData,
      name: name,
      userName: userName,
    };

    await updateProfile(auth.currentUser, {
      displayName: name,
    });

    if (role === "admin") {
      const adminDocRef = await doc(
        collection(db, "admin"),
        userCredential.user.uid
      );
      await setDoc(adminDocRef, userData);
    } else if (role === "teacher") {
      const teacherDocRef = doc(
        collection(db, "teachers"),
        userCredential.user.uid
      );

      const pictureFile = document.getElementById("teacherPicture").files[0];

      let pictureUrl = null;

      if (pictureFile) {
        const pictureRef = ref(
          storage,
          `teacherPictures/${email}-${Date.now()}`
        );

        await uploadBytes(pictureRef, pictureFile);

        pictureUrl = await getDownloadURL(pictureRef);
      }

      let subjects = [];
      document.querySelectorAll(".subjectInput").forEach((input, index) => {
        const subject = input.value.trim();
        const description = document
          .querySelectorAll(".descriptionInput")
          [index].value.trim();
        if (subject !== "") {
          subjects.push({
            subject,
            description,
            id: Math.floor(Math.random() * 9000) + 1000,
          });
        }
      });

      userData = {
        ...userData,
        degree: document.getElementById("teacherDegree").value,
        experience: document.getElementById("teacherExperience").value,
        picture: pictureUrl,
        subjects: subjects,
      };

      await setDoc(teacherDocRef, userData);
    } else {
      const roleDocRef = doc(
        collection(db, "students"),
        userCredential.user.uid
      );
      await setDoc(roleDocRef, userData);
    }

    alert("Create successful!");
    // window.location.href = "../Login/login.html";
  } catch (error) {
    console.error("Signup error:", error.message);
  }
});
