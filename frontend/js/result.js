/**
 * AfriSafe AI - Result Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  const emptyState = document.getElementById('emptyState');
  const resultContent = document.getElementById('resultContent');
  const reportDate = document.getElementById('reportDate');
  const riskLevelBadge = document.getElementById('riskLevelBadge');
  const confidenceCircle = document.getElementById('confidenceCircle');
  const confidenceNumber = document.getElementById('confidenceNumber');
  const predictionTitle = document.getElementById('predictionTitle');
  const predictionSubtext = document.getElementById('predictionSubtext');
  const aiInsightsText = document.getElementById('aiInsightsText');
  const recommendationCard = document.getElementById('recommendationCard');
  const recommendationText = document.getElementById('recommendationText');
  
  const patientDemographics = document.getElementById('patientDemographics');
  const patientLocation = document.getElementById('patientLocation');
  const patientDuration = document.getElementById('patientDuration');
  const patientSymptomsTags = document.getElementById('patientSymptomsTags');
  const downloadPdfBtn = document.getElementById('downloadPdfBtn');

  // Load Data from LocalStorage
  const resultData = JSON.parse(localStorage.getItem('triageResult'));
  const patientInputs = JSON.parse(localStorage.getItem('patientInputs'));

  // If no triage data, show empty state
  if (!resultData) {
    emptyState.classList.remove('hidden');
    resultContent.classList.add('hidden');
    return;
  }

  // Show result content
  emptyState.classList.add('hidden');
  resultContent.classList.remove('hidden');

  // Set report date
  const now = new Date();
  reportDate.textContent = `Evaluated on: ${now.toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`;

  // Parse Triage Result values
  const prediction = resultData.prediction || 'No Malaria';
  const probability = resultData.probability !== undefined ? resultData.probability : 0.0;
  const urgency = resultData.urgency || 'Low';
  const recommendation = resultData.recommendation || '';
  const aiInsights = resultData.aiInsights || '';

  // 1. Update Prediction Outcome Titles
  predictionTitle.textContent = prediction;
  if (prediction === 'Malaria') {
    predictionSubtext.textContent = 'Our symptom triage engine has flagged highly matching indicators for acute malaria infection.';
  } else {
    predictionSubtext.textContent = 'Triage metrics suggest low clinical indicators for active malaria. Monitor status.';
  }

  // 2. Dynamic Urgency Level Badge & Layout
  riskLevelBadge.textContent = `${urgency} priority`;
  riskLevelBadge.className = 'risk-badge';
  recommendationCard.className = 'result-card recommendation-card';

  if (urgency === 'High') {
    riskLevelBadge.classList.add('risk-high');
    recommendationCard.classList.add('risk-high');
  } else if (urgency === 'Medium') {
    riskLevelBadge.classList.add('risk-medium');
    recommendationCard.classList.add('risk-medium');
  } else {
    riskLevelBadge.classList.add('risk-low');
    recommendationCard.classList.add('risk-low');
  }

  // 3. Confidence Ring Animation (circumference of r=58 is ~364.42)
  const circumference = 2 * Math.PI * 58; // 364.4247
  confidenceCircle.style.strokeDasharray = `${circumference}`;
  
  // Animate the circle filling in
  const percentage = Math.round(probability * 100);
  const offset = circumference - (probability * circumference);
  
  setTimeout(() => {
    confidenceCircle.style.strokeDashoffset = offset;
    
    // Smooth number tick-up
    let currentCount = 0;
    const interval = setInterval(() => {
      if (currentCount >= percentage) {
        confidenceNumber.textContent = percentage;
        clearInterval(interval);
      } else {
        currentCount++;
        confidenceNumber.textContent = currentCount;
      }
    }, 12);
  }, 300);

  // Set Ring Stroke Color based on Risk Urgency
  if (urgency === 'High') {
    confidenceCircle.style.stroke = 'var(--danger)';
  } else if (urgency === 'Medium') {
    confidenceCircle.style.stroke = 'var(--warning)';
  } else {
    confidenceCircle.style.stroke = 'var(--success)';
  }

  // 4. Fill AI Insights & Recommendation text
  // Formatting helper for Markdown-style lists/returns
  aiInsightsText.innerHTML = formatText(aiInsights);
  recommendationText.innerHTML = formatText(recommendation);

  // 5. Populate Patient Profile Summary Side Card
  if (patientInputs) {
    const age = patientInputs.age || '--';
    const gender = patientInputs.gender || '--';
    patientDemographics.textContent = `${age} Years / ${gender}`;

    const state = patientInputs.state || '--';
    const lga = patientInputs.lga ? `, ${patientInputs.lga}` : '';
    patientLocation.textContent = `${state}${lga}`;

    const duration = patientInputs.duration || 1;
    patientDuration.textContent = `${duration} ${duration === 1 ? 'Day' : 'Days'}`;

    // Symptoms tags
    patientSymptomsTags.innerHTML = '';
    const symptoms = patientInputs.symptoms || [];
    if (symptoms.length > 0) {
      symptoms.forEach(sym => {
        const span = document.createElement('span');
        span.className = 'symptom-tag';
        span.textContent = sym;
        patientSymptomsTags.appendChild(span);
      });
    } else {
      patientSymptomsTags.innerHTML = '<span class="no-tags">None listed</span>';
    }
  } else {
    patientDemographics.textContent = '--';
    patientLocation.textContent = '--';
    patientDuration.textContent = '--';
    patientSymptomsTags.innerHTML = '<span class="no-tags">None listed</span>';
  }

  // PDF Download / Print Action
  if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener('click', () => {
      window.print();
    });
  }

  /**
   * Simple helper to format raw paragraphs and list markers (* or -) into HTML.
   */
  function formatText(text) {
    if (!text) return '--';
    
    // Replace newlines with break tags, bullet points with real lists
    let lines = text.split('\n');
    let inList = false;
    let formattedHtml = '';

    lines.forEach(line => {
      const cleanLine = line.trim();
      if (cleanLine.startsWith('-') || cleanLine.startsWith('*')) {
        if (!inList) {
          formattedHtml += '<ul class="insights-list" style="margin-top: 0.5rem; margin-bottom: 0.5rem; padding-left: 1.5rem; list-style-type: disc;">';
          inList = true;
        }
        formattedHtml += `<li style="margin-bottom: 0.35rem;">${cleanLine.substring(1).trim()}</li>`;
      } else {
        if (inList) {
          formattedHtml += '</ul>';
          inList = false;
        }
        if (cleanLine.length > 0) {
          formattedHtml += `<p style="margin-bottom: 0.75rem;">${cleanLine}</p>`;
        }
      }
    });

    if (inList) {
      formattedHtml += '</ul>';
    }

    return formattedHtml;
  }
});
