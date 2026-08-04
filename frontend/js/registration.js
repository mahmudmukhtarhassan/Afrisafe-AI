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

    const full_name = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim();
    const age = document.getElementById("age").value;
    const gender = document.getElementById("gender").value;
    const state = document.getElementById("state").value;
    const password = document.getElementById("password").value;
    const terms = document.getElementById("terms").checked;

    let valid = true;
    if (!full_name) {
      formAlert.className = "form-alert danger";
      formAlert.textContent = "Full name is required.";
      valid = false;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      formAlert.className = "form-alert danger";
      formAlert.textContent = formAlert.textContent || "A valid email is required.";
      valid = false;
    }
    if (!password || password.length < 6) {
      formAlert.className = "form-alert danger";
      formAlert.textContent = formAlert.textContent || "Password must be at least 6 characters.";
      valid = false;
    }
    if (!terms) {
      formAlert.className = "form-alert danger";
      formAlert.textContent = "Please accept the Terms of Service and Privacy Policy.";
      valid = false;
    }
    if (!valid) {
      if (typeof formAlert.animate === "function") {
        formAlert.animate([{ transform: "translateX(-8px)" }, { transform: "translateX(8px)" }, { transform: "translateX(0)" }], { duration: 300 });
      }
      return;
    }

    registerBtn.classList.add("loading");
    registerBtn.disabled = true;

    try {
      const resp = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, full_name, age: age ? Number(age) : undefined, gender, state }),
      });

      const data = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        formAlert.className = "form-alert danger";
        formAlert.textContent = await extractErrorMessage(resp, "Registration failed. Please try again.");
        registerBtn.classList.remove("loading");
        registerBtn.disabled = false;
        return;
      }

      saveTokens({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: 3600,
      });
      formAlert.className = "form-alert success";
      formAlert.textContent = "Registration successful. Redirecting...";
      
      setTimeout(() => {
        window.location.href = "./dashboard.html";
      }, 300);
    } catch (err) {
      formAlert.className = "form-alert danger";
      formAlert.textContent = err.message || "Unable to connect to the server. Please try again.";
      registerBtn.classList.remove("loading");
      registerBtn.disabled = false;
    }
  });
});
