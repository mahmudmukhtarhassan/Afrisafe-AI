/**
 * AfriSafe AI - Result Controller
 * Reads prediction and patient state from localStorage and populates the DOM.
 * Generates client-side PDF summaries via jsPDF.
 */

document.addEventListener("DOMContentLoaded", () => {
  // 1. Session & Auth Check
  if (typeof requireAuth === "function" && !requireAuth()) return;
  if (typeof populateUserBadge === "function") populateUserBadge();
  if (typeof wireLogout === "function") wireLogout();

  // 2. DOM Elements
  const emptyState = document.getElementById("emptyState");
  const resultContent = document.getElementById("resultContent");

  const riskLevelBadge = document.getElementById("riskBadge");
  const confidenceCircle = document.getElementById("confidenceRing");
  const confidenceNumber = document.getElementById("confidenceValue");
  const predictionTitle = document.getElementById("predictionTitle");
  const predictionSubtext = document.getElementById("predictionSub");

  const aiInsightsText = document.getElementById("insightsText");
  const recommendationCard = document.getElementById("recommendationCard");
  const recommendationText = document.getElementById("recommendationText");

  const summaryRows = document.getElementById("summaryRows");
  const patientSymptomsTags = document.getElementById("symptomTags");
  const downloadPdfBtn = document.getElementById("downloadPdf");

  // 3. Load Data from LocalStorage (Supports fallback keys)
  let resultData = null;
  let patientInputs = null;

  try {
    resultData =
      JSON.parse(localStorage.getItem("triageResult")) ||
      JSON.parse(localStorage.getItem("afrisafe_latest_result"));

    patientInputs =
      JSON.parse(localStorage.getItem("patientInputs")) ||
      JSON.parse(localStorage.getItem("afrisafe_patient_inputs"));
  } catch (err) {
    console.error("Error reading evaluation data from localStorage:", err);
  }

  // 4. Handle Empty State
  if (!resultData) {
    if (emptyState) emptyState.classList.remove("hidden");
    if (resultContent) resultContent.classList.add("hidden");
    return;
  }

  // Reveal Content
  if (emptyState) emptyState.classList.add("hidden");
  if (resultContent) resultContent.classList.remove("hidden");

  // 5. Data Field Extraction & Normalization
  const prediction = resultData.prediction || resultData.model_outcome || "Malaria Assessment";
  const confidence = resultData.confidence !== undefined ? parseFloat(resultData.confidence) : 0;
  const risk = resultData.risk || resultData.urgency || "Low";
  const recommendation = resultData.recommendation || "";
  const advice = Array.isArray(resultData.advice) ? resultData.advice : [];
  const aiInsights = resultData.ai_insights || resultData.aiInsights || "";
  const timestamp = resultData.timestamp || resultData.created_at || new Date().toISOString();

  // 6. Populate Header & Assessment Meta
  if (predictionTitle) {
    predictionTitle.textContent = prediction;
  }

  if (predictionSubtext) {
    if (prediction.toLowerCase().includes("malaria") || risk === "High") {
      predictionSubtext.textContent = "Symptom matrix indicates strong correlation with active Plasmodium indicators.";
    } else if (risk === "Medium") {
      predictionSubtext.textContent = "Moderate symptom correlation detected. Close clinical monitoring is advised.";
    } else {
      predictionSubtext.textContent = "Triage metrics suggest low probability for active acute infection.";
    }
  }

  // 7. Dynamic Risk Badge & Styling
  if (riskLevelBadge) {
    riskLevelBadge.textContent = `${risk} Risk`;
    riskLevelBadge.className = `risk-badge risk-${risk.toLowerCase()}`;
  }

  if (recommendationCard) {
    recommendationCard.className = `card insight-card fade-in delay-2 ${risk.toLowerCase()}`;
  }

  // 8. Progress Ring & Number Counter Animation
  const confidencePercent = Math.min(100, Math.max(0, confidence));
  const confidenceFraction = confidencePercent / 100;
  const radius = confidenceCircle ? confidenceCircle.r.baseVal.value : 70;
  const circumference = 2 * Math.PI * radius;

  if (confidenceCircle) {
    confidenceCircle.style.strokeDasharray = `${circumference}`;
    const offset = circumference - confidenceFraction * circumference;

    // Set Stroke Color by Risk Level
    if (risk === "High") {
      confidenceCircle.style.stroke = "var(--danger, #EA4335)";
    } else if (risk === "Medium") {
      confidenceCircle.style.stroke = "var(--warning, #FBBC05)";
    } else {
      confidenceCircle.style.stroke = "var(--success, #0F9D58)";
    }

    setTimeout(() => {
      confidenceCircle.style.strokeDashoffset = offset;
    }, 200);
  }

  if (confidenceNumber) {
    animateCounter(confidenceNumber, 0, Math.round(confidencePercent), 1500);
    confidenceNumber.textContent = Math.round(confidencePercent) + '%';
  }

  // 9. Render Insights & Recommendations
  if (aiInsightsText) {
    aiInsightsText.innerHTML = formatText(aiInsights || "No additional AI insights generated for this assessment.");
  }

  if (recommendationText) {
    recommendationText.innerHTML = formatText(recommendation || "Consult a qualified healthcare provider for clinical evaluation.");
  }

  // 10. Populate Patient Profile Summary
  if (patientInputs) {
    const age = patientInputs.age || patientInputs.patient_age || "--";
    const gender = patientInputs.gender || patientInputs.patient_gender || "--";
    const state = patientInputs.state || patientInputs.location || "Not specified";
    const duration = patientInputs.duration || patientInputs.symptom_duration || 1;

    if (summaryRows) {
      summaryRows.innerHTML = `
        <div class="summary-row"><span class="summary-key">Age / Gender</span><span class="summary-val">${age} / ${gender}</span></div>
        <div class="summary-row"><span class="summary-key">Location</span><span class="summary-val">${state}</span></div>
        <div class="summary-row"><span class="summary-key">Symptom Duration</span><span class="summary-val">${duration} ${parseInt(duration, 10) === 1 ? "Day" : "Days"}</span></div>
      `;
    }

    if (patientSymptomsTags) {
      patientSymptomsTags.innerHTML = "";
      const symptoms = Array.isArray(patientInputs.symptoms) ? patientInputs.symptoms : [];
      if (symptoms.length > 0) {
        symptoms.forEach((sym) => {
          const span = document.createElement("span");
          span.className = "symptom-tag";
          span.textContent = sym;
          patientSymptomsTags.appendChild(span);
        });
      } else {
        patientSymptomsTags.innerHTML = '<span class="text-muted" style="font-size:0.8rem;">None listed</span>';
      }
    }
  } else {
    if (summaryRows) summaryRows.innerHTML = '<div class="text-muted">No patient data available</div>';
    if (patientSymptomsTags) patientSymptomsTags.innerHTML = '<span class="text-muted" style="font-size:0.8rem;">None listed</span>';
  }

  // 11. PDF Download Handler
  if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener("click", generatePDF);
  }

  /**
   * PDF Generator using jsPDF
   */
  function generatePDF() {
    if (typeof window.jspdf === "undefined" && typeof jsPDF === "undefined") {
      if (typeof showToast === "function") {
        showToast("PDF library loading. Triggering print window...", "warning");
      }
      window.print();
      return;
    }

    const { jsPDF } = window.jspdf || window;
    const doc = new jsPDF("p", "mm", "a4");

    // Header Band
    doc.setFillColor(15, 157, 88); // #0F9D58
    doc.rect(0, 0, 210, 28, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("AfriSafe AI - Clinical Triage Report", 105, 18, { align: "center" });

    // Timestamp
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${formatDate(timestamp)}`, 105, 35, { align: "center" });

    // Result Summary Box
    doc.setDrawColor(220, 225, 230);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(15, 42, 180, 32, 3, 3, "FD");

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);

    doc.text("Assessment Outcome:", 20, 52);
    doc.setFont("helvetica", "normal");
    doc.text(String(prediction), 68, 52);

    doc.setFont("helvetica", "bold");
    doc.text("Model Confidence:", 20, 60);
    doc.setFont("helvetica", "normal");
    doc.text(`${Math.round(confidencePercent)}%`, 68, 60);

    doc.setFont("helvetica", "bold");
    doc.text("Risk Classification:", 20, 68);

    const riskColors = { High: [234, 67, 53], Medium: [251, 188, 5], Low: [15, 157, 88] };
    const rc = riskColors[risk] || [15, 157, 88];
    doc.setTextColor(rc[0], rc[1], rc[2]);
    doc.text(`${risk} Risk`, 68, 68);

    // Patient Profile Section
    let y = 85;
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Patient Demographics", 15, y);
    y += 6;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    if (patientInputs) {
      doc.text(`Age / Gender: ${patientInputs.age || "--"} Yrs / ${patientInputs.gender || "--"}`, 15, y); y += 5;
      doc.text(`Location: ${patientInputs.state || "--"}${patientInputs.lga ? ", " + patientInputs.lga : ""}`, 15, y); y += 5;
      doc.text(`Symptom Duration: ${patientInputs.duration || "--"} Day(s)`, 15, y); y += 5;
      const symList = Array.isArray(patientInputs.symptoms) ? patientInputs.symptoms.join(", ") : "None";
      const splitSym = doc.splitTextToSize(`Symptoms: ${symList}`, 180);
      doc.text(splitSym, 15, y);
      y += splitSym.length * 5;
    }

    // Recommended Action
    y += 4;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Clinical Guidance & Actions", 15, y); y += 6;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const recLines = doc.splitTextToSize(recommendation || "Consult healthcare provider.", 180);
    doc.text(recLines, 15, y);
    y += recLines.length * 5 + 4;

    // Direct Advice
    if (advice.length > 0) {
      advice.forEach((item) => {
        const itemLines = doc.splitTextToSize(`• ${item}`, 180);
        doc.text(itemLines, 15, y);
        y += itemLines.length * 5;
      });
      y += 4;
    }

    // Insights
    if (aiInsights) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("AI Insights", 15, y); y += 6;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const insightLines = doc.splitTextToSize(aiInsights, 180);
      doc.text(insightLines, 15, y);
      y += insightLines.length * 5;
    }

    // Disclaimer Box
    y = Math.max(y + 8, 265);
    doc.setDrawColor(220, 220, 220);
    doc.line(15, y, 195, y);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.setFont("helvetica", "italic");
    const disclaimer = "IMPORTANT DISCLAIMER: This document contains AI-assisted screening logic and does NOT constitute a formal medical diagnosis. Always verify clinical findings via accredited laboratory tests (RDT/Microscopy) with a licensed healthcare practitioner.";
    const splitDisclaimer = doc.splitTextToSize(disclaimer, 180);
    doc.text(splitDisclaimer, 15, y + 5);

    doc.save(`AfriSafe_Triage_Report_${new Date().toISOString().slice(0, 10)}.pdf`);

    if (typeof showToast === "function") {
      showToast("PDF report downloaded successfully.", "success");
    }
  }
});

/**
 * Helper: Formats ISO timestamps into human-readable strings
 */
function formatDate(dateString) {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
}

/**
 * Helper: Escapes raw strings for safe innerHTML injection
 */
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Helper: Converts multi-line paragraph text or lists into HTML
 */
function formatText(text) {
  if (!text) return "--";

  const lines = text.split("\n");
  let inList = false;
  let formattedHtml = "";

  lines.forEach((line) => {
    const cleanLine = line.trim();
    if (cleanLine.startsWith("-") || cleanLine.startsWith("*")) {
      if (!inList) {
        formattedHtml += '<ul class="insights-list" style="margin-top: 0.5rem; margin-bottom: 0.5rem; padding-left: 1.25rem; list-style-type: disc;">';
        inList = true;
      }
      formattedHtml += `<li style="margin-bottom: 0.35rem;">${escapeHtml(cleanLine.substring(1).trim())}</li>`;
    } else {
      if (inList) {
        formattedHtml += "</ul>";
        inList = false;
      }
      if (cleanLine.length > 0) {
        formattedHtml += `<p style="margin-bottom: 0.5rem;">${escapeHtml(cleanLine)}</p>`;
      }
    }
  });

  if (inList) {
    formattedHtml += "</ul>";
  }

  return formattedHtml;
}

/**
 * Helper: Smooth numerical counter animation
 */
function animateCounter(element, start, end, duration) {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    element.textContent = Math.floor(progress * (end - start) + start);
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}
