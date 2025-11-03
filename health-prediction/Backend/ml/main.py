from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd
import uvicorn
import os
import gdown

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


rename_map = {
    "age": "Age",
    "gender": "Gender",
    "height": "Height",
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

    user_id = input_data["userId"].iloc[0]
    input_data.drop(columns=["userId"], inplace=True)

    input_data.rename(columns=rename_map, inplace=True)

    if "Height" in input_data.columns:
        input_data["Height_cm"] = pd.to_numeric(input_data["Height"].fillna(0), errors="coerce") * 30.48
        input_data.drop(columns=["Height"], inplace=True)

    fill_defaults = {
        "Chronic_Disease": "No Disease",
        "Allergies": "No",
        "Food_Aversions": "No"
    }
    input_data.fillna(fill_defaults, inplace=True)

    input_data = input_data.applymap(lambda x: str(x).strip() if isinstance(x, str) else x)

    for col, encoder in encoders.items():
        if col in input_data.columns:
            input_data[col] = input_data[col].astype(str)
            known_classes = set(encoder.classes_)

            def encode_or_default(val):
                return int(encoder.transform([val])[0]) if val in known_classes else 0

            input_data[col] = input_data[col].apply(encode_or_default)

    for col in model_features:
        if col not in input_data.columns:
            input_data[col] = 0

    input_data = input_data[model_features]

    pred = model.predict(input_data)[0]

    meal_plan = meal_plan_encoder.inverse_transform([int(pred[0])])[0]

    result = {
        "userId": user_id,
        "Recommended_Meal_Plan": meal_plan,
        "Recommended_Calories": float(pred[1]),
        "Recommended_Protein": float(pred[2]),
        "Recommended_Carbs": float(pred[3]),
        "Recommended_Fats": float(pred[4]),
    }

    return {"success": True, "data": result}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
