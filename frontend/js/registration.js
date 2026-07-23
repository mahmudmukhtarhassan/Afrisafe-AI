// ==========================================
// AfriSafe AI Registration
// ==========================================

const API_BASE_URL = "http://127.0.0.1:8000";

const registerForm = document.getElementById("registerForm");
const registerBtn = document.getElementById("registerBtn");
const alertBox = document.getElementById("alertBox");

const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirm_password");

const togglePassword = document.getElementById("togglePassword");
const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");

// ==========================================
// Show Alert
// ==========================================

function showAlert(message, type = "info") {

    alertBox.classList.remove("hidden", "info", "danger");

    alertBox.classList.add(type);

    alertBox.textContent = message;
}

// ==========================================
// Hide Alert
// ==========================================

function hideAlert() {

    alertBox.classList.add("hidden");

}

// ==========================================
// Toggle Password
// ==========================================

togglePassword.addEventListener("click", () => {

    password.type =
        password.type === "password"
            ? "text"
            : "password";

});

toggleConfirmPassword.addEventListener("click", () => {

    confirmPassword.type =
        confirmPassword.type === "password"
            ? "text"
            : "password";

});

// ==========================================
// Register
// ==========================================

registerForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    hideAlert();

    const full_name =
        document.getElementById("full_name").value.trim();

    const email =
        document.getElementById("email").value.trim();

    const age =
        Number(document.getElementById("age").value);

    const gender =
        document.getElementById("gender").value;

    const state =
        document.getElementById("state").value.trim();

    const lga =
        document.getElementById("lga").value.trim();

    const passwordValue =
        password.value;

    const confirmValue =
        confirmPassword.value;

    // Validation

    if (
        !full_name ||
        !email ||
        !passwordValue ||
        !confirmValue ||
        !age ||
        !gender ||
        !state
    ) {

        showAlert("Please fill all required fields.", "danger");

        return;

    }

    if (passwordValue.length < 8) {

        showAlert(
            "Password must be at least 8 characters.",
            "danger"
        );

        return;

    }

    if (passwordValue !== confirmValue) {

        showAlert(
            "Passwords do not match.",
            "danger"
        );

        return;

    }

    registerBtn.disabled = true;

    registerBtn.innerHTML = `
        <span class="btn-spinner"></span>
        Creating Account...
    `;

    try {

        const response = await fetch(

            `${API_BASE_URL}/api/v1/auth/register`,

            {

                method: "POST",

                headers: {

                    "Content-Type": "application/json"

                },

                body: JSON.stringify({

                    full_name,

                    email,

                    password: passwordValue,

                    age,

                    gender,

                    state,

                    lga

                })

            }

        );

        const data = await response.json();

        if (!response.ok) {

            throw new Error(

                data.detail ||
                data.message ||
                "Registration failed."

            );

        }

        showAlert(

            "Registration successful! Redirecting...",

            "info"

        );

        setTimeout(() => {

            window.location.href = "login.html";

        }, 1500);

    }

    catch (error) {

        showAlert(error.message, "danger");

    }

    finally {

        registerBtn.disabled = false;

        registerBtn.innerHTML = "Create Account";

    }

});
