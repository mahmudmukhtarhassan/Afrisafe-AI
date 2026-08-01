import { API_BASE_URL } from "./config.js";
import { fetchWithAuth, loadTokens } from "./auth.js";

document.addEventListener("DOMContentLoaded", () => {
  if (typeof populateUserBadge === "function") populateUserBadge();
  if (typeof wireLogout === "function") wireLogout();

  const form = document.getElementById("assessmentForm");
  if (!form) return;

  let currentStep = 1;

  // --- Step Navigation ---
  function showStep(step) {
    document.querySelectorAll(".form-section").forEach((s) => s.classList.add("hidden-section"));
    document.getElementById(`step${step}`).classList.remove("hidden-section");

    document.querySelectorAll(".step-item").forEach((item) => {
      item.classList.toggle("active", Number(item.dataset.step) <= step);
    });

    const progress = (step / 3) * 100;
    document.getElementById("progressBar").style.width = `${progress}%`;
    currentStep = step;
  }

  document.getElementById("nextBtn1").addEventListener("click", () => {
    updateReview();
    showStep(2);
  });
  document.getElementById("nextBtn2").addEventListener("click", () => {
    updateReview();
    showStep(3);
  });
  document.getElementById("backBtn2").addEventListener("click", () => showStep(1));
  document.getElementById("backBtn3").addEventListener("click", () => showStep(2));

  // --- Duration Slider ---
  const durationSlider = document.getElementById("durationSlider");
  const durationValue = document.getElementById("durationValue");
  const summaryDuration = document.getElementById("summaryDuration");

  durationSlider.addEventListener("input", () => {
    const days = parseInt(durationSlider.value, 10);
    const label = days === 1 ? "1 Day" : `${days} Days`;
    durationValue.textContent = label;
    summaryDuration.textContent = label;
    updateRiskIndicator();
  });

  // --- Symptom Toggle Cards ---
  document.querySelectorAll(".symptom-card").forEach((card) => {
    const checkbox = card.querySelector('input[type="checkbox"]');
    checkbox.addEventListener("change", () => {
      card.classList.toggle("selected", checkbox.checked);
      updateSummarySymptoms();
      updateRiskIndicator();
    });
  });

  // --- Context Toggles ---
  ["mosquitoExposure", "standingWater", "travelHistory", "bedNetUsed", "drugHistory"].forEach((id) => {
    document.getElementById(id).addEventListener("change", updateRiskIndicator);
  });

  // --- Live Summary Updates ---
  function getSelectedSymptoms() {
    return Array.from(document.querySelectorAll('.symptom-card input[type="checkbox"]:checked'))
      .map((cb) => cb.value);
  }

  function updateSummarySymptoms() {
    const symptoms = getSelectedSymptoms();
    const container = document.getElementById("summarySymptoms");
    if (symptoms.length === 0) {
      container.innerHTML = '<span class="no-tags">None selected</span>';
    } else {
      container.innerHTML = symptoms.map((s) => `<span class="symptom-tag">${s}</span>`).join("");
    }
  }

  function updateRiskIndicator() {
    const symptoms = getSelectedSymptoms();
    const count = symptoms.length;
    const hasHighFever = symptoms.includes("High Fever");
    const mosquito = document.getElementById("mosquitoExposure").checked;
    const water = document.getElementById("standingWater").checked;

    let risk = "Low";
    if (count >= 4 || (hasHighFever && count >= 2)) risk = "High";
    else if (count >= 2 || hasHighFever || mosquito || water) risk = "Medium";

    const indicator = document.getElementById("summaryRisk");
    indicator.innerHTML = `<span class="risk-badge risk-${risk.toLowerCase()}">${risk} Risk</span>`;
  }

  function updateReview() {
    const symptoms = getSelectedSymptoms();
    document.getElementById("reviewSymptoms").textContent =
      symptoms.length > 0 ? symptoms.join(", ") : "None selected";
    document.getElementById("reviewDuration").textContent = durationValue.textContent;
    document.getElementById("reviewMosquito").textContent = document.getElementById("mosquitoExposure").checked ? "Yes" : "No";
    document.getElementById("reviewWater").textContent = document.getElementById("standingWater").checked ? "Yes" : "No";
    document.getElementById("reviewTravel").textContent = document.getElementById("travelHistory").checked ? "Yes" : "No";
    document.getElementById("reviewBedNet").textContent = document.getElementById("bedNetUsed").checked ? "Yes" : "No";
    document.getElementById("reviewDrugs").textContent = document.getElementById("drugHistory").checked ? "Yes" : "No";
  }

  // --- Form Submission ---
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const symptoms = getSelectedSymptoms();
    const payload = {
      symptoms,
      duration: parseInt(durationSlider.value, 10),
      mosquito_exposure: document.getElementById("mosquitoExposure").checked,
      standing_water: document.getElementById("standingWater").checked,
      travel_history: document.getElementById("travelHistory").checked,
      bed_net_used: document.getElementById("bedNetUsed").checked,
      drug_history: document.getElementById("drugHistory").checked,
    };

    // Save patient inputs for result page
    const tokens = loadTokens();
    const patientInputs = { ...payload };
    try {
      const meResp = await fetchWithAuth(`${API_BASE_URL}/api/v1/auth/me`, { method: "GET" });
      if (meResp.ok) {
        const me = await meResp.json();
        patientInputs.age = me.age;
        patientInputs.gender = me.gender;
        patientInputs.state = me.state;
      }
    } catch {}

    document.getElementById("loadingOverlay").classList.remove("hidden");

    try {
      const resp = await fetchWithAuth(`${API_BASE_URL}/api/v1/prediction/predict`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        document.getElementById("loadingOverlay").classList.add("hidden");
        if (typeof showToast === "function") {
          showToast(err.detail || "Assessment failed. Please try again.", "error");
        }
        return;
      }

      const data = await resp.json();

      // Save result for the result page
      localStorage.setItem("triageResult", JSON.stringify(data));
      localStorage.setItem("patientInputs", JSON.stringify(patientInputs));

      window.location.href = "/result.html";
    } catch (err) {
      document.getElementById("loadingOverlay").classList.add("hidden");
      if (typeof showToast === "function") {
        showToast("Network error. Please try again.", "error");
      }
    }
  });
});
