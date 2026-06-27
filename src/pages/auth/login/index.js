import { auth, db } from '../../../config/firebase.js';
import { signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import { COLLECTIONS } from '../../../utils/constants.js';
import { redirectToDashboard } from '../../../services/auth.js';
import { showToast, showLoader } from '../../../utils/helpers.js';

// Auto-navigate if already logged in
onAuthStateChanged(auth, async (user) => {
    if (user) {
        showLoader(true);
        const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, user.uid));
        if (userDoc.exists()) {
            redirectToDashboard(userDoc.data().role);
        } else {
            showLoader(false);
        }
    }
});

const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    showLoader(true);
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userId = userCredential.user.uid;

        const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));

        if (userDoc.exists()) {
            const userData = userDoc.data();
            showToast("Login successful!");
            redirectToDashboard(userData.role);
        } else {
            showToast("User record not found in system.", true);
            showLoader(false);
        }
    } catch (error) {
        showLoader(false);
        showToast(`Login failed: ${error.message}`, true);
    }
});
