document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signupForm");

  const nameInput = document.getElementById("name");
  const usernameInput = document.getElementById("username");
  const emailInput = document.getElementById("signupEmail");
  const nameError = document.getElementById("nameError");
  const usernameError = document.getElementById("usernameError");
  const emailError = document.getElementById("emailError");

  function validateName(name) {
    const nameRegex = /^[A-Za-z]+$/;
    return nameRegex.test(name);
  }

  function validateUsername(username) {
    const usernameRegex = /^[A-Za-z0-9@._-]+$/;
    return usernameRegex.test(username);
  }

  function validateEmail(email) {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z]+\.[A-Za-z]+$/;
    return emailRegex.test(email);
  }

  nameInput.addEventListener("input", () => {
    if (!validateName(nameInput.value)) {
      nameError.textContent = "Name must contain only alphabetic characters.";
      nameError.classList.add("error");
    } else {
      nameError.textContent = "";
    }
  });

  usernameInput.addEventListener("input", () => {
    if (!validateUsername(usernameInput.value)) {
      usernameError.textContent = "Username can only contain alphanumeric characters and @ . _ -";
      usernameError.classList.add("error");
    } else {
      usernameError.textContent = "";
    }
  });

  emailInput.addEventListener("input", () => {
    if (!validateEmail(emailInput.value)) {
      emailError.textContent = "Email must be in the format yourname@domain.com";
      emailError.classList.add("error");
    } else {
      emailError.textContent = "";
    }
  });

  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;
    const userName = document.getElementById("username").value;
    const role = document.getElementById("role").value;

    let validationFailed = false;

    if (!validateName(name)) {
      nameError.textContent = "Name must contain only alphabetic characters.";
      nameError.classList.add("error");
      validationFailed = true;
    }

    if (!validateUsername(userName)) {
      usernameError.textContent = "Username can only contain alphanumeric characters and @ . _ -";
      usernameError.classList.add("error");
      validationFailed = true;
    }

    if (!validateEmail(email)) {
      emailError.textContent = "Email must be in the format yourname@domain.com";
      emailError.classList.add("error");
      validationFailed = true;
    }

    if (validationFailed) {
      alert("Please fix the errors in the form before submitting.");
      return;
    }

    let userData = {
      email: email,
      role: role,
    };

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      userData = {
        ...userData,
        name: name,
        userName: userName,
      };

      await updateProfile(auth.currentUser, {
        displayName: name,
      });

      if (role === "admin") {
        const adminDocRef = await doc(collection(db, "admin"), userCredential.user.uid);
        await setDoc(adminDocRef, userData);
      } else if (role === "teacher") {
        const teacherDocRef = doc(collection(db, "approve_Teacher"), userCredential.user.uid);

        const pictureFile = document.getElementById("teacherPicture").files[0];

        let pictureUrl = null;

        if (pictureFile) {
          const pictureRef = ref(storage, `teacherPictures/${email}-${Date.now()}`);

          await uploadBytes(pictureRef, pictureFile);

          pictureUrl = await getDownloadURL(pictureRef);
        }

        let subjects = [];
        document.querySelectorAll(".subjectInput").forEach((input, index) => {
          const subject = input.value.trim();
          const description = document.querySelectorAll(".descriptionInput")[index].value.trim();
          if (subject !== "") {
            subjects.push({
              subject,
              description,
              id: Math.floor(Math.random() * 9000) + 1000,
            });
          }
        });

        userData = {
          ...userData,
          degree: document.getElementById("teacherDegree").value,
          experience: document.getElementById("teacherExperience").value,
          picture: pictureUrl,
          subjects: subjects,
        };

        await setDoc(teacherDocRef, userData);
      } else {
        const roleDocRef = doc(collection(db, "students"), userCredential.user.uid);
        await setDoc(roleDocRef, userData);
      }

      alert("Signup successful!");
      window.location.href = "../Login/login.html";
    } catch (error) {
      console.error("Signup error:", error.message);
    }
  });
});
