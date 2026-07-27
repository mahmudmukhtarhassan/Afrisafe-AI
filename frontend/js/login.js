/**
 * AfriSafe AI - Login Controller
 * Real JWT authentication via backend API.
 */

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const emailError = document.getElementById("emailError");
  const passwordError = document.getElementById("passwordError");
  const togglePasswordBtn = document.getElementById("togglePassword");
  const formAlert = document.getElementById("formAlert");

  // Clear any existing triage result on login load
  localStorage.removeItem("triageResult");
  localStorage.removeItem("patientInputs");

  // If already logged in, go to assessment
  if (isLoggedIn()) {
    window.location.href = "assessment.html";
    return;
  }

  // Toggle Password Visibility
  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener("click", () => {
      const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
      passwordInput.setAttribute("type", type);

      const eyeOpen = togglePasswordBtn.querySelector(".eye-open");
      const eyeClosed = togglePasswordBtn.querySelector(".eye-closed");

      if (type === "text") {
        eyeOpen.classList.add("hidden");
        eyeClosed.classList.remove("hidden");
        togglePasswordBtn.setAttribute("aria-label", "Hide password");
      } else {
        eyeOpen.classList.remove("hidden");
        eyeClosed.classList.add("hidden");
        togglePasswordBtn.setAttribute("aria-label", "Show password");
      }
    });
  }

  // Handle Login Form Submission
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      let isValid = true;
      const email = emailInput.value.trim();
      const password = passwordInput.value;

      // Reset errors
      emailError.textContent = "";
      passwordError.textContent = "";
      emailInput.classList.remove("invalid");
      passwordInput.classList.remove("invalid");
      formAlert.classList.add("hidden");

      // Validate Email
      if (!email) {
        emailError.textContent = "Email address is required.";
        emailInput.classList.add("invalid");
        isValid = false;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        emailError.textContent = "Please enter a valid email address.";
        emailInput.classList.add("invalid");
        isValid = false;
      }

      // Validate Password
      if (!password) {
        passwordError.textContent = "Password is required.";
        passwordInput.classList.add("invalid");
        isValid = false;
      }

      if (!isValid) return;

      setLoadingState(true);

      try {
        const data = await apiRequest("/api/v1/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });

        setTokens(data.access_token, data.refresh_token);
        if (data.user) setUser(data.user);

        showToast("Login successful! Redirecting...", "success");
        setTimeout(() => {
          window.location.href = "assessment.html";
        }, 800);
      } catch (err) {
        setLoadingState(false);
        if (err.status === 401 || err.status === 403) {
          showToast(err.message || "Invalid email or password.", "error");
        } else if (err.status === 422) {
          showToast(err.message || "Please check your input.", "error");
        } else {
          showToast(err.message || "Login failed. Please try again.", "error");
        }
      }
    });
  }

  function setLoadingState(isLoading) {
    const loginBtn = document.getElementById("loginBtn");
    const btnText = loginBtn.querySelector(".btn-text");
    const btnSpinner = loginBtn.querySelector(".btn-spinner");

    if (isLoading) {
      loginBtn.disabled = true;
      btnSpinner.classList.remove("hidden");
      btnText.textContent = "Signing In...";
    } else {
      loginBtn.disabled = false;
      btnSpinner.classList.add("hidden");
      btnText.textContent = "Sign In";
    }
  }
});
