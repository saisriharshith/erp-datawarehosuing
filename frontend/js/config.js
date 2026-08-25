/**
 * Client API Configuration
 * Supports dynamic switching between local development and production Render backend.
 */

const API_CONFIG = {
  // Check if custom override is stored in localStorage, otherwise check hostname
  get BASE_URL() {
    const override = localStorage.getItem("ERP_API_BASE_URL");
    if (override && override.trim() !== "") {
      return override.trim();
    }
    
    const isLocal = window.location.hostname === "localhost" || 
                    window.location.hostname === "127.0.0.1" || 
                    window.location.hostname === "";
    
    return isLocal 
      ? "http://localhost:5001/api" 
      : "https://erp-data-warehouse-api.onrender.com/api";
  },

  set BASE_URL(newUrl) {
    if (newUrl) {
      localStorage.setItem("ERP_API_BASE_URL", newUrl.trim());
    } else {
      localStorage.removeItem("ERP_API_BASE_URL");
    }
  }
};
