import { API_BASE_URL } from "./config.js";
import { saveTokens, extractErrorMessage } from "./auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  if (!form) return;

  const registerBtn = document.getElementById("registerBtn");
  const formAlert = document.getElementById("formAlert");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    formAlert.className = "form-alert";
    formAlert.textContent = "";

    const full_name = document.getElementById("full_name").value.trim();
    const email = document.getElementById("email").value.trim();
    const age = document.getElementById("age").value;
    const gender = document.getElementById("gender").value;
    const state = document.getElementById("state").value;
    const password = document.getElementById("password").value;
    const terms = document.getElementById("termsAgree").checked;

    let valid = true;
    if (!full_name) {
      document.getElementById("fullNameError").textContent = "Full name is required.";
      valid = false;
    } else {
      document.getElementById("fullNameError").textContent = "";
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      document.getElementById("emailError").textContent = "A valid email is required.";
      valid = false;
    } else {
      document.getElementById("emailError").textContent = "";
    }
    if (!password || password.length < 6) {
      document.getElementById("passwordError").textContent = "Password must be at least 6 characters.";
      valid = false;
    } else {
      document.getElementById("passwordError").textContent = "";
    }
    if (!terms) {
      formAlert.className = "form-alert warning";
      formAlert.textContent = "Please accept the Terms of Service and Privacy Policy.";
      valid = false;
    }
    if (!valid) return;

    registerBtn.disabled = true;
    const btnText = registerBtn.querySelector(".btn-text");
    const btnSpinner = registerBtn.querySelector(".btn-spinner");
    btnSpinner.classList.remove("hidden");
    btnText.textContent = "Creating account...";

    try {
      const resp = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, full_name, age: age ? Number(age) : undefined, gender, state }),
      });

      const data = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        formAlert.className = "form-alert error";
        formAlert.textContent = await extractErrorMessage(resp, "Registration failed. Please try again.");
        registerBtn.disabled = false;
        btnSpinner.classList.add("hidden");
        btnText.textContent = "Create Account";
        return;
      }

      saveTokens({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: 3600,
      });
      window.location.href = "/dashboard.html";
    } catch (err) {
      formAlert.className = "form-alert error";
      formAlert.textContent = err.message || "Unable to connect to the server. Please try again.";
      registerBtn.disabled = false;
      btnSpinner.classList.add("hidden");
      btnText.textContent = "Create Account";
    }
  });
});
