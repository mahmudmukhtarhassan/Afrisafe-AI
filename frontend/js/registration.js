import { API_BASE_URL } from "./config.js";
import { saveTokens } from "./auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = form.elements["email"].value;
    const password = form.elements["password"].value;
    const resp = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ detail: resp.statusText }));
      alert("Registration failed: " + (err.detail || JSON.stringify(err)));
      return;
    }
    const data = await resp.json();
    saveTokens({ access_token: data.access_token, refresh_token: data.refresh_token, expires_in: data.expires_in || 3600 });
    window.location.href = "/dashboard.html";
  });
});
