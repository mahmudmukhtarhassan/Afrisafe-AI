import { API_BASE_URL } from "./config.js";
import { fetchWithAuth, clearTokens, extractErrorMessage } from "./auth.js";

document.addEventListener("DOMContentLoaded", async () => {
  if (typeof populateUserBadge === "function") populateUserBadge();
  if (typeof wireLogout === "function") wireLogout();

  // Fetch user profile
  try {
    const meResp = await fetchWithAuth(`${API_BASE_URL}/api/v1/auth/me`, { method: "GET" });
    if (!meResp.ok) {
      if (meResp.status === 401) {
        clearTokens();
        window.location.href = "/login.html";
        return;
      }
      const msg = await extractErrorMessage(meResp, "Failed to load profile.");
      if (typeof showToast === "function") showToast(msg, "error");
    } else {
      const me = await meResp.json();
      const nameEl = document.getElementById("userName");
      if (nameEl) nameEl.textContent = me.full_name || me.email || "User";
    }
  } catch (err) {
    if (err.message && err.message.includes("Session expired")) {
      clearTokens();
      window.location.href = "/login.html";
      return;
    }
    if (typeof showToast === "function") showToast(err.message || "Failed to load profile.", "error");
  }

  // Fetch prediction history
  try {
    const histResp = await fetchWithAuth(`${API_BASE_URL}/api/v1/prediction/history`, { method: "GET" });
    if (!histResp.ok) {
      const msg = await extractErrorMessage(histResp, "Failed to load assessment history.");
      if (typeof showToast === "function") showToast(msg, "error");
      return;
    }
    const data = await histResp.json();
    const items = data.items || data;

    const total = items.length;
    const highRisk = items.filter((i) => (i.risk || "").toLowerCase() === "high").length;
    const avgConf =
      total > 0
        ? Math.round(items.reduce((acc, i) => acc + (i.confidence || 0), 0) / total)
        : 0;

    const totalEl = document.getElementById("totalAssessments");
    const avgEl = document.getElementById("avgConfidence");
    const highEl = document.getElementById("highRiskCount");
    if (totalEl) totalEl.textContent = total;
    if (avgEl) avgEl.textContent = `${avgConf}%`;
    if (highEl) highEl.textContent = highRisk;

    const list = document.getElementById("historyList");
    if (!list) return;

    if (!items || items.length === 0) {
      list.innerHTML = `
        <div class="empty-history">
          <p style="font-size:1rem;font-weight:600;margin-bottom:0.5rem;">No assessments yet</p>
          <p style="font-size:0.9rem;">Take your first malaria risk assessment to see results here.</p>
          <a href="assessment.html" class="btn btn-primary" style="width:auto;margin-top:1rem;">Start Assessment</a>
        </div>`;
      return;
    }

    list.innerHTML = "";
    items.slice(0, 10).forEach((item) => {
      const div = document.createElement("div");
      div.className = "history-item";

      const date = new Date(item.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      const riskClass = (item.risk || "low").toLowerCase();

      div.innerHTML = `
        <div class="history-left">
          <span class="history-prediction">${item.prediction || "Unknown"}</span>
          <span class="history-date">${date}</span>
        </div>
        <div class="history-right">
          <span class="history-conf">${item.confidence || 0}% confidence</span>
          <span class="risk-badge risk-${riskClass}">${item.risk || "Low"} Risk</span>
        </div>
      `;
      list.appendChild(div);
    });
  } catch (err) {
    if (typeof showToast === "function") showToast(err.message || "Failed to load history.", "error");
  }
});
