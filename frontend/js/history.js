import { API_BASE_URL } from "./config.js";
import { fetchWithAuth, clearTokens, extractErrorMessage } from "./auth.js";

let allItems = [];
let activeFilter = "all";
let searchQuery = "";

document.addEventListener("DOMContentLoaded", async () => {
  if (typeof initAuth === "function") {
    const ok = await initAuth();
    if (!ok) return;
  }
  if (typeof populateUserBadge === "function") populateUserBadge();
  if (typeof wireLogout === "function") wireLogout();

  const searchInput = document.getElementById("searchInput");
  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value.trim().toLowerCase();
    renderList();
  });

  document.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      activeFilter = chip.dataset.filter;
      renderList();
    });
  });

  await loadHistory();
});

async function loadHistory() {
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
      container.innerHTML = `<div class="error-state"><p>${msg}</p></div>`;
      return;
    }

    const data = await resp.json();
    allItems = data.items || data;
    renderList();
  } catch (err) {
    container.innerHTML = `<div class="error-state"><p>${err.message || "Unable to reach the server."}</p></div>`;
  }
}

function filterItems() {
  let filtered = allItems;

  if (activeFilter === "positive") {
    filtered = filtered.filter((i) => (i.prediction || "").toLowerCase().includes("malaria") && !(i.prediction || "").toLowerCase().includes("no"));
  } else if (activeFilter === "negative") {
    filtered = filtered.filter((i) => (i.prediction || "").toLowerCase().includes("no malaria"));
  } else if (activeFilter === "high") {
    filtered = filtered.filter((i) => (i.risk || "").toLowerCase() === "high");
  } else if (activeFilter === "low") {
    filtered = filtered.filter((i) => (i.risk || "").toLowerCase() === "low");
  }

  if (searchQuery) {
    filtered = filtered.filter(
      (i) =>
        (i.prediction || "").toLowerCase().includes(searchQuery) ||
        (i.risk || "").toLowerCase().includes(searchQuery) ||
        (i.recommendation || "").toLowerCase().includes(searchQuery)
    );
  }

  return filtered;
}

function renderList() {
  const container = document.getElementById("historyContainer");
  const items = filterItems();

  if (allItems.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/></svg>
        <h3>No Assessments Yet</h3>
        <p>Take your first malaria risk assessment to see results here.</p>
        <a href="assessment.html" class="btn btn-primary">Start Assessment</a>
      </div>`;
    return;
  }

  if (items.length === 0) {
    container.innerHTML = `<div class="empty-state"><h3>No matches found</h3><p>Try a different search or filter.</p></div>`;
    return;
  }

  container.innerHTML = "";
  items.forEach((item) => {
    const date = new Date(item.created_at).toLocaleDateString("en-US", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
    const riskClass = (item.risk || "low").toLowerCase();
    const isPositive = (item.prediction || "").toLowerCase().includes("malaria") && !(item.prediction || "").toLowerCase().includes("no");
    const iconClass = isPositive ? "red" : "green";

    const div = document.createElement("div");
    div.className = "history-item";
    div.style.animation = "fadeInUp 0.3s var(--ease-out) both";
    div.innerHTML = `
      <div class="history-icon ${iconClass}">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/></svg>
      </div>
      <div class="history-info">
        <div class="history-date">${item.prediction || "Unknown"}</div>
        <div class="history-meta">${date} · ${item.confidence || 0}% confidence</div>
      </div>
      <div class="history-right">
        <span class="risk-badge risk-${riskClass}">${item.risk || "Low"}</span>
        <svg class="history-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
    `;
    div.addEventListener("click", () => showDetail(item));
    container.appendChild(div);
  });
}

function showDetail(item) {
  const modal = document.getElementById("detailModal");
  const content = document.getElementById("detailContent");
  const date = new Date(item.created_at).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
  const riskClass = (item.risk || "low").toLowerCase();
  const advice = Array.isArray(item.advice) ? item.advice.map((a) => `<li style="margin-bottom:6px;">${a}</li>`).join("") : "";
  const symptoms = item.symptoms ? (Array.isArray(item.symptoms.symptoms) ? item.symptoms.symptoms.join(", ") : "N/A") : "N/A";

  content.innerHTML = `
    <div style="text-align:center;margin-bottom:20px;">
      <span class="risk-badge risk-${riskClass}" style="font-size:0.85rem;padding:6px 18px;">${item.risk || "Low"} Risk</span>
      <h3 style="font-size:1.5rem;font-weight:800;margin-top:12px;">${item.prediction || "Unknown"}</h3>
      <p style="color:var(--text-2);font-size:0.85rem;">${date}</p>
      <p style="font-size:1.2rem;font-weight:800;margin-top:8px;background:var(--gradient);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">${item.confidence || 0}% Confidence</p>
    </div>
    <div class="detail-row"><span class="detail-key">Prediction</span><span class="detail-val">${item.prediction || "N/A"}</span></div>
    <div class="detail-row"><span class="detail-key">Risk Level</span><span class="detail-val">${item.risk || "N/A"}</span></div>
    <div class="detail-row"><span class="detail-key">Confidence</span><span class="detail-val">${item.confidence || 0}%</span></div>
    <div class="detail-row"><span class="detail-key">Symptoms</span><span class="detail-val" style="text-align:right;">${symptoms}</span></div>
    <div class="detail-row"><span class="detail-key">Recommendation</span><span class="detail-val" style="text-align:right;max-width:60%;">${item.recommendation || "N/A"}</span></div>
    ${advice ? `<div style="margin-top:12px;"><div style="font-size:0.75rem;font-weight:600;color:var(--text-2);text-transform:uppercase;margin-bottom:6px;">Advice</div><ul style="padding-left:18px;font-size:0.85rem;line-height:1.6;">${advice}</ul></div>` : ""}
    ${item.ai_insights ? `<div style="margin-top:12px;"><div style="font-size:0.75rem;font-weight:600;color:var(--text-2);text-transform:uppercase;margin-bottom:6px;">AI Insights</div><p style="font-size:0.85rem;line-height:1.6;color:var(--text-2);">${item.ai_insights}</p></div>` : ""}
    <button class="btn btn-danger btn-block" style="margin-top:20px;" id="modalDeleteBtn">Delete Record</button>
  `;

  modal.classList.add("active");

  document.getElementById("modalClose").addEventListener("click", () => modal.classList.remove("active"));
  modal.addEventListener("click", (e) => { if (e.target === modal) modal.classList.remove("active"); });

  document.getElementById("modalDeleteBtn").addEventListener("click", async () => {
    if (!confirm("Delete this assessment record?")) return;
    try {
      const delResp = await fetchWithAuth(`${API_BASE_URL}/api/v1/prediction/history/${item.id}`, { method: "DELETE" });
      if (delResp.ok) {
        allItems = allItems.filter((i) => i.id !== item.id);
        renderList();
        modal.classList.remove("active");
        if (typeof showToast === "function") showToast("Record deleted.", "success");
      } else {
        const msg = await extractErrorMessage(delResp, "Failed to delete record.");
        if (typeof showToast === "function") showToast(msg, "error");
      }
    } catch (err) {
      if (typeof showToast === "function") showToast(err.message || "Failed to delete record.", "error");
    }
  });
}
