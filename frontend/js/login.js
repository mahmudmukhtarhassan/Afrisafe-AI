// ========================================
// AfriSafe AI - Login
// ========================================

document.addEventListener("DOMContentLoaded", () => {
// If already logged in, go to assessment page
if (isAuthenticated()) {
window.location.href = "assessment.html";
return;
}

```
const loginForm = document.getElementById("loginForm");

if (!loginForm) {
    console.error("Login form not found");
    return;
}

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    const submitBtn = loginForm.querySelector("button[type='submit']");

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Signing in...";
    }

    try {
        const data = await login(email, password);

        console.log("Login successful", data);

        // login() in config.js already saves tokens
        window.location.href = "assessment.html";

    } catch (error) {
        console.error(error);
        alert(error.message || "Login failed");
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Login";
        }
    }
});
```

});
