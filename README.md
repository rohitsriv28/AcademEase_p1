# AcademEase - Find Your Perfect Tutor

**AcademEase** is a web-based educational platform designed to connect students with experienced tutors. It streamlines the process of finding educators, booking classes, and managing academic schedules.

## 🚀 Features

### 🎓 Student Section

- **Find Tutors**: Browse a list of qualified tutors filtered by subject.
- **Book Classes**: Schedule demo classes or regular sessions.
- **Dashboard**: View enrolled classes and upcoming schedules.
- **Profile**: Manage personal details.

### 👨‍🏫 Tutor Section

- **Registration**: Sign up with professional details (degree, experience).
- **Subject Management**: Add and manage subjects offered.
- **Class Schedule**: View and manage upcoming classes with students.
- **Profile**: Update professional information.

### 🛡️ Admin Section

- **Teacher Approval**: Review and approve/reject new teacher registrations.
- **User Management**: View details and manage all users (Students and Teachers).
- **Oversight**: Ensure platform quality and safety.

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6 Modules)
- **Backend & Database**: Google Firebase (Firestore, Authentication, Storage)
- **Styling**: Vanilla CSS, Bootstrap 5

## 📁 Project Structure

```
AcademEase/
├── Admin/              # Admin workflows (Approve, Delete, Details)
├── Dashboard/          # User dashboards
├── Login/              # Login pages
├── Signup/             # Registration pages
├── StudentSection/     # Student workflows (BookClass, MyClasses, TutorList)
├── TutorSection/       # Tutor workflows (AddClass, ManageSubjects)
├── common/             # Shared resources
├── index.html          # Landing page
└── README.md           # Project documentation
```

## ⚙️ Setup & Installation

1.  **Clone the Repository**

    ```bash
    git clone <repository-url>
    cd AcademEase_project1.0
    ```

2.  **Run Locally**
    Since this is a static web application using Firebase, you can serve it using any static file server.

    Using `http-server` (Node.js):

    ```bash
    npx http-server . -o
    ```

    Or use the "Live Server" extension in VS Code.

3.  **Firebase Configuration**
    The project is currently configured to specific Firebase instances. Ensure you have the correct permissions if you plan to modify backend rules.

## 📝 Usage

1.  **Landing Page**: Start at `index.html`.
2.  **Sign Up**: Create an account as a Student or Teacher.
    - _Note: Teacher accounts require Admin approval before full access._
3.  **Login**: Access your respective dashboard.
4.  **Admin Access**: Log in with admin credentials to approve teachers.

## 📄 License

This project is for educational purposes. All rights reserved.
