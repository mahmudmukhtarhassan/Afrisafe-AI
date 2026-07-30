// ========================================
// AfriSafe AI - Frontend Configuration
// FastAPI + Supabase
// ========================================

const API_BASE_URL = "https://afrisafe-ai.onrender.com";

// Token storage keys
const TOKEN_KEY = "afrisafe_access_token";
const REFRESH_KEY = "afrisafe_refresh_token";

// ========================================
// Token Helpers
// ========================================

function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function getRefreshToken() {
    return localStorage.getItem(REFRESH_KEY);
}

function saveTokens(accessToken, refreshToken) {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
}

function clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
}

// ========================================
// Authentication Status
// ========================================

function isAuthenticated() {
    return !!getToken();
}

// ========================================
// Refresh Access Token
// ========================================

async function refreshAccessToken() {
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
        clearAuth();
        return false;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                refresh_token: refreshToken
            })
        });

        if (!response.ok) {
            throw new Error("Refresh failed");
        }

        const data = await response.json();

        saveTokens(
            data.access_token,
            data.refresh_token
        );

        return true;

    } catch (error) {
        console.error("Token refresh failed:", error);
        clearAuth();
        return false;
    }
}

// ========================================
// Generic API Request
// ========================================

async function apiRequest(endpoint, options = {}) {

    let token = getToken();

    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };

    if (token && !headers.Authorization) {
        headers.Authorization = `Bearer ${token}`;
    }

    let response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
            ...options,
            headers
        }
    );

    // Access token expired
    if (response.status === 401) {

        const refreshed = await refreshAccessToken();

        if (refreshed) {

            token = getToken();

            headers.Authorization = `Bearer ${token}`;

            response = await fetch(
                `${API_BASE_URL}${endpoint}`,
                {
                    ...options,
                    headers
                }
            );

        } else {

            window.location.href = "login.html";
            throw new Error("Session expired");

        }
    }

    if (!response.ok) {

        let message = `Request failed (${response.status})`;

        try {
            const error = await response.json();
            message = error.detail || error.message || message;
        } catch (_) {}

        throw new Error(message);

    }

    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
        return response.json();
    }

    return response;
}

// ========================================
// Login
// ========================================

async function login(email, password) {

    const result = await apiRequest(
        "/api/v1/auth/login",
        {
            method: "POST",
            body: JSON.stringify({
                email,
                password
            })
        }
    );

    saveTokens(
        result.access_token,
        result.refresh_token
    );

    return result;
}

// ========================================
// Register
// ========================================

async function register(fullName, email, password) {

    return await apiRequest(
        "/api/v1/auth/register",
        {
            method: "POST",
            body: JSON.stringify({
                full_name: fullName,
                email,
                password
            })
        }
    );
}

// ========================================
// Logout
// ========================================

async function logout() {

    const token = getToken();

    try {

        await apiRequest(
            "/api/v1/auth/logout",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

    } catch (error) {

        console.error("Logout failed:", error);

    } finally {

        clearAuth();

        window.location.href = "login.html";

    }
}

// ========================================
// Current User
// ========================================

async function getCurrentUser() {

    return await apiRequest(
        "/api/v1/users/me"
    );
}

// ========================================
// Route Protection
// ========================================

function requireAuth() {

    if (!isAuthenticated()) {
        window.location.href = "login.html";
    }

}

function redirectIfAuthenticated() {

    if (isAuthenticated()) {
        window.location.href = "dashboard.html";
    }

}

// ========================================
// Global Auth Button Helper
// ========================================

document.addEventListener("DOMContentLoaded", () => {

    const logoutBtn = document.getElementById("logoutBtn");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", logout);
    }

});
