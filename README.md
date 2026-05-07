# NeuroScan Alzheimer's Risk Predictor

NeuroScan is a Flask-based machine learning web app that predicts Alzheimer's risk from structured clinical inputs.
The model is pre-trained and loaded at runtime from `models/rf_model.pkl`.

## Project Overview

- Backend: Flask API in `app.py`
- Frontend: server-rendered template UI (`templates/`) plus static client assets (`public/`)
- Model metadata: `models/model_metrics.json`
- Interface: single-page sections (Predict, EDA, Workflow, Metrics, Tuning, About)

## Project Structure

```text
ml_alzheimers/
|-- app.py
|-- train_model.py
|-- requirements.txt
|-- models/
|   |-- rf_model.pkl
|   `-- model_metrics.json
|-- templates/
|   |-- index.html
|   `-- components/
|       |-- nav.html
|       |-- hero.html
|       `-- tabs.html
|-- public/
|   |-- app.js
|   `-- config.js
|-- render.yaml
`-- vercel.json
```

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/meta` - Feature list and model metrics metadata
- `POST /api/predict` - Prediction endpoint
- `POST /predict` - Alias of prediction endpoint

Example request body:

```json
{
  "Age": 75,
  "BMI": 25.1,
  "Smoking": 0
}
```

The backend expects all input fields listed in `feature_cols` from `models/model_metrics.json`.

## Run Locally

```bash
pip install -r requirements.txt
python app.py
```

Open:

`http://127.0.0.1:5000`

## Deploy Backend (Render)

`render.yaml` is configured to run:

```bash
gunicorn app:app
```

## Deploy Frontend (Vercel)

1. Edit `public/config.js`
2. Set `API_BASE_URL` to your deployed backend URL
3. Deploy the repository to Vercel

Example config:

```js
window.NEUROSCAN_CONFIG = {
  API_BASE_URL: "https://your-backend.onrender.com"
};
```
