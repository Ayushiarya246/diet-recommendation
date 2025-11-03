from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd
import uvicorn
import os

app = FastAPI()

# ✅ CORS
origins = [
    "http://localhost:5173",
    "https://diet-recommendation-chi.vercel.app",
    "https://diet-recommendation-jyx1.onrender.com",
    "https://diet-recommendation-1-7t28.onrender.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Load Model + Artifacts
base_dir = os.path.dirname(__file__)
model = joblib.load(os.path.join(base_dir, "random_forest_model.pkl"))
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
    return {"message": "Diet Recommendation API ✅ Running"}


@app.post("/predict/recommendation")
async def predict_recommendation(data: HealthInput):

    input_data = pd.DataFrame([data.dict()])
    user_id = input_data.pop("userId").iloc[0]

    input_data.rename(columns=rename_map, inplace=True)

    # ✅ Convert height feet ➝ cm (if numeric & < 100 assume feet)
    if "Height" in input_data.columns and input_data["Height"].iloc[0] < 100:
        input_data["Height"] = input_data["Height"] * 30.48

    # ✅ Apply training missing-fill rules
    input_data.fillna({"Chronic_Disease": "No disease", "Allergies": "No", "Food_Aversions": "No"}, inplace=True)

    # ✅ Apply label encoding (fallback for new categories)
    for col, encoder in encoders.items():
        if col in input_data.columns:
            val = input_data[col].astype(str)
            input_data[col] = val.apply(lambda x: encoder.transform([x])[0]
                                        if x in encoder.classes_
                                        else encoder.transform(["Other"])[0])

    # ✅ Final safety convert leftover strings
    for col in input_data.columns:
        if input_data[col].dtype == "object":
            input_data[col] = input_data[col].astype("category").cat.codes

    # ✅ Ensure correct column alignment
    for col in model_features:
        if col not in input_data.columns:
            input_data[col] = 0
    input_data = input_data[model_features]

    # ✅ Prediction
    pred = model.predict(input_data)[0]

    meal_plan = meal_plan_encoder.inverse_transform([int(pred[0])])[0]

    return {
        "success": True,
        "data": {
            "userId": user_id,
            "Recommended_Meal_Plan": meal_plan,
            "Recommended_Calories": float(pred[1]),
            "Recommended_Protein": float(pred[2]),
            "Recommended_Carbs": float(pred[3]),
            "Recommended_Fats": float(pred[4])
        }
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0",
                port=int(os.environ.get("PORT", 8000)))
