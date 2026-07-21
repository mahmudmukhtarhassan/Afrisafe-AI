# 🦟 AfriSafe AI – Malaria Symptom Triage Helper

![Python](https://img.shields.io/badge/Python-3.11-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110-green)
![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-ML-orange)
![License](https://img.shields.io/badge/License-MIT-yellow)
![Status](https://img.shields.io/badge/Status-Production%20Ready-success)

> An AI-powered malaria symptom assessment and triage system designed to help individuals understand their malaria risk before visiting a healthcare facility.

---

# 📖 Overview

AfriSafe AI is an intelligent healthcare application that predicts the likelihood of malaria infection using Machine Learning.

The platform allows users to:

- Enter personal information
- Select malaria symptoms
- Receive an AI-powered malaria risk prediction
- Get medical recommendations
- Understand confidence level of prediction

The goal is **early awareness**, **better decision making**, and **improved access to healthcare**, especially in underserved communities across Africa.

---

# 🚀 Features

- AI-powered malaria prediction
- FastAPI REST API
- Machine Learning inference
- Modern frontend interface
- Confidence score
- Risk classification
- Clinical recommendations
- Health check endpoint
- Swagger API documentation
- Clean project architecture

---

# 🏗 Project Architecture

```
Frontend (HTML/CSS/JavaScript)
           │
           ▼
 FastAPI Backend
           │
           ▼
 Machine Learning Model (.pkl)
           │
           ▼
 Prediction Response
```

---

# 🧠 Machine Learning

The prediction model was trained using malaria symptom data and exported as:

```
model.pkl
```

Technologies used:

- Scikit-Learn
- Pandas
- NumPy
- Joblib

---

# ⚙️ Backend Technologies

- FastAPI
- Pydantic
- Uvicorn
- Joblib
- Scikit-Learn
- Pandas
- NumPy

---

# 💻 Frontend Technologies

- HTML5
- CSS3
- JavaScript (ES6)

---

# 📦 Installation

## Clone Repository

```bash
git clone https://github.com/mahmudmukhtarhassan/afrisafe-ai.git

cd afrisafe-ai
```

---


# 📡 API Example

POST

```
/predict
```

Request

```json
{
  "patient": {
    "age": 25,
    "gender": "Male",
    "state": "Kano",
    "lga": "Nassarawa"
  },
  "assessment": {
    "symptoms": [
      "fever",
      "headache",
      "chills"
    ],
    "durationDays": 3,
    "recentMosquitoBites": true,
    "recentTravel": false,
    "takenMalariaDrugs": false
  }
}
```

---

Response

```json
{
  "prediction": "Positive",
  "risk": "High",
  "confidence": 94.7,
  "recommendation": "Visit the nearest health facility for malaria testing immediately.",
  "advice": [
    "Take a Rapid Diagnostic Test (RDT).",
    "Drink enough water.",
    "Avoid self-medication."
  ]
}
```

---

# 🧪 Running Tests

```bash
pytest
```

---

# 🔒 Security

Input validation is implemented using **Pydantic**.

The application includes:

- Request validation
- Error handling
- Model initialization checks
- Structured API responses
- CORS protection

---

# 🌍 Use Cases

- Community healthcare
- Rural clinics
- Digital health platforms
- Public health awareness
- AI healthcare research
- Malaria screening support

---

# 📊 Future Improvements

- Deep Learning model
- Multi-disease prediction
- Mobile application
- Offline prediction
- Hospital integration
- Electronic Health Records (EHR)
- User authentication
- Cloud deployment
- Analytics dashboard

---

# 🤝 Contributing

Contributions are welcome!

5. Open a Pull Request

---

# 📜 License

This project is licensed under the MIT License.

---

# 👨‍💻 Author

## Mahmud Mukhtar Hassan

Data Scientist | Machine Learning Engineer | Full Stack Developer

GitHub:
https://github.com/mahmudmukhtarhassan

Email:
mahmudmukhtarhassan.com

---

# 🙏 Acknowledgements

Special thanks to:

- OpenAI
- FastAPI
- Scikit-Learn
- Python Community
- 3MTT Nigeria
- 3MTT Nextgen
- Blue Sapphire Hub
- Kaggle Community

---

# ⭐ Support

If you found this project helpful, please give it a ⭐ on GitHub.

It helps others discover the project and motivates future development.

---

## 📈 Project Status

✅ Active Development

Version:

```
v1.0.0
```

---

## 🌍 Vision

AfriSafe AI aims to leverage Artificial Intelligence to improve malaria awareness, support early risk assessment, and empower communities with accessible digital health tools across Africa.

> **Disclaimer:** AfriSafe AI is intended as a decision-support and educational tool. It does **not** replace professional medical diagnosis or treatment. Users should consult qualified healthcare professionals for medical advice.
