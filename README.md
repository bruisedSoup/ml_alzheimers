# NeuroScan Alzheimer's Risk Predictor

This project is now split into:

- `Render` backend: Flask API that loads the trained model and returns JSON
- `Vercel` frontend: static HTML/CSS/JS that calls the backend with `fetch()`

## Local Run

```bash
pip install -r requirements.txt
python app.py
```

Open `http://localhost:5000`.

## API Endpoints

- `GET /api/health` - simple health check
- `GET /api/meta` - model name, metrics, tuning results, and feature metadata
- `POST /api/predict` - prediction endpoint

Example request:

```json
{
  "Age": 75,
  "Gender": 1
}
```

The backend expects all feature columns listed in `models/model_metrics.json`.

## Deploy Backend to Render

`render.yaml` is included for a web service using:

```bash
gunicorn app:app
```

After deploy, copy your Render URL, for example:

```txt
https://your-backend.onrender.com
```

## Deploy Frontend to Vercel

1. Edit [`public/config.js`](/c:/Users/Isabella%20Gonzales/ml_alzheimers/public/config.js:1)
2. Set `API_BASE_URL` to your Render backend URL
3. Deploy this repo to Vercel

Example:

```js
window.NEUROSCAN_CONFIG = {
  API_BASE_URL: "https://your-backend.onrender.com"
};
```

`vercel.json` rewrites requests so Vercel serves the static frontend from `public/`.

## Structure

- [`app.py`](/c:/Users/Isabella%20Gonzales/ml_alzheimers/app.py:1) - Flask API and local static hosting
- [`public/index.html`](/c:/Users/Isabella%20Gonzales/ml_alzheimers/public/index.html:1) - static frontend
- [`public/app.js`](/c:/Users/Isabella%20Gonzales/ml_alzheimers/public/app.js:1) - client-side API integration
- [`public/config.js`](/c:/Users/Isabella%20Gonzales/ml_alzheimers/public/config.js:1) - frontend backend URL config
- [`render.yaml`](/c:/Users/Isabella%20Gonzales/ml_alzheimers/render.yaml:1) - Render service config
- [`vercel.json`](/c:/Users/Isabella%20Gonzales/ml_alzheimers/vercel.json:1) - Vercel static rewrite config
