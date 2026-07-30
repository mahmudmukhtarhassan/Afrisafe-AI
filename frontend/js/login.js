// ========================================
// AfriSafe AI - Login
// Works with the simplified config.js
// ========================================

document.addEventListener("DOMContentLoaded", () => {
const loginForm = document.getElementById("loginForm");

if (!loginForm) {
console.error("Login form not found");
return;
}

loginForm.addEventListener("submit", async (e) => {
e.preventDefault();

```
const email = document.getElementById("email").value.trim();
const password = document.getElementById("password").value;

const submitBtn = loginForm.querySelector("button[type='submit']");

if (submitBtn) {
  submitBtn.disabled = true;
  submitBtn.textContent = "Signing in...";
}

try {
  // login() is defined in config.js
  const data = await login(email, password);

  console.log("Login successful:", data);

  // Redirect after successful login
  window.location.href = "assessment.html";

} catch (error) {

  console.error("Login error:", error);

  alert(error.message || "Login failed");

} finally {

  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.textContent = "Login";
  }

}
```

});
});

