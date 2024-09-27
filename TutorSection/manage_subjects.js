import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA4fg_x-GFnD5TTsDJhdcgPzkiClfnpLh4",
  authDomain: "project1-1a12a.firebaseapp.com",
  databaseURL: "https://project1-1a12a-default-rtdb.firebaseio.com",
  projectId: "project1-1a12a",
  storageBucket: "project1-1a12a.appspot.com",
  messagingSenderId: "503658861390",
  appId: "1:503658861390:web:0ca201b7574cc71004041f",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function getUidFromLocalStorage() {
  return localStorage.getItem("uid");
}

async function fetchTeacherDoc(uid) {
  try {
    const teacherDocRef = doc(db, "teachers", uid);
    const teacherDocSnap = await getDoc(teacherDocRef);
    return teacherDocSnap;
  } catch (error) {
    console.error("Error fetching teacher document:", error);
    return null;
  }
}

function displaySubjects(subjects) {
  const subjectContainer = document.getElementById("subjectContainer");
  subjectContainer.innerHTML = "";
  subjects.forEach((subject) => {
    const card = document.createElement("div");
    card.classList.add("card");
    const subjectName = document.createElement("h2");
    subjectName.textContent = subject.subject;
    const description = document.createElement("p");
    description.textContent = subject.description;

    const editButton = document.createElement("button");
    editButton.textContent = "Edit";
    editButton.classList.add("btn", "btn-primary", "mx-1");
    editButton.addEventListener("click", () => openEditDialog(subject));

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.classList.add("btn", "btn-danger", "mx-1");
    deleteButton.addEventListener("click", () => deleteSubject(subject));

    card.appendChild(subjectName);
    card.appendChild(description);
    card.appendChild(editButton);
    card.appendChild(deleteButton);
    subjectContainer.appendChild(card);
  });
}

function populateEditDialog(subject) {
  const subjectNameInput = document.getElementById("editSubjectName");
  const descriptionInput = document.getElementById("editDescription");

  subjectNameInput.value = subject.subject;
  descriptionInput.value = subject.description;
}

function openEditDialog(subject) {
  populateEditDialog(subject);

  const editModal = new bootstrap.Modal(
    document.getElementById("editSubjectModal")
  );
  editModal.show();

  const submitButton = document.getElementById("editSubmit");
  submitButton.onclick = async () => {
    const uid = getUidFromLocalStorage();
    if (!uid) {
      console.error("UID not found in local storage");
      return;
    }

    try {
      const teacherDocSnap = await fetchTeacherDoc(uid);
      if (teacherDocSnap.exists()) {
        const teacherDocRef = doc(db, "teachers", uid);
        await updateDoc(teacherDocRef, {
          subjects: teacherDocSnap.data().subjects.map((s) => {
            if (
              s.subject === subject.subject &&
              s.description === subject.description
            ) {
              return {
                subject: document.getElementById("editSubjectName").value,
                description: document.getElementById("editDescription").value,
                id: subject.id,
              };
            }
            return s;
          }),
        });

        editModal.hide();
        manageSubjects();
      } else {
        console.error("Teacher document not found");
      }
    } catch (error) {
      console.error("Error updating subject:", error);
    }
  };
}

async function deleteSubject(subject) {
  try {
    const uid = getUidFromLocalStorage();
    if (!uid) {
      console.error("UID not found in local storage");
      return;
    }

    const teacherDocRef = doc(db, "teachers", uid);
    const teacherDocSnap = await getDoc(teacherDocRef);
    if (teacherDocSnap.exists()) {
      const updatedSubjects = teacherDocSnap
        .data()
        .subjects.filter(
          (s) =>
            s.subject !== subject.subject ||
            s.description !== subject.description
        );
      await updateDoc(teacherDocRef, { subjects: updatedSubjects });

      manageSubjects();
    } else {
      console.error("Teacher document not found");
    }
  } catch (error) {
    console.error("Error deleting subject:", error);
  }
}

async function addSubject(subject, description) {
  try {
    const uid = getUidFromLocalStorage();
    if (!uid) {
      console.error("UID not found in local storage");
      return;
    }

    const teacherDocRef = doc(db, "teachers", uid);
    await updateDoc(teacherDocRef, {
      subjects: arrayUnion({
        subject,
        description,
        id: Math.floor(Math.random() * 9000) + 1000,
      }),
    });

    manageSubjects();
  } catch (error) {
    console.error("Error adding subject:", error);
  }
}

async function fetchTeacherSubjects(uid) {
  try {
    const teacherDocSnap = await fetchTeacherDoc(uid);
    if (teacherDocSnap.exists()) {
      const data = teacherDocSnap.data();
      return data.subjects || [];
    } else {
      console.log("Teacher document not found");
      return [];
    }
  } catch (error) {
    console.error("Error fetching teacher subjects:", error);
    return [];
  }
}

async function manageSubjects() {
  const uid = getUidFromLocalStorage();
  if (!uid) {
    console.error("UID not found in local storage");
    return;
  }

  const subjects = await fetchTeacherSubjects(uid);
  displaySubjects(subjects);
}

manageSubjects();

document.getElementById("addSubjectBtn").addEventListener("click", () => {
  const addModal = new bootstrap.Modal(
    document.getElementById("addSubjectModal")
  );
  addModal.show();

  document.getElementById("addSubmit").onclick = async () => {
    const subject = document.getElementById("addSubjectName").value;
    const description = document.getElementById("addDescription").value;
    const id = Math.floor(Math.random() * 9000) + 1000;
    await addSubject(subject, description, id);
    addModal.hide();
  };
});
