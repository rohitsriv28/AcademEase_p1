import { auth, db } from '../../../config/firebase.js';
import { checkAuth } from '../../../services/auth.js';
import { ROLES, COLLECTIONS } from '../../../utils/constants.js';
import { renderSidebar } from '../../../utils/sidebar.js';
import { showToast, showLoader } from '../../../utils/helpers.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { collection, query, where, getDocs, doc, getDoc, writeBatch } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

// Guard Route
checkAuth(ROLES.ADMIN);

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, user.uid));
        if (userDoc.exists() && userDoc.data().role === ROLES.ADMIN) {
            renderSidebar(userDoc.data());
            loadPendingTeachers();
        }
    }
});

async function loadPendingTeachers() {
    const tableBody = document.getElementById('approvalsTableBody');
    tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Loading...</td></tr>';
    
    try {
        const q = query(collection(db, COLLECTIONS.USERS), where("role", "==", ROLES.PENDING_TEACHER));
        const querySnapshot = await getDocs(q);
        
        tableBody.innerHTML = '';
        if (querySnapshot.empty) {
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No pending approvals.</td></tr>';
            return;
        }

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const tr = document.createElement('tr');
            
            tr.innerHTML = `
                <td>${data.name}</td>
                <td>${data.email}</td>
                <td>${data.degree || 'N/A'} - ${data.experience || 'N/A'}</td>
                <td>
                    <button class="btn btn-primary approve-btn" data-id="${docSnap.id}">Approve</button>
                    <button class="btn btn-danger reject-btn" data-id="${docSnap.id}" style="margin-left:5px;">Reject</button>
                </td>
            `;
            tableBody.appendChild(tr);
        });

        // Attach listeners dynamically
        document.querySelectorAll('.approve-btn').forEach(btn => {
            btn.addEventListener('click', (e) => handleApproval(e.target.getAttribute('data-id'), true));
        });
        document.querySelectorAll('.reject-btn').forEach(btn => {
            btn.addEventListener('click', (e) => handleApproval(e.target.getAttribute('data-id'), false));
        });

    } catch (err) {
        console.error(err);
        showToast("Error loading approvals", true);
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:red;">Error loading data.</td></tr>';
    }
}

async function handleApproval(teacherId, isApprove) {
    showLoader(true);
    try {
        const batch = writeBatch(db);
        
        if (isApprove) {
            // Update user role to active teacher
            const userRef = doc(db, COLLECTIONS.USERS, teacherId);
            batch.update(userRef, { role: ROLES.TEACHER });
            
            // Set all their subjects to approved so students can see them
            const q = query(collection(db, COLLECTIONS.SUBJECTS), where("teacherId", "==", teacherId));
            const subjectDocs = await getDocs(q);
            subjectDocs.forEach(subDoc => {
                batch.update(doc(db, COLLECTIONS.SUBJECTS, subDoc.id), { isApproved: true });
            });
            
            await batch.commit();
            showToast("Teacher & Subjects approved successfully!");
        } else {
            // If rejected, delete user profile completely and their dormant subjects
            const userRef = doc(db, COLLECTIONS.USERS, teacherId);
            batch.delete(userRef);
            
            const q = query(collection(db, COLLECTIONS.SUBJECTS), where("teacherId", "==", teacherId));
            const subjectDocs = await getDocs(q);
            subjectDocs.forEach(subDoc => {
                batch.delete(doc(db, COLLECTIONS.SUBJECTS, subDoc.id));
            });
            
            await batch.commit();
            showToast("Teacher application rejected and removed.");
        }
        
        loadPendingTeachers(); // Refresh UI list
        
    } catch (error) {
        showToast("Action failed: " + error.message, true);
    } finally {
        showLoader(false);
    }
}
