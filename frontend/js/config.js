// Frontend configuration
// Uses relative URLs so requests work against the dev server proxy (same origin)
// in development, and against the Vercel rewrite to the Render backend in production.
function resolveApiBaseUrl() {
  if (window.__API_BASE_URL__) {
    return window.__API_BASE_URL__.replace(/\/$/, "");
  }
  // Relative base: the dev server (server.ts) serves the API at /api/v1/*
  // and the frontend from /frontend/*, and Vercel rewrites /api/* to Render.
  return "";
}
const API_BASE_URL = resolveApiBaseUrl();

export { API_BASE_URL };
