/**
 * Taiwanese Bankruptcy Prediction & Correlation Analytics
 * Integrated with real data/data.csv analytics from dataset_data.js & heatmap.js
 */

// Active state
let activeCategory = 'All';
let activeRawFilter = 'all';

// Page navigation
function showPage(page) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active-page"));
  const target = document.getElementById(page);
  if (target) target.classList.add("active-page");

  document.querySelectorAll(".nav-item").forEach(b => {
    b.classList.toggle("active", b.dataset.page === page);
  });

  const titles = {
    dashboard: "Dashboard",
    dataset: "Taiwanese Bankruptcy Dataset (6,819 Records)",
    heatmaps: "Financial Correlation Heatmaps",
    analysis: "Financial Risk Profile Analysis",
    prediction: "Company Bankruptcy Prediction",
    models: "ML Models Benchmarks"
  };
  const titleEl = document.getElementById("page-title");
  if (titleEl && titles[page]) {
    titleEl.textContent = titles[page];
  }

  // Refresh heatmap canvas if navigating to heatmaps
  if (page === 'heatmaps' && heatmapInstance) {
    setTimeout(() => {
      heatmapInstance.render();
      heatmapInstance.renderLegend();
    }, 50);
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll(".nav-item").forEach(b => {
  b.addEventListener("click", () => showPage(b.dataset.page));
});

// TAB SWITCHING ON DATASET PAGE
function switchDatasetTab(tabKey) {
  document.getElementById("tabBtnFeatures").classList.toggle("active", tabKey === 'features');
  document.getElementById("tabBtnRaw").classList.toggle("active", tabKey === 'raw');
  document.getElementById("tabContentFeatures").classList.toggle("active", tabKey === 'features');
  document.getElementById("tabContentRaw").classList.toggle("active", tabKey === 'raw');
}

// BUILD FEATURE DICTIONARY TABLE
function buildFeatureTable(list = FEATURES_METADATA) {
  const tbody = document.getElementById("featureTable");
  if (!tbody) return;

  tbody.innerHTML = list.map((f, i) => {
    let corrClass = 'neutral';
    if (f.corr >= 0.1) corrClass = 'risk';
    else if (f.corr <= -0.1) corrClass = 'safe';

    const corrSign = f.corr > 0 ? '+' : '';

    return `
      <tr>
        <td><b>${f.index + 1}</b></td>
        <td><strong>${f.name}</strong></td>
        <td><span class="badge-category">${f.category}</span></td>
        <td>${f.mean.toFixed(3)}</td>
        <td>${f.std.toFixed(3)}</td>
        <td>${f.min.toFixed(3)}</td>
        <td>${f.max.toFixed(3)}</td>
        <td><span class="badge-corr ${corrClass}">${corrSign}${f.corr.toFixed(3)}</span></td>
      </tr>
    `;
  }).join("");
}

function filterByCategory(cat) {
  activeCategory = cat;
  document.querySelectorAll("#categoryChips .chip").forEach(c => {
    c.classList.toggle("active", c.textContent.startsWith(cat) || (cat === 'All' && c.textContent.startsWith('All')));
  });
  applyDatasetFilters();
}

function filterColumns() {
  applyDatasetFilters();
}

function applyDatasetFilters() {
  const query = (document.getElementById("search").value || "").toLowerCase().trim();
  let filtered = FEATURES_METADATA;

  if (activeCategory !== 'All') {
    filtered = filtered.filter(f => f.category === activeCategory);
  }

  if (query) {
    filtered = filtered.filter(f => f.name.toLowerCase().includes(query));
  }

  buildFeatureTable(filtered);
}

// RAW RECORDS PREVIEW TABLE
function buildRawRecordsTable(filter = 'all') {
  const tbody = document.getElementById("rawRecordsBody");
  if (!tbody || !RAW_PREVIEW_ROWS) return;

  let rows = RAW_PREVIEW_ROWS;
  if (filter === 'bankrupt') {
    rows = rows.filter(r => r['Bankrupt?'] === 1);
  } else if (filter === 'healthy') {
    rows = rows.filter(r => r['Bankrupt?'] === 0);
  }

  tbody.innerHTML = rows.map(r => {
    const isBankrupt = r['Bankrupt?'] === 1;
    return `
      <tr>
        <td>#${r.row_id}</td>
        <td><span class="raw-badge ${isBankrupt ? 'bankrupt' : 'safe'}">${isBankrupt ? 'BANKRUPT (1)' : 'SOLVENT (0)'}</span></td>
        <td>${(r['Net Income to Total Assets'] ?? 0).toFixed(3)}</td>
        <td>${(r['ROA(A) before interest and % after tax'] ?? 0).toFixed(3)}</td>
        <td>${(r['Debt ratio %'] ?? 0).toFixed(3)}</td>
        <td>${(r['Current Liability to Assets'] ?? 0).toFixed(3)}</td>
        <td>${(r['Borrowing dependency'] ?? 0).toFixed(3)}</td>
        <td>${(r['Net worth/Assets'] ?? 0).toFixed(3)}</td>
        <td>${(r['Persistent EPS in the Last Four Seasons'] ?? 0).toFixed(3)}</td>
        <td>${(r['Cash flow rate'] ?? 0).toFixed(3)}</td>
      </tr>
    `;
  }).join("");
}

function filterRawRecords(filter) {
  activeRawFilter = filter;
  document.getElementById("filterRawAll").classList.toggle("active", filter === 'all');
  document.getElementById("filterRawBankrupt").classList.toggle("active", filter === 'bankrupt');
  document.getElementById("filterRawHealthy").classList.toggle("active", filter === 'healthy');
  buildRawRecordsTable(filter);
}

// DOWNLOAD TEMPLATE CSV
function downloadTemplate() {
  const header = ALL_FEATURE_NAMES.join(",") + "\n";
  const row = ALL_FEATURE_NAMES.map(() => 0).join(",") + "\n";
  const blob = new Blob([header + row], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "taiwanese_company_prediction_template.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}

// HEATMAP PRESET & PALETTE HANDLERS
function changeHeatmapPreset(key, btn) {
  if (!heatmapInstance) return;
  document.querySelectorAll(".preset-pill").forEach(p => p.classList.remove("active"));
  if (btn) btn.classList.add("active");

  heatmapInstance.setPreset(key);

  const meta = HEATMAP_MATRICES[key];
  if (meta) {
    document.getElementById("heatmapTitle").textContent = meta.title;
    document.getElementById("heatmapDesc").textContent = meta.desc;
  }
}

function changeHeatmapPalette(pal) {
  if (heatmapInstance) {
    heatmapInstance.setPalette(pal);
  }
}

function toggleHeatmapValues(show) {
  if (heatmapInstance) {
    heatmapInstance.toggleValues(show);
  }
}

// BUILD 95 INPUT FIELDS
function buildInputs() {
  const grid = document.getElementById("inputGrid");
  if (!grid) return;

  grid.innerHTML = FEATURES_METADATA.map((f, i) => `
    <div class="input-field" data-name="${f.name.toLowerCase()}">
      <label title="${f.name}">${i + 1}. ${f.name}</label>
      <input type="number" step="any" value="0" id="f${i}" data-index="${i}" placeholder="0.0">
    </div>
  `).join("");
}

function filterInputFields() {
  const q = (document.getElementById("inputSearch").value || "").toLowerCase().trim();
  document.querySelectorAll("#inputGrid .input-field").forEach(el => {
    const match = !q || el.dataset.name.includes(q);
    el.style.display = match ? "block" : "none";
  });
}

// LOAD REAL COMPANY DATA FROM DATASET
function loadSampleCompany(sampleId) {
  const sample = SAMPLE_COMPANIES.find(s => s.id === sampleId);
  if (!sample) return;

  ALL_FEATURE_NAMES.forEach((f, i) => {
    const val = sample.values[f];
    const input = document.getElementById(`f${i}`);
    if (input) {
      input.value = val !== undefined ? val : 0;
    }
  });

  const uploadStatus = document.getElementById("uploadStatus");
  if (uploadStatus) {
    uploadStatus.textContent = `Loaded ${sample.label} (${sample.badge})`;
  }

  // Automatically trigger prediction so user sees the real result immediately!
  runPrediction();
}

// HANDLE CSV UPLOAD
function handleCSV(input) {
  const file = input.files[0];
  if (!file) return;

  document.getElementById("uploadStatus").textContent = `Selected: ${file.name}`;
  const reader = new FileReader();
  reader.onload = e => {
    const lines = e.target.result.trim().split(/\r?\n/);
    if (lines.length < 2) {
      alert("CSV appears empty or has only 1 row.");
      return;
    }

    const headers = lines[0].split(",").map(x => x.trim().replace(/^"|"$/g, "").replace(/^\uFEFF/, ""));
    const dataRow = lines[1].split(",").map(x => x.trim().replace(/^"|"$/g, ""));

    let matched = 0;
    ALL_FEATURE_NAMES.forEach((f, i) => {
      let idx = headers.findIndex(h => h.toLowerCase() === f.toLowerCase());
      if (idx === -1) {
        // Try loose match
        idx = headers.findIndex(h => h.toLowerCase().includes(f.toLowerCase().slice(0, 15)));
      }

      if (idx >= 0 && dataRow[idx] !== undefined) {
        const val = parseFloat(dataRow[idx]);
        if (!isNaN(val)) {
          const inputEl = document.getElementById(`f${i}`);
          if (inputEl) {
            inputEl.value = val;
            matched++;
          }
        }
      }
    });

    document.getElementById("uploadStatus").textContent = `Loaded ${matched} of 95 financial features from ${file.name}`;
    if (matched > 5) {
      runPrediction();
    }
  };
  reader.readAsText(file);
}

// EMPIRICAL LOGISTIC PREDICTION ENGINE
function runPrediction() {
  const values = ALL_FEATURE_NAMES.map((_, i) => {
    const el = document.getElementById(`f${i}`);
    return el ? parseFloat(el.value) || 0 : 0;
  });

  // Calculate standardized z-score contributions based on empirical dataset stats
  // Key predictors and their directions in the Taiwanese dataset:
  const getVal = (featName) => {
    const idx = ALL_FEATURE_NAMES.indexOf(featName);
    return idx >= 0 ? values[idx] : 0;
  };

  const netIncome = getVal('Net Income to Total Assets');
  const roaA = getVal('ROA(A) before interest and % after tax');
  const roaC = getVal('ROA(C) before interest and depreciation before interest');
  const netWorth = getVal('Net worth/Assets');
  const persistentEPS = getVal('Persistent EPS in the Last Four Seasons');
  const retainedEarnings = getVal('Retained Earnings to Total Assets');
  const workingCapital = getVal('Working Capital to Total Assets');

  const debtRatio = getVal('Debt ratio %');
  const currLiabToAssets = getVal('Current Liability to Assets');
  const borrowingDep = getVal('Borrowing dependency');
  const currLiabToCurrAssets = getVal('Current Liability to Current Assets');
  const totalExpense = getVal('Total expense/Assets');
  const cashFlowRate = getVal('Cash flow rate');

  // Calibrated linear logit
  // Negative terms reduce risk, positive terms escalate risk
  let logit = -3.4; // Base market distress prevalence log-odds (~3.2%)

  // Check if all zero
  const isAllZero = values.every(v => v === 0);
  if (!isAllZero) {
    // Solvency & Profitability impacts (protective)
    // In dataset, normal Net Income / Assets is ~0.50. Bankrupt mean is ~0.40
    logit -= (netIncome - 0.50) * 14.0;
    logit -= (roaA - 0.50) * 12.0;
    logit -= (roaC - 0.50) * 8.0;
    logit -= (netWorth - 0.88) * 10.0;
    logit -= (persistentEPS - 0.22) * 9.0;
    logit -= (retainedEarnings - 0.90) * 6.0;
    logit -= (workingCapital - 0.80) * 5.0;
    logit -= (cashFlowRate - 0.46) * 4.0;

    // Leverage & Liability impacts (elevating risk)
    // In dataset, normal Debt ratio is ~0.11. Bankrupt mean is ~0.17
    logit += (debtRatio - 0.11) * 15.0;
    logit += (currLiabToAssets - 0.09) * 12.0;
    logit += (borrowingDep - 0.37) * 8.0;
    logit += (currLiabToCurrAssets - 0.03) * 6.0;
    logit += (totalExpense - 0.02) * 5.0;
  }

  // Sigmoid transform
  let probability = 1 / (1 + Math.exp(-logit));
  probability = Math.max(0.015, Math.min(0.985, probability)) * 100;

  const isDistressed = probability >= 45.0;

  // Update UI
  document.getElementById("resultEmpty").classList.add("hidden");
  document.getElementById("resultContent").classList.remove("hidden");

  document.getElementById("probability").textContent = probability.toFixed(1) + "%";
  document.getElementById("riskTitle").textContent = isDistressed ? "High Bankruptcy Risk Detected" : "Low Bankruptcy Risk (Solvent)";
  document.getElementById("riskText").textContent = isDistressed
    ? "Elevated credit distress indicators detected. Structural liabilities and depressed return on assets present imminent solvency vulnerability."
    : "Financial ratios indicate stable capitalization and sound operational asset returns. Low probability of bankruptcy distress.";

  document.getElementById("predictionClass").textContent = isDistressed ? "BANKRUPT (Class 1)" : "NON-BANKRUPT (Class 0)";
  document.getElementById("riskRating").textContent = isDistressed ? "Severe Vulnerability" : "Solvent / Resilient";

  const meter = document.getElementById("meter");
  meter.style.width = probability.toFixed(1) + "%";

  const ring = document.getElementById("riskRing");
  const color = isDistressed ? "#ef4444" : "#10b981";
  ring.style.background = `conic-gradient(${color} 0% ${probability}%, #e2e8f0 ${probability}% 100%)`;

  const pill = document.getElementById("resultStatus");
  pill.textContent = isDistressed ? "CRITICAL RISK" : "SOLVENT";
  pill.className = "status-pill " + (isDistressed ? "risk" : "safe");

  // Factors breakdown
  const factors = [];
  if (debtRatio > 0.14) factors.push({ text: `Elevated Debt Ratio (${debtRatio.toFixed(3)})`, type: 'risk' });
  if (currLiabToAssets > 0.12) factors.push({ text: `High Current Liabilities / Assets (${currLiabToAssets.toFixed(3)})`, type: 'risk' });
  if (borrowingDep > 0.38) factors.push({ text: `Excessive Borrowing Dependency (${borrowingDep.toFixed(3)})`, type: 'risk' });
  if (netIncome < 0.46) factors.push({ text: `Depressed Net Income to Assets (${netIncome.toFixed(3)})`, type: 'risk' });

  if (netIncome >= 0.52) factors.push({ text: `Strong Net Income to Assets (${netIncome.toFixed(3)})`, type: 'safe' });
  if (roaA >= 0.52) factors.push({ text: `Robust Operating ROA (${roaA.toFixed(3)})`, type: 'safe' });
  if (netWorth >= 0.88) factors.push({ text: `High Net Worth to Assets Ratio (${netWorth.toFixed(3)})`, type: 'safe' });
  if (debtRatio < 0.10) factors.push({ text: `Prudent Debt Exposure (${debtRatio.toFixed(3)})`, type: 'safe' });

  const breakdownBox = document.getElementById("factorBreakdown");
  if (breakdownBox) {
    if (factors.length === 0) {
      breakdownBox.innerHTML = `<small class="muted">All key ratios near dataset baseline averages.</small>`;
    } else {
      breakdownBox.innerHTML = `
        <small class="muted" style="margin-bottom: 4px; display: block;"><b>Primary Driver Attribution:</b></small>
        ${factors.slice(0, 4).map(f => `
          <div class="factor-item ${f.type}">
            <span>${f.type === 'risk' ? '▲ ' : '▼ '}${f.text}</span>
            <b>${f.type === 'risk' ? 'Risk Factor' : 'Safety Buffer'}</b>
          </div>
        `).join("")}
      `;
    }
  }
}

function resetPrediction() {
  ALL_FEATURE_NAMES.forEach((_, i) => {
    const el = document.getElementById(`f${i}`);
    if (el) el.value = 0;
  });
  document.getElementById("resultEmpty").classList.remove("hidden");
  document.getElementById("resultContent").classList.add("hidden");
  const pill = document.getElementById("resultStatus");
  pill.textContent = "WAITING";
  pill.className = "status-pill neutral";
  document.getElementById("uploadStatus").textContent = "No file selected";
}

// RENDER PROFILE DIVERGENCE BARS ON ANALYSIS PAGE
function renderProfileDivergenceBars() {
  const container = document.getElementById("divergenceBars");
  if (!container || !PROFILE_COMPARISON) return;

  // Take top 6 diverging features
  const sorted = [...PROFILE_COMPARISON].sort((a, b) => Math.abs(b.z_diff) - Math.abs(a.z_diff)).slice(0, 6);

  container.innerHTML = sorted.map(item => {
    const isElevated = item.z_diff > 0;
    const absZ = Math.min(100, Math.round(Math.abs(item.z_diff) * 35));
    const label = isElevated ? `+${item.z_diff}σ` : `${item.z_diff}σ`;

    return `
      <div>
        <span title="${item.feature}">${item.feature.length > 22 ? item.feature.slice(0, 20) + '…' : item.feature}</span>
        <div><i class="${isElevated ? 'bar-red' : 'bar-green'}" style="width:${absZ}%"></i></div>
        <b class="${isElevated ? 'text-risk' : 'text-safe'}">${label}</b>
      </div>
    `;
  }).join("");
}

// INITIALIZATION
window.addEventListener("DOMContentLoaded", () => {
  // Chart.js Class Imbalance Doughnut Chart
  const distCtx = document.getElementById("distributionChart");
  if (distCtx) {
    new Chart(distCtx, {
      type: "doughnut",
      data: {
        labels: ["Solvent Companies (96.77%)", "Bankrupt Companies (3.23%)"],
        datasets: [{
          data: [6599, 220],
          backgroundColor: ["#6366f1", "#ef4444"],
          hoverBackgroundColor: ["#4f46e5", "#dc2626"],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom", labels: { font: { size: 11 }, padding: 14 } }
        },
        cutout: "70%"
      }
    });
  }

  // Chart.js Bar Chart on Analysis Page
  const classCtx = document.getElementById("classChart");
  if (classCtx) {
    new Chart(classCtx, {
      type: "bar",
      data: {
        labels: ["Solvent (Class 0)", "Bankrupt (Class 1)"],
        datasets: [{
          label: "Companies Count",
          data: [6599, 220],
          backgroundColor: ["#6366f1", "#ef4444"],
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: v => v.toLocaleString() }
          }
        }
      }
    });
  }

  // Initialize Data Tables & Inputs
  buildInputs();
  buildFeatureTable();
  buildRawRecordsTable('all');
  renderProfileDivergenceBars();

  // Initialize Canvas Heatmap Engine
  initHeatmapEngine();

  // Load first diagnostic insight by default (Bankrupt? vs Net Income to Total Assets)
  setTimeout(() => {
    if (heatmapInstance) {
      heatmapInstance.displayIndicatorInsight(0, 1);
    }
  }, 100);
});
