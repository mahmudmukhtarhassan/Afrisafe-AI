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

async function refreshAccessToken() {
  const tokens = loadTokens();
  if (!tokens || !tokens.refresh_token) throw new Error("No refresh token");
  const resp = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: tokens.refresh_token }),
  });
  if (!resp.ok) {
    clearTokens();
    throw new Error("Refresh failed");
  }
  const data = await resp.json();
  // Supabase returns no expires_in via this proxy; we keep previous expiry heuristic
  saveTokens({ access_token: data.access_token, refresh_token: data.refresh_token, expires_in: 3600 });
  return data.access_token;
}

async function fetchWithAuth(url, options = {}, retry = true) {
  const tokens = loadTokens();
  if (!options.headers) options.headers = {};
  if (tokens && tokens.access_token) {
    options.headers["Authorization"] = `Bearer ${tokens.access_token}`;
  }
  options.headers["Content-Type"] = options.headers["Content-Type"] || "application/json";

  let resp = await fetch(url, options);
  if (resp.status === 401 && retry) {
    try {
      const newAccess = await refreshAccessToken();
      options.headers["Authorization"] = `Bearer ${newAccess}`;
      resp = await fetch(url, options);
    } catch (err) {
      // refresh failed
      clearTokens();
      throw err;
    }
  }
  return resp;
}

export { saveTokens, loadTokens, clearTokens, refreshAccessToken, fetchWithAuth };
