from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd
import uvicorn
import os
import gdown
import numpy as np

app = FastAPI()

origins = [
    "http://localhost:5173",
    "https://diet-recommendation-chi.vercel.app",
    "https://diet-recommendation-jyx1.onrender.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_URL = "https://drive.google.com/uc?export=download&id=1luLlzq4QEqEJgJGF1L0NrE-90V-rYyje"
base_dir = os.path.dirname(__file__)
model_path = os.path.join(base_dir, "random_forest_model.pkl")

# ✅ Download model if not exists
if not os.path.exists(model_path):
    print("🔄 Downloading model file from Google Drive...")
    gdown.download(MODEL_URL, model_path, quiet=False)

model = joblib.load(model_path)
meal_plan_encoder = joblib.load(os.path.join(base_dir, "meal_plan_encoder.pkl"))
model_features = joblib.load(os.path.join(base_dir, "model_features.pkl"))
encoders = joblib.load(os.path.join(base_dir, "encoders.pkl"))

class HealthInput(BaseModel):
    age: float | None = None
    gender: str | None = None
    height: float | None = None
    weight: float | None = None
    bmi: float | None = None
    blood_pressure_systolic: float | None = None
    blood_pressure_diastolic: float | None = None
    cholesterol_level: float | None = None
    blood_sugar_level: float | None = None
    chronic_disease: str | None = None
    genetic_risk_factor: str | None = None
    allergies: str | None = None
    food_aversion: str | None = None
    daily_steps: float | None = None
    exercise_frequency: str | None = None
    sleep_hours: float | None = None
    alcohol_consumption: str | None = None
    smoking_habit: str | None = None
    dietary_habits: str | None = None
    preferred_cuisine: str | None = None
    userId: int | str | None = None


# ✅ Column renaming (matches training)
rename_map = {
    "age": "Age",
    "gender": "Gender",
    "height": "Height_cm",
    "weight": "Weight",
    "bmi": "BMI",
    "blood_pressure_systolic": "Blood_Pressure_Systolic",
    "blood_pressure_diastolic": "Blood_Pressure_Diastolic",
    "cholesterol_level": "Cholesterol_Level",
    "blood_sugar_level": "Blood_Sugar_Level",
    "chronic_disease": "Chronic_Disease",
    "genetic_risk_factor": "Genetic_Risk_Factor",
    "allergies": "Allergies",
    "food_aversion": "Food_Aversions",
    "daily_steps": "Daily_Steps",
    "exercise_frequency": "Exercise_Frequency",
    "sleep_hours": "Sleep_Hours",
    "alcohol_consumption": "Alcohol_Consumption",
    "smoking_habit": "Smoking_Habit",
    "dietary_habits": "Dietary_Habits",
    "preferred_cuisine": "Preferred_Cuisine"
}


@app.get("/")
def root():
    return {"message": "✅ Diet Recommendation API Running Successfully!"}


@app.post("/predict/recommendation")
async def predict_recommendation(data: HealthInput):
    input_data = pd.DataFrame([data.dict()])

    # ✅ Extract User ID safely and convert to Python int
    user_id = input_data.get("userId", [0])[0]
    try:
        user_id = int(user_id)
    except:
        user_id = 0
    input_data.drop(columns=["userId"], inplace=True)

    input_data.rename(columns=rename_map, inplace=True)

    # ✅ Convert Height correctly if present
    if "height" in data.dict() and input_data.get("Height_cm", None) is None:
        input_data["Height_cm"] = pd.to_numeric(data.height, errors="coerce")

    # ✅ Replace missing categorical data with defaults
    categorical_defaults = {
        "Chronic_Disease": "No Disease",
        "Allergies": "No",
        "Food_Aversions": "No",
        "Exercise_Frequency": "No"
    }
    input_data.fillna(categorical_defaults, inplace=True)

    # ✅ Fix deprecated behavior
    for col in input_data.select_dtypes(include=["object"]).columns:
        input_data[col] = input_data[col].str.strip()

    # ✅ Label encode categorical fields
    for col, encoder in encoders.items():
        if col in input_data.columns:
            allowed = set(encoder.classes_)
            input_data[col] = input_data[col].astype(str).apply(
                lambda v: encoder.transform([v])[0] if v in allowed else 0
            )

    # ✅ Ensure all model features exist
    for col in model_features:
        if col not in input_data.columns:
            input_data[col] = 0

    input_data = input_data[model_features]

    # ✅ Make prediction
    pred = model.predict(input_data)[0].astype(float)

    # ✅ Decode meal plan class
    meal_plan_index = int(pred[0])
    meal_plan = meal_plan_encoder.inverse_transform([meal_plan_index])[0]

    # ✅ Prepare final API-safe response
    result = {
        "userId": user_id,
        "Recommended_Meal_Plan": str(meal_plan),
        "Recommended_Calories": float(pred[1]),
        "Recommended_Protein": float(pred[2]),
        "Recommended_Carbs": float(pred[3]),
        "Recommended_Fats": float(pred[4]),
    }

    # ✅ Final JSON safe return
    result = {k: (v.item() if hasattr(v, "item") else v) for k, v in result.items()}

    return {"success": True, "data": result}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
