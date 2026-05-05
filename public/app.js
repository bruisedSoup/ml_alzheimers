const appState = {
  final_model_name: "Model unavailable"
};

const API_BASE_URL = (window.NEUROSCAN_CONFIG && window.NEUROSCAN_CONFIG.API_BASE_URL
  ? window.NEUROSCAN_CONFIG.API_BASE_URL
  : "").replace(/\/$/, "");

function apiUrl(path) {
  return API_BASE_URL ? API_BASE_URL + path : path;
}

function formatPercent(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function formatScore(value) {
  return Number(value).toFixed(4);
}

function formatParams(params) {
  return Object.entries(params)
    .map(([key, value]) => `${key.replace("model__", "")} = ${value}`)
    .join(", ");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((button) => button.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach((panel) => panel.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add("active");
  });
});

document.getElementById("predict-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = {};
  new FormData(e.target).forEach((value, key) => {
    data[key] = value;
  });

  document.getElementById("btn-text").textContent = "Analyzing...";
  document.getElementById("spinner").style.display = "block";
  document.querySelector(".btn-predict").disabled = true;

  try {
    const res = await fetch(apiUrl("/api/predict"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    json.error ? showError(json.error) : showResult(json);
  } catch (err) {
    showError("Network error. Check public/config.js and make sure the Render backend is running.");
  } finally {
    document.getElementById("btn-text").textContent = "Run Prediction";
    document.getElementById("spinner").style.display = "none";
    document.querySelector(".btn-predict").disabled = false;
  }
});

function showResult(json) {
  const isAD = json.prediction === 1;
  const color = isAD ? "#f85149" : "#3fb950";
  const icon = isAD ? "Warning" : "Clear";
  const box = document.getElementById("result-box");

  box.style.borderColor = isAD ? "rgba(248,81,73,.3)" : "rgba(63,185,80,.3)";
  box.innerHTML = `
    <div class="result-header" style="background:${isAD ? "rgba(248,81,73,.06)" : "rgba(63,185,80,.06)"}">
      <div class="result-icon" style="background:${isAD ? "rgba(248,81,73,.1)" : "rgba(63,185,80,.1)"};border:2px solid ${color}">${icon}</div>
      <div>
        <div class="result-title" style="color:${color}">${json.label}</div>
        <div class="result-sub">Based on provided clinical features · ${appState.final_model_name}</div>
      </div>
    </div>
    <div class="result-body">
      <div class="prob-row">
        <div class="prob-label">No Alzheimer's</div>
        <div class="prob-bar-wrap"><div class="prob-bar" style="width:0%;background:#3fb950" data-w="${json.prob_no_ad}"></div></div>
        <div class="prob-val" style="color:#3fb950">${json.prob_no_ad}%</div>
      </div>
      <div class="prob-row">
        <div class="prob-label">Alzheimer's Detected</div>
        <div class="prob-bar-wrap"><div class="prob-bar" style="width:0%;background:#f85149" data-w="${json.prob_ad}"></div></div>
        <div class="prob-val" style="color:#f85149">${json.prob_ad}%</div>
      </div>
    </div>`;
  box.style.display = "block";
  box.scrollIntoView({ behavior: "smooth", block: "nearest" });
  setTimeout(() => {
    box.querySelectorAll(".prob-bar").forEach((bar) => {
      bar.style.width = `${bar.dataset.w}%`;
    });
  }, 80);
}

function showError(msg) {
  const box = document.getElementById("result-box");
  box.style.borderColor = "rgba(248,81,73,.3)";
  box.innerHTML = `<div class="result-header" style="background:rgba(248,81,73,.06)"><div class="result-icon" style="border:2px solid #f85149">Error</div><div><div class="result-title" style="color:#f85149">Error</div><div class="result-sub">${escapeHtml(msg)}</div></div></div>`;
  box.style.display = "block";
}

function renderMeta(meta) {
  appState.final_model_name = meta.final_model_name;

  document.getElementById("nav-badge").textContent = `${meta.final_model_name} · F1 ${meta.winner_f1}`;
  document.getElementById("winner-name").textContent = meta.final_model_name;
  document.getElementById("winner-f1").textContent = meta.winner_f1;
  document.getElementById("params-box").innerHTML = `<strong>Logistic Regression:</strong> ${escapeHtml(formatParams(meta.best_lr_params))}<br><strong>Random Forest:</strong> ${escapeHtml(formatParams(meta.best_rf_params))}`;
  document.getElementById("about-model-line").innerHTML = `<strong>Deployed Model:</strong> ${escapeHtml(meta.final_model_name)} - Test F1 Score: ${escapeHtml(String(meta.winner_f1))}`;

  renderMetrics(meta.cv_results || {});
  renderTuning(meta.tuning_results || {});
}

function renderMetrics(cvResults) {
  const featuredHost = document.getElementById("featured-model");
  const metricsSide = document.getElementById("metrics-side");
  const rf = cvResults["Random Forest"];

  if (rf) {
    featuredHost.innerHTML = `
      <div class="model-card featured">
        <div class="featured-head">
          <div>
            <div class="featured-kicker">Top Cross-Validation Model</div>
            <div class="featured-title">Random Forest</div>
            <div class="featured-sub">
              Highest-performing classifier in this comparison, with the strongest overall CV F1 score before final deployment selection.
            </div>
          </div>
          <span style="font-size:.68rem;background:rgba(63,185,80,.15);color:var(--accent2);border-radius:99px;padding:.22rem .65rem;font-weight:700;">Tuned</span>
        </div>
        <div class="featured-metrics">
          <div class="mc-metric"><strong>${formatPercent(rf["CV Accuracy"])}</strong>CV Accuracy</div>
          <div class="mc-metric"><strong>${formatPercent(rf["CV Precision"])}</strong>CV Precision</div>
          <div class="mc-metric"><strong>${formatPercent(rf["CV Recall"])}</strong>CV Recall</div>
          <div class="mc-metric"><strong>${formatScore(rf["CV F1 Score"])}</strong>CV F1 Score</div>
        </div>
      </div>`;
  } else {
    featuredHost.innerHTML = "";
  }

  metricsSide.innerHTML = Object.entries(cvResults)
    .filter(([name]) => name !== "Random Forest")
    .map(([name, cv]) => `
      <div class="model-card ${name === "Logistic Regression" ? "runner-up" : ""}">
        <div class="mc-name">
          ${escapeHtml(name)}
          ${name === "Logistic Regression"
        ? '<span style="font-size:.65rem;background:rgba(227,179,65,.16);color:var(--warn);border-radius:99px;padding:.15rem .55rem;font-weight:700;">Top 2</span><span style="font-size:.65rem;background:rgba(88,166,255,.15);color:var(--accent);border-radius:99px;padding:.15rem .55rem;font-weight:600;">Tuned</span>'
        : ""}
        </div>
        <div class="mc-metrics">
          <div class="mc-metric"><strong>${formatPercent(cv["CV Accuracy"])}</strong>CV Accuracy</div>
          <div class="mc-metric"><strong>${formatPercent(cv["CV Precision"])}</strong>CV Precision</div>
          <div class="mc-metric"><strong>${formatPercent(cv["CV Recall"])}</strong>CV Recall</div>
          <div class="mc-metric"><strong>${formatScore(cv["CV F1 Score"])}</strong>CV F1 Score</div>
        </div>
      </div>`)
    .join("");
}

function renderTuning(tuningResults) {
  const tbody = document.getElementById("tuning-table-body");
  tbody.innerHTML = Object.entries(tuningResults)
    .map(([name, metrics]) => `
      <tr class="${name.includes("After") ? "after-row" : "before-row"}">
        <td>${escapeHtml(name)}</td>
        <td>${formatScore(metrics["Accuracy"])}</td>
        <td>${formatScore(metrics["Precision"])}</td>
        <td>${formatScore(metrics["Recall"])}</td>
        <td>${formatScore(metrics["F1 Score"])}</td>
      </tr>`)
    .join("");
}

async function loadMeta() {
  try {
    const res = await fetch(apiUrl("/api/meta"));
    const meta = await res.json();
    if (!res.ok || meta.error) {
      throw new Error(meta.error || "Failed to load model metadata.");
    }
    renderMeta(meta);
  } catch (err) {
    document.getElementById("nav-badge").textContent = "Backend unavailable";
    document.getElementById("params-box").textContent = "Unable to load backend metadata.";
    document.getElementById("about-model-line").innerHTML = "<strong>Deployed Model:</strong> Backend unavailable";
  }
}

function resetForm() {
  document.getElementById("predict-form").reset();
  const box = document.getElementById("result-box");
  box.style.display = "none";
  box.innerHTML = "";
}

loadMeta();
