"""
app.py - Alzheimer's Disease Risk Predictor
Flask backend API for local use or a separate frontend deployment.
"""

from pathlib import Path
import json

import joblib
import pandas as pd
from flask import Flask, jsonify, request, render_template
from flask_cors import CORS

app = Flask(__name__, static_folder="public", static_url_path="")
CORS(app)

BASE_DIR = Path(__file__).resolve().parent

# Load model and metrics once at startup.
model = joblib.load(BASE_DIR / "models" / "rf_model.pkl")
with open(BASE_DIR / "models" / "model_metrics.json", encoding="utf-8") as f:
    meta = json.load(f)

FEATURE_COLS = meta["feature_cols"]
CV_RESULTS = meta["cv_results"]
TUNING_RESULTS = meta["tuning_results"]
FINAL_MODEL_NAME = meta["final_model_name"]
BEST_LR_PARAMS = meta["best_lr_params"]
BEST_RF_PARAMS = meta["best_rf_params"]
WINNER_F1 = meta["winner_f1"]


def build_app_payload():
    return {
        "feature_cols": FEATURE_COLS,
        "cv_results": CV_RESULTS,
        "tuning_results": TUNING_RESULTS,
        "final_model_name": FINAL_MODEL_NAME,
        "best_lr_params": BEST_LR_PARAMS,
        "best_rf_params": BEST_RF_PARAMS,
        "winner_f1": WINNER_F1,
    }


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})


@app.route("/api/meta")
def api_meta():
    return jsonify(build_app_payload())


@app.route("/api/predict", methods=["POST"])
@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json(silent=True)
        if not isinstance(data, dict):
            return jsonify({"error": "Request body must be valid JSON."}), 400

        row = {}
        for col in FEATURE_COLS:
            val = data.get(col)
            if val is None:
                return jsonify({"error": f"Missing field: {col}"}), 400

            try:
                row[col] = float(val)
            except (TypeError, ValueError):
                return jsonify({"error": f"Invalid numeric value for field: {col}"}), 400

        X = pd.DataFrame([row], columns=FEATURE_COLS)
        pred = int(model.predict(X)[0])
        proba = model.predict_proba(X)[0]

        return jsonify(
            {
                "prediction": pred,
                "label": "Alzheimer's Detected" if pred == 1 else "No Alzheimer's Detected",
                "prob_no_ad": round(float(proba[0]) * 100, 1),
                "prob_ad": round(float(proba[1]) * 100, 1),
            }
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
