/**
 * AfriSafe AI - Registration Controller
 * Real registration via backend API.
 */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  const registerBtn = document.getElementById("registerBtn");
  const formAlert = document.getElementById("formAlert");

  const password = document.getElementById("password");
  const confirmPassword = document.getElementById("confirm_password");

  const togglePassword = document.getElementById("togglePassword");
  const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");

  // If already logged in, go to assessment
  if (isLoggedIn()) {
    window.location.href = "assessment.html";
    return;
  }

  // Password Toggle
  if (togglePassword) {
    togglePassword.addEventListener("click", () => {
      password.type = password.type === "password" ? "text" : "password";
    });
  }

  if (toggleConfirmPassword) {
    toggleConfirmPassword.addEventListener("click", () => {
      confirmPassword.type = confirmPassword.type === "password" ? "text" : "password";
    });
  }

  // Registration Form Submit
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      hideInlineAlert("formAlert");

      const full_name = document.getElementById("full_name").value.trim();
      const email = document.getElementById("email").value.trim();
      const age = parseInt(document.getElementById("age").value, 10);
      const gender = document.getElementById("gender").value;
      const state = document.getElementById("state").value.trim();
      const lga = document.getElementById("lga").value.trim();
      const agree = document.getElementById("agreeTerms").checked;

      // Validation
      if (!full_name) {
        showInlineAlert("formAlert", "Please enter your full name.");
        return;
      }

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showInlineAlert("formAlert", "Please enter a valid email address.");
        return;
      }

      if (!age || age < 1 || age > 120) {
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

      if (password.value.length < 6) {
        showInlineAlert("formAlert", "Password must be at least 6 characters.");
        return;
      }

      if (password.value !== confirmPassword.value) {
        showInlineAlert("formAlert", "Passwords do not match.");
        return;
      }

      registerBtn.disabled = true;
      registerBtn.innerHTML = '<span class="btn-text">Creating Account...</span>';

      try {
        const data = await apiRequest("/api/v1/auth/register", {
          method: "POST",
          body: JSON.stringify({
            full_name,
            email,
            password: password.value,
            age,
            gender,
            state,
            lga,
          }),
        });

        // Auto-login: store tokens if returned
        if (data.access_token) {
          setTokens(data.access_token, data.refresh_token);
          if (data.user) setUser(data.user);
          showInlineAlert("formAlert", "Account created! Redirecting...", "success");
          showToast("Registration successful!", "success");
          setTimeout(() => {
            window.location.href = "assessment.html";
          }, 1000);
        } else {
          showInlineAlert("formAlert", "Registration successful! Redirecting to login...", "success");
          showToast("Registration successful!", "success");
          setTimeout(() => {
            window.location.href = "login.html";
          }, 1500);
        }
      } catch (err) {
        registerBtn.disabled = false;
        registerBtn.innerHTML = '<span class="btn-text">Create Account</span>';

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
});
