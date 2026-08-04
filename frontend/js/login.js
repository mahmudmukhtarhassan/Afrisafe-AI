import { API_BASE_URL } from "./config.js";
import { saveTokens, extractErrorMessage } from "./auth.js";

document.addEventListener("DOMContentLoaded", () => {
const form = document.getElementById("loginForm");
if (!form) return;

const loginBtn = document.getElementById("loginBtn");
const formAlert = document.getElementById("formAlert");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

form.addEventListener("submit", async (e) => {
e.preventDefault();

emailInput.classList.remove("is-error");
passwordInput.classList.remove("is-error");
formAlert.className = "form-alert";
formAlert.textContent = "";

const email = emailInput.value.trim();
const password = passwordInput.value;

let valid = true;

if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  emailInput.classList.add("is-error");
  valid = false;
}

if (!password) {
  passwordInput.classList.add("is-error");
  valid = false;
}

if (!valid) {
  formAlert.className = "form-alert danger";
  formAlert.textContent = "Please enter a valid email and password.";
  return;
}

loginBtn.classList.add("loading");
loginBtn.disabled = true;

try {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    formAlert.className = "form-alert danger";
    formAlert.textContent = await extractErrorMessage(
      response,
      data.detail || data.message || "Login failed. Please check your credentials."
    );

    loginBtn.classList.remove("loading");
    loginBtn.disabled = false;
    return;
  }

  if (!data.access_token) {
    formAlert.className = "form-alert danger";
    formAlert.textContent = "Invalid login response from server. Please try again.";
    loginBtn.classList.remove("loading");
    loginBtn.disabled = false;
    return;
  }

  saveTokens({
    access_token: data.access_token,
    refresh_token: data.refresh_token || "",
    token_type: data.token_type || "bearer",
    expires_in: 3600,
  });

  formAlert.className = "form-alert success";
  formAlert.textContent = "Login successful. Redirecting...";

  setTimeout(() => {
    window.location.href = "./dashboard.html";
  }, 300);
} catch (error) {
  console.error("Login error:", error);

  formAlert.className = "form-alert danger";
  formAlert.textContent =
    error.message || "Unable to connect to the server. Please try again.";

  loginBtn.classList.remove("loading");
  loginBtn.disabled = false;
}

});
});
