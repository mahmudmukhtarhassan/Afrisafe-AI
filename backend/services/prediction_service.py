import pandas as pd

from utils.model_loader import ml_model
from schemas.request import PredictionRequest
from schemas.response import PredictionResponse


def _get_urgency(probability: float) -> str:
    """Determine urgency level from prediction probability."""
    if probability >= 0.70:
        return "High"
    elif probability >= 0.30:
        return "Medium"
    return "Low"


def _get_recommendation(urgency: str) -> str:
    """Return recommendation based on urgency level."""

    recommendations = {
        "High": (
            "Visit the nearest health facility immediately. "
            "This tool is for screening only and is not a medical diagnosis."
        ),
        "Medium": (
            "Monitor your symptoms and seek medical attention if they worsen. "
            "Consider visiting a healthcare provider."
        ),
        "Low": (
            "Current risk appears low. Continue monitoring your symptoms. "
            "If symptoms persist or worsen, consult a healthcare provider."
        ),
    }

    return recommendations[urgency]


def predict(data: PredictionRequest) -> PredictionResponse:
    """
    Perform malaria prediction using the trained ML model.
    """

    input_data = {
        "age": data.age,
        "gender": data.gender,
        "state": data.state,
        "fever": data.fever,
        "high_fever": data.high_fever,
        "headache": data.headache,
        "chills": data.chills,
        "vomiting": data.vomiting,
        "duration": data.duration,
    }

    # Create DataFrame
    df = pd.DataFrame([input_data])

    # One-hot encode categorical variables
    df = pd.get_dummies(df)

    # Ensure feature order matches training
    df = df.reindex(columns=ml_model.feature_names, fill_value=0)

    # Prediction
    prediction = ml_model.model.predict(df)[0]
    probability = float(ml_model.model.predict_proba(df)[0][1])

    prediction_label = "Malaria" if prediction == 1 else "No Malaria"

    urgency = _get_urgency(probability)

    recommendation = _get_recommendation(urgency)

    return PredictionResponse(
        prediction=prediction_label,
        probability=round(probability, 4),
        urgency=urgency,
        recommendation=recommendation,
    )
