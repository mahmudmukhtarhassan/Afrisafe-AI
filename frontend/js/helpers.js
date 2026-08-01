/**
 * AfriSafe AI - Shared UI Helpers
 * Provides global utilities used across all pages: auth guards, user badge,
 * logout wiring, toast notifications, HTML escaping, and API requests.
 */
import { API_BASE_URL } from "./config.js";
import { fetchWithAuth, loadTokens, clearTokens } from "./auth.js";

// --- Auth Guard ---
function requireAuth() {
  const tokens = loadTokens();
  if (!tokens || !tokens.access_token) {
    window.location.href = "/login.html";
    return false;
  }
  return true;
}

// --- Populate User Badge in Navbar ---
async function populateUserBadge() {
  const userText = document.querySelector(".user-text");
  if (!userText) return;
  try {
    const resp = await fetchWithAuth(`${API_BASE_URL}/api/v1/auth/me`, { method: "GET" });
    if (resp.ok) {
      const me = await resp.json();
      userText.textContent = me.full_name || me.email || "User";
    }
  } catch {}
}

// --- Wire Logout Button ---
function wireLogout() {
  const btn = document.getElementById("logoutBtn");
  if (!btn) return;
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    clearTokens();
    window.location.href = "/login.html";
  });
}

// --- Toast Notifications ---
function showToast(message, type = "info", duration = 4000) {
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.style.cssText =
      "position:fixed;top:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:10px;pointer-events:none;";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  const colors = {
    success: { bg: "rgba(16,185,129,0.95)", icon: "✓" },
    error: { bg: "rgba(239,68,68,0.95)", icon: "✕" },
    warning: { bg: "rgba(245,158,11,0.95)", icon: "!" },
    info: { bg: "rgba(30,136,229,0.95)", icon: "i" },
  };
  const c = colors[type] || colors.info;

  toast.style.cssText = `
    background:${c.bg};color:#fff;padding:12px 18px;border-radius:12px;
    font-size:0.875rem;font-weight:600;font-family:inherit;
    box-shadow:0 8px 24px rgba(0,0,0,0.15);display:flex;align-items:center;gap:10px;
    pointer-events:auto;max-width:380px;animation:toastSlide 0.3s ease;
  `;
  toast.innerHTML = `<span style="font-weight:800;">${c.icon}</span><span>${escapeHtml(message)}</span>`;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// --- HTML Escape ---
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// --- Format Date ---
function formatDate(dateString) {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
}

// --- API Request Helper ---
async function apiRequest(url, method = "GET", body = null, auth = true) {
  const options = { method, headers: {} };
  if (body) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  if (auth) {
    return await fetchWithAuth(`${API_BASE_URL}${url}`, options);
  } else {
    return await fetch(`${API_BASE_URL}${url}`, options);
  }
}

// Expose globally for non-module scripts
window.requireAuth = requireAuth;
window.populateUserBadge = populateUserBadge;
window.wireLogout = wireLogout;
window.showToast = showToast;
window.escapeHtml = escapeHtml;
window.formatDate = formatDate;
window.apiRequest = apiRequest;
