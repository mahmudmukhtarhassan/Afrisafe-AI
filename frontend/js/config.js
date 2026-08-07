// frontend/js/config.js
// AfriSafe AI frontend configuration
// Connected to your Render backend

function resolveApiBaseUrl() {
  // Allow overriding from a global variable if needed
  if (typeof window !== 'undefined' && window.API_BASE_URL) {
    return String(window.API_BASE_URL).replace(/\/$/, '');
  }

  // Render production backend
  return 'https://afrisafe-ai.onrender.com';
}

const API_BASE_URL = resolveApiBaseUrl();

export { API_BASE_URL };
