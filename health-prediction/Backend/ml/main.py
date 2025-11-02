# python_api/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd
import uvicorn
import os
import numpy as np
from sklearn.preprocessing import LabelEncoder
import zipfile

app = FastAPI()

origins = [
    "https://diet-recommendation-chi.vercel.app",
    "https://diet-recommendation-jyx1.onrender.com",  # Node backend domain
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
MODEL_FILENAME = "random_forest_model.pkl"
MEAL_ENCODER_FILENAME = "meal_plan_encoder.pkl"
CSV_FILENAME = "Personalized_Diet_Recommendations.csv"
ZIP_FILENAME = "archive.zip"

# try to ensure CSV exists (if you packaged it as archive.zip like training script)
base_dir = os.path.dirname(__file__)
csv_path = os.path.join(base_dir, CSV_FILENAME)
zip_path = os.path.join(base_dir, ZIP_FILENAME)

if not os.path.exists(csv_path) and os.path.exists(zip_path):
    try:
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(base_dir)
            print(f"Extracted {ZIP_FILENAME} to {base_dir}")
    except Exception as e:
        print("Failed to extract archive.zip:", e)

if not os.path.exists(csv_path):
    print("Warning: training CSV not found at", csv_path, "- label encoders will be built from default behavior (less accurate).")

# Load model and meal_plan encoder
model = joblib.load(os.path.join(base_dir, MODEL_FILENAME))
meal_plan_encoder = joblib.load(os.path.join(base_dir, MEAL_ENCODER_FILENAME))

# Columns that were label-encoded during training
LABEL_ENCODE_COLS = [
    "Gender", "Chronic_Disease", "Genetic_Risk_Factor", "Allergies",
    "Food_Aversions", "Alcohol_Consumption", "Smoking_Habit",
    "Dietary_Habits", "Preferred_Cuisine"
]

# We'll fit label encoders from the training CSV if available
label_encoders = {}

def build_label_encoders():
    if not os.path.exists(csv_path):
        print("Training CSV not found. Not building feature label encoders.")
        return

    try:
        df_train = pd.read_csv(csv_path)
    except Exception as e:
        print("Failed to read training CSV:", e)
        return

    # Fill NaNs as training script did
    if "Chronic_Disease" in df_train.columns:
        df_train['Chronic_Disease'] = df_train['Chronic_Disease'].fillna('No Disease')
    if "Allergies" in df_train.columns:
        df_train['Allergies'] = df_train['Allergies'].fillna('No')
    if "Food_Aversions" in df_train.columns:
        df_train['Food_Aversions'] = df_train['Food_Aversions'].fillna('No')

    for col in LABEL_ENCODE_COLS:
        if col in df_train.columns:
            le = LabelEncoder()
            # convert to str to avoid problems
            cleaned = df_train[col].fillna("No").astype(str)
            le.fit(cleaned)
            label_encoders[col] = {
                "encoder": le,
                "classes": list(le.classes_),
                # choose a fallback class (most common)
                "fallback": cleaned.mode().iloc[0] if not cleaned.mode().empty else le.classes_[0]
            }
            print(f"Built LabelEncoder for {col} with classes: {list(le.classes_)[:10]}{'...' if len(le.classes_)>10 else ''}")
        else:
            print(f"Training CSV missing expected column: {col} — encoder not built.")

# Build encoders at startup
build_label_encoders()


class HealthInput(BaseModel):
    Age: float | None = None
    Gender: str | None = None
    Height: float | None = None
    Weight: float | None = None
    BMI: float | None = None
    Blood_Pressure_Systolic: float | None = None
    Blood_Pressure_Diastolic: float | None = None
    Cholesterol_Level: float | None = None
    Blood_Sugar_Level: float | None = None
    Chronic_Disease: str | None = None
    Genetic_Risk_Factor: str | None = None
    Allergies: str | None = None
    Food_Aversions: str | None = None
    Daily_Steps: float | None = None
    Exercise_Frequency: str | None = None
    Sleep_Hours: float | None = None
    Alcohol_Consumption: str | None = None
    Smoking_Habit: str | None = None
    Dietary_Habits: str | None = None
    Preferred_Cuisine: str | None = None
    userId: str | None = None


def safe_label_transform(col, value):
    """Transform categorical value to the numeric label used during training.
    If encoder for col not found, try to coerce to string and fallback to a safe value.
    """
    if col not in label_encoders:
        # no encoder built; return the incoming value unchanged
        # but model expects numeric -> try to return 0
        try:
            return float(value)
        except Exception:
            return 0
    enc = label_encoders[col]["encoder"]
    val_str = str(value) if value is not None else ""
    # If unseen category, map to fallback
    if val_str not in enc.classes_:
        fallback = label_encoders[col]["fallback"]
        try:
            return int(enc.transform([fallback])[0])
        except Exception:
            return 0
    return int(enc.transform([val_str])[0])


@app.get("/")
def root():
    return {"message": "Health Prediction API Running ✅"}


@app.post("/predict/recommendation")
async def predict_recommendation(data: HealthInput):
    # Convert to DataFrame
    input_raw = data.dict()
    # Apply label encoding for columns that were label encoded in training
    for col in LABEL_ENCODE_COLS:
        if col in input_raw:
            input_raw[col] = safe_label_transform(col, input_raw[col])
        else:
            # missing column: set a safe default encoded value (0)
            input_raw[col] = 0

    input_data = pd.DataFrame([input_raw])

    # In training you applied get_dummies only for Dietary_Habits and Preferred_Cuisine.
    # The training pipeline label-encoded those columns first then pd.get_dummies(...) on them.
    # So replicate that: Dietary_Habits and Preferred_Cuisine are currently numeric label-encoded.
    cat_dummy_cols = ['Dietary_Habits', 'Preferred_Cuisine']
    input_data = pd.get_dummies(input_data, columns=[c for c in cat_dummy_cols if c in input_data.columns], drop_first=True)

    # Align with feature names the model expects
    try:
        model_feature_cols = model.feature_names_in_
    except Exception:
        model_feature_cols = list(input_data.columns)

    # Add missing columns as zeros
    for col in model_feature_cols:
        if col not in input_data.columns:
            input_data[col] = 0

    # Reorder columns
    input_data = input_data[model_feature_cols]

    # Predict (multi-output model)
    try:
        pred = model.predict(input_data)[0]  # array like [meal_label, calories, protein, carbs, fats]
    except Exception as e:
        # give detailed error for debugging
        print("Model prediction failed. input_data columns:", list(input_data.columns)[:40])
        raise

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
