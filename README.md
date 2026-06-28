# AcademEase - Find Your Perfect Tutor 🎓

**AcademEase** is a web-based educational platform designed to connect students with experienced, certified tutors. It streamlines the process of finding educators, booking classes, and managing schedules through dedicated dashboards.

> [!NOTE]
> The codebase has been fully refactored and updated to follow a clean, modular directory structure containing static ES6 modules and Firestore security integrations.

---

## 🚀 Features & Capabilities

### 🎓 Student Dashboard

- **Tutor Catalog**: Browse registered tutors, view degree/experience credentials, and filter by subjects.
- **Dynamic Welcome & Metrics**: A personalized header greet with system calendar dates, displaying dynamic counts for booked, upcoming, completed, and cancelled classes.
- **Upcoming Schedule Table**: Displays confirmed booked sessions containing tutor profile pictures, dates, and times.

### 👨‍🏫 Tutor Dashboard

- **Dormant Signup Flow**: Apply to teach by uploading credentials (highest degree, years of experience, and subjects) alongside a profile picture hosted via Cloudinary.
- **Subject Management**: Dynamically list and add subjects taught. New subjects created by active tutors are pre-approved instantly.
- **Upcoming Teaching Schedule**: Real-time listing of scheduled student bookings (student name, email, date, time, and class confirmed badge).

### 🛡️ Admin Dashboard

- **Tutor Approvals Manager**: Dedicated console screen to approve or reject pending teacher accounts.
- **KPI Metrics Panel**: Counts total students, total teachers, total subjects, and pending approvals.
- **Tutor & Student Directories**: Responsive, side-by-side lists of all active platform members for easy moderation.

---

## 📁 Modular Folder Structure

The project has been reorganized into a component-focused, root-relative modular layout:

```
AcademEase/
├── index.html                  # Stunning Landing Page (CTAs, Features, Stats)
├── 404.html                    # Glassmorphism Page Not Found fallback
├── firestore.rules             # Database access and secure creation validation
├── src/
│   ├── assets/
│   │   └── css/
│   │       ├── dashboard.css   # Main layout, grids, KPI cards and tables styling
│   │       └── landing.css     # Landing page aesthetics
│   ├── config/
│   │   └── firebase.js         # Firebase App, Auth, and Firestore initialization
│   ├── services/
│   │   ├── auth.js             # Client guards and role validation routing
│   │   └── cloudinary.js       # Cloudinary secure image upload handler
│   ├── utils/
│   │   ├── constants.js        # Global enum mapping (Roles, Collections, Status)
│   │   ├── helpers.js          # Shared modal overlay loaders and toasts
│   │   ├── sidebar.js          # Dynamic role-based navigation sidebar
│   │   └── validators.js       # Signup password matching helpers
│   └── pages/                  # Modular pages (HTML, JS controllers, local CSS)
│       ├── auth/               # Login and Signup card templates
│       ├── admin/              # Dashboard, Approvals, and Teachers directories
│       ├── student/            # Dashboard, My Classes, and Tutor List bookers
│       └── tutor/              # Dashboard, Classes, Subjects list, and Pending waitlists
```

---

## 🛠️ Technology Stack

- **Core Structure**: HTML5 and Vanilla CSS3 custom design tokens.
- **Logic & Services**: Javascript (ES6 Modules) using standard fetch and APIs.
- **Database & Security**: Google Firebase (Firestore, Authentication) and Cloudinary CDN for profile pictures.

---

## ⚙️ Setup & Installation

1. **Clone the Repository**

   ```bash
   git clone https://github.com/rohitsriv28/AcademEase_p1.git
   cd AcademEase_project1.0
   ```

2. **Run Locally**
   Start a static file server in the project directory:

   ```bash
   npx serve -l 8000
   ```

   Or use the VS Code **Live Server** extension. Open **[http://localhost:8000](http://localhost:8000)** in your web browser.

3. **Database Security Rules**
   To update your Firebase console security layout, copy and deploy [firestore.rules](file:///d:/Workspace/AcademEase_project1.0/firestore.rules) content directly into your Firebase Console Rules tab.
