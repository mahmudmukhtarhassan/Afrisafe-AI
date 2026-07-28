import joblib
import numpy as np
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_PATH = BASE_DIR / "ml" / "malaria_model.pkl"
FEATURE_PATH = BASE_DIR / "ml" / "feature_names.pkl"

model = joblib.load(MODEL_PATH)
features = joblib.load(FEATURE_PATH)


def predict(data):

    values = np.array([[
        data.fever,
        data.headache,
        data.chills,
        data.vomiting,
        data.fatigue,
        data.body_pain,
    ]])

    prediction = model.predict(values)[0]

    probability = float(
        model.predict_proba(values).max()
    )

    return prediction, probability
