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
  const reminderToggle = document.getElementById("reminderToggle");
  if (reminderToggle) reminderToggle.checked = settings.symptomReminderEnabled !== false;

  // Dark mode toggle
  const darkToggle = document.getElementById("darkModeToggle");
  const savedTheme = localStorage.getItem("afrisafe_theme") || "light";
  if (darkToggle) {
    darkToggle.checked = savedTheme === "dark";
    darkToggle.addEventListener("change", () => {
      const theme = darkToggle.checked ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("afrisafe_theme", theme);
    });
  }

  // Save reminder toggle
  if (reminderToggle) {
    reminderToggle.addEventListener("change", () => {
      const s = window.getNotificationSettings ? window.getNotificationSettings() : {};
      s.symptomReminderEnabled = reminderToggle.checked;
      if (window.saveNotificationSettings) window.saveNotificationSettings(s);
    });
  }

  // Enable browser notifications
  const enableNotifBtn = document.getElementById("enableNotifBtn");
  if (enableNotifBtn) {
    enableNotifBtn.addEventListener("click", async () => {
      if (typeof requestBrowserNotificationPermission === "function") {
        await requestBrowserNotificationPermission();
      }
    });
  }

  // Modal helpers
  function openModal(id) { document.getElementById(id).classList.add("active"); }
  function closeModal(id) { document.getElementById(id).classList.remove("active"); }
  document.querySelectorAll("[data-close]").forEach(btn => {
    btn.addEventListener("click", () => {
      const modal = btn.closest(".modal-overlay");
      if (modal) modal.classList.remove("active");
    });
  });
  document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.classList.remove("active");
    });
  });

  // Edit profile
  document.getElementById("editProfileBtn").addEventListener("click", () => {
    document.getElementById("editName").value = currentUser.full_name || "";
    document.getElementById("editAge").value = currentUser.age || "";
    document.getElementById("editGender").value = currentUser.gender || "";
    document.getElementById("editState").value = currentUser.state || "";
    openModal("editModal");
  });

  document.getElementById("saveProfileBtn").addEventListener("click", async () => {
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
      closeModal("editModal");
      if (typeof showToast === "function") showToast("Profile updated successfully.", "success");
    } catch (err) {
      if (typeof showToast === "function") showToast(err.message || "Failed to update profile.", "error");
    }
  });

  // Change password
  document.getElementById("changePasswordRow").addEventListener("click", () => {
    document.getElementById("currentPass").value = "";
    document.getElementById("newPass").value = "";
    document.getElementById("confirmPass").value = "";
    openModal("passModal");
  });

  document.getElementById("savePassBtn").addEventListener("click", async () => {
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
      closeModal("passModal");
      if (typeof showToast === "function") showToast("Password changed successfully.", "success");
    } catch (err) {
      if (typeof showToast === "function") showToast(err.message || "Failed to change password.", "error");
    }
  });

  // Logout button
  document.getElementById("logoutBtn").addEventListener("click", () => {
    clearTokens();
    window.location.href = "/login.html";
  });
});

function populateProfile(me) {
  const name = me.full_name || me.email || "User";
  document.getElementById("profileName").textContent = name;
  document.getElementById("profileEmail").textContent = me.email || "—";
  document.getElementById("profileAvatar").textContent = name.charAt(0).toUpperCase();

  document.getElementById("infoName").textContent = me.full_name || "—";
  document.getElementById("infoAge").textContent = me.age ? `${me.age} years` : "—";
  document.getElementById("infoGender").textContent = me.gender || "—";
  document.getElementById("infoState").textContent = me.state || "—";
  document.getElementById("infoJoined").textContent = me.created_at
    ? new Date(me.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "—";

  const userText = document.querySelector(".user-text");
  if (userText) userText.textContent = me.full_name || me.email || "User";
}
