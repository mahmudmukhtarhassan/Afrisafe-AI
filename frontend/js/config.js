// Frontend configuration
// In development, API calls go to the same origin (the Express server).
// Override at runtime by setting window.__API_BASE_URL__.
const API_BASE_URL = (window.__API_BASE_URL__ || "").replace(/\/$/, "");

export { API_BASE_URL };
