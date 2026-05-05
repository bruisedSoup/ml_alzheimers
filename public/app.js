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
  const bgColor = isAD ? "rgba(248,81,73,.08)" : "rgba(63,185,80,.08)";
  const barColor = isAD ? "#f85149" : "#3fb950";
  const confidence = isAD ? json.prob_ad : json.prob_no_ad;
  const confLabel = isAD ? "Probability of Alzheimer's" : "Probability of No Alzheimer's";
  const descText = isAD
    ? "The model detects signs of Alzheimer’s risk based on your inputs. Please consult a qualified healthcare professional for a proper clinical evaluation."
    : "The model does not detect significant Alzheimer’s risk based on your inputs. Continue regular health monitoring and consult your doctor for guidance.";

  const placeholder = document.getElementById("result-placeholder");
  if (placeholder) placeholder.style.display = "none";

  const box = document.getElementById("result-box");
  box.style.borderColor = isAD ? "rgba(248,81,73,.25)" : "rgba(63,185,80,.25)";
  box.innerHTML = `
    <div style="background:${bgColor};padding:1.25rem 1.5rem;border-bottom:1px solid ${isAD ? "rgba(248,81,73,.15)" : "rgba(63,185,80,.15)"}">
      <div style="font-size:.7rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:.5rem;">Prediction Result</div>
      <div style="display:flex;align-items:center;gap:.6rem;">
        <span style="font-size:1.3rem;">${isAD ? "⚠️" : "✅"}</span>
        <div style="font-family:'DM Serif Display',serif;font-size:1.55rem;font-weight:700;color:${color};line-height:1.2;">${json.label}</div>
      </div>
    </div>
    <div class="result-body">
      <div style="margin-bottom:1.2rem;">
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:.4rem;">
          <div style="font-size:.82rem;color:var(--muted);font-weight:600;">Model Confidence</div>
          <div style="font-size:1.6rem;font-weight:800;color:${color};line-height:1;">${confidence}%</div>
        </div>
        <div style="height:8px;background:var(--surface2);border-radius:99px;overflow:hidden;">
          <div id="conf-bar" style="height:100%;width:0%;background:${barColor};border-radius:99px;transition:width .6s ease;" data-w="${confidence}"></div>
        </div>
        <div style="font-size:.72rem;color:var(--muted);margin-top:.35rem;">${confLabel}: ${confidence}%</div>
      </div>
      <p style="font-size:.84rem;color:var(--muted);line-height:1.7;margin-bottom:1rem;">${descText}</p>
      <div style="background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:10px;padding:.75rem 1rem;font-size:.75rem;color:var(--muted);line-height:1.6;margin-bottom:1rem;">
        ℹ️ This tool is for <strong>educational purposes only</strong> and is based on a machine learning model trained on survey data. It is not a clinical diagnosis. Always consult a qualified mental health professional.
      </div>
      <button onclick="resetForm()" style="background:none;border:none;color:var(--muted);font-size:.82rem;cursor:pointer;display:flex;align-items:center;gap:.4rem;padding:0;">↺ Reset and try again</button>
    </div>`;
  box.style.display = "block";
  setTimeout(() => {
    const bar = box.querySelector("#conf-bar");
    if (bar) bar.style.width = bar.dataset.w + "%";
  }, 80);
}

function showError(msg) {
  const placeholder = document.getElementById("result-placeholder");
  if (placeholder) placeholder.style.display = "none";
  const box = document.getElementById("result-box");
  box.style.borderColor = "rgba(248,81,73,.3)";
  box.innerHTML = `
    <div style="background:rgba(248,81,73,.08);padding:1.25rem 1.5rem;border-bottom:1px solid rgba(248,81,73,.15)">
      <div style="font-size:.7rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:.5rem;">Prediction Result</div>
      <div style="display:flex;align-items:center;gap:.6rem;">
        <span style="font-size:1.3rem;">❌</span>
        <div style="font-family:'DM Serif Display',serif;font-size:1.4rem;font-weight:700;color:#f85149;">Error</div>
      </div>
    </div>
    <div class="result-body">
      <p style="font-size:.84rem;color:var(--muted);line-height:1.7;">${escapeHtml(msg)}</p>
      <button onclick="resetForm()" style="background:none;border:none;color:var(--muted);font-size:.82rem;cursor:pointer;display:flex;align-items:center;gap:.4rem;padding:0;margin-top:1rem;">↺ Reset and try again</button>
    </div>`;
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
  const placeholder = document.getElementById("result-placeholder");
  if (placeholder) placeholder.style.display = "flex";
}

loadMeta();
