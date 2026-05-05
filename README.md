# Alzheimer's Disease Risk Predictor — Flask Web App
IT325 Machine Learning | Gonzales

## Setup & Run
```bash
pip install -r requirements.txt
python train_model.py    # generates models/ folder (already included)
python app.py            # starts Flask at http://localhost:5000
```

## Project Structure
```
alzheimers_webapp/
├── app.py                          # Flask backend
├── train_model.py                  # EDA + training script (combined)
├── Gonzales_AlzheimersDisease.csv  # Dataset
├── models/
│   ├── rf_model.pkl                # Trained Random Forest pipeline
│   └── model_metrics.json          # CV + test metrics
├── templates/
│   └── index.html                  # Web UI (single file)
└── requirements.txt
```
