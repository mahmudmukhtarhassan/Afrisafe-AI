"""
Main FastAPI application for AfriSafe-AI (Render backend)
Endpoints:
 - /api/v1/auth/*  -> registration, login, refresh, me (Supabase-backed)
 - /api/v1/assessment -> create, history, get, delete
 - /health -> health check
"""
from fastapi import FastAPI, HTTPException, Depends, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.routing import APIRouter
import os
from dotenv import load_dotenv
from .api.v1 import auth as auth_router_module, assessment as assessment_router_module

load_dotenv()

API_V1_PREFIX = "/api/v1"

app = FastAPI(title="AfriSafe AI - Backend")

# CORS — allow all origins since auth uses JWT bearer tokens (not cookies)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
api_router = APIRouter()
api_router.include_router(auth_router_module.router, prefix="/auth", tags=["auth"])
api_router.include_router(assessment_router_module.router, prefix="/assessment", tags=["assessment"])

app.include_router(api_router, prefix=API_V1_PREFIX)


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
