import { logOut } from "../services/auth.js";
import { ROLES } from "./constants.js";

export function renderSidebar(userDocData) {
  const container = document.getElementById("sidebar-container");
  if (!container) return; // Silent bail

  const role = userDocData.role;
  const name = userDocData.name || userDocData.displayName || "User";
  const email = userDocData.email || "";

  // Base Profile
  let html = `
        <div class="side-nav">
            <div>
                <div class="user">
                    <i class="fa-solid fa-user-circle"></i>
                    <div>
                        <h2>${name}</h2>
                        <p>${email}</p>
                    </div>
                </div>
                <ul>
                    <li>
                        <a href="/src/pages/${role === ROLES.ADMIN ? "admin" : role === ROLES.TEACHER ? "tutor" : "student"}/dashboard/index.html">
                            <i class="fa-solid fa-house"></i>
                            <span>Dashboard</span>
                        </a>
                    </li>
    `;

  // Role Specific Links
  if (role === ROLES.ADMIN) {
    html += `
            <li>
                <a href="/src/pages/admin/approvals/index.html">
                    <i class="fa-solid fa-list-check"></i>
                    <span>Approvals</span>
                </a>
            </li>
            <li>
                <a href="/src/pages/admin/teachers/index.html">
                    <i class="fa-solid fa-users-slash"></i>
                    <span>Manage Teachers</span>
                </a>
            </li>
        `;
  } else if (role === ROLES.TEACHER) {
    html += `
            <li>
                <a href="/src/pages/tutor/subjects/index.html">
                    <i class="fa-solid fa-book"></i>
                    <span>My Subjects</span>
                </a>
            </li>
            <li>
                <a href="/src/pages/tutor/classes/index.html">
                    <i class="fa-solid fa-calendar-check"></i>
                    <span>My Classes</span>
                </a>
            </li>
        `;
  } else if (role === ROLES.STUDENT) {
    html += `
            <li>
                <a href="/src/pages/student/tutor-list/index.html">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <span>Find & Book Tutors</span>
                </a>
            </li>
            <li>
                <a href="/src/pages/student/my-classes/index.html">
                    <i class="fa-solid fa-chalkboard-user"></i>
                    <span>My Bookings</span>
                </a>
            </li>
        `;
  }

  // Bottom Links
  html += `
                </ul>
            </div>
            <ul>
                <li>
                    <button id="logoutBtn" style="border:none; background:none; cursor:pointer;" class="btn">
                        <i class="fa-solid fa-right-from-bracket"></i>
                        <span>Logout</span>
                    </button>
                </li>
            </ul>
        </div>
    `;

  container.innerHTML = html;

  // Attach Log out functionality
  document.getElementById("logoutBtn").addEventListener("click", () => {
    logOut();
  });
}
