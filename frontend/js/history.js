import { API_BASE_URL } from "./config.js";
import { fetchWithAuth, clearTokens, extractErrorMessage } from "./auth.js";

let allItems = [];
let activeFilter = "all";
let searchQuery = "";

document.addEventListener("DOMContentLoaded", async () => {
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
      month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
    const riskClass = (item.risk || "low").toLowerCase();

    const div = document.createElement("div");
    div.className = "card fade-in";
    div.style.cursor = "pointer";
    div.innerHTML = `
      <div class="flex items-center justify-between mb-1">
        <span class="list-item-title">${item.prediction || "Unknown"}</span>
        <span class="risk-badge risk-${riskClass}">${item.risk || "Low"}</span>
      </div>
      <div class="list-item-sub">${date} · ${item.confidence || 0}% confidence</div>
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
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
      <h2 style="font-size:1.25rem;font-weight:800;">Assessment Details</h2>
      <button onclick="document.getElementById('detailModal').classList.add('hidden')" style="background:none;border:none;font-size:1.5rem;cursor:pointer;color:var(--text-muted);">&times;</button>
    </div>
    <div style="text-align:center;margin-bottom:20px;">
      <span class="risk-badge risk-${riskClass}" style="font-size:0.9rem;padding:6px 18px;">${item.risk || "Low"} Risk</span>
      <h3 style="font-size:1.5rem;font-weight:800;margin-top:10px;">${item.prediction || "Unknown"}</h3>
      <p style="color:var(--text-muted);font-size:0.85rem;">${date}</p>
      <p style="font-size:1.1rem;font-weight:700;margin-top:8px;">${item.confidence || 0}% Confidence</p>
    </div>
    <div class="card" style="margin-bottom:12px;">
      <div class="card-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>Recommendation</div>
      <p style="font-size:0.9rem;line-height:1.6;">${item.recommendation || "N/A"}</p>
    </div>
    ${advice ? `<div class="card" style="margin-bottom:12px;"><div class="card-title">Advice</div><ul style="padding-left:18px;font-size:0.88rem;">${advice}</ul></div>` : ""}
    <div class="card" style="margin-bottom:12px;">
      <div class="card-title">Symptoms Reported</div>
      <p style="font-size:0.88rem;">${symptoms}</p>
    </div>
    ${item.ai_insights ? `<div class="card"><div class="card-title">AI Insights</div><p style="font-size:0.88rem;line-height:1.6;">${item.ai_insights}</p></div>` : ""}
    <button class="btn btn-danger btn-block mt-2" id="modalDeleteBtn">Delete Record</button>
  `;

  modal.classList.remove("hidden");

  document.getElementById("modalDeleteBtn").addEventListener("click", async () => {
    if (!confirm("Delete this assessment record?")) return;
    try {
      const delResp = await fetchWithAuth(`${API_BASE_URL}/api/v1/prediction/history/${item.id}`, { method: "DELETE" });
      if (delResp.ok) {
        allItems = allItems.filter((i) => i.id !== item.id);
        renderList();
        modal.classList.add("hidden");
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
