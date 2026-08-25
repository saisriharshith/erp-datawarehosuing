/**
 * Centralized API Client
 * Wraps Fetch with authentication headers, JSON parsing, and user-friendly error alerts.
 */

async function fetchAPI(endpoint, options = {}) {
  const url = `${API_CONFIG.BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
  
  const token = localStorage.getItem("erp_auth_token");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.message || `HTTP Error ${response.status}`;
      console.error(`[API Error] ${endpoint}:`, errorMsg);
      throw new Error(errorMsg);
    }

    return data.data !== undefined ? data.data : data;
  } catch (error) {
    console.error(`[Network / API Failure] ${url}:`, error);
    throw error;
  }
}

/** Helper to show friendly notification toasts/alerts */
function showAlert(message, type = "danger") {
  const alertContainer = document.getElementById("alert-container");
  if (!alertContainer) {
    alert(message);
    return;
  }

  const alertDiv = document.createElement("div");
  alertDiv.className = `alert alert-${type} alert-dismissible fade show shadow-sm`;
  alertDiv.role = "alert";
  alertDiv.innerHTML = `
    <strong>${type === "danger" ? "Notice:" : "Success:"}</strong> ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  alertContainer.appendChild(alertDiv);

  setTimeout(() => {
    alertDiv.classList.remove("show");
    setTimeout(() => alertDiv.remove(), 200);
  }, 5000);
}
