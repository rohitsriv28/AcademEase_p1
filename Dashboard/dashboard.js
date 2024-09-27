import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA4fg_x-GFnD5TTsDJhdcgPzkiClfnpLh4",
  authDomain: "project1-1a12a.firebaseapp.com",
  databaseURL: "https://project1-1a12a-default-rtdb.firebaseio.com",
  projectId: "project1-1a12a",
  storageBucket: "project1-1a12a.appspot.com",
  messagingSenderId: "503658861390",
  appId: "1:503658861390:web:0ca201b7574cc71004041f",
};

const roleType = JSON.parse(localStorage.getItem("userD")).userType || "login";
const allRoleElements = document.getElementsByClassName("roleType");

console.log(roleType);

for (let i = 0; i < allRoleElements.length; i++) {
  allRoleElements[i].style.display = "none";
}

const roleSpecificElements = document.getElementsByClassName(roleType);
for (let i = 0; i < roleSpecificElements.length; i++) {
  roleSpecificElements[i].style.display = "block";
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

function displayUserInfo(user) {
  if (user) {
    console.log("user", user);
    const displayName = user.displayName;
    const email = user.email;
    // const displayphoto = user.

    document.querySelector("#user-name").textContent = displayName;
    document.querySelector("#user-email").textContent = email;
    document.querySelector("");
    console.log(displayName, email);
    console.log("on have");
  } else {
    document.querySelector("#user-name").textContent = "";
    document.querySelector("#user-email").textContent = "";
    console.log(" ok no on have");
  }
}

function fnLogout() {
  localStorage.clear();
  window.location.href = "login.html";

  alert("logout");
}

onAuthStateChanged(auth, (user) => {
  displayUserInfo(user);
});
