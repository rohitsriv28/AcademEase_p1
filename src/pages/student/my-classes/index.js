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

checkAuth(ROLES.STUDENT);

let currentUser = null;
let allBookingsList = [];
let currentActiveTab = "Upcoming"; // Defaults to Upcoming

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, user.uid));
        if (userDoc.exists() && userDoc.data().role === ROLES.STUDENT) {
            currentUser = { id: user.uid, ...userDoc.data() };
            renderSidebar(userDoc.data());
            loadBookings();
        }
    }
});

// Load bookings for student
async function loadBookings() {
    const tableBody = document.getElementById('classesTableBody');
    tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Loading booked classes...</td></tr>';
    
    try {
        const q = query(collection(db, COLLECTIONS.BOOKINGS), where("studentId", "==", currentUser.id));
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
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red;">Failed to load bookings.</td></tr>';
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
        // Fetch tutor name
        const tutorDoc = await getDoc(doc(db, COLLECTIONS.USERS, b.teacherId));
        const tutorName = tutorDoc.exists() ? tutorDoc.data().name : "Unknown Tutor";
        
        // Fetch subject details
        const subDoc = await getDoc(doc(db, COLLECTIONS.SUBJECTS, b.subjectId));
        const subName = subDoc.exists() ? subDoc.data().subject : "Deleted Subject";

        const bookingDateTime = new Date(b.date + 'T' + b.time);
        const isFuture = bookingDateTime > now;

        let actionHtml = '';
        if (b.status === BOOKING_STATUS.CONFIRMED && isFuture) {
            actionHtml = `
                <button class="btn btn-secondary reschedule-btn" data-id="${b.id}" data-teacherid="${b.teacherId}" data-date="${b.date}" data-time="${b.time}" style="padding: 4px 10px; font-size:12px;">
                    <i class="fa-solid fa-clock"></i> Reschedule
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
            <td><strong>${tutorName}</strong></td>
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

    document.querySelectorAll('.reschedule-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const bookingId = e.currentTarget.getAttribute('data-id');
            const teacherId = e.currentTarget.getAttribute('data-teacherid');
            const date = e.currentTarget.getAttribute('data-date');
            const time = e.currentTarget.getAttribute('data-time');

            document.getElementById('rescheduleBookingId').value = bookingId;
            document.getElementById('rescheduleTeacherId').value = teacherId;
            document.getElementById('newDateInput').value = date;
            document.getElementById('newDateInput').min = new Date().toISOString().split('T')[0];
            document.getElementById('newTimeSelect').value = time;

            document.getElementById('rescheduleModal').style.display = 'flex';
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

// Reschedule actions
document.getElementById('closeRescheduleBtn').addEventListener('click', () => {
    document.getElementById('rescheduleModal').style.display = 'none';
});

document.getElementById('confirmRescheduleBtn').addEventListener('click', async () => {
    const bookingId = document.getElementById('rescheduleBookingId').value;
    const teacherId = document.getElementById('rescheduleTeacherId').value;
    const date = document.getElementById('newDateInput').value;
    const time = document.getElementById('newTimeSelect').value;

    if (!date || !time) return showToast("Please select date and time", true);

    const selectedDateTime = new Date(date + 'T' + time);
    if (selectedDateTime <= new Date()) {
        return showToast("Please select a future date and time.", true);
    }

    showLoader(true);
    try {
        // Query overlapping bookings (excluding our current booking)
        const qOverlap = query(collection(db, COLLECTIONS.BOOKINGS), 
            where("teacherId", "==", teacherId),
            where("date", "==", date),
            where("time", "==", time),
            where("status", "==", BOOKING_STATUS.CONFIRMED)
        );
        const overlapSnap = await getDocs(qOverlap);
        
        const conflicts = overlapSnap.docs.filter(docSnap => docSnap.id !== bookingId);
        
        if (conflicts.length > 0) {
            showLoader(false);
            return showToast("Tutor is already booked for this specific time slot.", true);
        }

        // Update booking document
        await updateDoc(doc(db, COLLECTIONS.BOOKINGS, bookingId), {
            date: date,
            time: time,
            status: BOOKING_STATUS.CONFIRMED // Reset status to confirmed if changed
        });

        showToast("Session successfully rescheduled!");
        document.getElementById('rescheduleModal').style.display = 'none';
        loadBookings();
    } catch(err) {
        showToast("Reschedule failed: " + err.message, true);
    } finally {
        showLoader(false);
    }
});
