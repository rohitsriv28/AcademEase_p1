import { auth, db } from '../config/firebase.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { COLLECTIONS, ROLES } from '../utils/constants.js';
import { showLoader } from '../utils/helpers.js';

export function checkAuth(requiredRole = null, redirectUrl = "/src/pages/auth/login/index.html") {
    showLoader(true);
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            if (requiredRole !== null) { // if null, it's a public unguarded route maybe? But checkAuth implies guarding.
                window.location.href = redirectUrl;
            } else {
                showLoader(false);
            }
            return;
        }

        // Fetch user document
        const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, user.uid));
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            
            if (requiredRole && userData.role !== requiredRole) {
                // Unauthorized access, bounce to relevant dashboard
                redirectToDashboard(userData.role);
            } else {
                // Authorized
                showLoader(false);
            }
        } else {
            // User DB record missing
            await signOut(auth);
            window.location.href = redirectUrl;
        }
    });
}

export function logOut(redirectUrl = "/src/pages/auth/login/index.html") {
    signOut(auth).then(() => {
        localStorage.clear(); // Clear cache
        window.location.href = redirectUrl;
    }).catch((error) => {
        console.error("Logout error", error);
    });
}

export function redirectToDashboard(role) {
    if (role === ROLES.ADMIN) {
        window.location.href = "/src/pages/admin/dashboard/index.html";
    } else if (role === ROLES.TEACHER) {
        window.location.href = "/src/pages/tutor/dashboard/index.html";
    } else if (role === ROLES.PENDING_TEACHER) {
        window.location.href = "/src/pages/tutor/pending/index.html";
    } else {
        window.location.href = "/src/pages/student/dashboard/index.html";
    }
}

