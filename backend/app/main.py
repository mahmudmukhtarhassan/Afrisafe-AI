"""
Main FastAPI application for AfriSafe AI (Render backend)

Endpoints:
- /api/v1/auth/*                   Authentication
- /api/v1/users/*                  User management
- /api/v1/prediction/*             Malaria prediction
- /api/v1/assessments/*            Assessment history
- /api/v1/prevention-guidelines/*  Prevention guidance
- /api/v1/reports/*                PDF reports
- /api/v1/reminders/*              User reminders
- /api/v1/notifications/*          Notifications
- /api/v1/ai/*                     AI engine
- /api/v1/ai_chat                  AI health assistant
- /api/v1/health                   Health check
- /health                          Render health endpoint
"""

import logging
import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router

load_dotenv()

app = FastAPI(
    title="AfriSafe AI Backend",
    version="1.0.0",
    description="AI-powered malaria health monitoring platform for Nigeria and Africa.",
)

# -------------------------------------------------------------------
# CORS
# -------------------------------------------------------------------

FRONTEND_URL = os.environ.get(
    "FRONTEND_URL",
    "https://afrisafe-ai.vercel.app"
)

RENDER_URL = os.environ.get("RENDER_URL", "")

allow_origins = [
    FRONTEND_URL,
    "https://afrisafe-ai.vercel.app",
    "https://www.afrisafe-ai.vercel.app",
    "http://localhost:3000",
    "http://localhost:5500",
    "http://localhost:5173",
]

if RENDER_URL:
    allow_origins.append(RENDER_URL)

# Remove duplicates
allow_origins = list(dict.fromkeys(allow_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=[
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
    ],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "X-Client-Info",
        "apikey",
    ],
)

# -------------------------------------------------------------------
# API Router
# -------------------------------------------------------------------

app.include_router(api_router)

# -------------------------------------------------------------------
# Startup
# -------------------------------------------------------------------

@app.on_event("startup")
def startup_event():
    """Preload the AI model at startup so the first request is faster."""

    log = logging.getLogger("afrisafe")

    try:
        from app.services.ai_service import load_model, is_model_ready

        load_model()

        if is_model_ready():
            log.info("AI model loaded successfully.")
        else:
            log.warning("AI model not loaded — prediction endpoints may return 503.")

    except Exception as e:
        log.warning("AI model startup load failed: %s", e)

# -------------------------------------------------------------------
# Health Endpoints
# -------------------------------------------------------------------

@app.get("/", tags=["Root"])
def root():
    return {
        "name": "AfriSafe AI Backend",
        "status": "running",
        "version": "1.0.0",
    }

@app.get("/health", tags=["Health"])
def health():
    return {
        "status": "ok",
        "service": "AfriSafe AI Backend",
    }

# -------------------------------------------------------------------
# Exception Handlers
# -------------------------------------------------------------------

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "detail": exc.detail,
        },
    )

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logging.exception("Unhandled exception: %s", exc)

    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "detail": "Internal server error",
        },
    )
