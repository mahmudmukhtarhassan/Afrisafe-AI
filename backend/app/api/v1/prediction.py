"""
Prediction router for AfriSafe AI (Render backend).
Mirrors the Express dev server's /api/v1/prediction/* endpoints:
  POST /predict          -> run triage, persist to Supabase, return result
  GET  /history          -> list user's predictions
  DELETE /history/{id}   -> delete a prediction record
"""
import os
import math
import uuid
import datetime
import requests
from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
REST_URL = f"{SUPABASE_URL}/rest/v1"

service_headers = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
}


class PredictionPayload(BaseModel):
    symptoms: list[str] = []
    duration: int = 1
    mosquito_exposure: bool = False
    standing_water: bool = False
    travel_history: bool = False
    bed_net_used: bool = False
    drug_history: bool = False


def get_user_id_from_request(request: Request) -> str:
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header",
        )
    url = f"{SUPABASE_URL}/auth/v1/user"
    headers = {"Authorization": auth_header, "apikey": SUPABASE_ANON_KEY}
    resp = requests.get(url, headers=headers)
    if resp.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    user = resp.json()
    return user.get("id")


def calculate_risk(payload: PredictionPayload) -> dict:
    symptoms = [str(s).lower().strip() for s in (payload.symptoms or [])]
    duration = payload.duration or 1
    mosquito = payload.mosquito_exposure
    travel = payload.travel_history
    standing_water = payload.standing_water
    bed_net = payload.bed_net_used

    z = -2.2
    if "high fever" in symptoms:
        z += 2.1
    elif "fever" in symptoms:
        z += 1.4
    if "chills" in symptoms:
        z += 1.2
    if "vomiting" in symptoms:
        z += 1.0
    if "headache" in symptoms:
        z += 0.7
    if "bitter taste" in symptoms or "loss of appetite" in symptoms:
        z += 0.4
    if "dizziness" in symptoms:
        z += 0.4
    if mosquito:
        z += 0.5
    if standing_water:
        z += 0.4
    if travel:
        z += 0.4
    if bed_net:
        z -= 0.3
    z += min(duration * 0.1, 0.8)

    probability = 1 / (1 + math.exp(-z))
    prediction = "Malaria" if probability >= 0.5 else "No Malaria"
    confidence = round((probability if probability >= 0.5 else 1 - probability) * 10000) / 100

    risk = "Low"
    if probability >= 0.75:
        risk = "High"
    elif probability >= 0.45 or "high fever" in symptoms:
        risk = "Medium"

    if risk == "High":
        recommendation = (
            "High risk detected. Visit the nearest health facility for malaria testing immediately. "
            "Severe symptoms require urgent clinical evaluation."
        )
        advice = [
            "Take a Rapid Diagnostic Test (RDT) or blood smear at a clinic.",
            "Begin prescribed antimalarial treatment (ACT) only after confirmation.",
            "Drink plenty of fluids and rest.",
            "Avoid self-medication or leftover antimalarials.",
            "Seek emergency care if confusion, seizures, or difficulty breathing occur.",
        ]
    elif risk == "Medium":
        recommendation = "Moderate risk detected. Visit a clinic within 24-48 hours for a malaria test."
        advice = [
            "Get a Rapid Diagnostic Test (RDT) to confirm malaria.",
            "Stay hydrated and monitor your temperature.",
            "Use insecticide-treated bed nets.",
            "Do not self-medicate; wait for test results.",
        ]
    else:
        recommendation = "Low risk indicators. Monitor symptoms and rest. Seek care if symptoms worsen."
        advice = [
            "Rest and maintain hydration.",
            "Continue monitoring for fever or new symptoms.",
            "Use preventive measures (bed nets, repellents).",
            "Visit a clinic if symptoms persist beyond 48 hours.",
        ]

    symptom_text = ", ".join(payload.symptoms) if payload.symptoms else "no significant symptoms"
    pct = round(probability * 1000) / 10
    if prediction == "Malaria":
        lead = f"The model estimates a {pct}% probability of malaria based on the reported symptom profile ({symptom_text})."
    else:
        lead = f"The model estimates a low ({pct}%) probability of malaria. Reported symptoms ({symptom_text}) do not strongly match the malaria profile."

    notes: list[str] = []
    if mosquito:
        notes.append("Recent mosquito bites increase epidemiological likelihood.")
    if standing_water:
        notes.append("Presence of standing/stagnant water near residence creates mosquito breeding vectors.")
    if bed_net:
        notes.append("Regular use of insecticide-treated bed nets serves as a valuable protective barrier.")
    if travel:
        notes.append("Recent travel to endemic areas is a supporting risk factor.")
    if payload.drug_history:
        notes.append("Recent antimalarial use may suppress test results; inform your clinician.")

    ai_insights = f"{lead} {' '.join(notes)}".strip()

    return {
        "prediction": prediction,
        "confidence": confidence,
        "probability": probability,
        "risk": risk,
        "recommendation": recommendation,
        "advice": advice,
        "ai_insights": ai_insights,
    }


@router.post("/predict")
def predict(payload: PredictionPayload, request: Request):
    user_id = get_user_id_from_request(request)
    result = calculate_risk(payload)
    created_at = datetime.datetime.utcnow().isoformat()

    record = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "prediction": result["prediction"],
        "confidence": result["confidence"],
        "risk": result["risk"],
        "recommendation": result["recommendation"],
        "advice": result["advice"],
        "symptoms": payload.model_dump(),
        "ai_insights": result["ai_insights"],
        "created_at": created_at,
    }

    url = f"{REST_URL}/predictions"
    resp = requests.post(url, json=record, headers=service_headers)
    if resp.status_code not in (200, 201):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=resp.text,
        )

    return {
        "id": record["id"],
        "prediction": record["prediction"],
        "confidence": record["confidence"],
        "risk": record["risk"],
        "recommendation": record["recommendation"],
        "advice": record["advice"],
        "symptoms": record["symptoms"],
        "ai_insights": record["ai_insights"],
        "timestamp": created_at,
    }


@router.get("/history")
def prediction_history(request: Request):
    user_id = get_user_id_from_request(request)
    url = f"{REST_URL}/predictions?user_id=eq.{user_id}&order=created_at.desc"
    resp = requests.get(url, headers=service_headers)
    if resp.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=resp.text,
        )
    rows = resp.json()
    items = [
        {
            "id": r.get("id"),
            "prediction": r.get("prediction"),
            "confidence": r.get("confidence"),
            "risk": r.get("risk"),
            "recommendation": r.get("recommendation"),
            "advice": r.get("advice"),
            "symptoms": r.get("symptoms"),
            "ai_insights": r.get("ai_insights"),
            "created_at": r.get("created_at"),
        }
        for r in rows
    ]
    return {"total": len(items), "items": items}


@router.delete("/history/{prediction_id}", status_code=204)
def delete_prediction(prediction_id: str, request: Request):
    user_id = get_user_id_from_request(request)
    url = f"{REST_URL}/predictions?id=eq.{prediction_id}&user_id=eq.{user_id}"
    resp = requests.delete(url, headers=service_headers)
    if resp.status_code not in (200, 204):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=resp.text,
        )
    return {}
