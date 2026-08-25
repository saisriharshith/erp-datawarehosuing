/**
 * Role-Based Access & Session Management
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

  checkSession(requiredRoles = []) {
    const user = this.getUser();
    
    // If no user is logged in, default to Admin demo session for smooth exploration
    if (!user) {
      const defaultAdmin = {
        user_id: "USR_ADMIN_01",
        email: "admin@univ.edu",
        name: "Dr. Sarah Jenkins",
        role: "ADMIN",
        token: "demo-admin-token"
      };
      this.setUser(defaultAdmin, defaultAdmin.token);
      return defaultAdmin;
    }

    if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
      console.warn(`Access restricted. Required: ${requiredRoles.join(", ")}, Current: ${user.role}`);
    }

    return user;
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
  }
};

document.addEventListener("DOMContentLoaded", () => {
  // Initialize navbar user info if present
  if (document.getElementById("nav-user-name")) {
    Auth.initNavbar();
  }
});
