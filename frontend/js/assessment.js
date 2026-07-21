/**
 * AfriSafe AI - Assessment Controller
 * Production-ready frontend logic handling multi-step workflow, accessibility state,
 * real-time validation, privacy filtering, and backend API integration.
 */

document.addEventListener('DOMContentLoaded', () => {
  // API Endpoint
  const API_BASE_URL = window.location.origin;

  // DOM Elements
  const triageForm = document.getElementById('triageForm');
  const progressBar = document.getElementById('progressBar');
  const alertContainer = document.getElementById('alertContainer');
  const loadingOverlay = document.getElementById('loadingOverlay');
  const submitBtn = document.getElementById('submitBtn');

  // Input Elements
  const ageInput = document.getElementById('age');
  const genderInput = document.getElementById('gender');
  const stateInput = document.getElementById('state');
  const lgaInput = document.getElementById('lga');
  const fullNameInput = document.getElementById('fullName');
  const durationSlider = document.getElementById('durationSlider');
  const durationDisplay = document.getElementById('durationDisplay');

  // Summary Elements
  const summaryPatient = document.getElementById('summaryPatient');
  const summaryLocation = document.getElementById('summaryLocation');
  const summarySymptomTags = document.getElementById('summarySymptomTags');
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

  /**
   * Navigation Setup
   */
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

    // Update Progress Step Indicators
    document.querySelectorAll('.step-item').forEach((item, index) => {
      item.classList.toggle('active', index + 1 <= step);
    });

    // Update Accessibility and Fill Bar
    const progressPercent = step * 25;
    progressBar.style.width = `${progressPercent}%`;
    progressBar.setAttribute('aria-valuenow', progressPercent);
    currentStep = step;

    if (step === 4) {
      updateReviewData();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Step Validations
   */
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

  /**
   * UI Input Bindings & Card Handlers
   */
  function initFormInteractions() {
    // Card Clicks Toggle Switches
    document.querySelectorAll('.symptom-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.switch')) return; // Avoid double toggle on switch element click
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

    // Duration Slider
    durationSlider.addEventListener('input', (e) => {
      const val = e.target.value;
      durationDisplay.textContent = `${val} ${val === '1' ? 'Day' : 'Days'}`;
      updateLiveSummary();
    });

    // Input Dynamic Updates
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

  /**
   * Sidebar Live Summary Update
   */
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
    const travelled = document.querySelector('input[name="travelled"]:checked')?.value || 'No';
    const drugs = document.querySelector('input[name="malariaDrugs"]:checked')?.value || 'No';

    reviewContext.textContent = `Bites: ${mosquito} | Travel: ${travelled} | Anti-malaria: ${drugs}`;
  }

  /**
   * Helper Error Display
   */
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
   * Form Submission & Production API Dispatcher
   */
  async function handleFormSubmit(e) {
    e.preventDefault();

    if (!validateStep(1) || !validateStep(2)) {
      showAlert('Please complete all required fields before submitting.');
      return;
    }

    // Secure Payload Creation (fullName excluded for privacy)
    const payload = {
      age: parseInt(ageInput.value, 10),
      gender: genderInput.value,
      state: stateInput.value,
      lga: lgaInput.value.trim() || null,
      symptoms: getSelectedSymptoms(),
      duration: parseInt(durationSlider.value, 10),
      mosquitoBites: document.querySelector('input[name="mosquitoBites"]:checked')?.value === 'Yes',
      travelled: document.querySelector('input[name="travelled"]:checked')?.value === 'Yes',
      malariaDrugs: document.querySelector('input[name="malariaDrugs"]:checked')?.value === 'Yes'
    };

    // UI Busy Lock State
    setSubmitState(true);

    try {
      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Server status: ${response.status}`);
      }

      const result = await response.json();

      // Persist Result & Redirect
      localStorage.setItem('triageResult', JSON.stringify(result));
      localStorage.setItem('patientInputs', JSON.stringify(payload));
      window.location.href = 'result.html';

    } catch (err) {
      console.error('API Prediction request error:', err);
      showAlert('Unable to connect to the prediction server.');
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
