import axios from 'axios';

// Base API configuration — relative /api for production and Vite dev proxy
const API_BASE = import.meta.env.VITE_API_BASE || '/api';

// Create axios instance with credentials for cookies
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // send httpOnly cookies
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 15000
});

// Fetch API helper (normalizes /api path, attaches JWT Bearer, unwraps data envelope)
export const fetchAPI = async (url, options = {}) => {
  let targetUrl = url;
  if (!targetUrl.startsWith('http')) {
    if (!targetUrl.startsWith('/api')) {
      targetUrl = `/api${targetUrl.startsWith('/') ? '' : '/'}${targetUrl}`;
    }
  }

  const token = localStorage.getItem('ERP_AUTH_TOKEN');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(targetUrl, {
    credentials: 'include',
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMsg = data.message || data.error || `Request failed (${response.status})`;
    throw new Error(errorMsg);
  }
  return data.data !== undefined ? data.data : data;
};

// Request interceptor: normalize /api/ prefix and inject auth token if present
api.interceptors.request.use(
  async (config) => {
    // Prevent duplicate /api/api
    if (config.url && config.baseURL && config.baseURL.endsWith('/api')) {
      if (config.url.startsWith('/api/')) {
        config.url = config.url.substring(4);
      } else if (config.url === '/api') {
        config.url = '/';
      }
    }

    // Try to get token from localStorage (fallback if cookie not set)
    const token = localStorage.getItem('ERP_AUTH_TOKEN');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 with refresh (except for login/logout/refresh), then logout
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Do NOT attempt token refresh if request itself was to auth endpoints (/auth/login, etc.)
    if (originalRequest?.url && (
      originalRequest.url.includes('/auth/login') ||
      originalRequest.url.includes('/auth/refresh') ||
      originalRequest.url.includes('/auth/logout')
    )) {
      return Promise.reject(error);
    }

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token via refresh cookie endpoint
        const res = await axios.post(
          `${API_BASE.replace(/\/+$/, '')}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        if (res.data && res.data.accessToken) {
          // Update token in localStorage
          localStorage.setItem('ERP_AUTH_TOKEN', res.data.accessToken);
          originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
          // Retry original request
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed -> logout
        await logoutAutomatic();
      }
    }

    return Promise.reject(error);
  }
);

// Automatic logout helper
async function logoutAutomatic() {
  localStorage.removeItem('ERP_AUTH_TOKEN');
  localStorage.removeItem('ERP_USER_PROFILE');
  // Call server logout
  try {
    await axios.post('/api/auth/logout', {}, { withCredentials: true });
  } catch (e) {
    // Ignore logout errors
  }
}

// Export toast helper (will be integrated with ToastContext)
export const showToast = (message, type = 'info') => {
  // This will be replaced by ToastContext integration
  console.log(`[${type.toUpperCase()}] ${message}`);
};

export default api;