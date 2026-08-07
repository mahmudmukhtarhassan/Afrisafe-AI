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

  const greetingTime = document.getElementById("greetingTime");
  if (greetingTime) greetingTime.textContent = greeting;

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
      const greetingName = document.getElementById("greetingName");
      if (greetingName) greetingName.textContent = firstName;
    } else if (meResp.status === 401) {
      clearTokens();
      window.location.href = "/login.html";
      return;
    }
  } catch (err) {
    console.error(err);
  }

  // ---------------------------
  // Load dashboard sections
  // ---------------------------
  await Promise.all([
    loadHistory(),
    updateHeaderBadges(),
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

      const historyList = document.getElementById("historyList");
      if (historyList) {
        historyList.innerHTML =
          `<div class="error-state"><p>Failed to load history.</p></div>`;
      }
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

    const statTotal = document.getElementById("statTotal");
    const statPositive = document.getElementById("statPositive");
    const statNegative = document.getElementById("statNegative");
    const statHighRisk = document.getElementById("statHighRisk");

    if (statTotal) statTotal.textContent = total;
    if (statPositive) statPositive.textContent = positive;
    if (statNegative) statNegative.textContent = negative;
    if (statHighRisk) statHighRisk.textContent = highRisk;

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

    const healthScore = document.getElementById("healthScore");
    if (healthScore) healthScore.textContent = score;

    const gaugeFill = document.getElementById("gaugeFill");
    if (gaugeFill) {
      const circumference = 377;
      const offset = circumference - (score / 100) * circumference;

      requestAnimationFrame(() => {
        gaugeFill.style.strokeDashoffset = offset;
      });
    }

    const healthStatus = document.getElementById("healthStatus");

    if (healthStatus) {
      if (total === 0) {
        healthStatus.textContent = "No assessments yet";
      } else {
        const latest = items[0];
        const risk = latest.risk || "Low";
        healthStatus.textContent =
          `Latest: ${latest.prediction || "Unknown"} (${risk} risk)`;
      }
    }

    // ---------------------------
    // Recent activity
    // ---------------------------
    const list = document.getElementById("historyList");

    if (!list) return;

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
        <div class="activity-dot ${iconClass}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
                     2 5.42 4.42 3 7.5 3
                     c1.74 0 3.41.81 4.5 2.09
                     C13.09 3.81 14.76 3 16.5 3
                     19.58 3 22 5.42 22 8.5
                     c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>
        <div class="activity-info">
          <div class="activity-title">${item.prediction || "Unknown"}</div>
          <div class="activity-time">${date}</div>
        </div>
        <span class="risk-badge risk-${riskClass}">
          ${item.risk || "Low"}
        </span>
      `;

      list.appendChild(div);
    });
  } catch (err) {
    const historyList = document.getElementById("historyList");
    if (historyList) {
      historyList.innerHTML =
        `<div class="error-state">
          <p>Unable to load data. Check your connection.</p>
        </div>`;
    }
  }
}

// =====================================================
// Header Notification & Reminder Badges
// =====================================================
async function updateHeaderBadges() {
  try {
    // Notifications
    const nResp = await fetchWithAuth(
      `${API_BASE_URL}/api/v1/notifications`,
      { method: "GET" }
    );

    if (nResp.ok) {
      const nData = await nResp.json();
      const unread = (nData.data || []).filter(n => !n.read).length;

      const nBadge = document.getElementById("notificationBadge");

      if (nBadge) {
        if (unread > 0) {
          nBadge.textContent = unread;
          nBadge.classList.remove("hidden");
        } else {
          nBadge.classList.add("hidden");
        }
      }
    }

    // Reminders
    const rResp = await fetchWithAuth(
      `${API_BASE_URL}/api/v1/reminders`,
      { method: "GET" }
    );

    if (rResp.ok) {
      const rData = await rResp.json();
      const count = (rData.data || []).length;

      const rBadge = document.getElementById("reminderBadge");

      if (rBadge) {
        if (count > 0) {
          rBadge.textContent = count;
          rBadge.classList.remove("hidden");
        } else {
          rBadge.classList.add("hidden");
        }
      }
    }
  } catch (err) {
    console.error("Header badge error:", err);
  }
}
