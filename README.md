# MediPredict AI — Smarter Predictions. Better Health Awareness.

MediPredict AI is a full-stack healthcare symptom-analysis platform featuring an explainable machine learning pipeline, independent rule-based emergency screening, private user accounts, SQLite persistence, and interactive Chart.js analytics.

> **Disclaimer:** MediPredict AI provides informational health awareness only. It does not provide a confirmed medical diagnosis, prescribe medication, or replace evaluation by a licensed clinician.

## Architecture Overview

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Chart.js, Lucide Icons
- **Backend:** Express.js (`server.ts`) with Vite middleware in development and static serving in production
- **Database:** SQLite (`node:sqlite`, persisted in `instance/medipredict.db`) with parameterized queries and per-user ownership isolation
- **Machine Learning Pipeline (`ml/`):**
  - `ml/schema.ts` — 36 structured symptom indicators across 6 systems and 12 outpatient condition classes
  - `ml/dataset.ts` — Deterministic curated symptom-condition dataset generator with missing-value and duplicate inspection
  - `ml/preprocessor.ts` — Shared validation and feature encoder (36 binary symptom flags + log-normalized duration + ordinal severity + normalized age)
  - `ml/algorithms.ts` — Implementations of CART Decision Tree, Random Forest (36 trees), Multinomial Logistic Regression (L2), and Temperature Scaling calibration
  - `ml/evaluator.ts` — Stratified 80/20 split, 5-fold stratified cross-validation, Macro Precision/Recall/F1, Top-3 Hit Rate, Brier score, and confusion matrix
  - `ml/train.ts` — Reproducible training script persisting `ml/artifacts/model_bundle.json` and `ml/artifacts/evaluation_report.json`
  - `ml/predictor.ts` — Ranked inference (up to 3 candidates), insufficient-evidence inconclusive gate, and leave-one-feature-out Explainable AI attributions
- **Safety & Guidance (`services/`):**
  - `services/emergencyService.ts` — Independent rule-based clinical red-flag screening
  - `services/recommendationService.ts` — Non-prescribing department suggestions, general precautions, and escalation triggers
  - `services/authService.ts` — `scrypt` salted password hashing (`timingSafeEqual`) and HMAC-SHA256 server-side sessions
  - `services/assessmentService.ts` — End-to-end execution, transaction-safe SQLite persistence, history retrieval, deletion, and real dashboard analytics

## Setup & Run Commands

### Linux / macOS
```bash
npm install
npm run train-ml
npm test
npm run dev
```

### Windows PowerShell
```powershell
npm install
npm run train-ml
npm test
npm run dev
```

Open `http://localhost:3000` in your browser.

### Production Build & Start
```bash
npm run build
NODE_ENV=production npm start
```

## ML Model Selection & Evaluation Summary

Running `npm run train-ml` cleans 994 unique records across 12 condition classes and evaluates three algorithms via 5-fold stratified cross-validation and a 20% unseen holdout split:
- **Multinomial Logistic Regression (L2)** (Selected via highest CV Macro F1: `0.9629`, Holdout Test Accuracy: `95.0%`, Top-3 Hit Rate: `99.5%`)
- **Random Forest Classifier (36 Trees)** (CV Macro F1: `0.9463`, Holdout Test Accuracy: `95.0%`)
- **CART Decision Tree (Gini)** (CV Macro F1: `0.8527`, Holdout Test Accuracy: `87.0%`)

### Known Limitations
- Covers 12 prevalent outpatient conditions rather than rare pathologies.
- Does not ingest vital signs, laboratory values, or physical examination findings.
- Calibrated scores represent relative model alignment within the 12-class universe, not clinical certainty.
