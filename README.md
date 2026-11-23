# 🩺 MediPredict AI — Smarter Predictions. Better Health Awareness.

**An AI/ML-powered healthcare support platform that transforms symptom inputs into explainable predictions, health insights, and personalized healthcare recommendations.**

MediPredict AI combines machine learning, explainable AI, independent emergency warning-sign screening, and interactive analytics to support better health awareness and informed decision-making.

---

## ✨ Key Features

- 🧠 **AI-Powered Predictions:** Generates up to three ranked possible health conditions using trained ML models.
- 🔍 **Explainable AI:** Highlights the symptom factors contributing to prediction results.
- 🚨 **Emergency Screening:** Independent rule-based warning-sign detection.
- 🩺 **Healthcare Recommendations:** Provides general precautions, suggested medical departments, and safe next steps.
- 📊 **Interactive Analytics:** Visualizes assessment activity, prediction trends, and health insights.
- 🔐 **Secure Authentication:** Private user accounts with password hashing and session management.
- 🗂️ **Assessment History:** Stores and retrieves user-specific assessments using SQLite.

## 🎨 Tech Stack

**Frontend**

![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)
![Lucide](https://img.shields.io/badge/Lucide_Icons-F5A623?style=for-the-badge&logo=lucide&logoColor=white)

**Backend & Database**

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

**Machine Learning & Data Science**

![Machine Learning](https://img.shields.io/badge/Machine_Learning-8A2BE2?style=for-the-badge)
![Logistic Regression](https://img.shields.io/badge/Logistic_Regression-7B61FF?style=for-the-badge)
![Random Forest](https://img.shields.io/badge/Random_Forest-228B22?style=for-the-badge)
![Decision Tree](https://img.shields.io/badge/Decision_Tree-FF9800?style=for-the-badge)
![Explainable AI](https://img.shields.io/badge/Explainable_AI-E91E63?style=for-the-badge)

**Development Tools**

![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)
![npm](https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white)

---

## 🏗️ System Architecture

| Layer | Technologies | Responsibility |
|---|---|---|
| Frontend | React, TypeScript, Tailwind CSS | Interactive user interface |
| Visualization | Chart.js, Lucide | Charts and visual insights |
| Backend | Node.js, Express.js | API and application logic |
| Database | SQLite | Secure assessment persistence |
| ML Pipeline | Custom ML implementations | Training, evaluation, prediction |
| Security | scrypt, HMAC-SHA256 | Password hashing and sessions |

### 🧠 Machine Learning Pipeline

The ML pipeline is organized into modular components:

- **Schema:** 36 structured symptom indicators across 6 body systems and 12 outpatient condition classes.
- **Dataset:** Deterministic curated dataset generation with missing-value and duplicate inspection.
- **Preprocessing:** Feature validation, encoding, duration normalization, severity encoding, and age normalization.
- **Algorithms:** Multinomial Logistic Regression (L2), Random Forest (36 trees), and CART Decision Tree.
- **Evaluation:** Stratified train-test split, 5-fold cross-validation, Macro Precision, Recall, F1, Top-3 Hit Rate, Brier score, and confusion matrix.
- **Prediction:** Ranked candidate generation, insufficient-evidence handling, and leave-one-feature-out explanations.
- **Model Artifacts:** Persisted model bundle and evaluation report for reproducible inference.

### 🛡️ Safety & Healthcare Guidance

- Independent rule-based emergency warning-sign screening.
- Non-prescribing healthcare recommendations.
- Suggested medical departments and escalation guidance.
- Inconclusive prediction handling when evidence is insufficient.
- User-specific assessment history and data isolation.

---

## 🚀 Getting Started

### Prerequisites
- Node.js
- npm
- Git

### Installation

Clone the repository:

```bash
git clone YOUR_REPOSITORY_URL
cd medipredict-ai
```

Install dependencies:

```bash
npm install
```

Train the ML models:

```bash
npm run train-ml
```

Run automated tests:

```bash
npm test
```

Start the development server:

```bash
npm run dev
```

Open your browser:

```text
http://localhost:3000
```

### Production Build

```bash
npm run build
```

Start production server:

```bash
npm start
```

For Windows PowerShell, set production mode before starting:

```powershell
$env:NODE_ENV="production"
npm start
```

---

## 📈 ML Model Evaluation

The training pipeline evaluates three algorithms using 994 cleaned dataset records across 12 condition classes.

| Model | CV Macro-F1 | Holdout Accuracy | Top-3 Hit Rate |
|---|---:|---:|---:|
| Multinomial Logistic Regression (L2) | **0.9629** | 95% | 99.5% |
| Random Forest (36 Trees) | 0.9463 | 95% | 99.5% |
| CART Decision Tree | 0.8527 | 87% | 93% |

**Selected Model:** Multinomial Logistic Regression (L2), selected based on the highest cross-validation Macro-F1 score.

*Note: These are results from the project's curated dataset and holdout evaluation. They do not establish clinical accuracy, external validation, or real-world diagnostic performance.*

---

## ⚠️ Known Limitations

- Currently supports 12 outpatient condition classes.
- Does not process vital signs, laboratory results, or physical examination findings.
- Cannot identify every rare or complex medical condition.
- Model scores represent relative alignment within the supported condition classes, not clinical certainty.
- Recommendations are informational and do not replace professional medical evaluation.

---

## 🔮 Future Enhancements

- Expanded and independently validated medical datasets.
- More advanced model calibration and evaluation.
- Multilingual symptom assessment.
- Improved explainability and health education.
- Enhanced accessibility and mobile responsiveness.

---

## ⚕️ Medical Disclaimer

MediPredict AI is an educational and informational healthcare support project. It does not provide confirmed medical diagnoses, prescribe medication, or replace consultation with qualified healthcare professionals. Always seek professional medical advice for health concerns. If you experience emergency warning signs, seek urgent medical assistance.

---

## 👩‍💻 Project

**MediPredict AI — Smarter Predictions. Better Health Awareness.**

Built with a focus on machine learning, explainable predictions, responsible healthcare technology, and user-centered design.

⭐ If you find this project interesting, consider giving the repository a star!
