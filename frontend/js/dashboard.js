import { API_BASE_URL } from "./config.js";
import { fetchWithAuth, clearTokens, extractErrorMessage } from "./auth.js";

document.addEventListener("DOMContentLoaded", async () => {
  if (typeof initAuth === "function") {
    const ok = await initAuth();
    if (!ok) return;
  }
  if (typeof populateUserBadge === "function") populateUserBadge();
  if (typeof wireLogout === "function") wireLogout();

  // Greeting based on time of day
  const hour = new Date().getHours();
  let greeting = "Welcome";
  if (hour < 12) greeting = "Good Morning";
  else if (hour < 17) greeting = "Good Afternoon";
  else greeting = "Good Evening";
  document.getElementById("greetingTime").textContent = greeting;

  // Fetch user profile for name
  try {
    const meResp = await fetchWithAuth(`${API_BASE_URL}/api/v1/auth/me`, { method: "GET" });
    if (meResp.ok) {
      const me = await meResp.json();
      const nameEl = document.getElementById("userName");
      const firstName = (me.full_name || me.email || "User").split(" ")[0];
      nameEl.textContent = firstName;
    } else if (meResp.status === 401) {
      clearTokens();
      window.location.href = "/login.html";
      return;
    }
  } catch {}

  // Fetch prediction history for stats
  try {
    const histResp = await fetchWithAuth(`${API_BASE_URL}/api/v1/prediction/history`, { method: "GET" });
    if (!histResp.ok) {
      if (histResp.status === 401) {
        clearTokens();
        window.location.href = "/login.html";
        return;
      }
      const list = document.getElementById("historyList");
      list.innerHTML = `<div class="error-state"><p>Failed to load history.</p></div>`;
      return;
    }

    const data = await histResp.json();
    const items = data.items || data;

    const total = items.length;
    const positive = items.filter((i) => (i.prediction || "").toLowerCase().includes("malaria") && !i.prediction.toLowerCase().includes("no")).length;
    const negative = total - positive;
    const highRisk = items.filter((i) => (i.risk || "").toLowerCase() === "high").length;

    document.getElementById("totalAssessments").textContent = total;
    document.getElementById("positiveCases").textContent = positive;
    document.getElementById("negativeCases").textContent = negative;
    document.getElementById("highRiskCount").textContent = highRisk;

    // Health status hero text
    const healthText = document.getElementById("healthStatusText");
    if (total === 0) {
      healthText.textContent = "No assessments yet. Take your first malaria risk assessment to get started.";
    } else {
      const latest = items[0];
      const risk = latest.risk || "Low";
      healthText.textContent = `Latest result: ${latest.prediction} — ${risk} risk. ${total} assessment${total > 1 ? "s" : ""} completed.`;
    }

    // Recent activity list
    const list = document.getElementById("historyList");
    if (!items || items.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          <h3>No Assessments Yet</h3>
          <p>Take your first malaria risk assessment to see results here.</p>
          <a href="assessment.html" class="btn btn-primary">Start Assessment</a>
        </div>`;
      return;
    }

    list.innerHTML = "";
    items.slice(0, 5).forEach((item) => {
      const date = new Date(item.created_at).toLocaleDateString("en-US", {
        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
      });
      const riskClass = (item.risk || "low").toLowerCase();
      const div = document.createElement("a");
      div.href = "history.html";
      div.style.textDecoration = "none";
      div.style.color = "inherit";
      div.className = "list-item fade-in";
      div.innerHTML = `
        <div class="list-item-left">
          <span class="list-item-title">${item.prediction || "Unknown"}</span>
          <span class="list-item-sub">${date}</span>
        </div>
        <div class="list-item-right">
          <span class="list-item-sub">${item.confidence || 0}%</span>
          <span class="risk-badge risk-${riskClass}">${item.risk || "Low"}</span>
        </div>
      `;
      list.appendChild(div);
    });
  } catch (err) {
    const list = document.getElementById("historyList");
    list.innerHTML = `<div class="error-state"><p>Unable to load data. Check your connection.</p></div>`;
  }
});
