import { API_BASE_URL } from "./config.js";
import { saveTokens, extractErrorMessage } from "./auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  if (!form) return;

  const loginBtn = document.getElementById("loginBtn");
  const formAlert = document.getElementById("formAlert");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const emailError = document.getElementById("emailError");
  const passwordError = document.getElementById("passwordError");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    emailError.textContent = "";
    passwordError.textContent = "";
    emailInput.classList.remove("invalid");
    passwordInput.classList.remove("invalid");
    formAlert.classList.add("hidden");
    formAlert.classList.remove("danger", "info");

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    let valid = true;
    if (!email) {
      emailError.textContent = "Email is required.";
      emailInput.classList.add("invalid");
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      emailError.textContent = "Please enter a valid email address.";
      emailInput.classList.add("invalid");
      valid = false;
    }
    if (!password) {
      passwordError.textContent = "Password is required.";
      passwordInput.classList.add("invalid");
      valid = false;
    }
    if (!valid) return;

    loginBtn.disabled = true;
    const btnText = loginBtn.querySelector(".btn-text");
    const btnSpinner = loginBtn.querySelector(".btn-spinner");
    btnSpinner.classList.remove("hidden");
    btnText.textContent = "Signing in...";

    try {
      const resp = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        formAlert.classList.remove("hidden");
        formAlert.classList.add("danger");
        formAlert.textContent = await extractErrorMessage(resp, "Login failed. Please check your credentials.");
        loginBtn.disabled = false;
        btnSpinner.classList.add("hidden");
        btnText.textContent = "Sign In";
        return;
      }

      saveTokens({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: 3600,
      });

      window.location.href = "/dashboard.html";
    } catch (err) {
      formAlert.classList.remove("hidden");
      formAlert.classList.add("danger");
      formAlert.textContent = err.message || "Unable to connect to the server. Please try again.";
      loginBtn.disabled = false;
      btnSpinner.classList.add("hidden");
      btnText.textContent = "Sign In";
    }
  });
});
