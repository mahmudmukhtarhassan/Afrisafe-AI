/**
 * AfriSafe AI - Assessment Controller
 * Multi-step workflow with real backend API integration.
 */

document.addEventListener("DOMContentLoaded", () => {
  // Guard: must be logged in
  if (!requireAuth()) return;

  populateUserBadge();
  wireLogout();

  // DOM Elements
  const triageForm = document.getElementById("triageForm");
  const progressBar = document.getElementById("progressBar");
  const alertContainer = document.getElementById("alertContainer");
  const loadingOverlay = document.getElementById("loadingOverlay");
  const submitBtn = document.getElementById("submitBtn");

  // Input Elements
  const ageInput = document.getElementById("age");
  const genderInput = document.getElementById("gender");
  const stateInput = document.getElementById("state");
  const lgaInput = document.getElementById("lga");
  const fullNameInput = document.getElementById("fullName");
  const durationSlider = document.getElementById("durationSlider");
  const durationDisplay = document.getElementById("durationDisplay");

  // Summary Elements
  const summaryPatient = document.getElementById("summaryPatient");
  const summaryLocation = document.getElementById("summaryLocation");
  const summarySymptomTags = document.getElementById("summarySymptomTags");
  const summaryRiskBadge = document.getElementById('summaryRiskBadge');
  const summaryStatus = document.getElementById('summaryStatus');

  // Review Elements
  const reviewPatient = document.getElementById('reviewPatient');
  const reviewLocation = document.getElementById('reviewLocation');
  const reviewSymptoms = document.getElementById('reviewSymptoms');
  const reviewDuration = document.getElementById('reviewDuration');
  const reviewContext = document.getElementById('reviewContext');

  // Navigation State
  let currentStep = 1;

  // Initialize Event Listeners
  initNavigation();
  initFormInteractions();
  updateLiveSummary();

  function initNavigation() {
    document.querySelectorAll('.btn-next').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetStep = parseInt(e.currentTarget.dataset.next, 10);
        if (validateStep(currentStep)) {
          navigateToStep(targetStep);
        }
      });
    });

    document.querySelectorAll('.btn-prev').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetStep = parseInt(e.currentTarget.dataset.prev, 10);
        navigateToStep(targetStep);
      });
    });
  }

  function navigateToStep(step) {
    hideAlert();
    document.querySelectorAll('.form-section').forEach(sec => sec.classList.add('hidden-section'));
    document.getElementById(`section-${step}`).classList.remove('hidden-section');

    document.querySelectorAll('.step-item').forEach((item, index) => {
      item.classList.toggle('active', index + 1 <= step);
    });

    const progressPercent = step * 25;
    progressBar.style.width = `${progressPercent}%`;
    progressBar.setAttribute('aria-valuenow', progressPercent);
    currentStep = step;

    if (step === 4) {
      updateReviewData();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function validateStep(step) {
    let isValid = true;

    if (step === 1) {
      const ageVal = ageInput.value.trim();
      if (!ageVal || isNaN(ageVal) || parseInt(ageVal, 10) < 0 || parseInt(ageVal, 10) > 120) {
        showFieldError('ageError', 'Please enter a valid age (0-120).');
        ageInput.classList.add('invalid');
        isValid = false;
      } else {
        clearFieldError('ageError');
        ageInput.classList.remove('invalid');
      }

      if (!genderInput.value) {
        showFieldError('genderError', 'Please select gender.');
        genderInput.classList.add('invalid');
        isValid = false;
      } else {
        clearFieldError('genderError');
        genderInput.classList.remove('invalid');
      }

      if (!stateInput.value) {
        showFieldError('stateError', 'Please select state.');
        stateInput.classList.add('invalid');
        isValid = false;
      } else {
        clearFieldError('stateError');
        stateInput.classList.remove('invalid');
      }
    }

    if (step === 2) {
      const selectedSymptoms = getSelectedSymptoms();
      if (selectedSymptoms.length === 0) {
        showFieldError('symptomsError', 'Please select at least one symptom to proceed.');
        isValid = false;
      } else {
        clearFieldError('symptomsError');
      }
    }

    return isValid;
  }

  function initFormInteractions() {
    document.querySelectorAll('.symptom-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.switch')) return;
        const checkbox = card.querySelector('.symptom-checkbox');
        checkbox.checked = !checkbox.checked;
        card.classList.toggle('selected', checkbox.checked);
        updateLiveSummary();
      });
    });

    document.querySelectorAll('.symptom-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const card = e.target.closest('.symptom-card');
        card.classList.toggle('selected', e.target.checked);
        updateLiveSummary();
      });
    });

    durationSlider.addEventListener('input', (e) => {
      const val = e.target.value;
      durationDisplay.textContent = `${val} ${val === '1' ? 'Day' : 'Days'}`;
      updateLiveSummary();
    });

    [ageInput, genderInput, stateInput, fullNameInput, lgaInput].forEach(elem => {
      elem.addEventListener('input', updateLiveSummary);
      elem.addEventListener('change', updateLiveSummary);
    });

    triageForm.addEventListener('submit', handleFormSubmit);
  }

  function getSelectedSymptoms() {
    const checked = document.querySelectorAll('.symptom-checkbox:checked');
    return Array.from(checked).map(cb => cb.value);
  }

  function updateLiveSummary() {
    const age = ageInput.value.trim();
    const gender = genderInput.value;
    const name = fullNameInput.value.trim();

    if (age && gender) {
      summaryPatient.textContent = `${name ? name + ' (' : ''}${age} yrs, ${gender}${name ? ')' : ''}`;
    } else {
      summaryPatient.textContent = '--';
    }

    const state = stateInput.value;
    const lga = lgaInput.value.trim();
    if (state) {
      summaryLocation.textContent = `${state}${lga ? ', ' + lga : ''}`;
    } else {
      summaryLocation.textContent = '--';
    }

    const symptoms = getSelectedSymptoms();
    summarySymptomTags.innerHTML = '';

    if (symptoms.length > 0) {
      symptoms.forEach(sym => {
        const tag = document.createElement('span');
        tag.className = 'symptom-tag';
        tag.textContent = sym;
        summarySymptomTags.appendChild(tag);
      });
    } else {
      summarySymptomTags.innerHTML = '<span class="no-tags">No symptoms selected</span>';
    }

    const riskScore = calculateHeuristicRisk(symptoms);
    summaryRiskBadge.className = 'risk-badge';

    if (riskScore >= 4) {
      summaryRiskBadge.textContent = 'High';
      summaryRiskBadge.classList.add('risk-high');
    } else if (riskScore >= 2) {
      summaryRiskBadge.textContent = 'Moderate';
      summaryRiskBadge.classList.add('risk-moderate');
    } else {
      summaryRiskBadge.textContent = 'Low';
      summaryRiskBadge.classList.add('risk-low');
    }

    if (age && gender && state && symptoms.length > 0) {
      summaryStatus.textContent = 'Ready for AI Prediction';
      summaryStatus.style.color = 'var(--primary-green)';
    } else {
      summaryStatus.textContent = 'Pending Required Info';
      summaryStatus.style.color = 'var(--medical-blue)';
    }
  }

  function calculateHeuristicRisk(symptoms) {
    let score = 0;
    if (symptoms.includes('High Fever')) score += 3;
    if (symptoms.includes('Fever')) score += 2;
    if (symptoms.includes('Chills')) score += 1;
    if (symptoms.includes('Vomiting')) score += 1;
    if (symptoms.includes('Body Pain')) score += 1;
    return score;
  }

  function updateReviewData() {
    reviewPatient.textContent = summaryPatient.textContent;
    reviewLocation.textContent = summaryLocation.textContent;

    const symptoms = getSelectedSymptoms();
    reviewSymptoms.textContent = symptoms.length > 0 ? symptoms.join(', ') : 'None';
    reviewDuration.textContent = durationDisplay.textContent;

    const mosquito = document.querySelector('input[name="mosquitoBites"]:checked')?.value || 'No';
    const standingWater = document.querySelector('input[name="standingWater"]:checked')?.value || 'No';
    const bedNet = document.querySelector('input[name="bedNet"]:checked')?.value || 'No';
    const travelled = document.querySelector('input[name="travelled"]:checked')?.value || 'No';
    const drugs = document.querySelector('input[name="malariaDrugs"]:checked')?.value || 'No';

    reviewContext.textContent = `Bites: ${mosquito} | Standing Water: ${standingWater} | Bed Net: ${bedNet} | Travel: ${travelled} | Anti-malaria: ${drugs}`;
  }

  function showFieldError(id, msg) {
    const errorElem = document.getElementById(id);
    if (errorElem) errorElem.textContent = msg;
  }

  function clearFieldError(id) {
    const errorElem = document.getElementById(id);
    if (errorElem) errorElem.textContent = '';
  }

  function showAlert(msg) {
    alertContainer.textContent = msg;
    alertContainer.classList.remove('hidden');
  }

  function hideAlert() {
    alertContainer.classList.add('hidden');
    alertContainer.textContent = '';
  }

  /**
   * Form Submission — calls POST /api/v1/prediction/predict with JWT auth.
   */
  async function handleFormSubmit(e) {
    e.preventDefault();

    if (!validateStep(1) || !validateStep(2)) {
      showAlert('Please complete all required fields before submitting.');
      return;
    }

    const payload = {
      age: parseInt(ageInput.value, 10),
      gender: genderInput.value,
      state: stateInput.value,
      lga: lgaInput.value.trim() || null,
      symptoms: getSelectedSymptoms(),
      duration: parseInt(durationSlider.value, 10),
      mosquito_exposure: document.querySelector('input[name="mosquitoBites"]:checked')?.value === 'Yes',
      standing_water: document.querySelector('input[name="standingWater"]:checked')?.value === 'Yes',
      bed_net_used: document.querySelector('input[name="bedNet"]:checked')?.value === 'Yes',
      travel_history: document.querySelector('input[name="travelled"]:checked')?.value === 'Yes',
      drug_history: document.querySelector('input[name="malariaDrugs"]:checked')?.value === 'Yes',
    };

    setSubmitState(true);

    try {
      const result = await apiRequest('/api/v1/prediction/predict', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      // Persist result and inputs for the result page
      localStorage.setItem('triageResult', JSON.stringify(result));
      localStorage.setItem('patientInputs', JSON.stringify(payload));
      window.location.href = 'result.html';
    } catch (err) {
      console.error('API Prediction request error:', err);
      if (err.status === 401) {
        showToast("Session expired. Please log in again.", "error");
        setTimeout(() => { window.location.href = "login.html"; }, 1500);
      } else if (err.status === 422) {
        showAlert(err.message || "Please check your input and try again.");
      } else {
        showAlert(err.message || "Unable to connect to the prediction server.");
      }
      setSubmitState(false);
    }
  }

  function setSubmitState(isLoading) {
    if (isLoading) {
      loadingOverlay.classList.remove('hidden');
      submitBtn.disabled = true;
    } else {
      loadingOverlay.classList.add('hidden');
      submitBtn.disabled = false;
    }
  }
});
