// Frontend configuration
// Ensure this points at the deployed backend (Render)
const API_BASE_URL = (window.__API_BASE_URL__ || "https://afrisafe-ai.onrender.com").replace(/\/$/, "");
const FRONTEND_URL = (window.__FRONTEND_URL__ || "https://afrisafe-ai.vercel.app").replace(/\/$/, "");

export { API_BASE_URL, FRONTEND_URL };
