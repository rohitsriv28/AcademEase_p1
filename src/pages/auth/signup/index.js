import { auth, db } from "../../../config/firebase.js";
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import {
  doc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import { COLLECTIONS, ROLES } from "../../../utils/constants.js";
import {
  validateName,
  validateUsername,
  validatePassword,
  validateEmail,
} from "../../../utils/validators.js";
import { showToast, showLoader, generateUUID } from "../../../utils/helpers.js";
import { uploadImage } from "../../../services/cloudinary.js";

const signupForm = document.getElementById("signupForm");
const roleSelect = document.getElementById("roleSelect");
const teacherOptions = document.getElementById("teacherOptions");
const addSubjectBtn = document.getElementById("addSubjectBtn");
const subjectFields = document.getElementById("subjectFields");

// Toggle Teacher Options
roleSelect.addEventListener("change", () => {
  if (roleSelect.value === ROLES.TEACHER) {
    teacherOptions.style.display = "block";
  } else {
    teacherOptions.style.display = "none";
  }
});

// Dynamic Subject Fields
addSubjectBtn.addEventListener("click", () => {
  const inputWrapper = document.createElement("div");
  inputWrapper.classList.add("subjectInputWrapper");
  inputWrapper.innerHTML = `
        <input type="text" placeholder="Subject Name" class="subjectInput" />
        <input type="text" placeholder="Subject Description" class="descriptionInput" />
    `;
  subjectFields.appendChild(inputWrapper);
});

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("signupName").value.trim();
  const username = document.getElementById("signupUsername").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;
  const confirmPass = document.getElementById("confirmPass").value;
  const roleRaw = roleSelect.value;
  const isTeacher = roleRaw === ROLES.TEACHER;
  const role = isTeacher ? ROLES.PENDING_TEACHER : ROLES.STUDENT;

  // Manual Validation Checks
  if (!validateName(name))
    return showToast("Name must contain only alphabetic characters.", true);
  if (!validateUsername(username))
    return showToast(
      "Username can only contain alphanumeric and @ . _ -",
      true,
    );
  if (!validateEmail(email)) return showToast("Invalid email format.", true);
  if (!validatePassword(password))
    return showToast("Password must be at least 6 characters.", true);
  if (password !== confirmPass)
    return showToast("Passwords do not match.", true);

  showLoader(true);

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const userId = userCredential.user.uid;

    await updateProfile(userCredential.user, { displayName: name });

    let userData = {
      name: name,
      userName: username,
      email: email,
      role: role,
    };

    if (isTeacher) {
      const degree = document.getElementById("teacherDegree").value;
      const experience = document.getElementById("teacherExperience").value;
      const pictureFile = document.getElementById("teacherPicture").files[0];

      let pictureUrl = "https://via.placeholder.com/150";
      if (pictureFile) {
        try {
          pictureUrl = await uploadImage(pictureFile);
        } catch (uploadErr) {
          showToast(
            "Warning: Image could not be uploaded. Using default avatar.",
            true,
          );
          console.error(uploadErr);
        }
      }

      userData = {
        ...userData,
        degree: degree,
        experience: experience,
        picture: pictureUrl,
      };

      // FIX: Save Unified User Record FIRST so that Firestore Rules can validate the 'approve_Teacher' role during subject creation!
      await setDoc(doc(db, COLLECTIONS.USERS, userId), userData);

      // Capture Subjects into global subjects collection
      const subjectInputs = document.querySelectorAll(".subjectInput");
      const descInputs = document.querySelectorAll(".descriptionInput");

      const subjectsPromises = [];
      subjectInputs.forEach((input, index) => {
        const subjectName = input.value.trim();
        const description = descInputs[index].value.trim();

        if (subjectName !== "") {
          const subjectData = {
            teacherId: userId,
            teacherName: name,
            teacherEmail: email,
            teacherPicture: pictureUrl,
            subject: subjectName,
            description: description,
            isApproved: false,
          };
          const subId = generateUUID();
          subjectsPromises.push(
            setDoc(doc(db, COLLECTIONS.SUBJECTS, subId), subjectData),
          );
        }
      });
      await Promise.all(subjectsPromises);
    } else {
      // Save Unified User Record for Student
      await setDoc(doc(db, COLLECTIONS.USERS, userId), userData);
    }

    showLoader(false);
    showToast("Signup successful! Redirecting to login...");
    setTimeout(() => {
      window.location.href = "/src/pages/auth/login/index.html";
    }, 1500);
  } catch (error) {
    showLoader(false);
    showToast(`Signup Error: ${error.message}`, true);
  }
});
