import { API_BASE_URL } from "./config.js";
import { fetchWithAuth, clearTokens } from "./auth.js";

document.addEventListener("DOMContentLoaded", async () => {
  if (typeof populateUserBadge === "function") populateUserBadge();
  if (typeof wireLogout === "function") wireLogout();

  // Load profile
  try {
    const resp = await fetchWithAuth(`${API_BASE_URL}/api/v1/auth/me`, { method: "GET" });
    if (!resp.ok) {
      clearTokens();
      window.location.href = "/login.html";
      return;
    }
    const me = await resp.json();

    document.getElementById("profileName").textContent = me.full_name || "--";
    document.getElementById("profileEmail").textContent = me.email || "--";
    document.getElementById("profileAge").textContent = me.age ? `${me.age} years` : "--";
    document.getElementById("profileGender").textContent = me.gender || "--";
    document.getElementById("profileState").textContent = me.state || "--";
    document.getElementById("profileJoined").textContent = me.created_at
      ? new Date(me.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
      : "--";

    const avatar = document.getElementById("avatarCircle");
    const name = me.full_name || me.email || "U";
    avatar.textContent = name.charAt(0).toUpperCase();

    // Update nav user badge
    const userText = document.querySelector(".user-text");
    if (userText) userText.textContent = me.full_name || me.email || "User";
  } catch (err) {
    clearTokens();
    window.location.href = "/login.html";
    return;
  }

  // Load notification settings from localStorage
  const settings = getNotificationSettings();
  document.getElementById("symptomEnabled").checked = settings.symptomReminderEnabled;
  document.getElementById("symptomTime").value = settings.symptomReminderTime;
  document.getElementById("preventionEnabled").checked = settings.preventionReminderEnabled;
  document.getElementById("preventionTime").value = settings.preventionReminderTime;
  document.getElementById("browserNotifsEnabled").checked = settings.browserNotifsEnabled;

  // Style sliders based on checkbox state
  function updateSliderStyle(checkbox) {
    const slider = checkbox.nextElementSibling;
    slider.style.backgroundColor = checkbox.checked ? "var(--primary-green)" : "#D1D5DB";
  }
  ["symptomEnabled", "preventionEnabled", "browserNotifsEnabled"].forEach((id) => {
    const cb = document.getElementById(id);
    updateSliderStyle(cb);
    cb.addEventListener("change", () => updateSliderStyle(cb));
  });

  // Enable browser notifications button
  document.getElementById("enableBrowserBtn").addEventListener("click", async () => {
    if (typeof requestBrowserNotificationPermission === "function") {
      const granted = await requestBrowserNotificationPermission();
      if (granted) {
        document.getElementById("browserNotifsEnabled").checked = true;
        updateSliderStyle(document.getElementById("browserNotifsEnabled"));
      }
    }
  });

  // Save settings
  document.getElementById("saveNotifBtn").addEventListener("click", () => {
    const newSettings = {
      symptomReminderEnabled: document.getElementById("symptomEnabled").checked,
      symptomReminderTime: document.getElementById("symptomTime").value,
      preventionReminderEnabled: document.getElementById("preventionEnabled").checked,
      preventionReminderTime: document.getElementById("preventionTime").value,
      browserNotifsEnabled: document.getElementById("browserNotifsEnabled").checked,
      intervalDays: 1,
    };
    saveNotificationSettings(newSettings);
    if (typeof showToast === "function") {
      showToast("Notification settings saved.", "success");
    }
  });
});
