// Frontend configuration
// In development, API calls go to the same origin (the Express server on port 3000).
// In production (Vercel), API calls go to the Render backend.
// Override at runtime by setting window.__API_BASE_URL__.
function resolveApiBaseUrl() {
  if (window.__API_BASE_URL__) {
    return window.__API_BASE_URL__.replace(/\/$/, "");
  }
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") {
    return "";
  }
  return "https://afrisafe-ai-backend.onrender.com";
}
const API_BASE_URL = resolveApiBaseUrl();

export { API_BASE_URL };
