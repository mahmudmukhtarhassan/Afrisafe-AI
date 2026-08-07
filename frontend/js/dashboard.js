import { API_BASE_URL } from "./config.js";
import { fetchWithAuth, clearTokens } from "./auth.js";

document.addEventListener("DOMContentLoaded", async () => {
  // ---------------------------
  // Authentication
  // ---------------------------
  if (typeof initAuth === "function") {
    const ok = await initAuth();
    if (!ok) return;
  }

  if (typeof populateUserBadge === "function") populateUserBadge();
  if (typeof wireLogout === "function") wireLogout();

  // ---------------------------
  // Greeting
  // ---------------------------
  const hour = new Date().getHours();
  let greeting = "Welcome";
  if (hour < 12) greeting = "Good Morning";
  else if (hour < 17) greeting = "Good Afternoon";
  else greeting = "Good Evening";

  document.getElementById("greetingTime").textContent = greeting;

  // ---------------------------
  // Current user
  // ---------------------------
  try {
    const meResp = await fetchWithAuth(`${API_BASE_URL}/api/v1/auth/me`, {
      method: "GET",
    });

    if (meResp.ok) {
      const me = await meResp.json();
      const firstName = (me.full_name || me.email || "User").split(" ")[0];
      document.getElementById("greetingName").textContent = firstName;
    } else if (meResp.status === 401) {
      clearTokens();
      window.location.href = "/login.html";
      return;
    }
  } catch {}

  // ---------------------------
  // Load dashboard sections
  // ---------------------------
  await Promise.all([
    loadHistory(),
    loadNotifications(),
    loadReminders(),
  ]);
});

// =====================================================
// History / Dashboard Statistics
// =====================================================
async function loadHistory() {
  try {
    const histResp = await fetchWithAuth(
      `${API_BASE_URL}/api/v1/prediction/history`,
      { method: "GET" }
    );

    if (!histResp.ok) {
      if (histResp.status === 401) {
        clearTokens();
        window.location.href = "/login.html";
        return;
      }

      document.getElementById("historyList").innerHTML =
        `<div class="error-state"><p>Failed to load history.</p></div>`;
      return;
    }

    const data = await histResp.json();
    const items = data.items || data || [];

    const total = items.length;
    const positive = items.filter(
      (i) =>
        (i.prediction || "").toLowerCase().includes("malaria") &&
        !(i.prediction || "").toLowerCase().includes("no")
    ).length;

    const negative = total - positive;

    const highRisk = items.filter(
      (i) => (i.risk || "").toLowerCase() === "high"
    ).length;

    document.getElementById("statTotal").textContent = total;
    document.getElementById("statPositive").textContent = positive;
    document.getElementById("statNegative").textContent = negative;
    document.getElementById("statHighRisk").textContent = highRisk;

    // ---------------------------
    // Health score
    // ---------------------------
    let score = 85;

    if (total > 0) {
      const latest = items[0];
      const conf = parseFloat(latest.confidence || 0);

      const isPositive =
        (latest.prediction || "").toLowerCase().includes("malaria") &&
        !(latest.prediction || "").toLowerCase().includes("no");

      score = isPositive
        ? Math.round(100 - conf)
        : Math.round(60 + conf * 0.4);
    }

    document.getElementById("healthScore").textContent = score;

    const gaugeFill = document.getElementById("gaugeFill");
    const circumference = 377;
    const offset = circumference - (score / 100) * circumference;

    requestAnimationFrame(() => {
      gaugeFill.style.strokeDashoffset = offset;
    });

    const healthStatus = document.getElementById("healthStatus");

    if (total === 0) {
      healthStatus.textContent = "No assessments yet";
    } else {
      const latest = items[0];
      const risk = latest.risk || "Low";
      healthStatus.textContent =
        `Latest: ${latest.prediction || "Unknown"} (${risk} risk)`;
    }

    // ---------------------------
    // Recent activity
    // ---------------------------
    const list = document.getElementById("historyList");

    if (items.length === 0) {
      list.innerHTML =
        `<div class="empty-state" style="padding:24px;">
          <div class="empty-state-title">No Assessments Yet</div>
          <div class="empty-state-text">
            Take your first assessment to see results here.
          </div>
        </div>`;
      return;
    }

    list.innerHTML = "";

    items.slice(0, 5).forEach((item) => {
      const date = new Date(item.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      const riskClass = (item.risk || "low").toLowerCase();

      const isPositive =
        (item.prediction || "").toLowerCase().includes("malaria") &&
        !(item.prediction || "").toLowerCase().includes("no");

      const iconClass = isPositive ? "red" : "green";

      const div = document.createElement("a");
      div.href = "history.html";
      div.style.textDecoration = "none";
      div.style.color = "inherit";
      div.className = "activity-item";

      div.innerHTML = `
        <div class="activity-dot ${iconClass}">❤️</div>
        <div class="activity-info">
          <div class="activity-title">
            ${item.prediction || "Unknown"}
          </div>
          <div class="activity-time">${date}</div>
        </div>
        <span class="risk-badge risk-${riskClass}">
          ${item.risk || "Low"}
        </span>
      `;

      list.appendChild(div);
    });
  } catch (err) {
    document.getElementById("historyList").innerHTML =
      `<div class="error-state">
        <p>Unable to load data. Check your connection.</p>
      </div>`;
  }
}

// =====================================================
// Notifications
// =====================================================
async function loadNotifications() {
  const list = document.getElementById("notificationsList");
  const badge = document.getElementById("notificationBadge");

  if (!list || !badge) return;

  try {
    const resp = await fetchWithAuth(
      `${API_BASE_URL}/api/v1/notifications`,
      { method: "GET" }
    );

    if (!resp.ok) {
      list.innerHTML =
        `<div class="empty-state">No notifications available.</div>`;
      badge.style.display = "none";
      return;
    }

    const result = await resp.json();
    const notifications = result.data || [];

    if (notifications.length === 0) {
      list.innerHTML =
        `<div class="empty-state">No notifications available.</div>`;
      badge.style.display = "none";
      return;
    }

    const unread = notifications.filter((n) => !n.read).length;

    if (unread > 0) {
      badge.textContent = unread;
      badge.style.display = "inline-block";
    } else {
      badge.style.display = "none";
    }

    list.innerHTML = notifications
      .slice(0, 3)
      .map(
        (n) => `
        <div class="activity-item">
          <div class="activity-dot ${n.read ? "blue" : "green"}">
            🔔
          </div>
          <div class="activity-info">
            <div class="activity-title">${n.title}</div>
            <div class="activity-time">${n.message}</div>
          </div>
        </div>
      `
      )
      .join("");
  } catch (err) {
    list.innerHTML =
      `<div class="error-state">
        <p>Failed to load notifications.</p>
      </div>`;
  }
}

// =====================================================
// Reminders
// =====================================================
async function loadReminders() {
  const list = document.getElementById("remindersList");

  if (!list) return;

  try {
    const resp = await fetchWithAuth(
      `${API_BASE_URL}/api/v1/reminders`,
      { method: "GET" }
    );

    if (!resp.ok) {
      list.innerHTML =
        `<div class="empty-state">No reminders available.</div>`;
      return;
    }

    const result = await resp.json();
    const reminders = result.data || [];

    if (reminders.length === 0) {
      list.innerHTML =
        `<div class="empty-state">No reminders scheduled.</div>`;
      return;
    }

    list.innerHTML = reminders
      .slice(0, 3)
      .map(
        (r) => `
        <div class="activity-item">
          <div class="activity-dot blue">⏰</div>
          <div class="activity-info">
            <div class="activity-title">${r.title}</div>
            <div class="activity-time">${r.reminder_date}</div>
          </div>
        </div>
      `
      )
      .join("");
  } catch (err) {
    list.innerHTML =
      `<div class="error-state">
        <p>Failed to load reminders.</p>
      </div>`;
  }
}
