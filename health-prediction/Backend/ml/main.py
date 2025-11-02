# python_api/main.py (FastAPI)
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd
import uvicorn
import os
import numpy as np

app = FastAPI()

origins = [
    "https://diet-recommendation-chi.vercel.app",
    "https://diet-recommendation-jyx1.onrender.com",
    "http://localhost:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load trained model and encoder
model = joblib.load("random_forest_model.pkl")
meal_plan_encoder = joblib.load("meal_plan_encoder.pkl")

class HealthInput(BaseModel):
    Age: float
    Gender: str
    Height_cm: float
    Weight_kg: float
    Chronic_Disease: str
    Genetic_Risk_Factor: str
    Allergies: str
    Food_Aversions: str
    Alcohol_Consumption: str
    Smoking_Habit: str
    Dietary_Habits: str
    Preferred_Cuisine: str
    Daily_Steps: float
    Sleep_Hours: float
    Blood_Pressure_Systolic: float
    Blood_Pressure_Diastolic: float

@app.get("/")
def root():
    return {"message": "Health Prediction API Running ✅"}

@app.post("/predict/recommendation")
async def predict_recommendation(data: HealthInput):
    # Convert to DataFrame
    input_data = pd.DataFrame([data.dict()])

    # One-hot encode categorical variables (same preprocessing used during training)
    categorical_cols = [
        "Gender", "Chronic_Disease", "Genetic_Risk_Factor", "Allergies",
        "Food_Aversions", "Alcohol_Consumption", "Smoking_Habit",
        "Dietary_Habits", "Preferred_Cuisine"
    ]
    input_data = pd.get_dummies(input_data, columns=categorical_cols, drop_first=True)

    # Align with feature names the model expects
    try:
        model_feature_cols = model.feature_names_in_
    except Exception:
        # fallback: if not present, try to derive columns from training-time saving (less common)
        model_feature_cols = getattr(model, "feature_names_in_", list(input_data.columns))

    # Add missing columns as zeros
    for col in model_feature_cols:
        if col not in input_data.columns:
            input_data[col] = 0

    input_data = input_data[model_feature_cols]

    # Predict (multi-output model)
    pred = model.predict(input_data)[0]  # array like [meal_label, calories, protein, carbs, fats]

    # meal label is first entry in your training pipeline
    meal_plan_label = int(np.round(pred[0]))  # round/convert to int robustly
    try:
        meal_plan = meal_plan_encoder.inverse_transform([meal_plan_label])[0]
    except Exception:
        meal_plan = str(meal_plan_label)

    response = {
        "Recommended_Meal_Plan": meal_plan,
        "Recommended_Calories": float(pred[1]),
        "Recommended_Protein": float(pred[2]),
        "Recommended_Carbs": float(pred[3]),
        "Recommended_Fats": float(pred[4])
    }
    return response

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 10000)))
