"""
train_model.py
Gonzales – Alzheimer's Disease ML Pipeline
Mirrors alzheimersdisease.ipynb exactly:
  EDA → Preprocessing → 5-Model Training → SMOTE + CV → Tuning (LR + RF) → Save best model

Run once to produce:
  models/rf_model.pkl
  models/model_metrics.json
"""

import json, os, warnings
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_validate, GridSearchCV
from sklearn.preprocessing import MinMaxScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.neighbors import KNeighborsClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.metrics import (accuracy_score, precision_score,
                             recall_score, f1_score, make_scorer)
from imblearn.over_sampling import SMOTE
from imblearn.pipeline import Pipeline as ImbPipeline
import joblib

warnings.filterwarnings("ignore")
os.makedirs("models", exist_ok=True)

# ── 1. Load data ─────────────────────────────────────────────────────────────
df = pd.read_csv("Gonzales_AlzheimersDisease.csv")
X  = df.drop(columns=["PatientID", "Diagnosis"])
y  = df["Diagnosis"]
feature_cols = X.columns.tolist()

# ── 2. Train/test split (matches notebook — no stratify) ─────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# ── 3. Preprocessing ─────────────────────────────────────────────────────────
num_cols   = X.columns.tolist()
preprocess = ColumnTransformer(transformers=[("num", MinMaxScaler(), num_cols)])

# ── 4. Five baseline pipelines (no SMOTE) ────────────────────────────────────
lr  = Pipeline([("prep", preprocess), ("model", LogisticRegression(random_state=42, max_iter=1000))])
knn = Pipeline([("prep", preprocess), ("model", KNeighborsClassifier())])
dt  = Pipeline([("prep", preprocess), ("model", DecisionTreeClassifier(random_state=42))])
rf  = Pipeline([("prep", preprocess), ("model", RandomForestClassifier(random_state=42, n_estimators=200))])
nb  = Pipeline([("prep", preprocess), ("model", GaussianNB())])

lr.fit(X_train, y_train)
knn.fit(X_train, y_train)
dt.fit(X_train, y_train)
rf.fit(X_train, y_train)
nb.fit(X_train, y_train)
print("All five baseline classifiers trained.")

# ── 5. SMOTE pipelines ────────────────────────────────────────────────────────
lr_s  = ImbPipeline([("scaler", MinMaxScaler()), ("smote", SMOTE(random_state=42)), ("model", LogisticRegression(random_state=42, max_iter=1000))])
knn_s = ImbPipeline([("scaler", MinMaxScaler()), ("smote", SMOTE(random_state=42)), ("model", KNeighborsClassifier())])
dt_s  = ImbPipeline([("scaler", MinMaxScaler()), ("smote", SMOTE(random_state=42)), ("model", DecisionTreeClassifier(random_state=42))])
rf_s  = ImbPipeline([("scaler", MinMaxScaler()), ("smote", SMOTE(random_state=42)), ("model", RandomForestClassifier(random_state=42, n_estimators=200))])
nb_s  = ImbPipeline([("scaler", MinMaxScaler()), ("smote", SMOTE(random_state=42)), ("model", GaussianNB())])

# ── 6. 5-Fold CV with SMOTE ───────────────────────────────────────────────────
skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
scoring = {
    "accuracy":  make_scorer(accuracy_score),
    "precision": make_scorer(precision_score),
    "recall":    make_scorer(recall_score),
    "f1":        make_scorer(f1_score),
}

smote_models = {
    "Logistic Regression": lr_s,
    "K-Nearest Neighbors": knn_s,
    "Decision Tree":       dt_s,
    "Random Forest":       rf_s,
    "Naive Bayes":         nb_s,
}

cv_results = {}
for name, pipe in smote_models.items():
    cv = cross_validate(pipe, X_train, y_train, cv=skf,
                        scoring=scoring, return_train_score=False)
    cv_results[name] = {
        "CV Accuracy":  round(float(cv["test_accuracy"].mean()),  4),
        "CV Precision": round(float(cv["test_precision"].mean()), 4),
        "CV Recall":    round(float(cv["test_recall"].mean()),    4),
        "CV F1 Score":  round(float(cv["test_f1"].mean()),        4),
    }
    print(f"[CV] {name}: Acc={cv_results[name]['CV Accuracy']:.4f}  F1={cv_results[name]['CV F1 Score']:.4f}")

# ── 7. Hyperparameter Tuning ──────────────────────────────────────────────────
print("\n" + "=" * 60)
print("       HYPERPARAMETER TUNING STAGE")
print("=" * 60)

# Tune Logistic Regression
print("\n Tuning Logistic Regression...")
lr_tune_pipe = ImbPipeline([
    ("scaler", MinMaxScaler()),
    ("smote",  SMOTE(random_state=42)),
    ("model",  LogisticRegression(random_state=42, max_iter=1000)),
])
lr_param_grid = {
    "model__C":        [0.01, 0.1, 1, 10, 100],
    "model__l1_ratio": [0.0, 1.0],
    "model__solver":   ["saga"],
}
lr_grid = GridSearchCV(lr_tune_pipe, lr_param_grid, cv=5, scoring="f1", n_jobs=-1, verbose=0)
lr_grid.fit(X_train, y_train)
best_lr_model  = lr_grid.best_estimator_
lr_predictions = best_lr_model.predict(X_test)
print(f" Best LR Parameters : {lr_grid.best_params_}")

# Tune Random Forest
print("\n Tuning Random Forest...")
rf_tune_pipe = ImbPipeline([
    ("scaler", MinMaxScaler()),
    ("smote",  SMOTE(random_state=42)),
    ("model",  RandomForestClassifier(random_state=42)),
])
rf_param_grid = {
    "model__n_estimators":      [100, 200, 300],
    "model__max_depth":         [None, 10, 20],
    "model__min_samples_split": [2, 5],
    "model__max_features":      ["sqrt", "log2"],
}
rf_grid = GridSearchCV(rf_tune_pipe, rf_param_grid, cv=5, scoring="f1", n_jobs=-1, verbose=0)
rf_grid.fit(X_train, y_train)
best_rf_model  = rf_grid.best_estimator_
rf_predictions = best_rf_model.predict(X_test)
print(f" Best RF Parameters : {rf_grid.best_params_}")

# ── 8. Before vs After comparison ────────────────────────────────────────────
lr_s.fit(X_train, y_train)
rf_s.fit(X_train, y_train)

tuning_results = {}
comparisons = {
    "Logistic Regression (Before)": lr_s.predict(X_test),
    "Random Forest (Before)":       rf_s.predict(X_test),
    "Logistic Regression (After)":  lr_predictions,
    "Random Forest (After)":        rf_predictions,
}
for name, preds in comparisons.items():
    tuning_results[name] = {
        "Accuracy":  round(float(accuracy_score(y_test, preds)),                   4),
        "Precision": round(float(precision_score(y_test, preds, zero_division=0)), 4),
        "Recall":    round(float(recall_score(y_test, preds, zero_division=0)),    4),
        "F1 Score":  round(float(f1_score(y_test, preds, zero_division=0)),        4),
    }
    print(f"[Tuning] {name}: Acc={tuning_results[name]['Accuracy']:.4f}  F1={tuning_results[name]['F1 Score']:.4f}")

# ── 9. Winner selection ───────────────────────────────────────────────────────
lr_f1 = f1_score(y_test, lr_predictions)
rf_f1 = f1_score(y_test, rf_predictions)

if rf_f1 >= lr_f1:
    final_model      = best_rf_model
    final_model_name = "Tuned Random Forest"
else:
    final_model      = best_lr_model
    final_model_name = "Tuned Logistic Regression"

print(f"\n WINNER: {final_model_name}  (F1={max(lr_f1, rf_f1):.4f})")

# ── 10. Save model + metrics ──────────────────────────────────────────────────
joblib.dump(final_model, "models/rf_model.pkl")
print("Saved → models/rf_model.pkl")

metrics = {
    "feature_cols":     feature_cols,
    "final_model_name": final_model_name,
    "cv_results":       cv_results,
    "tuning_results":   tuning_results,
    "best_lr_params":   {k: str(v) for k, v in lr_grid.best_params_.items()},
    "best_rf_params":   {k: str(v) for k, v in rf_grid.best_params_.items()},
    "winner_f1":        round(max(lr_f1, rf_f1), 4),
}
with open("models/model_metrics.json", "w") as f:
    json.dump(metrics, f, indent=2)
print("Saved → models/model_metrics.json")
