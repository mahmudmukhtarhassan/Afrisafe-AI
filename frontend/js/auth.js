// Authentication helpers: token storage, refresh, fetch wrapper
import { API_BASE_URL } from "./config.js";

const TOKEN_KEY = "afrisafe_tokens";

function saveTokens({ access_token, refresh_token, expires_in }) {
  const expires_at = expires_in ? Date.now() + expires_in * 1000 : null;
  const payload = { access_token, refresh_token, expires_at };
  localStorage.setItem(TOKEN_KEY, JSON.stringify(payload));
}

function loadTokens() {
  const raw = localStorage.getItem(TOKEN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
}

function isTokenExpired() {
  const tokens = loadTokens();
  if (!tokens || !tokens.expires_at) return false;
  return Date.now() > tokens.expires_at - 60000;
}

async function refreshAccessToken() {
  const tokens = loadTokens();
  if (!tokens || !tokens.refresh_token) {
    clearTokens();
    throw new Error("No refresh token available");
  }
  let resp;
  try {
    resp = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: tokens.refresh_token }),
    });
  } catch (err) {
    clearTokens();
    throw new Error("Network error during token refresh");
  }

  if (!resp.ok) {
    clearTokens();
    const errData = await resp.json().catch(() => ({}));
    throw new Error(errData.detail || "Session expired. Please log in again.");
  }

  const data = await resp.json();
  saveTokens({
    access_token: data.access_token,
    refresh_token: data.refresh_token || tokens.refresh_token,
    expires_in: 3600,
  });
  return data.access_token;
}

function extractErrorMessage(resp, fallback) {
  return resp.json()
    .then((data) => {
      if (typeof data === "string") return data;
      if (data.detail) {
        if (typeof data.detail === "string") return data.detail;
        if (Array.isArray(data.detail)) {
          return data.detail.map((e) => e.msg || JSON.stringify(e)).join("; ");
        }
        return JSON.stringify(data.detail);
      }
      if (data.message) return data.message;
      return fallback;
    })
    .catch(() => fallback);
}

async function fetchWithAuth(url, options = {}, retry = true) {
  const tokens = loadTokens();
  if (!options.headers) options.headers = {};
  if (tokens && tokens.access_token) {
    options.headers["Authorization"] = `Bearer ${tokens.access_token}`;
  }
  options.headers["Content-Type"] = options.headers["Content-Type"] || "application/json";

  let resp;
  try {
    resp = await fetch(url, options);
  } catch (err) {
    throw new Error("Unable to reach the server. Please check your connection and try again.");
  }

  if (resp.status === 401 && retry) {
    try {
      const newAccess = await refreshAccessToken();
      options.headers["Authorization"] = `Bearer ${newAccess}`;
      resp = await fetch(url, options);
    } catch (err) {
      clearTokens();
      throw err;
    }
  }
  return resp;
}

export { saveTokens, loadTokens, clearTokens, refreshAccessToken, fetchWithAuth, isTokenExpired, extractErrorMessage };
