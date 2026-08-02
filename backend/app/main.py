"""
Main FastAPI application for AfriSafe-AI (Render backend)
Endpoints:
 - /api/v1/auth/*      -> registration, login, refresh, me (Supabase-backed)
 - /api/v1/prediction/* -> predict, history, delete (Supabase-backed)
 - /api/v1/assessment  -> create, history, get, delete
 - /api/v1/health      -> health check
"""
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
import os

from app.api.v1.router import api_router

load_dotenv()

app = FastAPI(title="AfriSafe AI - Backend")

FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://afrisafe-ai.vercel.app")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_URL,
        "https://afrisafe-ai.vercel.app",
        "https://www.afrisafe-ai.vercel.app",
        "http://localhost:3000",
        "http://localhost:5500",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Client-Info", "Apikey"],
)

app.include_router(api_router)


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
