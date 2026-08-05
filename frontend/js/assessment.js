import { API_BASE_URL } from "./config.js";
import { fetchWithAuth, extractErrorMessage } from "./auth.js";

document.addEventListener("DOMContentLoaded", async () => {
  if (typeof initAuth === "function") {
    const ok = await initAuth();
    if (!ok) return;
  }
  if (typeof populateUserBadge === "function") populateUserBadge();
  if (typeof wireLogout === "function") wireLogout();

  let currentStep = 1;
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const submitBtn = document.getElementById("submitAssessment");
  const progressBar = document.getElementById("progressBar");

  function showStep(step) {
    document.querySelectorAll(".step-content").forEach((s) => s.classList.add("hidden"));
    document.getElementById(`step${step}`).classList.remove("hidden");

    [1, 2, 3].forEach((n) => {
      const ind = document.getElementById(`step${n}Indicator`);
      ind.classList.remove("active", "completed");
      if (n < step) ind.classList.add("completed");
      else if (n === step) ind.classList.add("active");
    });

    progressBar.style.width = `${(step / 3) * 100}%`;
    currentStep = step;

    prevBtn.style.display = step > 1 ? "inline-flex" : "none";
    nextBtn.style.display = step < 3 ? "inline-flex" : "none";
    submitBtn.style.display = step === 3 ? "inline-flex" : "none";
    if (step === 3) updateReview();
  }

  nextBtn.addEventListener("click", () => {
    if (currentStep < 3) showStep(currentStep + 1);
  });
  prevBtn.addEventListener("click", () => {
    if (currentStep > 1) showStep(currentStep - 1);
  });

  // Duration slider
  const durationSlider = document.getElementById("duration");
  const durationValue = document.getElementById("durationValue");
  durationSlider.addEventListener("input", () => {
    durationValue.textContent = durationSlider.value;
  });

  // Symptom cards
  document.querySelectorAll(".symptom-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.tagName === "INPUT") return;
      e.preventDefault();
      card.classList.toggle("selected");
      const cb = card.querySelector('input[type="checkbox"]');
      cb.checked = card.classList.contains("selected");
    });
  });

  function getSelectedSymptoms() {
    return Array.from(document.querySelectorAll(".symptom-card.selected"))
      .map((c) => c.dataset.symptom);
  }

  function updateReview() {
    const symptoms = getSelectedSymptoms();
    document.getElementById("reviewSymptoms").textContent =
      symptoms.length > 0 ? symptoms.join(", ") : "None selected";
    document.getElementById("reviewDuration").textContent = `${durationSlider.value} days`;
    const factors = [];
    if (document.getElementById("mosquitoBites").checked) factors.push("Mosquito bites");
    if (document.getElementById("standingWater").checked) factors.push("Standing water");
    if (document.getElementById("travelHistory").checked) factors.push("Travel history");
    if (document.getElementById("bedNet").checked) factors.push("Uses bed net");
    if (document.getElementById("antimalarial").checked) factors.push("On antimalarials");
    document.getElementById("reviewFactors").textContent =
      factors.length > 0 ? factors.join(", ") : "None reported";
  }

  submitBtn.addEventListener("click", async () => {
    const symptoms = getSelectedSymptoms();
    const payload = {
      symptoms,
      duration: parseInt(durationSlider.value, 10),
      mosquito_exposure: document.getElementById("mosquitoBites").checked,
      standing_water: document.getElementById("standingWater").checked,
      travel_history: document.getElementById("travelHistory").checked,
      bed_net_used: document.getElementById("bedNet").checked,
      drug_history: document.getElementById("antimalarial").checked,
    };

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

    document.getElementById("loadingOverlay").classList.add("active");

    try {
      const resp = await fetchWithAuth(`${API_BASE_URL}/api/v1/prediction/predict`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const msg = await extractErrorMessage(resp, "Assessment failed. Please try again.");
        document.getElementById("loadingOverlay").classList.remove("active");
        if (typeof showToast === "function") showToast(msg, "error");
        return;
      }

      const data = await resp.json();
      // log and persist
      console.log("api response:", data);
      localStorage.setItem("triageResult", JSON.stringify(data));
      localStorage.setItem("patientInputs", JSON.stringify(patientInputs));
      // redirect using relative path and include prediction id for server fallback
      window.location.href = `result.html?id=${encodeURIComponent(data.id)}`;
    } catch (err) {
      document.getElementById("loadingOverlay").classList.remove("active");
      if (typeof showToast === "function") {
        showToast(err.message || "Unable to reach the server. Please try again.", "error");
      }
    }
  });

  showStep(1);
});
