import { API_BASE_URL } from "./config.js";
import { fetchWithAuth, clearTokens } from "./auth.js";

document.addEventListener("DOMContentLoaded", async () => {
  if (typeof initAuth === "function") {
    const ok = await initAuth();
    if (!ok) return;
  }
  if (typeof populateUserBadge === "function") populateUserBadge();
  if (typeof wireLogout === "function") wireLogout();

  const hour = new Date().getHours();
  let greeting = "Welcome";
  if (hour < 12) greeting = "Good Morning";
  else if (hour < 17) greeting = "Good Afternoon";
  else greeting = "Good Evening";
  document.getElementById("greetingTime").textContent = greeting;

  try {
    const meResp = await fetchWithAuth(`${API_BASE_URL}/api/v1/auth/me`, { method: "GET" });
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

  try {
    const histResp = await fetchWithAuth(`${API_BASE_URL}/api/v1/prediction/history`, { method: "GET" });
    if (!histResp.ok) {
      if (histResp.status === 401) {
        clearTokens();
        window.location.href = "/login.html";
        return;
      }
      document.getElementById("historyList").innerHTML = `<div class="error-state"><p>Failed to load history.</p></div>`;
      return;
    }

    const data = await histResp.json();
    const items = data.items || data;

    const total = items.length;
    const positive = items.filter((i) => (i.prediction || "").toLowerCase().includes("malaria") && !i.prediction.toLowerCase().includes("no")).length;
    const negative = total - positive;
    const highRisk = items.filter((i) => (i.risk || "").toLowerCase() === "high").length;

    document.getElementById("statTotal").textContent = total;
    document.getElementById("statPositive").textContent = positive;
    document.getElementById("statNegative").textContent = negative;
    document.getElementById("statHighRisk").textContent = highRisk;

    // Health score gauge
    let score = 85;
    if (total > 0) {
      const latest = items[0];
      const conf = parseFloat(latest.confidence || 0);
      const isPositive = (latest.prediction || "").toLowerCase().includes("malaria") && !latest.prediction.toLowerCase().includes("no");
      score = isPositive ? Math.round(100 - conf) : Math.round(60 + conf * 0.4);
    }
    document.getElementById("healthScore").textContent = score;
    const gaugeFill = document.getElementById("gaugeFill");
    const circumference = 377;
    const offset = circumference - (score / 100) * circumference;
    requestAnimationFrame(() => { gaugeFill.style.strokeDashoffset = offset; });

    const healthStatus = document.getElementById("healthStatus");
    if (total === 0) {
      healthStatus.textContent = "No assessments yet";
    } else {
      const latest = items[0];
      const risk = latest.risk || "Low";
      healthStatus.textContent = `Latest: ${latest.prediction || "Unknown"} (${risk} risk)`;
    }

    // Recent activity
    const list = document.getElementById("historyList");
    if (!items || items.length === 0) {
      list.innerHTML = `
        <div class="empty-state" style="padding:24px;">
          <div class="empty-state-icon" style="width:48px;height:48px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <div class="empty-state-title" style="font-size:15px;">No Assessments Yet</div>
          <div class="empty-state-text">Take your first assessment to see results here.</div>
        </div>`;
      return;
    }

    list.innerHTML = "";
    items.slice(0, 5).forEach((item) => {
      const date = new Date(item.created_at).toLocaleDateString("en-US", {
        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
      });
      const riskClass = (item.risk || "low").toLowerCase();
      const isPositive = (item.prediction || "").toLowerCase().includes("malaria") && !item.prediction.toLowerCase().includes("no");
      const iconClass = isPositive ? "red" : "green";
      const div = document.createElement("a");
      div.href = "history.html";
      div.style.textDecoration = "none";
      div.style.color = "inherit";
      div.className = "activity-item";
      div.innerHTML = `
        <div class="activity-dot ${iconClass}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/></svg>
        </div>
        <div class="activity-info">
          <div class="activity-title">${item.prediction || "Unknown"}</div>
          <div class="activity-time">${date}</div>
        </div>
        <span class="risk-badge risk-${riskClass}">${item.risk || "Low"}</span>
      `;
      list.appendChild(div);
    });
  } catch (err) {
    document.getElementById("historyList").innerHTML = `<div class="error-state"><p>Unable to load data. Check your connection.</p></div>`;
  }
});
