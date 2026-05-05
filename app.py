"""
app.py  –  Alzheimer's Disease Risk Predictor
Flask web application
"""

from flask import Flask, render_template, request, jsonify
import joblib, json
import pandas as pd

app = Flask(__name__, static_folder="public", static_url_path="")

# ── Load model & metrics once at startup ─────────────────────────────────────
model = joblib.load("models/rf_model.pkl")
with open("models/model_metrics.json") as f:
    meta = json.load(f)

FEATURE_COLS     = meta["feature_cols"]
CV_RESULTS       = meta["cv_results"]
TUNING_RESULTS   = meta["tuning_results"]
FINAL_MODEL_NAME = meta["final_model_name"]
BEST_LR_PARAMS   = meta["best_lr_params"]
BEST_RF_PARAMS   = meta["best_rf_params"]
WINNER_F1        = meta["winner_f1"]


# ── Routes ────────────────────────────────────────────────────────────────────
@app.route("/")
def index():
    return render_template(
        "index.html",
        cv_results=CV_RESULTS,
        tuning_results=TUNING_RESULTS,
        final_model_name=FINAL_MODEL_NAME,
        best_lr_params=BEST_LR_PARAMS,
        best_rf_params=BEST_RF_PARAMS,
        winner_f1=WINNER_F1,
    )

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()

        row = {}
        for col in FEATURE_COLS:
            val = data.get(col)
            if val is None:
                return jsonify({"error": f"Missing field: {col}"}), 400
            row[col] = float(val)

        X     = pd.DataFrame([row], columns=FEATURE_COLS)
        pred  = int(model.predict(X)[0])
        proba = model.predict_proba(X)[0]

        return jsonify({
            "prediction": pred,
            "label":      "Alzheimer's Detected" if pred == 1 else "No Alzheimer's Detected",
            "prob_no_ad": round(float(proba[0]) * 100, 1),
            "prob_ad":    round(float(proba[1]) * 100, 1),
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
