# AfriSafe AI

An AI-powered Malaria Risk Prediction System for Nigeria.

## Overview

AfriSafe AI uses a trained logistic regression model to estimate malaria
likelihood from patient-reported symptoms and demographic data, then classifies
the case into a triage risk level (Low / Medium / High) with tailored
recommendations. The backend exposes a secure JWT-authenticated REST API with
user registration, login, prediction, history, and an admin dashboard.

## Tech Stack

- **Python 3.12** / **FastAPI** / **Uvicorn**
- **SQLAlchemy 2.0** ORM with **Alembic** migrations
- **SQLite** (development) / **PostgreSQL** (production)
- **Pydantic v2** for validation
- **JWT** auth (python-jose) + **bcrypt** hashing (passlib)
- **scikit-learn** / **joblib** for ML inference
- **pytest** for testing

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   └── routes/        # auth, prediction, admin routers
│   ├── config/            # Pydantic BaseSettings
│   ├── core/              # security, logging, exceptions
│   ├── database/          # engine, session, Base
│   ├── dependencies/      # current user / admin guards
│   ├── middleware/        # rate limiting
│   ├── ml/                # model loading + inference
│   ├── models/            # SQLAlchemy ORM models
│   ├── repositories/      # Repository Pattern data access
│   ├── schemas/           # Pydantic v2 request/response models
│   ├── services/          # business logic (auth, prediction, admin)
│   ├── utils/             # helpers
│   ├── logs/              # rotating log files
│   └── main.py            # FastAPI entry point
├── migrations/            # Alembic migrations
├── Model/                 # malaria_model.pkl, feature_names.pkl
├── tests/                 # pytest suite
├── alembic.ini
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

## Quick Start

### Local development

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

The API is available at `http://localhost:8000`. Interactive docs at `/docs`.

### Docker

```bash
cp .env.example .env
docker compose up --build
```

## API Endpoints

All routes are prefixed with `/api/v1`.

| Method | Path                        | Auth   | Description                          |
|--------|-----------------------------|--------|--------------------------------------|
| GET    | `/health`                   | None   | Health check + model load state      |
| POST   | `/auth/register`            | None   | Register, returns JWT pair           |
| POST   | `/auth/login`               | None   | Login, returns JWT pair              |
| POST   | `/auth/refresh`             | None   | Refresh access token                 |
| POST   | `/auth/logout`               | None   | Revoke refresh token                 |
| GET    | `/auth/me`                  | User   | Current user profile                  |
| POST   | `/prediction/predict`       | User   | Run malaria prediction + save history|
| GET    | `/prediction/history`       | User   | List user's prediction history       |
| DELETE | `/prediction/history/{id}`   | User   | Delete a prediction record           |
| GET    | `/admin/users`              | Admin  | List all users                       |
| GET    | `/admin/predictions`        | Admin  | List all predictions                 |
| GET    | `/admin/statistics`         | Admin  | Aggregate platform statistics        |

## Database Migrations (Alembic)

```bash
# Generate a new migration after model changes
alembic revision --autogenerate -m "describe change"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1
```

> Note: in development, tables are auto-created on startup via `init_db()`.
> In production, use Alembic migrations.

## Testing

```bash
pytest -v
```

Tests cover authentication, JWT, prediction, and database layers.

## Environment Variables

See `.env.example` for all supported variables. Never commit the real `.env`.

## Deployment

The backend is deployable to Render, Railway, Azure, AWS, and Docker. Set the
environment variables from `.env.example` in your hosting provider and run:

```
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

For PostgreSQL, set `DATABASE_URL=postgresql+psycopg://user:pass@host:5432/db`.
