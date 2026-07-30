// ========================================
// AfriSafe AI - Login
// Clean version for Render backend
// ========================================

document.addEventListener("DOMContentLoaded", () => {
const form = document.getElementById("loginForm");
const status = document.getElementById("status");
const button = document.getElementById("loginBtn");

form.addEventListener("submit", async (e) => {
e.preventDefault();

```
status.textContent = "";

const email = document.getElementById("email").value.trim();
const password = document.getElementById("password").value;

button.disabled = true;
button.textContent = "Signing in...";

try {
  const response = await fetch("https://afrisafe-ai.onrender.com/api/v1/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: email,
      password: password
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Login failed");
  }

  // Save tokens
  localStorage.setItem("afrisafe_access_token", data.access_token);
  localStorage.setItem("afrisafe_refresh_token", data.refresh_token);

  // Optional user data
  if (data.user) {
    localStorage.setItem("afrisafe_user", JSON.stringify(data.user));
  }

  // Redirect
  window.location.href = "assessment.html";

} catch (err) {

  console.error(err);
  status.textContent = err.message || "Unable to login. Please try again.";

} finally {

  button.disabled = false;
  button.textContent = "Sign In";

}
```

});
});
