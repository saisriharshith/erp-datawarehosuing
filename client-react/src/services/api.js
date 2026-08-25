/**
 * Centralized API Service for React Frontend
 */

const API_BASE = '/api';

export async function fetchAPI(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const token = localStorage.getItem('ERP_AUTH_TOKEN');
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  const response = await fetch(url, config);
  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = json.message || json.error || `HTTP ${response.status}: Request failed`;
    throw new Error(errorMsg);
  }

  return json.data !== undefined ? json.data : json;
}
