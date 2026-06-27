import { auth, db } from '../../../config/firebase.js';
import { checkAuth } from '../../../services/auth.js';
import { ROLES, COLLECTIONS } from '../../../utils/constants.js';
import { renderSidebar } from '../../../utils/sidebar.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { doc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

// Guard Route
checkAuth(ROLES.ADMIN);

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, user.uid));
        if (userDoc.exists() && userDoc.data().role === ROLES.ADMIN) {
            renderSidebar(userDoc.data());
            initDashboard();
        }
    }
});

function initDashboard() {
    // Set Current Date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').innerText = new Date().toLocaleDateString('en-US', options);
    
    loadKPIStats();
}

async function loadKPIStats() {
    try {
        // 1. Query users collection
        const usersSnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
        const activeTeachers = [];
        const studentUsers = [];
        let studentCount = 0;
        let teacherCount = 0;
        let pendingCount = 0;
        
        usersSnapshot.forEach(docSnap => {
            const data = docSnap.data();
            const role = data.role;
            const item = { id: docSnap.id, ...data };
            
            if (role === ROLES.STUDENT) {
                studentCount++;
                studentUsers.push(item);
            } else if (role === ROLES.TEACHER) {
                teacherCount++;
                activeTeachers.push(item);
            } else if (role === ROLES.PENDING_TEACHER) {
                pendingCount++;
            }
        });
        
        // 2. Query subjects collection
        const subjectsSnapshot = await getDocs(collection(db, COLLECTIONS.SUBJECTS));
        const subjectCount = subjectsSnapshot.size;
        
        // Update DOM
        document.getElementById('totalStudents').innerText = studentCount;
        document.getElementById('totalTeachers').innerText = teacherCount;
        document.getElementById('totalSubjects').innerText = subjectCount;
        document.getElementById('pendingApprovals').innerText = pendingCount;
        
        // Render Tables
        renderTutorsTable(activeTeachers);
        renderStudentsTable(studentUsers);
        
    } catch (err) {
        console.error("Error loading KPI stats: ", err);
        document.getElementById('totalStudents').innerText = "?";
        document.getElementById('totalTeachers').innerText = "?";
        document.getElementById('totalSubjects').innerText = "?";
        document.getElementById('pendingApprovals').innerText = "?";
        
        const errHTML = `<tr><td colspan="4" style="text-align: center; color: red;">Error loading data.</td></tr>`;
        document.getElementById('tutorsTableBody').innerHTML = errHTML;
        document.getElementById('studentsTableBody').innerHTML = errHTML;
    }
}

function renderTutorsTable(tutors) {
    const tableBody = document.getElementById('tutorsTableBody');
    tableBody.innerHTML = '';

    if (tutors.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 24px; color: var(--text-secondary);">
                    No approved tutors registered on the platform.
                </td>
            </tr>
        `;
        return;
    }

    tutors.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: 600; display: flex; align-items: center; gap: 10px;">
                <img src="${user.picture || 'https://via.placeholder.com/150'}" alt="${user.name}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;" onerror="this.src='https://via.placeholder.com/150'" />
                ${user.name}
            </td>
            <td>${user.email}</td>
            <td>${user.degree || 'N/A'}</td>
            <td>${user.experience ? user.experience + ' Yrs' : 'N/A'}</td>
        `;
        tableBody.appendChild(tr);
    });
}

function renderStudentsTable(students) {
    const tableBody = document.getElementById('studentsTableBody');
    tableBody.innerHTML = '';

    if (students.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="3" style="text-align: center; padding: 24px; color: var(--text-secondary);">
                    No registered students found.
                </td>
            </tr>
        `;
        return;
    }

    students.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: 600;">${user.name}</td>
            <td>${user.email}</td>
            <td>${user.userName || 'N/A'}</td>
        `;
        tableBody.appendChild(tr);
    });
}
