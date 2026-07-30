/**
 * AfriSafe AI - Registration Controller
 * Real registration via backend API.
 */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  const registerBtn = document.getElementById("registerBtn");

  const password = document.getElementById("password");
  const confirmPassword = document.getElementById("confirm_password");

  const togglePassword = document.getElementById("togglePassword");
  const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");

  // If already logged in, go to assessment
  if (typeof isLoggedIn === "function" && isLoggedIn()) {
    window.location.href = "assessment.html";
    return;
  }

  // Password Toggle
  if (togglePassword && password) {
    togglePassword.addEventListener("click", () => {
      password.type = password.type === "password" ? "text" : "password";
    });
  }

  if (toggleConfirmPassword && confirmPassword) {
    toggleConfirmPassword.addEventListener("click", () => {
      confirmPassword.type = confirmPassword.type === "password" ? "text" : "password";
    });
  }

  // Registration Form Submit
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (typeof hideInlineAlert === "function") hideInlineAlert("formAlert");

      // Safely read input values
      const full_name = document.getElementById("full_name")?.value.trim() || "";
      const email = document.getElementById("email")?.value.trim() || "";
      const ageRaw = document.getElementById("age")?.value;
      const age = ageRaw ? parseInt(ageRaw, 10) : NaN;
      const gender = document.getElementById("gender")?.value || "";
      const state = document.getElementById("state")?.value.trim() || "";
      const lga = document.getElementById("lga")?.value.trim() || "";
      const agree = document.getElementById("agreeTerms")?.checked || false;

      const pwdValue = password?.value || "";
      const confirmPwdValue = confirmPassword?.value || "";

      // Validation
      if (!full_name) {
        showInlineAlert("formAlert", "Please enter your full name.");
        return;
      }

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showInlineAlert("formAlert", "Please enter a valid email address.");
        return;
      }

      if (isNaN(age) || age < 1 || age > 120) {
        showInlineAlert("formAlert", "Please enter a valid age (1-120).");
        return;
      }

      if (!gender) {
        showInlineAlert("formAlert", "Please select your gender.");
        return;
      }

      if (!state) {
        showInlineAlert("formAlert", "Please enter your state.");
        return;
      }

      if (!lga) {
        showInlineAlert("formAlert", "Please enter your Local Government Area.");
        return;
      }

      if (!agree) {
        showInlineAlert("formAlert", "Please accept the Terms & Conditions.");
        return;
      }

      if (pwdValue.length < 6) {
        showInlineAlert("formAlert", "Password must be at least 6 characters.");
        return;
      }

      if (pwdValue !== confirmPwdValue) {
        showInlineAlert("formAlert", "Passwords do not match.");
        return;
      }

      setLoadingState(true);

      try {
        const data = await apiRequest("/api/v1/auth/register", {
          method: "POST",
          body: JSON.stringify({
            full_name,
            email,
            password: pwdValue,
            age,
            gender,
            state,
            lga,
          }),
        });

        // Auto-login: store tokens if returned
        if (data.access_token) {
          if (typeof setTokens === "function") setTokens(data.access_token, data.refresh_token);
          if (data.user && typeof setUser === "function") setUser(data.user);

          showInlineAlert("formAlert", "Account created! Redirecting...", "success");
          if (typeof showToast === "function") showToast("Registration successful!", "success");

          setTimeout(() => {
            window.location.href = "assessment.html";
          }, 1000);
        } else {
          showInlineAlert("formAlert", "Registration successful! Redirecting to login...", "success");
          if (typeof showToast === "function") showToast("Registration successful!", "success");

          setTimeout(() => {
            window.location.href = "login.html";
          }, 1500);
        }
      } catch (err) {
        setLoadingState(false);

        if (err.status === 409) {
          showInlineAlert("formAlert", "An account with this email already exists.");
        } else if (err.status === 422) {
          showInlineAlert("formAlert", err.message || "Please check your input.");
        } else if (err.status === 400) {
          showInlineAlert("formAlert", err.message || "Invalid request.");
        } else {
          showInlineAlert("formAlert", err.message || "Registration failed. Please try again.");
        }
      }
    });
  }

  function setLoadingState(isLoading) {
    if (!registerBtn) return;

    const btnText = registerBtn.querySelector(".btn-text");
    const btnSpinner = registerBtn.querySelector(".btn-spinner");

    registerBtn.disabled = isLoading;

    if (btnSpinner) {
      btnSpinner.classList.toggle("hidden", !isLoading);
    }

    if (btnText) {
      btnText.textContent = isLoading ? "Creating Account..." : "Create Account";
    } else if (!btnSpinner) {
      registerBtn.textContent = isLoading ? "Creating Account..." : "Create Account";
    }
  }
});
