from pathlib import Path
import joblib

# Base directory (backend/)
BASE_DIR = Path(__file__).resolve().parent.parent

# Models directory
MODEL_DIR = BASE_DIR.parent / "models"

MODEL_PATH = MODEL_DIR / "malaria_model.pkl"
FEATURES_PATH = MODEL_DIR / "feature_names.pkl"


class ModelLoader:
    """
    Loads the trained machine learning model and feature names
    once when the application starts.
    """

    def __init__(self):
        self.model = None
        self.feature_names = None

    def load(self):
        """Load ML artifacts into memory."""
        self.model = joblib.load(MODEL_PATH)
        self.feature_names = joblib.load(FEATURES_PATH)


# Singleton instance
ml_model = ModelLoader()
