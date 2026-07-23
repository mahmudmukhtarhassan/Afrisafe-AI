// ===========================================
// AfriSafe AI Registration
// ===========================================

const API_BASE_URL = "https://afrisafe-ai.onrender.com";
// Development:
// const API_BASE_URL = "http://127.0.0.1:8000";

const form = document.getElementById("registerForm");
const registerBtn = document.getElementById("registerBtn");
const formAlert = document.getElementById("formAlert");

const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirm_password");

const togglePassword = document.getElementById("togglePassword");
const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");

// ===========================================
// Alert
// ===========================================

function showAlert(message, type = "error") {

    formAlert.style.display = "block";
    formAlert.textContent = message;

    formAlert.className = "form-alert";

    if (type === "success") {
        formAlert.classList.add("success");
    } else {
        formAlert.classList.add("error");
    }
}

function hideAlert() {

    formAlert.style.display = "none";

}

// ===========================================
// Password Toggle
// ===========================================

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

// ===========================================
// Registration
// ===========================================

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    hideAlert();

    const full_name =
        document.getElementById("full_name").value.trim();

    const email =
        document.getElementById("email").value.trim();

    const age =
        parseInt(document.getElementById("age").value);

    const gender =
        document.getElementById("gender").value;

    const state =
        document.getElementById("state").value.trim();

    const lga =
        document.getElementById("lga").value.trim();

    const agree =
        document.getElementById("agreeTerms").checked;

    if (!agree) {

        showAlert("Please accept Terms & Conditions.");

        return;

    }

    if (password.value.length < 8) {

        showAlert("Password must contain at least 8 characters.");

        return;

    }

    if (password.value !== confirmPassword.value) {

        showAlert("Passwords do not match.");

        return;

    }

    registerBtn.disabled = true;

    registerBtn.innerHTML = "Creating Account...";

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

                    password: password.value,

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

                "Registration failed."

            );

        }

        showAlert(

            "Registration Successful! Redirecting...",

            "success"

        );

        setTimeout(() => {

            window.location.href = "login.html";

        }, 1500);

    }

    catch (error) {

        showAlert(error.message);

    }

    finally {

        registerBtn.disabled = false;

        registerBtn.innerHTML = "Create Account";

    }

});
