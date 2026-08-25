/**
 * Role-Based Access Control (RBAC) & Persona Management
 * Enforces strict view segregation between ADMIN, FACULTY, and STUDENT.
 */

const Auth = {
  getUser() {
    const raw = localStorage.getItem("erp_user");
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setUser(user, token) {
    if (user) {
      localStorage.setItem("erp_user", JSON.stringify(user));
      localStorage.setItem("erp_auth_token", token || user.token || "demo-token");
    }
  },

  logout() {
    localStorage.removeItem("erp_user");
    localStorage.removeItem("erp_auth_token");
    window.location.href = "index.html";
  },

  switchPersona(role) {
    if (role === "ADMIN") {
      this.setUser({
        user_id: "USR_ADMIN_01",
        email: "admin@univ.edu",
        name: "Dr. Sarah Jenkins (Dean / Admin)",
        role: "ADMIN",
        token: "demo-admin-token"
      });
      window.location.href = "dashboard.html";
    } else if (role === "FACULTY") {
      this.setUser({
        user_id: "FAC101",
        email: "faculty@univ.edu",
        name: "Prof. Rajeshwar Rao (CSE HOD)",
        role: "FACULTY",
        department_id: "DEPT_CSE",
        department_name: "Computer Science & Engineering",
        token: "demo-faculty-token"
      });
      window.location.href = "faculty-portal.html";
    } else if (role === "STUDENT") {
      this.setUser({
        user_id: "STU2023001",
        student_id: "STU2023001",
        email: "student@univ.edu",
        name: "Aarav Sharma (Student)",
        role: "STUDENT",
        department_id: "DEPT_CSE",
        department_name: "Computer Science & Engineering",
        semester: 5,
        token: "demo-student-token"
      });
      window.location.href = "student-portal.html";
    }
  },

  checkSession(requiredRoles = []) {
    let user = this.getUser();
    
    // Default fallback to Admin if none stored
    if (!user) {
      user = {
        user_id: "USR_ADMIN_01",
        email: "admin@univ.edu",
        name: "Dr. Sarah Jenkins (Dean / Admin)",
        role: "ADMIN",
        token: "demo-admin-token"
      };
      this.setUser(user, user.token);
    }

    // Role-based page routing guard
    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    
    if (user.role === "STUDENT") {
      const allowedStudentPages = ["student-portal.html", "index.html"];
      if (!allowedStudentPages.includes(currentPage) && currentPage !== "") {
        console.info("[RBAC] Redirecting student to personal student portal.");
        window.location.href = "student-portal.html";
        return user;
      }
    } else if (user.role === "FACULTY") {
      const restrictedForFaculty = ["data-quality.html", "fees.html"];
      if (restrictedForFaculty.includes(currentPage)) {
        alert("Access Restricted: This module is reserved for Institutional Administration and Governance.");
        window.location.href = "faculty-portal.html";
        return user;
      }
    }

    return user;
  },

  renderRoleBasedNavigation() {
    const user = this.getUser() || this.checkSession();
    const sidebarNav = document.querySelector("#sidebar-wrapper .sidebar-nav");
    if (!sidebarNav) return;

    const currentPage = window.location.pathname.split("/").pop() || "dashboard.html";

    if (user.role === "STUDENT") {
      // Student Navigation (Only personal academic tools)
      sidebarNav.innerHTML = `
        <div class="px-3 my-2 small text-uppercase fw-bold text-muted" style="font-size: 0.7rem;">My Student Hub</div>
        <a href="student-portal.html" class="sidebar-link ${currentPage === 'student-portal.html' ? 'active' : ''}"><i class="bi bi-speedometer2 text-indigo"></i> My Academic Dashboard</a>
        <a href="student-portal.html#attendanceSection" class="sidebar-link"><i class="bi bi-calendar-check text-primary"></i> My Attendance & Eligibility</a>
        <a href="student-portal.html#examsSection" class="sidebar-link"><i class="bi bi-award text-success"></i> My Exam Grades & CGPA</a>
        <a href="student-portal.html#feesSection" class="sidebar-link"><i class="bi bi-cash-stack text-warning"></i> My Fee Receipts</a>
        <a href="student-portal.html#librarySection" class="sidebar-link"><i class="bi bi-book text-info"></i> My Library Account</a>
        <div class="px-3 my-2 small text-uppercase fw-bold text-muted" style="font-size: 0.7rem;">Mentorship & Guidance</div>
        <a href="student-portal.html#adviceSection" class="sidebar-link"><i class="bi bi-lightbulb text-warning"></i> Academic Advisories</a>
      `;
    } else if (user.role === "FACULTY") {
      // Faculty Navigation (Department Scope)
      sidebarNav.innerHTML = `
        <div class="px-3 my-2 small text-uppercase fw-bold text-muted" style="font-size: 0.7rem;">Department Management</div>
        <a href="faculty-portal.html" class="sidebar-link ${currentPage === 'faculty-portal.html' ? 'active' : ''}"><i class="bi bi-speedometer2 text-indigo"></i> Department Overview</a>
        <a href="students.html?department_id=DEPT_CSE" class="sidebar-link ${currentPage === 'students.html' ? 'active' : ''}"><i class="bi bi-people"></i> CSE Students Roster</a>
        <a href="attendance.html?department_id=DEPT_CSE" class="sidebar-link ${currentPage === 'attendance.html' ? 'active' : ''}"><i class="bi bi-calendar-check"></i> Attendance Monitoring</a>
        <a href="examinations.html?department_id=DEPT_CSE" class="sidebar-link ${currentPage === 'examinations.html' ? 'active' : ''}"><i class="bi bi-award"></i> Exam Results & GPA</a>
        <div class="px-3 my-2 small text-uppercase fw-bold text-muted" style="font-size: 0.7rem;">Decision Support</div>
        <a href="risk-analysis.html?department_id=DEPT_CSE" class="sidebar-link ${currentPage === 'risk-analysis.html' ? 'active' : ''}"><i class="bi bi-shield-exclamation text-danger"></i> Advisee Risk Mentorship & What-If</a>
      `;
    } else {
      // Admin / Dean Navigation (Full Institutional Access)
      sidebarNav.innerHTML = `
        <div class="px-3 my-2 small text-uppercase fw-bold text-muted" style="font-size: 0.7rem;">Institutional Overview</div>
        <a href="dashboard.html" class="sidebar-link ${currentPage === 'dashboard.html' ? 'active' : ''}"><i class="bi bi-speedometer2"></i> Executive Dashboard</a>
        <a href="students.html" class="sidebar-link ${currentPage === 'students.html' ? 'active' : ''}"><i class="bi bi-people"></i> Students 360 Master</a>
        <a href="attendance.html" class="sidebar-link ${currentPage === 'attendance.html' ? 'active' : ''}"><i class="bi bi-calendar-check"></i> Attendance Analytics</a>
        <a href="examinations.html" class="sidebar-link ${currentPage === 'examinations.html' ? 'active' : ''}"><i class="bi bi-award"></i> Examination Analytics</a>
        <a href="fees.html" class="sidebar-link ${currentPage === 'fees.html' ? 'active' : ''}"><i class="bi bi-cash-stack"></i> Fee Collections</a>
        <a href="library.html" class="sidebar-link ${currentPage === 'library.html' ? 'active' : ''}"><i class="bi bi-book"></i> Library Circulation</a>
        <a href="faculty.html" class="sidebar-link ${currentPage === 'faculty.html' ? 'active' : ''}"><i class="bi bi-person-video3"></i> Faculty Directory</a>
        <div class="px-3 my-2 small text-uppercase fw-bold text-muted" style="font-size: 0.7rem;">Decision Support & Governance</div>
        <a href="risk-analysis.html" class="sidebar-link ${currentPage === 'risk-analysis.html' ? 'active' : ''}"><i class="bi bi-shield-exclamation text-danger"></i> Risk Prediction & What-If</a>
        <a href="data-quality.html" class="sidebar-link ${currentPage === 'data-quality.html' ? 'active' : ''}"><i class="bi bi-check2-circle text-success"></i> Data Quality Audit</a>
      `;
    }
  },

  initNavbar() {
    const user = this.checkSession();
    const userBadgeEl = document.getElementById("nav-user-badge");
    const userNameEl = document.getElementById("nav-user-name");
    
    if (userNameEl && user) {
      userNameEl.textContent = user.name || user.email;
    }

    if (userBadgeEl && user) {
      userBadgeEl.textContent = user.role;
      userBadgeEl.className = `badge ${user.role === 'ADMIN' ? 'bg-indigo' : user.role === 'FACULTY' ? 'bg-primary' : 'bg-success'}`;
    }

    this.renderRoleBasedNavigation();
  }
};

document.addEventListener("DOMContentLoaded", () => {
  Auth.initNavbar();
});
