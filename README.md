# AfriSafe AI

**AI-powered health risk assessment and disease prediction platform for Africa**

AfriSafe AI is an intelligent healthcare platform designed to improve early disease detection and preventive healthcare across Africa. The platform enables users to perform AI-driven health assessments, receive personalized risk predictions, track assessment history, and access health insights through a secure web application.

Built with **FastAPI**, **Supabase**, and a **Vercel-hosted frontend**, AfriSafe AI aims to provide accessible, scalable, and data-driven healthcare support for underserved communities.

---

## Vision

To build Africa’s most trusted AI-powered preventive healthcare platform, helping millions of people detect health risks early and make informed medical decisions.

## Key Features

* AI-powered health risk assessment
* Disease prediction engine
* Secure user authentication
* Personalized dashboard
* Assessment history tracking
* PDF report generation
* Health reminders and notifications
* RESTful API architecture
* Cloud deployment with Render and Vercel
* Supabase authentication and database integration

---

## Technology Stack

### Frontend

* HTML5
* CSS3
* JavaScript (ES6+)
* Vercel

### Backend

* FastAPI
* Uvicorn
* Python
* Pydantic
* ReportLab

### AI / Data

* Scikit-learn
* Pandas
* NumPy
* Joblib

### Database & Authentication

* Supabase
* Supabase Auth
* PostgreSQL

### Deployment

* Render (Backend)
* Vercel (Frontend)

---

## Project Structure

```text
Afrisafe-AI/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── main.py
│   ├── requirements.txt
│   └── render.yaml
│
├── frontend/
│   ├── css/
│   ├── js/
│   ├── index.html
│   ├── login.html
│   ├── dashboard.html
│   └── assessment.html
│
└── README.md
```

---

## API Overview

### Authentication

| Method | Endpoint                |
| ------ | ----------------------- |
| POST   | `/api/v1/auth/register` |
| POST   | `/api/v1/auth/login`    |
| POST   | `/api/v1/auth/refresh`  |
| GET    | `/api/v1/auth/me`       |

### Assessment

| Method | Endpoint                     |
| ------ | ---------------------------- |
| POST   | `/api/v1/assessment`         |
| GET    | `/api/v1/assessment/history` |
| GET    | `/api/v1/assessment/{id}`    |
| DELETE | `/api/v1/assessment/{id}`    |

### System

| Method | Endpoint  |
| ------ | --------- |
| GET    | `/health` |

---

## Getting Started

### Prerequisites

* Python 3.11+
* Node.js (optional for frontend tooling)
* Supabase account
* Git

### Clone the Repository

```bash
git clone https://github.com/your-username/Afrisafe-AI.git
cd Afrisafe-AI
```

### Backend Setup

```bash
cd backend

python -m venv .venv

# Windows
.venv\\Scripts\\activate

# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

JWT_SECRET_KEY=your_secret_key
JWT_REFRESH_SECRET_KEY=your_refresh_secret_key

FRONTEND_URL=http://localhost:3000
```

Run the backend:

```bash
uvicorn app.main:app --reload
```

Backend will be available at:

```text
http://localhost:8000
```

Swagger documentation:

```text
http://localhost:8000/docs
```

---

## Frontend Setup

Open the frontend directory:

```bash
cd frontend
```

Update `js/config.js`:

```javascript
const API_BASE_URL = "http://localhost:8000";
```

Open `index.html` in your browser or serve it with a local server.

---

## Deployment

### Backend (Render)

1. Connect GitHub repository
2. Set `rootDir` to `backend`
3. Build command:

```text
pip install -r requirements.txt
```

4. Start command:

```text
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

5. Add environment variables in Render.

### Frontend (Vercel)

1. Import repository
2. Set project root to `frontend`
3. Update:

```javascript
const API_BASE_URL = "https://your-render-service.onrender.com";
```

Deploy.

---

## AI Pipeline

1. User submits health assessment
2. Backend validates input
3. AI model processes symptoms and demographic data
4. Prediction result is generated
5. Result is stored in Supabase
6. Dashboard displays assessment history and recommendations
7. PDF reports can be generated for sharing with healthcare providers

---

## Security

* Supabase Authentication
* JWT-based access control
* Password hashing
* Protected API endpoints
* CORS configuration
* Environment variable management
* HTTPS deployment support

---

## Current Development Status

| Module                 | Status      |
| ---------------------- | ----------- |
| Frontend UI            | Completed   |
| Authentication         | In Progress |
| Dashboard              | In Progress |
| Assessment Engine      | In Progress |
| AI Prediction          | In Progress |
| Reports                | In Progress |
| Deployment             | Active      |
| Production Integration | Ongoing     |

---

## Roadmap

* Mobile application (Android/iOS)
* Multi-language support (English, Hausa, Yoruba, Igbo)
* Telemedicine integration
* Hospital and pharmacy connectivity
* Maternal health emergency support
* Offline-first mode
* SMS/USSD access
* Wearable device integration
* Community health analytics

---

## Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push the branch
5. Open a Pull Request

---

## Founder

**Mahmud Mukhtar Hassan**

Founder & CEO, **MAHTECH Innovation Lab**

Passionate about artificial intelligence, healthcare technology, and building scalable digital solutions for Africa.

GitHub: https://github.com/your-username

LinkedIn: https://linkedin.com/in/your-profile

---

## License

This project is licensed under the **MIT License**.

---

## Acknowledgements

* Supabase
* FastAPI
* Vercel
* Render
* Scikit-learn
* Open-source AI and healthcare communities

---

**AfriSafe AI — Smarter Prevention. Healthier Africa.**

