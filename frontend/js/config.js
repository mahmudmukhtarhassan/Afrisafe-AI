// ========================================
// AfriSafe AI - Simple Frontend Config
// Render + FastAPI + Supabase
// ========================================

const API_BASE_URL = "https://afrisafe-ai.onrender.com";

// Local storage key
const TOKEN_KEY = "afrisafe_access_token";

// ----------------------
// Token helpers
// ----------------------

function getToken() {
return localStorage.getItem(TOKEN_KEY);
}

function saveToken(token) {
localStorage.setItem(TOKEN_KEY, token);
}

function clearAuth() {
localStorage.removeItem(TOKEN_KEY);
}

function isAuthenticated() {
return !!getToken();
}

// ----------------------
// API request helper
// ----------------------

async function apiRequest(endpoint, options = {}) {
const headers = {
"Content-Type": "application/json",
...(options.headers || {})
};

const token = getToken();
if (token) {
headers.Authorization = `Bearer ${token}`;
}

const response = await fetch(`${API_BASE_URL}${endpoint}`, {
...options,
headers
});

if (!response.ok) {
let message = `Request failed (${response.status})`;

```
try {
  const err = await response.json();
  message = err.detail || err.message || message;
} catch (_) {}

throw new Error(message);
```

}

const contentType = response.headers.get("content-type");

if (contentType && contentType.includes("application/json")) {
return response.json();
}

return response;
}

// ----------------------
// Authentication
// ----------------------

async function login(email, password) {
const data = await apiRequest("/api/v1/auth/login", {
method: "POST",
body: JSON.stringify({
email,
password
})
});

saveToken(data.access_token);

return data;
}

async function register(fullName, email, password) {
return await apiRequest("/api/v1/auth/register", {
method: "POST",
body: JSON.stringify({
full_name: fullName,
email,
password
})
});
}

async function logout() {
clearAuth();
window.location.href = "login.html";
}

// ----------------------
// User
// ----------------------

async function getCurrentUser() {
return await apiRequest("/api/v1/users/me");
}

// ----------------------
// Route protection
// ----------------------

function requireAuth() {
if (!isAuthenticated()) {
window.location.href = "login.html";
}
}

function redirectIfAuthenticated() {
if (isAuthenticated()) {
window.location.href = "assessment.html";
}
}

// ----------------------
// Auto logout button
// ----------------------

document.addEventListener("DOMContentLoaded", () => {
const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
logoutBtn.addEventListener("click", logout);
}
});

