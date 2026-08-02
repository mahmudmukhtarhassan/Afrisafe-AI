import { API_BASE_URL } from "./config.js";
import { fetchWithAuth, clearTokens, extractErrorMessage } from "./auth.js";

document.addEventListener("DOMContentLoaded", async () => {
  if (typeof populateUserBadge === "function") populateUserBadge();
  if (typeof wireLogout === "function") wireLogout();

  const container = document.getElementById("historyContainer");

  try {
    const resp = await fetchWithAuth(`${API_BASE_URL}/api/v1/prediction/history`, { method: "GET" });
    if (!resp.ok) {
      if (resp.status === 401) {
        clearTokens();
        window.location.href = "/login.html";
        return;
      }
      const msg = await extractErrorMessage(resp, "Failed to load history.");
      container.innerHTML = `<div class="empty-state">${msg}</div>`;
      return;
    }

    const data = await resp.json();
    const items = data.items || data;

    if (!items || items.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p style="font-size:1.1rem;font-weight:700;margin-bottom:0.5rem;">No assessments yet</p>
          <p style="margin-bottom:1.5rem;">Take your first malaria risk assessment to see results here.</p>
          <a href="assessment.html" class="btn btn-primary" style="width:auto;">Start Assessment</a>
        </div>`;
      return;
    }

    let html = `
      <div class="history-row header">
        <span>Prediction</span>
        <span>Date</span>
        <span>Confidence</span>
        <span>Risk Level</span>
        <span>Action</span>
      </div>
    `;

    items.forEach((item) => {
      const date = new Date(item.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      const riskClass = (item.risk || "low").toLowerCase();

      html += `
        <div class="history-row" data-id="${item.id}">
          <span class="row-prediction">${item.prediction || "Unknown"}</span>
          <span class="row-date">${date}</span>
          <span class="row-conf">${item.confidence || 0}%</span>
          <span class="risk-badge risk-${riskClass}">${item.risk || "Low"} Risk</span>
          <button class="delete-btn" data-id="${item.id}">Delete</button>
        </div>
      `;
    });

    container.innerHTML = html;

    container.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        if (!confirm("Delete this assessment record?")) return;

        try {
          const delResp = await fetchWithAuth(`${API_BASE_URL}/api/v1/prediction/history/${id}`, { method: "DELETE" });
          if (delResp.ok) {
            const row = container.querySelector(`.history-row[data-id="${id}"]`);
            if (row) row.remove();
            if (typeof showToast === "function") showToast("Record deleted.", "success");
          } else {
            const msg = await extractErrorMessage(delResp, "Failed to delete record.");
            if (typeof showToast === "function") showToast(msg, "error");
          }
        } catch (err) {
          if (typeof showToast === "function") showToast(err.message || "Failed to delete record.", "error");
        }
      });
    });
  } catch (err) {
    container.innerHTML = `<div class="empty-state">${err.message || "Unable to reach the server. Please try again."}</div>`;
  }
});
