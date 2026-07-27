/**
 * AfriSafe AI - Result Controller
 * Reads the prediction result from localStorage (set by assessment.js)
 * and renders it. Supports PDF download via jsPDF.
 */

document.addEventListener("DOMContentLoaded", () => {
  // Guard: must be logged in
  if (!requireAuth()) return;

  populateUserBadge();
  wireLogout();

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
  const adviceListContainer = document.getElementById('adviceList');

  const patientDemographics = document.getElementById('patientDemographics');
  const patientLocation = document.getElementById('patientLocation');
  const patientDuration = document.getElementById('patientDuration');
  const patientSymptomsTags = document.getElementById('patientSymptomsTags');
  const downloadPdfBtn = document.getElementById('downloadPdfBtn');

  // Load Data from LocalStorage
  let resultData = null;
  let patientInputs = null;
  try {
    resultData = JSON.parse(localStorage.getItem('triageResult'));
    patientInputs = JSON.parse(localStorage.getItem('patientInputs'));
  } catch {
    resultData = null;
    patientInputs = null;
  }

  // If no triage data, show empty state
  if (!resultData) {
    emptyState.classList.remove('hidden');
    resultContent.classList.add('hidden');
    return;
  }

  // Show result content
  emptyState.classList.add('hidden');
  resultContent.classList.remove('hidden');

  // Map backend fields (with fallbacks for older formats)
  const prediction = resultData.prediction || 'Unknown';
  const confidence = resultData.confidence !== undefined ? resultData.confidence : 0.0;
  const risk = resultData.risk || resultData.urgency || 'Low';
  const recommendation = resultData.recommendation || '';
  const advice = resultData.advice || [];
  const aiInsights = resultData.ai_insights || resultData.aiInsights || '';
  const timestamp = resultData.timestamp || new Date().toISOString();

  // Set report date
  reportDate.textContent = `Evaluated on: ${formatDate(timestamp)}`;

  // 1. Update Prediction Outcome Titles
  predictionTitle.textContent = prediction;
  if (prediction === 'Malaria') {
    predictionSubtext.textContent = 'Our symptom triage engine has flagged highly matching indicators for acute malaria infection.';
  } else {
    predictionSubtext.textContent = 'Triage metrics suggest low clinical indicators for active malaria. Monitor status.';
  }

  // 2. Dynamic Risk Level Badge & Layout
  riskLevelBadge.textContent = `${risk} Risk`;
  riskLevelBadge.className = 'risk-badge';
  recommendationCard.className = 'result-card recommendation-card';

  if (risk === 'High') {
    riskLevelBadge.classList.add('risk-high');
    recommendationCard.classList.add('risk-high');
  } else if (risk === 'Medium') {
    riskLevelBadge.classList.add('risk-medium');
    recommendationCard.classList.add('risk-medium');
  } else {
    riskLevelBadge.classList.add('risk-low');
    recommendationCard.classList.add('risk-low');
  }

  // 3. Confidence Ring Animation
  // Backend returns confidence as 0-100 percentage; convert to 0-1 for ring math
  const confidencePercent = Math.min(100, Math.max(0, confidence));
  const confidenceFraction = confidencePercent / 100;
  const circumference = 2 * Math.PI * 58; // ~364.42
  confidenceCircle.style.strokeDasharray = `${circumference}`;
  const offset = circumference - (confidenceFraction * circumference);

  setTimeout(() => {
    confidenceCircle.style.strokeDashoffset = offset;

    // Smooth number tick-up
    const targetCount = Math.round(confidencePercent);
    let currentCount = 0;
    const interval = setInterval(() => {
      if (currentCount >= targetCount) {
        confidenceNumber.textContent = targetCount;
        clearInterval(interval);
      } else {
        currentCount++;
        confidenceNumber.textContent = currentCount;
      }
    }, 12);
  }, 300);

  // Set Ring Stroke Color based on Risk
  if (risk === 'High') {
    confidenceCircle.style.stroke = 'var(--danger)';
  } else if (risk === 'Medium') {
    confidenceCircle.style.stroke = 'var(--warning)';
  } else {
    confidenceCircle.style.stroke = 'var(--success)';
  }

  // 4. Fill AI Insights & Recommendation text
  aiInsightsText.innerHTML = formatText(aiInsights || 'No additional insights available.');

  recommendationText.innerHTML = formatText(recommendation || 'No specific recommendation available.');

  // 5. Render advice list if present
  if (adviceListContainer && Array.isArray(advice) && advice.length > 0) {
    adviceListContainer.innerHTML = '';
    const ul = document.createElement('ul');
    ul.className = 'insights-list';
    ul.style.cssText = 'margin-top: 0.5rem; margin-bottom: 0.5rem; padding-left: 1.5rem; list-style-type: disc;';
    advice.forEach(item => {
      const li = document.createElement('li');
      li.style.marginBottom = '0.35rem';
      li.textContent = item;
      ul.appendChild(li);
    });
    adviceListContainer.appendChild(ul);
  }

  // 6. Populate Patient Profile Summary Side Card
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

  // 7. PDF Download via jsPDF (loaded from CDN in result.html)
  if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener('click', generatePDF);
  }

  function generatePDF() {
    if (typeof window.jspdf === 'undefined') {
      showToast('PDF library not loaded. Using print instead.', 'warning');
      window.print();
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');

    // Header
    doc.setFillColor(15, 157, 88);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('AfriSafe AI - Malaria Risk Report', 105, 18, { align: 'center' });

    // Date
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${formatDate(timestamp)}`, 105, 38, { align: 'center' });

    // Prediction result box
    doc.setDrawColor(229, 231, 235);
    doc.setFillColor(244, 247, 249);
    doc.roundedRect(15, 45, 180, 30, 3, 3, 'FD');

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text('Prediction:', 20, 55);
    doc.text(String(prediction), 60, 55);

    doc.text('Confidence:', 20, 63);
    doc.text(`${confidencePercent}%`, 60, 63);

    doc.text('Risk Level:', 20, 71);
    const riskColors = { High: [239, 68, 68], Medium: [245, 158, 11], Low: [16, 185, 129] };
    const rc = riskColors[risk] || [16, 185, 129];
    doc.setTextColor(rc[0], rc[1], rc[2]);
    doc.text(String(risk), 60, 71);

    // Patient info
    doc.setTextColor(31, 41, 55);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Patient Profile', 15, 88);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    let y = 96;
    if (patientInputs) {
      doc.text(`Age / Gender: ${patientInputs.age || '--'} / ${patientInputs.gender || '--'}`, 20, y); y += 6;
      doc.text(`Location: ${patientInputs.state || '--'}${patientInputs.lga ? ', ' + patientInputs.lga : ''}`, 20, y); y += 6;
      doc.text(`Symptom Duration: ${patientInputs.duration || '--'} days`, 20, y); y += 6;
      const symText = (patientInputs.symptoms || []).join(', ') || 'None';
      doc.text(`Symptoms: ${symText}`, 20, y); y += 6;
    }

    // Recommendation
    y += 4;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Recommendation', 15, y); y += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const recLines = doc.splitTextToSize(recommendation || 'N/A', 175);
    doc.text(recLines, 15, y);
    y += recLines.length * 5 + 4;

    // Advice
    if (Array.isArray(advice) && advice.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Clinical Advice', 15, y); y += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      advice.forEach(item => {
        const lines = doc.splitTextToSize(`• ${item}`, 175);
        doc.text(lines, 15, y);
        y += lines.length * 5;
      });
    }

    // AI Insights
    if (aiInsights) {
      y += 4;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('AI Insights', 15, y); y += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const insightLines = doc.splitTextToSize(aiInsights, 175);
      doc.text(insightLines, 15, y);
      y += insightLines.length * 5;
    }

    // Disclaimer
    y = Math.max(y + 10, 270);
    doc.setDrawColor(229, 231, 235);
    doc.line(15, y, 195, y);
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.setFont('helvetica', 'italic');
    const disclaimerLines = doc.splitTextToSize(
      'This application provides AI-assisted screening only. It is NOT a medical diagnosis. Always consult a qualified healthcare professional.',
      175
    );
    doc.text(disclaimerLines, 15, y + 5);

    doc.save(`AfriSafe_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
    showToast('Report downloaded.', 'success');
  }

  /**
   * Simple helper to format raw paragraphs and list markers into HTML.
   */
  function formatText(text) {
    if (!text) return '--';

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
        formattedHtml += `<li style="margin-bottom: 0.35rem;">${escapeHtml(cleanLine.substring(1).trim())}</li>`;
      } else {
        if (inList) {
          formattedHtml += '</ul>';
          inList = false;
        }
        if (cleanLine.length > 0) {
          formattedHtml += `<p style="margin-bottom: 0.75rem;">${escapeHtml(cleanLine)}</p>`;
        }
      }
    });

    if (inList) {
      formattedHtml += '</ul>';
    }

    return formattedHtml;
  }
});
