import { API_BASE_URL } from "./config.js";
import { fetchWithAuth, clearTokens } from "./auth.js";

document.addEventListener("DOMContentLoaded", async () => {
  // User info
  try {
    const meResp = await fetchWithAuth(`${API_BASE_URL}/api/v1/auth/me`, { method: "GET" });
    if (!meResp.ok) {
      // redirect to login
      clearTokens();
      window.location.href = "/login.html";
      return;
    }
    const me = await meResp.json();
    document.getElementById("userEmail").innerText = me.email || me.user_metadata?.email || "Unknown";
  } catch (err) {
    console.error(err);
    window.location.href = "/login.html";
    return;
  }

  // Load assessment history
  try {
    const histResp = await fetchWithAuth(`${API_BASE_URL}/api/v1/assessment/history`, { method: "GET" });
    if (!histResp.ok) {
      console.error("Failed to fetch history", await histResp.text());
      return;
    }
    const history = await histResp.json();
    const list = document.getElementById("historyList");
    list.innerHTML = "";
    history.forEach((a) => {
      const li = document.createElement("li");
      li.innerText = `${a.created_at} — ${a.result} (score: ${a.score})`;
      list.appendChild(li);
    });
  } catch (err) {
    console.error(err);
  }

  // Logout
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      clearTokens();
      window.location.href = "/login.html";
    });
  }
});
