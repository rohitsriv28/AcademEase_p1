import { auth, db } from '../../../config/firebase.js';
import { checkAuth } from '../../../services/auth.js';
import { ROLES, COLLECTIONS, BOOKING_STATUS } from '../../../utils/constants.js';
import { renderSidebar } from '../../../utils/sidebar.js';
import { showToast, showLoader, formatDate } from '../../../utils/helpers.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    doc, 
    getDoc, 
    updateDoc 
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

checkAuth(ROLES.TEACHER);

let currentUser = null;
let allBookingsList = [];
let currentActiveTab = "Upcoming"; // Defaults to Upcoming

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, user.uid));
        if (userDoc.exists() && userDoc.data().role === ROLES.TEACHER) {
            currentUser = { id: user.uid, ...userDoc.data() };
            renderSidebar(userDoc.data());
            loadBookings();
        }
    }
});

// Load tutor bookings
async function loadBookings() {
    const tableBody = document.getElementById('classesTableBody');
    tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Loading classes...</td></tr>';
    
    try {
        const q = query(collection(db, COLLECTIONS.BOOKINGS), where("teacherId", "==", currentUser.id));
        const querySnapshot = await getDocs(q);
        
        allBookingsList = [];
        querySnapshot.forEach(docSnap => {
            allBookingsList.push({ id: docSnap.id, ...docSnap.data() });
        });
        
        // Sort by date/time ascending
        allBookingsList.sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));
        
        renderFilteredBookings();

    } catch (err) {
        console.error(err);
        showToast("Error loading classes: " + err.message, true);
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red;">Failed to load.</td></tr>';
    }
}

// Render bookings based on active filter tab
async function renderFilteredBookings() {
    const tableBody = document.getElementById('classesTableBody');
    tableBody.innerHTML = '';

    const now = new Date();
    
    // Filter bookings based on active tab
    const filtered = allBookingsList.filter(b => {
        const bookingDateTime = new Date(b.date + 'T' + b.time);
        
        if (currentActiveTab === "Upcoming") {
            return b.status === BOOKING_STATUS.CONFIRMED && bookingDateTime > now;
        } else if (currentActiveTab === "Scheduled") {
            return b.status === BOOKING_STATUS.CONFIRMED;
        } else if (currentActiveTab === "Completed") {
            return b.status === BOOKING_STATUS.COMPLETED || bookingDateTime <= now;
        }
        return false;
    });

    if (filtered.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No ${currentActiveTab.toLowerCase()} classes found.</td></tr>`;
        return;
    }

    for (const b of filtered) {
        // Fetch student name
        const studentDoc = await getDoc(doc(db, COLLECTIONS.USERS, b.studentId));
        const studentName = studentDoc.exists() ? studentDoc.data().name : "Unknown Student";
        
        // Fetch subject details
        const subDoc = await getDoc(doc(db, COLLECTIONS.SUBJECTS, b.subjectId));
        const subName = subDoc.exists() ? subDoc.data().subject : "Deleted Subject";

        const bookingDateTime = new Date(b.date + 'T' + b.time);
        const isFuture = bookingDateTime > now;

        let actionHtml = '';
        if (b.status === BOOKING_STATUS.CONFIRMED) {
            actionHtml = `
                <button class="btn btn-success complete-btn" data-id="${b.id}" style="padding: 4px 10px; font-size:12px;">
                    <i class="fa-solid fa-check"></i> Complete
                </button>
                <button class="btn btn-danger cancel-btn" data-id="${b.id}" style="padding: 4px 10px; font-size:12px; margin-left: 4px;">
                    <i class="fa-solid fa-times"></i> Cancel
                </button>
            `;
        } else if (b.status === BOOKING_STATUS.CANCELLED) {
            actionHtml = `<span style="color:var(--danger); font-weight:600;">Cancelled</span>`;
        } else {
            actionHtml = `<span style="color:var(--success); font-weight:600;"><i class="fa-solid fa-circle-check"></i> Completed</span>`;
        }

        // Status Badge Style
        let badgeColor = '';
        if (b.status === BOOKING_STATUS.CONFIRMED) {
            badgeColor = isFuture ? 'background: #e0f2f1; color: #00695c;' : 'background: #f1f5f9; color: #475569;';
        } else if (b.status === BOOKING_STATUS.CANCELLED) {
            badgeColor = 'background: #ffebee; color: #c62828;';
        } else {
            badgeColor = 'background: #e8f5e9; color: #2e7d32;';
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${studentName}</strong></td>
            <td>${subName}</td>
            <td>${formatDate(b.date)}</td>
            <td>${b.time}</td>
            <td>
                <span style="padding: 4px 10px; border-radius: 20px; font-weight:600; font-size:12px; ${badgeColor}">
                    ${b.status === BOOKING_STATUS.CONFIRMED && !isFuture ? 'completed' : b.status}
                </span>
            </td>
            <td>${actionHtml}</td>
        `;
        tableBody.appendChild(tr);
    }

    // Attach listeners
    document.querySelectorAll('.complete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const bookingId = e.currentTarget.getAttribute('data-id');
            showLoader(true);
            try {
                await updateDoc(doc(db, COLLECTIONS.BOOKINGS, bookingId), {
                    status: BOOKING_STATUS.COMPLETED
                });
                showToast("Class marked as completed.");
                loadBookings();
            } catch (err) {
                showToast("Operation failed: " + err.message, true);
            } finally {
                showLoader(false);
            }
        });
    });

    document.querySelectorAll('.cancel-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const bookingId = e.currentTarget.getAttribute('data-id');
            if (!confirm("Are you sure you want to cancel this booking?")) return;
            
            showLoader(true);
            try {
                await updateDoc(doc(db, COLLECTIONS.BOOKINGS, bookingId), {
                    status: BOOKING_STATUS.CANCELLED
                });
                showToast("Booking cancelled successfully.");
                loadBookings();
            } catch (err) {
                showToast("Cancellation failed: " + err.message, true);
            } finally {
                showLoader(false);
            }
        });
    });
}

// Tab triggers
const tabUpcoming = document.getElementById("tabUpcoming");
const tabScheduled = document.getElementById("tabScheduled");
const tabCompleted = document.getElementById("tabCompleted");

function setActiveTab(tabName, activeBtn) {
    currentActiveTab = tabName;
    document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
    activeBtn.classList.add("active");
    renderFilteredBookings();
}

tabUpcoming.addEventListener('click', (e) => setActiveTab("Upcoming", e.target));
tabScheduled.addEventListener('click', (e) => setActiveTab("Scheduled", e.target));
tabCompleted.addEventListener('click', (e) => setActiveTab("Completed", e.target));
