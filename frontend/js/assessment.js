import { API_BASE_URL } from "./config.js";
import { fetchWithAuth } from "./auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("assessmentForm");
  if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const answers = {};
    for (const [k, v] of formData.entries()) {
      // try to coerce numeric answers to numbers
      if (!isNaN(v)) {
        answers[k] = Number(v);
      } else if (v === "true" || v === "false") {
        answers[k] = v === "true";
      } else {
        answers[k] = v;
      }
    }
    try {
      const resp = await fetchWithAuth(`${API_BASE_URL}/api/v1/assessment`, {
        method: "POST",
        body: JSON.stringify({ answers }),
      });
      if (!resp.ok) {
        const err = await resp.json();
        alert("Submission failed: " + (err.detail || JSON.stringify(err)));
        return;
      }
      const data = await resp.json();
      // show immediate result
      const resultDiv = document.getElementById("result");
      resultDiv.innerHTML = `Result: <strong>${data.result}</strong> (score: ${data.score})`;
      // optionally redirect to dashboard
      setTimeout(() => (window.location.href = "/dashboard.html"), 1500);
    } catch (err) {
      alert("Submission error: " + err.message);
    }
  });
});
