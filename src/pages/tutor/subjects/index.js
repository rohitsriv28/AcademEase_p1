import { auth, db } from "../../../config/firebase.js";
import { checkAuth } from "../../../services/auth.js";
import { ROLES, COLLECTIONS } from "../../../utils/constants.js";
import { renderSidebar } from "../../../utils/sidebar.js";
import { showToast, showLoader, generateUUID } from "../../../utils/helpers.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

checkAuth(ROLES.TEACHER);

let currentUser = null;

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, user.uid));
    if (userDoc.exists() && userDoc.data().role === ROLES.TEACHER) {
      currentUser = { id: user.uid, ...userDoc.data() };
      renderSidebar(userDoc.data());
      loadSubjects();
    }
  }
});

const modal = document.getElementById("subjectModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const openAddModalBtn = document.getElementById("openAddModalBtn");
const saveSubjectBtn = document.getElementById("saveSubjectBtn");

openAddModalBtn.addEventListener("click", () => {
  document.getElementById("modalTitle").innerText = "Add Subject";
  document.getElementById("subjectIdHidden").value = "";
  document.getElementById("subjectNameInput").value = "";
  document.getElementById("subjectDescInput").value = "";
  modal.style.display = "flex";
});

closeModalBtn.addEventListener("click", () => {
  modal.style.display = "none";
});

async function loadSubjects() {
  const tableBody = document.getElementById("subjectsTableBody");
  tableBody.innerHTML =
    '<tr><td colspan="3" style="text-align:center;">Loading...</td></tr>';

  try {
    const q = query(
      collection(db, COLLECTIONS.SUBJECTS),
      where("teacherId", "==", currentUser.id),
    );
    const querySnapshot = await getDocs(q);

    tableBody.innerHTML = "";
    if (querySnapshot.empty) {
      tableBody.innerHTML =
        '<tr><td colspan="3" style="text-align:center;">No subjects found. Add one above!</td></tr>';
      return;
    }

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const tr = document.createElement("tr");

      tr.innerHTML = `
                <td>${data.subject}</td>
                <td>${data.description}</td>
                <td>
                    <button class="btn btn-primary edit-btn" data-id="${docSnap.id}" data-sub="${data.subject}" data-desc="${data.description}">Edit</button>
                    <button class="btn btn-danger delete-btn" data-id="${docSnap.id}">Delete</button>
                </td>
            `;
      tableBody.appendChild(tr);
    });

    document.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        document.getElementById("modalTitle").innerText = "Edit Subject";
        document.getElementById("subjectIdHidden").value =
          e.target.getAttribute("data-id");
        document.getElementById("subjectNameInput").value =
          e.target.getAttribute("data-sub");
        document.getElementById("subjectDescInput").value =
          e.target.getAttribute("data-desc");
        modal.style.display = "flex";
      });
    });

    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        if (!confirm("Are you sure? This deletes the subject permanently."))
          return;
        showLoader(true);
        try {
          await deleteDoc(
            doc(db, COLLECTIONS.SUBJECTS, e.target.getAttribute("data-id")),
          );
          showToast("Subject deleted.");
          loadSubjects();
        } catch (err) {
          showToast("Error deleting: " + err.message, true);
        } finally {
          showLoader(false);
        }
      });
    });
  } catch (err) {
    showToast("Error loading subjects", true);
  }
}

saveSubjectBtn.addEventListener("click", async () => {
  const subId = document.getElementById("subjectIdHidden").value;
  const subName = document.getElementById("subjectNameInput").value.trim();
  const subDesc = document.getElementById("subjectDescInput").value.trim();

  if (!subName || !subDesc) return showToast("Please fill all fields", true);

  showLoader(true);
  try {
    if (subId) {
      // Edit
      await updateDoc(doc(db, COLLECTIONS.SUBJECTS, subId), {
        subject: subName,
        description: subDesc,
      });
      showToast("Subject updated!");
    } else {
      // Add (isApproved set to true since teacher is already active)
      const newId = generateUUID();
      await setDoc(doc(db, COLLECTIONS.SUBJECTS, newId), {
        teacherId: currentUser.id,
        teacherName: currentUser.name,
        teacherEmail: currentUser.email,
        teacherPicture:
          currentUser.picture || "https://via.placeholder.com/150",
        subject: subName,
        description: subDesc,
        isApproved: true,
      });
      showToast("Subject added!");
    }
    modal.style.display = "none";
    loadSubjects();
  } catch (err) {
    showToast("Error saving: " + err.message, true);
  } finally {
    showLoader(false);
  }
});
