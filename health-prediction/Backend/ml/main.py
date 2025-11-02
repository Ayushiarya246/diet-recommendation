from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd
import uvicorn
import os

app = FastAPI()

# ✅ Enable CORS for frontend calls
origins = [
    "https://diet-recommendation-chi.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Load trained model and encoder
model = joblib.load("random_forest_model.pkl")
meal_plan_encoder = joblib.load("meal_plan_encoder.pkl")


# ✅ Input structure validation
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

    input_data = pd.DataFrame([data.dict()])

    # ✅ One-hot encode categorical variables
    categorical_cols = [
        "Gender", "Chronic_Disease", "Genetic_Risk_Factor", "Allergies",
        "Food_Aversions", "Alcohol_Consumption", "Smoking_Habit",
        "Dietary_Habits", "Preferred_Cuisine"
    ]

    input_data = pd.get_dummies(input_data, columns=categorical_cols, drop_first=True)

    # ✅ Align with model input columns
    model_feature_cols = model.estimators_[0].feature_names_in_

    for col in model_feature_cols:
        if col not in input_data.columns:
            input_data[col] = 0

    input_data = input_data[model_feature_cols]

    # ✅ Predict values
    pred = model.predict(input_data)[0]

    meal_plan_label = int(pred[0])
    recommended_calories = float(pred[1])
    recommended_protein = float(pred[2])
    recommended_carbs = float(pred[3])
    recommended_fats = float(pred[4])

    meal_plan = meal_plan_encoder.inverse_transform([meal_plan_label])[0]

    return {
        "Recommended_Meal_Plan": meal_plan,
        "Recommended_Calories": recommended_calories,
        "Recommended_Protein": recommended_protein,
        "Recommended_Carbs": recommended_carbs,
        "Recommended_Fats": recommended_fats
    }


# ✅ Deployment Entry for Render
if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 10000))
    )
