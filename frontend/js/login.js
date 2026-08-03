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
      const resp = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        formAlert.className = "form-alert danger";
        formAlert.textContent = await extractErrorMessage(resp, "Login failed. Please check your credentials.");
        loginBtn.classList.remove("loading");
        loginBtn.disabled = false;
        return;
      }

      saveTokens({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: 3600,
      });

      window.location.href = "/dashboard.html";
    } catch (err) {
      formAlert.className = "form-alert danger";
      formAlert.textContent = err.message || "Unable to connect to the server. Please try again.";
      loginBtn.classList.remove("loading");
      loginBtn.disabled = false;
    }
  });
});
