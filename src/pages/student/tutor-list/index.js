import { auth, db } from '../../../config/firebase.js';
import { checkAuth } from '../../../services/auth.js';
import { ROLES, COLLECTIONS, BOOKING_STATUS } from '../../../utils/constants.js';
import { renderSidebar } from '../../../utils/sidebar.js';
import { showToast, showLoader, generateUUID } from '../../../utils/helpers.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { collection, query, where, getDocs, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

checkAuth(ROLES.STUDENT);

let currentUser = null;
let allSubjectsCache = [];

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, user.uid));
        if (userDoc.exists() && userDoc.data().role === ROLES.STUDENT) {
            currentUser = { id: user.uid, ...userDoc.data() };
            renderSidebar(userDoc.data());
            loadAllSubjects();
        }
    }
});

async function loadAllSubjects() {
    showLoader(true);
    try {
        const q = query(collection(db, COLLECTIONS.SUBJECTS), where("isApproved", "==", true));
        const querySnapshot = await getDocs(q);
        
        allSubjectsCache = [];
        querySnapshot.forEach(docSnap => {
            allSubjectsCache.push({ id: docSnap.id, ...docSnap.data() });
        });
        
        renderCards(allSubjectsCache);
    } catch (err) {
        showToast("Error loading subjects: " + err.message, true);
    } finally {
        showLoader(false);
    }
}

function renderCards(subjectsList) {
    const container = document.getElementById('tutorsContainer');
    container.innerHTML = '';
    
    if (subjectsList.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align:center;">No subjects found.</p>';
        return;
    }

    subjectsList.forEach(sub => {
        const div = document.createElement('div');
        div.className = 'tutor-card';
        div.innerHTML = `
            <img src="${sub.teacherPicture}" alt="${sub.teacherName}" onerror="this.src='https://via.placeholder.com/300'" />
            <h3>${sub.subject}</h3>
            <p>Taught by: <strong>${sub.teacherName}</strong></p>
            <p>${sub.description}</p>
            <button class="btn btn-primary book-btn" data-subid="${sub.id}" data-teacherid="${sub.teacherId}" data-subname="${sub.subject}">Book Class</button>
        `;
        container.appendChild(div);
    });

    document.querySelectorAll('.book-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.getElementById('bookSubjectId').value = e.target.getAttribute('data-subid');
            document.getElementById('bookTeacherId').value = e.target.getAttribute('data-teacherid');
            document.getElementById('bookingSubTitle').innerText = "Subject: " + e.target.getAttribute('data-subname');
            document.getElementById('bookDate').min = new Date().toISOString().split('T')[0];
            document.getElementById('bookingModal').style.display = 'flex';
        });
    });
}

document.getElementById('searchBtn').addEventListener('click', () => {
    const term = document.getElementById('searchInput').value.toLowerCase().trim();
    if(!term) {
        renderCards(allSubjectsCache);
        return;
    }
    // Client-side debounce/filter over the cached dataset. If dataset is huge, we should query Firestore using >= and <= but Firestore text search is limited without Algolia. 
    // Since Firebase doesn't natively do string.includes(), local array filter is best practice for vanilla without extensions.
    const filtered = allSubjectsCache.filter(s => s.subject.toLowerCase().includes(term) || s.teacherName.toLowerCase().includes(term));
    renderCards(filtered);
});

document.getElementById('closeModalBtn').addEventListener('click', () => {
    document.getElementById('bookingModal').style.display = 'none';
});

document.getElementById('confirmBookBtn').addEventListener('click', async () => {
    const subId = document.getElementById('bookSubjectId').value;
    const tId = document.getElementById('bookTeacherId').value;
    const date = document.getElementById('bookDate').value;
    const time = document.getElementById('bookTime').value;

    // Set min date to today
    const todayStr = new Date().toISOString().split('T')[0];
    document.getElementById('bookDate').min = todayStr;

    if(!date || !time) return showToast("Please select date and time", true);

    const selectedDateTime = new Date(date + 'T' + time);
    if (selectedDateTime <= new Date()) {
        return showToast("Please select a future date and time.", true);
    }

    showLoader(true);
    try {
        // Prevent strictly identical overlaps locally (Date + Time + Teacher Match)
        const qOverlap = query(collection(db, COLLECTIONS.BOOKINGS), 
            where("teacherId", "==", tId),
            where("date", "==", date),
            where("time", "==", time)
        );
        const overlapSnap = await getDocs(qOverlap);
        
        if(!overlapSnap.empty) {
            showLoader(false);
            return showToast("This tutor is already booked for this specific time.", true);
        }

        const newId = generateUUID();
        await setDoc(doc(db, COLLECTIONS.BOOKINGS, newId), {
            studentId: currentUser.id,
            teacherId: tId,
            subjectId: subId,
            date: date,
            time: time,
            status: BOOKING_STATUS.CONFIRMED,
            createdAt: new Date().toISOString()
        });

        showToast("Class officially booked!");
        document.getElementById('bookingModal').style.display = 'none';
    } catch(err) {
        showToast("Booking failed: " + err.message, true);
    } finally {
        showLoader(false);
    }
});
