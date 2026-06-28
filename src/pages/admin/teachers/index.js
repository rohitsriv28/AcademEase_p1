import { auth, db, firebaseConfig } from "../../../config/firebase.js";
import { checkAuth } from "../../../services/auth.js";
import { ROLES, COLLECTIONS } from "../../../utils/constants.js";
import { renderSidebar } from "../../../utils/sidebar.js";
import { showToast, showLoader, generateUUID } from "../../../utils/helpers.js";
import { uploadImage } from "../../../services/cloudinary.js";
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
  writeBatch,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signOut as secondarySignOut,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

// Guard Route
checkAuth(ROLES.ADMIN);

// Secondary Auth instance for creating users without logging out Admin
const secondaryApp = initializeApp(firebaseConfig, "secondaryAdminCreate");
const secondaryAuth = getAuth(secondaryApp);

let activeTeachersCache = [];

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, user.uid));
    if (userDoc.exists() && userDoc.data().role === ROLES.ADMIN) {
      renderSidebar(userDoc.data());
      loadActiveTeachers();
    }
  }
});

// Load Teachers from Firestore
async function loadActiveTeachers() {
  const tableBody = document.getElementById("teachersTableBody");
  tableBody.innerHTML =
    '<tr><td colspan="4" style="text-align:center;">Loading active teachers...</td></tr>';

  try {
    const q = query(
      collection(db, COLLECTIONS.USERS),
      where("role", "==", ROLES.TEACHER),
    );
    const querySnapshot = await getDocs(q);

    tableBody.innerHTML = "";
    activeTeachersCache = [];

    if (querySnapshot.empty) {
      tableBody.innerHTML =
        '<tr><td colspan="4" style="text-align:center;">No active teachers found.</td></tr>';
      return;
    }

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.id
        ? { id: docSnap.id, ...docSnap.data() }
        : docSnap.data();
      activeTeachersCache.push(data);

      const tr = document.createElement("tr");
      tr.innerHTML = `
                <td>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <img src="${data.picture || "https://via.placeholder.com/150"}" style="width:36px; height:36px; border-radius:50%; object-fit:cover;" onerror="this.src='https://via.placeholder.com/150'" />
                        <strong>${data.name}</strong>
                    </div>
                </td>
                <td>${data.email}</td>
                <td>${data.degree || "N/A"} (${data.experience || "N/A"})</td>
                <td>
                    <button class="btn btn-secondary edit-teacher-btn" data-id="${docSnap.id}">
                        <i class="fa-solid fa-pen"></i> Edit
                    </button>
                    <button class="btn btn-danger remove-teacher-btn" data-id="${docSnap.id}">
                        <i class="fa-solid fa-trash"></i> Revoke & Delete
                    </button>
                </td>
            `;
      tableBody.appendChild(tr);
    });

    // Attach event listeners
    document.querySelectorAll(".edit-teacher-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = e.currentTarget.getAttribute("data-id");
        openEditModal(id);
      });
    });

    document.querySelectorAll(".remove-teacher-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = e.currentTarget.getAttribute("data-id");
        removeTeacher(id);
      });
    });
  } catch (err) {
    console.error(err);
    showToast("Error loading teachers", true);
    tableBody.innerHTML =
      '<tr><td colspan="4" style="text-align:center; color:red;">Failed to load.</td></tr>';
  }
}

// Modal management
const modal = document.getElementById("teacherModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const openAddTeacherBtn = document.getElementById("openAddTeacherBtn");
const saveTeacherBtn = document.getElementById("saveTeacherBtn");
const addSubjectRowBtn = document.getElementById("addSubjectRowBtn");
const modalSubjectFields = document.getElementById("modalSubjectFields");

openAddTeacherBtn.addEventListener("click", () => {
  document.getElementById("modalTitle").innerText = "Add Teacher";
  document.getElementById("teacherIdHidden").value = "";
  document.getElementById("teacherNameInput").value = "";
  document.getElementById("teacherUsernameInput").value = "";

  const emailInput = document.getElementById("teacherEmailInput");
  emailInput.value = "";
  emailInput.removeAttribute("disabled");

  document.getElementById("passwordFieldContainer").style.display = "block";
  document.getElementById("teacherPasswordInput").value = "";
  document.getElementById("teacherDegreeInput").value = "";
  document.getElementById("teacherExperienceInput").value = "";
  document.getElementById("teacherPictureInput").value = "";
  modalSubjectFields.innerHTML = "";
  addSubjectRow(); // seed one row
  modal.style.display = "flex";
});

closeModalBtn.addEventListener("click", () => {
  modal.style.display = "none";
});

addSubjectRowBtn.addEventListener("click", () => {
  addSubjectRow();
});

function addSubjectRow(name = "", desc = "") {
  const div = document.createElement("div");
  div.className = "subject-item";
  div.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:12px; font-weight:600; color:#64748b;">Subject Info</span>
            <button type="button" class="btn btn-danger remove-sub-row-btn" style="padding: 2px 6px; font-size:10px;">
                <i class="fa-solid fa-times"></i>
            </button>
        </div>
        <input type="text" placeholder="Subject Name" class="sub-name-field" value="${name}" style="margin-bottom:6px; padding:6px 10px; font-size:13px;" />
        <input type="text" placeholder="Subject Description" class="sub-desc-field" value="${desc}" style="padding:6px 10px; font-size:13px;" />
    `;
  modalSubjectFields.appendChild(div);
  div.querySelector(".remove-sub-row-btn").addEventListener("click", () => {
    div.remove();
  });
}

// Open modal for editing
async function openEditModal(teacherId) {
  const teacher = activeTeachersCache.find((t) => t.id === teacherId);
  if (!teacher) return showToast("Teacher details not found in cache", true);

  showLoader(true);
  try {
    document.getElementById("modalTitle").innerText = "Edit Teacher";
    document.getElementById("teacherIdHidden").value = teacherId;
    document.getElementById("teacherNameInput").value = teacher.name || "";
    document.getElementById("teacherUsernameInput").value =
      teacher.userName || "";

    const emailInput = document.getElementById("teacherEmailInput");
    emailInput.value = teacher.email || "";
    emailInput.setAttribute("disabled", "true"); // cannot change email directly

    document.getElementById("passwordFieldContainer").style.display = "none"; // hide password
    document.getElementById("teacherDegreeInput").value = teacher.degree || "";
    document.getElementById("teacherExperienceInput").value =
      teacher.experience || "";
    document.getElementById("teacherPictureInput").value = "";

    modalSubjectFields.innerHTML = "";

    // Fetch subjects relating to them
    const q = query(
      collection(db, COLLECTIONS.SUBJECTS),
      where("teacherId", "==", teacherId),
    );
    const subjectsSnap = await getDocs(q);

    if (subjectsSnap.empty) {
      addSubjectRow();
    } else {
      subjectsSnap.forEach((docSnap) => {
        const subData = docSnap.data();
        addSubjectRow(subData.subject, subData.description);
      });
    }

    modal.style.display = "flex";
  } catch (err) {
    showToast("Error retrieving subjects: " + err.message, true);
  } finally {
    showLoader(false);
  }
}

// Save teacher trigger
saveTeacherBtn.addEventListener("click", async () => {
  const teacherId = document.getElementById("teacherIdHidden").value;
  const name = document.getElementById("teacherNameInput").value.trim();
  const username = document.getElementById("teacherUsernameInput").value.trim();
  const email = document.getElementById("teacherEmailInput").value.trim();
  const degree = document.getElementById("teacherDegreeInput").value.trim();
  const experience = document
    .getElementById("teacherExperienceInput")
    .value.trim();
  const pictureFile = document.getElementById("teacherPictureInput").files[0];

  if (!name || !username || !email) {
    return showToast("Name, Username, and Email are required.", true);
  }

  // Capture subject rows
  const subNames = document.querySelectorAll(".sub-name-field");
  const subDescs = document.querySelectorAll(".sub-desc-field");
  const subjects = [];
  subNames.forEach((input, index) => {
    const sName = input.value.trim();
    const sDesc = subDescs[index].value.trim();
    if (sName !== "") {
      subjects.push({ name: sName, description: sDesc });
    }
  });

  showLoader(true);
  try {
    let pictureUrl = "https://via.placeholder.com/150";
    if (teacherId) {
      // Find existing picture
      const existing = activeTeachersCache.find((t) => t.id === teacherId);
      if (existing && existing.picture) pictureUrl = existing.picture;
    }

    // Upload new picture if provided
    if (pictureFile) {
      try {
        pictureUrl = await uploadImage(pictureFile);
      } catch (e) {
        showToast(
          "Cloudinary Upload failed, using default placeholder: " + e.message,
          true,
        );
      }
    }

    if (!teacherId) {
      // ADD NEW TEACHER
      const password = document.getElementById("teacherPasswordInput").value;
      if (!password || password.length < 6) {
        showLoader(false);
        return showToast(
          "Password is required and must be at least 6 characters.",
          true,
        );
      }

      // Create account using secondary Auth instance to avoid admin session logging out
      const userCred = await createUserWithEmailAndPassword(
        secondaryAuth,
        email,
        password,
      );
      const newUid = userCred.user.uid;

      // Sign out secondary auth instance immediately
      await secondarySignOut(secondaryAuth);

      // Write user details
      const userData = {
        name,
        userName: username,
        email,
        role: ROLES.TEACHER,
        degree,
        experience,
        picture: pictureUrl,
      };
      await setDoc(doc(db, COLLECTIONS.USERS, newUid), userData);

      // Write subjects
      const batch = writeBatch(db);
      subjects.forEach((sub) => {
        const subId = generateUUID();
        batch.set(doc(db, COLLECTIONS.SUBJECTS, subId), {
          teacherId: newUid,
          teacherName: name,
          teacherEmail: email,
          teacherPicture: pictureUrl,
          subject: sub.name,
          description: sub.description,
          isApproved: true,
        });
      });
      await batch.commit();
      showToast("Teacher added successfully!");
    } else {
      // EDIT EXISTING TEACHER
      // Update profile
      await updateDoc(doc(db, COLLECTIONS.USERS, teacherId), {
        name,
        userName: username,
        degree,
        experience,
        picture: pictureUrl,
      });

      // Update & sync subjects: delete old ones and insert new list
      const oldSubjectsQuery = query(
        collection(db, COLLECTIONS.SUBJECTS),
        where("teacherId", "==", teacherId),
      );
      const oldSubjectsSnap = await getDocs(oldSubjectsQuery);

      const batch = writeBatch(db);
      // Delete old
      oldSubjectsSnap.forEach((docSnap) => {
        batch.delete(doc(db, COLLECTIONS.SUBJECTS, docSnap.id));
      });
      // Write new
      subjects.forEach((sub) => {
        const subId = generateUUID();
        batch.set(doc(db, COLLECTIONS.SUBJECTS, subId), {
          teacherId: teacherId,
          teacherName: name,
          teacherEmail: email,
          teacherPicture: pictureUrl,
          subject: sub.name,
          description: sub.description,
          isApproved: true,
        });
      });
      await batch.commit();
      showToast("Teacher updated successfully!");
    }

    modal.style.display = "none";
    loadActiveTeachers();
  } catch (err) {
    console.error(err);
    showToast("Operation failed: " + err.message, true);
  } finally {
    showLoader(false);
  }
});

// Remove/Revoke teacher
async function removeTeacher(teacherId) {
  if (
    !confirm(
      "Are you sure you want to completely remove this teacher and ALL their subjects?",
    )
  )
    return;

  showLoader(true);
  try {
    const batch = writeBatch(db);

    // Delete user doc
    batch.delete(doc(db, COLLECTIONS.USERS, teacherId));

    // Query & delete subjects
    const q = query(
      collection(db, COLLECTIONS.SUBJECTS),
      where("teacherId", "==", teacherId),
    );
    const subjectsSnap = await getDocs(q);
    subjectsSnap.forEach((subDoc) => {
      batch.delete(doc(db, COLLECTIONS.SUBJECTS, subDoc.id));
    });

    await batch.commit();
    showToast("Teacher access revoked and data deleted.");
    loadActiveTeachers();
  } catch (err) {
    console.error(err);
    showToast("Deletion failed: " + err.message, true);
  } finally {
    showLoader(false);
  }
}
