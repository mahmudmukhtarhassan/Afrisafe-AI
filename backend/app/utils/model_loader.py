from app.utils.model_loader import get_model

class PredictionService:
    @staticmethod
    def predict_malaria(input_data: dict):
        model = get_model("malaria_model")
        feature_names = get_model("feature_names")
        
        # Sarrafa data da yin prediction...
        # ...
        prediction = model.predict([list(input_data.values())])
        return prediction
