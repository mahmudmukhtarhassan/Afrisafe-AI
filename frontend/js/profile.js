import { API_BASE_URL } from "./config.js";
import { fetchWithAuth, clearTokens, extractErrorMessage } from "./auth.js";

const NIGERIAN_STATES = ["Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno","Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara"];

let currentUser = null;

document.addEventListener("DOMContentLoaded", async () => {
  if (typeof initAuth === "function") {
    const ok = await initAuth();
    if (!ok) return;
  }
  if (typeof populateUserBadge === "function") populateUserBadge();
  if (typeof wireLogout === "function") wireLogout();

  // Populate state dropdown in edit form
  const editStateSelect = document.getElementById("editState");
  NIGERIAN_STATES.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s; opt.textContent = s;
    editStateSelect.appendChild(opt);
  });

  // Load profile
  try {
    const resp = await fetchWithAuth(`${API_BASE_URL}/api/v1/auth/me`, { method: "GET" });
    if (!resp.ok) {
      clearTokens();
      window.location.href = "/login.html";
      return;
    }
    currentUser = await resp.json();
    populateProfile(currentUser);
  } catch {
    clearTokens();
    window.location.href = "/login.html";
    return;
  }

  // Load notification settings
  const settings = window.getNotificationSettings ? window.getNotificationSettings() : {};
  document.getElementById("symptomToggle").checked = settings.symptomReminderEnabled !== false;
  document.getElementById("preventionToggle").checked = settings.preventionReminderEnabled !== false;

  // Dark mode toggle
  const darkToggle = document.getElementById("darkModeToggle");
  const savedTheme = localStorage.getItem("afrisafe_theme") || "light";
  darkToggle.checked = savedTheme === "dark";
  darkToggle.addEventListener("change", () => {
    const theme = darkToggle.checked ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("afrisafe_theme", theme);
  });

  // Save notification toggles
  ["symptomToggle", "preventionToggle"].forEach((id) => {
    document.getElementById(id).addEventListener("change", () => {
      const s = window.getNotificationSettings ? window.getNotificationSettings() : {};
      s.symptomReminderEnabled = document.getElementById("symptomToggle").checked;
      s.preventionReminderEnabled = document.getElementById("preventionToggle").checked;
      if (window.saveNotificationSettings) window.saveNotificationSettings(s);
    });
  });

  // Enable browser notifications
  document.getElementById("enableBrowserBtn").addEventListener("click", async () => {
    if (typeof requestBrowserNotificationPermission === "function") {
      await requestBrowserNotificationPermission();
    }
  });

  // Edit profile
  document.getElementById("editProfileBtn").addEventListener("click", () => {
    document.getElementById("editName").value = currentUser.full_name || "";
    document.getElementById("editAge").value = currentUser.age || "";
    document.getElementById("editGender").value = currentUser.gender || "";
    document.getElementById("editState").value = currentUser.state || "";
    document.getElementById("editModal").classList.remove("hidden");
  });

  document.getElementById("editForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const updates = {
      full_name: document.getElementById("editName").value.trim(),
      age: document.getElementById("editAge").value ? Number(document.getElementById("editAge").value) : null,
      gender: document.getElementById("editGender").value,
      state: document.getElementById("editState").value,
    };
    try {
      const resp = await fetchWithAuth(`${API_BASE_URL}/api/v1/users/profile`, {
        method: "PUT",
        body: JSON.stringify(updates),
      });
      if (!resp.ok) {
        const msg = await extractErrorMessage(resp, "Failed to update profile.");
        if (typeof showToast === "function") showToast(msg, "error");
        return;
      }
      const updated = await resp.json();
      currentUser = { ...currentUser, ...updated };
      populateProfile(currentUser);
      document.getElementById("editModal").classList.add("hidden");
      if (typeof showToast === "function") showToast("Profile updated successfully.", "success");
    } catch (err) {
      if (typeof showToast === "function") showToast(err.message || "Failed to update profile.", "error");
    }
  });

  // Change password
  document.getElementById("changePassBtn").addEventListener("click", () => {
    document.getElementById("passForm").reset();
    document.getElementById("passModal").classList.remove("hidden");
  });

  document.getElementById("passForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const currentPass = document.getElementById("currentPass").value;
    const newPass = document.getElementById("newPass").value;
    const confirmPass = document.getElementById("confirmPass").value;

    if (newPass !== confirmPass) {
      if (typeof showToast === "function") showToast("New passwords do not match.", "error");
      return;
    }
    if (newPass.length < 6) {
      if (typeof showToast === "function") showToast("Password must be at least 6 characters.", "error");
      return;
    }

    try {
      const resp = await fetchWithAuth(`${API_BASE_URL}/api/v1/users/password`, {
        method: "PUT",
        body: JSON.stringify({ current_password: currentPass, new_password: newPass }),
      });
      if (!resp.ok) {
        const msg = await extractErrorMessage(resp, "Failed to change password.");
        if (typeof showToast === "function") showToast(msg, "error");
        return;
      }
      document.getElementById("passModal").classList.add("hidden");
      if (typeof showToast === "function") showToast("Password changed successfully.", "success");
    } catch (err) {
      if (typeof showToast === "function") showToast(err.message || "Failed to change password.", "error");
    }
  });

  // Logout button
  document.getElementById("logoutBtnMain").addEventListener("click", () => {
    clearTokens();
    window.location.href = "/login.html";
  });
});

function populateProfile(me) {
  const name = me.full_name || me.email || "User";
  document.getElementById("profileName").textContent = name;
  document.getElementById("profileEmail").textContent = me.email || "—";
  document.getElementById("avatarCircle").textContent = name.charAt(0).toUpperCase();

  document.getElementById("pName").textContent = me.full_name || "—";
  document.getElementById("pEmail").textContent = me.email || "—";
  document.getElementById("pAge").textContent = me.age ? `${me.age} years` : "—";
  document.getElementById("pGender").textContent = me.gender || "—";
  document.getElementById("pState").textContent = me.state || "—";
  document.getElementById("pJoined").textContent = me.created_at
    ? new Date(me.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "—";

  const userText = document.querySelector(".user-text");
  if (userText) userText.textContent = me.full_name || me.email || "User";
}
