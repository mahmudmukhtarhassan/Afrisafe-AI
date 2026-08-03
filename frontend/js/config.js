// frontend/js/config.js
// AfriSafe AI frontend configuration
// Connected to your Render backend: https://afrisafe-ai.onrender.com

function resolveApiBaseUrl() {
// Allow overriding from a global variable if needed
if (window.**API_BASE_URL**) {
return window.**API_BASE_URL**.replace(//$/, "");
}

// Production backend (Render)
return "https://afrisafe-ai.onrender.com";
}

const API_BASE_URL = resolveApiBaseUrl();

export { API_BASE_URL };

