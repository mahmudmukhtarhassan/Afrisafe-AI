/**
 * AfriSafe AI - Central Configuration & API Client
 * Single source of truth for API base URL, auth token management,
 * and authenticated fetch requests with automatic error handling.
 */

// Local Express backend API base URL
const API_BASE_URL = "https://afrisafe-ai.onrender.com";

// ---------------------------------------------------------------------------
// Token Storage Helpers
// ---------------------------------------------------------------------------

const TOKEN_KEY = "afrisafe_access_token";
const REFRESH_KEY = "afrisafe_refresh_token";
const USER_KEY = "afrisafe_user";

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

function setTokens(accessToken, refreshToken) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) {
    localStorage.setItem(REFRESH_KEY, refreshToken);
  }
}

function setUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

function isLoggedIn() {
  return !!getToken();
}

/**
 * Redirect to login if no valid token is present.
 * Call at the top of any protected page.
 */
function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = "login.html";
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Authenticated API Client
// ---------------------------------------------------------------------------

/**
 * Wrapper around fetch that:
 *  - prefixes API_BASE_URL
 *  - injects the Authorization header
 *  - parses JSON
 *  - normalises errors into a consistent shape
 *  - auto-refreshes the access token on 401 (once)
 *  - redirects to login on auth failure
 */
async function apiRequest(path, options = {}) {
  const url = path.startsWith("http") ? path : `${"https://afrisafe-ai.onrender.com";}${path}`;

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (err) {
    throw {
      status: 0,
      message: "Unable to reach the server. Check your internet connection.",
    };
  }

  // Attempt a single token refresh on 401
 if (response.status === 401 && getRefreshToken() && !options._retried) {
  const refreshed = await tryRefreshToken();
  if (refreshed) {
    return apiRequest(path, { ...options, _retried: true });
  }
  clearAuth();
  throw { status: 401, message: "Session expired. Please log in again." };
}
  if (response.status === 204) {
    return null;
  }

  let data = null;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const message = extractErrorMessage(data, response.status);
    throw { status: response.status, message, data };
  }

  return data;
}

/**
 * Try to refresh the access token using the stored refresh token.
 * Returns true on success.
 */
async function tryRefreshToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${"https://afrisafe-ai.onrender.com";L}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!response.ok) return false;
    const data = await response.json();
    setTokens(data.access_token, refreshToken);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract a human-readable error message from a failed API response.
 */
function extractErrorMessage(data, status) {
  if (!data) return `Request failed (${status}).`;

  // FastAPI validation error: [{msg: "..."}]
  if (Array.isArray(data.detail)) {
    return data.detail.map((e) => e.msg || JSON.stringify(e)).join("; ");
  }

  // Standard error envelope: {detail: "..."} or {message: "..."}
  if (typeof data.detail === "string") return data.detail;
  if (typeof data.message === "string") return data.message;

  // Nested error object
  if (data.error && typeof data.error.message === "string") return data.error.message;

  return `Request failed (${status}).`;
}

// ---------------------------------------------------------------------------
// Toast / Alert Utility
// ---------------------------------------------------------------------------

/**
 * Show a transient toast notification.
 * type: "success" | "error" | "info" | "warning"
 */
function showToast(message, type = "info", duration = 4000) {
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 9999;
      display: flex; flex-direction: column; gap: 10px; max-width: 380px;
    `;
    document.body.appendChild(container);
  }

  const colors = {
    success: { bg: "#0F9D58", icon: "✓" },
    error: { bg: "#EF4444", icon: "✕" },
    warning: { bg: "#F59E0B", icon: "!" },
    info: { bg: "#1E88E5", icon: "i" },
  };
  const c = colors[type] || colors.info;

  const toast = document.createElement("div");
  toast.style.cssText = `
    background: ${c.bg}; color: #fff; padding: 14px 18px; border-radius: 12px;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif; font-size: 0.9rem;
    font-weight: 600; box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    display: flex; align-items: center; gap: 10px; cursor: pointer;
    transform: translateX(420px); transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
  `;
  toast.innerHTML = `<span style="font-size:1.2rem;font-weight:800;">${c.icon}</span><span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.transform = "translateX(0)";
  });

  const dismiss = () => {
    toast.style.transform = "translateX(420px)";
    setTimeout(() => toast.remove(), 300);
  };
  toast.addEventListener("click", dismiss);
  setTimeout(dismiss, duration);
}

/**
 * Show an inline alert inside a designated alert container element.
 */
function showInlineAlert(elementId, message, type = "error") {
  const el = document.getElementById(elementId);
  if (!el) return;

  el.style.display = "block";
  el.textContent = message;
  el.className = "form-alert";
  if (type === "success") {
    el.classList.add("success");
  } else if (type === "warning") {
    el.classList.add("warning");
  } else {
    el.classList.add("error");
  }
}

function hideInlineAlert(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.style.display = "none";
  el.textContent = "";
}

// ---------------------------------------------------------------------------
// Misc Helpers
// ---------------------------------------------------------------------------

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = String(str);
  return div.innerHTML;
}

function formatDate(dateStr) {
  if (!dateStr) return "--";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "--";
  return d.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Populate the navbar user badge with the logged-in user's name.
 */
function populateUserBadge() {
  const user = getUser();
  const badge = document.querySelector(".user-badge .user-text");
  if (badge && user) {
    badge.textContent = user.full_name || user.email || "User";
  }
}

/**
 * Wire up a logout link/button with id="logoutBtn".
 */
function wireLogout() {
  const btn = document.getElementById("logoutBtn");
  if (!btn) return;
  btn.addEventListener("click", async (e) => {
    e.preventDefault();
    const refreshToken = getRefreshToken();
    try {
      if (refreshToken) {
        await apiRequest("/api/v1/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      }
    } catch {
      // Even if the server call fails, clear local state
    } finally {
      clearAuth();
      window.location.href = "login.html";
    }
  });
}
