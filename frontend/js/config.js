// Frontend configuration
// Production backend on Render. Override at runtime via window.__API_BASE_URL__.
function resolveApiBaseUrl() {
  if (window.__API_BASE_URL__) {
    return window.__API_BASE_URL__.replace(/\/$/, "");
  }
  return "https://afrisafe-ai.onrender.com";
}
const API_BASE_URL = resolveApiBaseUrl();

export { API_BASE_URL };
