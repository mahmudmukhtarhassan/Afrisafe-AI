/**
 * AfriSafe AI - Local Notification & Reminder System
 * Manages in-app notification center, scheduled local reminders for symptom logging
 * and daily malaria prevention tips, plus Browser Web Notification API integration.
 */

const NOTIF_SETTINGS_KEY = "afrisafe_notif_settings";
const NOTIF_ITEMS_KEY = "afrisafe_notif_items";
const NOTIF_LAST_TRIGGER_KEY = "afrisafe_notif_last_trigger";

// Default Malaria Prevention Tips Bank
const DAILY_PREVENTION_TIPS = [
  {
    title: "Bed Net Protection Reminder",
    body: "Ensure all household members sleep under Long-Lasting Insecticide-Treated Nets (LLINs) tonight.",
    link: "guidelines.html"
  },
  {
    title: "Standing Water Check",
    body: "Check around your yard for open puddles, clogged gutters, or uncovered water drums and drain them.",
    link: "guidelines.html"
  },
  {
    title: "Dusk Mosquito Defense",
    body: "Anopheles mosquitoes are active at night. Wear long-sleeved clothing and use mosquito repellent.",
    link: "guidelines.html"
  },
  {
    title: "Test Before Treatment Policy",
    body: "Experiencing fever or chills? Get a rapid diagnostic test (RDT) before taking antimalarials.",
    link: "assessment.html"
  },
  {
    title: "Children & Infant Immunization",
    body: "Check if eligible children (5-36 months) are up to date on their R21 malaria vaccine doses.",
    link: "guidelines.html"
  }
];

// --- Settings Management ---

function getDefaultNotificationSettings() {
  return {
    symptomReminderEnabled: true,
    symptomReminderTime: "09:00", // 9:00 AM
    preventionReminderEnabled: true,
    preventionReminderTime: "18:00", // 6:00 PM
    browserNotifsEnabled: false,
    intervalDays: 1 // Daily
  };
}

function getNotificationSettings() {
  try {
    const data = localStorage.getItem(NOTIF_SETTINGS_KEY);
    return data ? { ...getDefaultNotificationSettings(), ...JSON.parse(data) } : getDefaultNotificationSettings();
  } catch {
    return getDefaultNotificationSettings();
  }
}

function saveNotificationSettings(settings) {
  localStorage.setItem(NOTIF_SETTINGS_KEY, JSON.stringify(settings));
}

// --- Notification Items Management ---

function getNotifications() {
  try {
    const data = localStorage.getItem(NOTIF_ITEMS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveNotifications(items) {
  // Limit to last 50 notifications
  const trimmed = items.slice(0, 50);
  localStorage.setItem(NOTIF_ITEMS_KEY, JSON.stringify(trimmed));
  updateNotificationBellBadge();
}

function addNotification(title, body, type = "tip", link = "assessment.html") {
  const items = getNotifications();
  const newItem = {
    id: "notif_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
    title,
    body,
    type, // 'symptom', 'tip', 'system', 'alert'
    link,
    timestamp: new Date().toISOString(),
    read: false
  };

  items.unshift(newItem);
  saveNotifications(items);

  // Trigger Toast in-app
  if (typeof showToast === "function") {
    showToast(`${title}: ${body.substring(0, 50)}...`, "info", 5000);
  }

  // Trigger Browser Push Notification if enabled & allowed
  triggerBrowserPushNotification(title, body, link);

  // Re-render dropdown if open
  renderNotificationDropdownList();

  return newItem;
}

function markAsRead(id) {
  const items = getNotifications();
  const found = items.find(i => i.id === id);
  if (found) {
    found.read = true;
    saveNotifications(items);
    renderNotificationDropdownList();
  }
}

function markAllAsRead() {
  const items = getNotifications();
  items.forEach(i => i.read = true);
  saveNotifications(items);
  renderNotificationDropdownList();
}

function deleteNotification(id) {
  let items = getNotifications();
  items = items.filter(i => i.id !== id);
  saveNotifications(items);
  renderNotificationDropdownList();
}

function clearAllNotifications() {
  saveNotifications([]);
  renderNotificationDropdownList();
}

// --- Browser Push Notifications ---

async function requestBrowserNotificationPermission() {
  if (!("Notification" in window)) {
    if (typeof showToast === "function") showToast("Browser does not support desktop notifications.", "warning");
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const settings = getNotificationSettings();
      settings.browserNotifsEnabled = true;
      saveNotificationSettings(settings);

      if (typeof showToast === "function") {
        showToast("Web Notifications enabled successfully!", "success");
      }
      return true;
    } else {
      if (typeof showToast === "function") {
        showToast("Notification permission denied by browser.", "warning");
      }
      return false;
    }
  } catch (err) {
    console.error("Error requesting notification permission:", err);
    return false;
  }
}

function triggerBrowserPushNotification(title, body, link) {
  if (!("Notification" in window)) return;
  if (Notification.permission === "granted") {
    try {
      const notif = new Notification(title, {
        body: body,
        icon: "assets/gemini-svg.svg",
        badge: "assets/gemini-svg.svg",
        tag: "afrisafe-reminder"
      });

      notif.onclick = function (event) {
        event.preventDefault();
        window.focus();
        if (link) window.location.href = link;
        notif.close();
      };
    } catch (e) {
      console.warn("Unable to trigger desktop notification:", e);
    }
  }
}

// --- Local Scheduler & Trigger Engine ---

function checkScheduledReminders() {
  const settings = getNotificationSettings();
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
  const currentHHMM = now.toTimeString().substring(0, 5); // HH:MM

  let lastTriggers = {};
  try {
    lastTriggers = JSON.parse(localStorage.getItem(NOTIF_LAST_TRIGGER_KEY) || "{}");
  } catch {}

  // 1. Check Symptom Log Reminder
  if (settings.symptomReminderEnabled) {
    const lastSymptomTrigger = lastTriggers["symptom_reminder_date"];
    if (lastSymptomTrigger !== todayStr && currentHHMM >= settings.symptomReminderTime) {
      addNotification(
        "Daily Symptom Check Reminder",
        "It's time to log any recent fever, chills, or headache to keep your malaria risk score accurate.",
        "symptom",
        "assessment.html"
      );
      lastTriggers["symptom_reminder_date"] = todayStr;
    }
  }

  // 2. Check Daily Malaria Prevention Tip Reminder
  if (settings.preventionReminderEnabled) {
    const lastTipTrigger = lastTriggers["tip_reminder_date"];
    if (lastTipTrigger !== todayStr && currentHHMM >= settings.preventionReminderTime) {
      const randomTip = DAILY_PREVENTION_TIPS[Math.floor(Math.random() * DAILY_PREVENTION_TIPS.length)];
      addNotification(
        `Prevention Tip: ${randomTip.title}`,
        randomTip.body,
        "tip",
        randomTip.link
      );
      lastTriggers["tip_reminder_date"] = todayStr;
    }
  }

  localStorage.setItem(NOTIF_LAST_TRIGGER_KEY, JSON.stringify(lastTriggers));
}

// --- UI Bell & Dropdown Component ---

function injectNotificationBellStyles() {
  if (document.getElementById("notifBellStyles")) return;
  const style = document.createElement("style");
  style.id = "notifBellStyles";
  style.textContent = `
    .notif-bell-wrap {
      position: relative;
      display: inline-flex;
      align-items: center;
    }
    .notif-bell-btn {
      background: transparent;
      border: 1px solid var(--border-color, #E5E7EB);
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-color, #111827);
      cursor: pointer;
      position: relative;
      transition: all 0.2s ease;
    }
    .notif-bell-btn:hover {
      background: rgba(15,157,88,0.08);
      border-color: var(--primary-green, #0F9D58);
      color: var(--primary-green, #0F9D58);
    }
    .notif-badge {
      position: absolute;
      top: -2px;
      right: -2px;
      background: #EF4444;
      color: #ffffff;
      font-size: 0.68rem;
      font-weight: 800;
      border-radius: 10px;
      padding: 1px 6px;
      min-width: 18px;
      text-align: center;
      border: 2px solid #ffffff;
      box-shadow: 0 2px 6px rgba(239,68,68,0.3);
      display: none;
    }
    .notif-dropdown {
      position: absolute;
      top: 50px;
      right: 0;
      width: 340px;
      max-width: 90vw;
      background: #ffffff;
      border: 1px solid var(--border-color, #E5E7EB);
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.18);
      z-index: 999;
      display: none;
      flex-direction: column;
      overflow: hidden;
      animation: notifFadeIn 0.2s ease-out;
    }
    @keyframes notifFadeIn {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .notif-dropdown.open {
      display: flex;
    }
    .notif-header {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--border-color, #E5E7EB);
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(15,157,88,0.04);
    }
    .notif-header h3 {
      font-size: 0.95rem;
      font-weight: 800;
      color: var(--text-color, #111827);
      margin: 0;
    }
    .notif-mark-all {
      background: none;
      border: none;
      color: var(--primary-green, #0F9D58);
      font-size: 0.775rem;
      font-weight: 700;
      cursor: pointer;
      padding: 0;
    }
    .notif-mark-all:hover {
      text-decoration: underline;
    }
    .notif-list {
      max-height: 320px;
      overflow-y: auto;
      padding: 0;
      margin: 0;
      list-style: none;
    }
    .notif-item {
      padding: 0.9rem 1.25rem;
      border-bottom: 1px solid rgba(0,0,0,0.05);
      display: flex;
      flex-direction: column;
      gap: 4px;
      transition: background 0.15s ease;
      cursor: pointer;
      position: relative;
    }
    .notif-item:hover {
      background: rgba(15,157,88,0.05);
    }
    .notif-item.unread {
      background: rgba(15,157,88,0.08);
    }
    .notif-item-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .notif-item-title {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-color, #111827);
    }
    .notif-item-time {
      font-size: 0.7rem;
      color: var(--text-muted, #6B7280);
    }
    .notif-item-body {
      font-size: 0.8rem;
      color: var(--text-muted, #4B5563);
      line-height: 1.4;
    }
    .notif-footer {
      padding: 0.75rem;
      text-align: center;
      border-top: 1px solid var(--border-color, #E5E7EB);
      background: #fafafa;
    }
    .notif-footer a {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--primary-green, #0F9D58);
      text-decoration: none;
    }
    .notif-empty {
      padding: 2.5rem 1rem;
      text-align: center;
      color: var(--text-muted, #6B7280);
      font-size: 0.85rem;
    }
  `;
  document.head.appendChild(style);
}

function updateNotificationBellBadge() {
  const badge = document.getElementById("notifBellBadge");
  if (!badge) return;

  const items = getNotifications();
  const unreadCount = items.filter(i => !i.read).length;

  if (unreadCount > 0) {
    badge.textContent = unreadCount > 9 ? "9+" : unreadCount;
    badge.style.display = "block";
  } else {
    badge.style.display = "none";
  }
}

function renderNotificationDropdownList() {
  const listContainer = document.getElementById("notifDropdownList");
  if (!listContainer) return;

  const items = getNotifications();

  if (items.length === 0) {
    listContainer.innerHTML = `
      <div class="notif-empty">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:8px; opacity:0.4;"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        <p>No notifications right now.</p>
      </div>
    `;
    return;
  }

  listContainer.innerHTML = "";
  items.forEach(item => {
    const li = document.createElement("li");
    li.className = `notif-item ${item.read ? "" : "unread"}`;

    const dateFormatted = typeof formatDate === "function" ? formatDate(item.timestamp) : new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

    li.innerHTML = `
      <div class="notif-item-top">
        <span class="notif-item-title">${escapeHtml(item.title)}</span>
        <span class="notif-item-time">${dateFormatted}</span>
      </div>
      <div class="notif-item-body">${escapeHtml(item.body)}</div>
    `;

    li.addEventListener("click", () => {
      markAsRead(item.id);
      if (item.link) {
        window.location.href = item.link;
      }
    });

    listContainer.appendChild(li);
  });
}

function initNotificationBellUI() {
  const navActions = document.querySelector(".nav-actions");
  if (!navActions || document.getElementById("notifBellWrap")) return;

  injectNotificationBellStyles();

  const wrap = document.createElement("div");
  wrap.id = "notifBellWrap";
  wrap.className = "notif-bell-wrap";

  wrap.innerHTML = `
    <button class="notif-bell-btn" id="notifBellBtn" title="Notifications & Reminders" aria-label="Notifications">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
      </svg>
      <span class="notif-badge" id="notifBellBadge">0</span>
    </button>

    <div class="notif-dropdown" id="notifDropdown">
      <div class="notif-header">
        <h3>Reminders & Alerts</h3>
        <button class="notif-mark-all" id="notifMarkAllBtn">Mark all as read</button>
      </div>
      <ul class="notif-list" id="notifDropdownList"></ul>
      <div class="notif-footer">
        <a href="profile.html#notifications">Manage Reminder Settings &rarr;</a>
      </div>
    </div>
  `;

  // Insert before user badge
  navActions.insertBefore(wrap, navActions.firstChild);

  const bellBtn = document.getElementById("notifBellBtn");
  const dropdown = document.getElementById("notifDropdown");
  const markAllBtn = document.getElementById("notifMarkAllBtn");

  bellBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("open");
    renderNotificationDropdownList();
  });

  markAllBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    markAllAsRead();
  });

  document.addEventListener("click", (e) => {
    if (!wrap.contains(e.target)) {
      dropdown.classList.remove("open");
    }
  });

  updateNotificationBellBadge();
}

// --- Initialize Engine ---

function initNotificationSystem() {
  initNotificationBellUI();
  checkScheduledReminders();

  // Run periodic background check every 60 seconds
  setInterval(() => {
    checkScheduledReminders();
  }, 60000);
}

// Expose globally for module scripts
window.getNotificationSettings = getNotificationSettings;
window.saveNotificationSettings = saveNotificationSettings;
window.requestBrowserNotificationPermission = requestBrowserNotificationPermission;
window.addNotification = addNotification;
window.showToast = window.showToast || showToast;

document.addEventListener("DOMContentLoaded", () => {
  initNotificationSystem();
});
