import { auth, db } from '../../../config/firebase.js';
import { checkAuth } from '../../../services/auth.js';
import { ROLES, COLLECTIONS, BOOKING_STATUS } from '../../../utils/constants.js';
import { renderSidebar } from '../../../utils/sidebar.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { doc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

checkAuth(ROLES.TEACHER);

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, user.uid));
        if (userDoc.exists() && userDoc.data().role === ROLES.TEACHER) {
            renderSidebar(userDoc.data());
            initDashboard(user.uid, userDoc.data());
        }
    }
});

function initDashboard(userId, userData) {
    // Personalized Welcome Greeting
    document.getElementById('welcomeGreeting').innerText = `Welcome back, ${userData.name}!`;

    // Set Current Date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').innerText = new Date().toLocaleDateString('en-US', options);
    
    loadKPIStats(userId);
}

async function loadKPIStats(teacherId) {
    try {
        // 1. Query teacher's subjects
        const subjectsQuery = query(collection(db, COLLECTIONS.SUBJECTS), where("teacherId", "==", teacherId));
        const subjectsSnapshot = await getDocs(subjectsQuery);
        const subjectCount = subjectsSnapshot.size;

        // 2. Query teacher's bookings
        const bookingsQuery = query(collection(db, COLLECTIONS.BOOKINGS), where("teacherId", "==", teacherId));
        const bookingsSnapshot = await getDocs(bookingsQuery);
        
        const allBookings = [];
        let totalBookings = 0;
        let upcomingClasses = 0;
        let completedClasses = 0;

        bookingsSnapshot.forEach(docSnap => {
            const data = docSnap.data();
            allBookings.push({ id: docSnap.id, ...data });

            const status = data.status;
            totalBookings++;
            if (status === BOOKING_STATUS.CONFIRMED) {
                upcomingClasses++;
            } else if (status === BOOKING_STATUS.COMPLETED) {
                completedClasses++;
            }
        });

        // Update DOM
        document.getElementById('mySubjects').innerText = subjectCount;
        document.getElementById('totalBookings').innerText = totalBookings;
        document.getElementById('upcomingClasses').innerText = upcomingClasses;
        document.getElementById('completedClasses').innerText = completedClasses;

        // Render teaching schedule table
        renderSchedule(allBookings);

    } catch (err) {
        console.error("Error loading Teacher stats: ", err);
        document.getElementById('mySubjects').innerText = "?";
        document.getElementById('totalBookings').innerText = "?";
        document.getElementById('upcomingClasses').innerText = "?";
        document.getElementById('completedClasses').innerText = "?";

        document.getElementById('scheduleTableBody').innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: red;">Error loading class schedule.</td>
            </tr>
        `;
    }
}

function renderSchedule(bookings) {
    const tableBody = document.getElementById('scheduleTableBody');
    tableBody.innerHTML = '';

    // Filter for upcoming/confirmed classes
    const upcoming = bookings.filter(b => b.status === BOOKING_STATUS.CONFIRMED);

    if (upcoming.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 30px; color: var(--text-secondary);">
                    No upcoming classes scheduled. New student bookings will appear here.
                </td>
            </tr>
        `;
        return;
    }

    // Sort upcoming chronologically
    upcoming.sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));

    upcoming.forEach(b => {
        const tr = document.createElement('tr');
        
        // Status Badge
        const badgeColor = '#3b82f6';
        const badgeBg = 'rgba(59, 130, 246, 0.1)';
        
        tr.innerHTML = `
            <td style="font-weight: 600;">${b.studentName}</td>
            <td>${b.studentEmail}</td>
            <td>${b.subjectName}</td>
            <td>${b.date}</td>
            <td>${b.time}</td>
            <td>
                <span style="display: inline-block; padding: 4px 10px; font-size: 12px; font-weight: 600; border-radius: 20px; color: ${badgeColor}; background: ${badgeBg}; border: 1px solid rgba(59, 130, 246, 0.15);">
                    ${b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                </span>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}
