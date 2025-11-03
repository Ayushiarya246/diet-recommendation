from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestRegressor
from sklearn.multioutput import MultiOutputRegressor
from sklearn.metrics import mean_absolute_error, r2_score
import pandas as pd
import numpy as np
import zipfile, os, joblib

# ✅ Extract dataset
zip_path = os.path.join(os.path.dirname(__file__), "archive.zip")
with zipfile.ZipFile(zip_path, 'r') as zip_ref:
    zip_ref.extractall(os.path.dirname(__file__))

csv_path = os.path.join(os.path.dirname(__file__), "Personalized_Diet_Recommendations.csv")
df = pd.read_csv(csv_path)
print("✅ CSV Loaded: ", df.shape)

# ✅ Fill missing values (match backend)
df['Chronic_Disease'] = df['Chronic_Disease'].fillna('No Disease')
df['Allergies'] = df['Allergies'].fillna('No')
df['Food_Aversions'] = df['Food_Aversions'].fillna('No')
df['Exercise_Frequency'] = df['Exercise_Frequency'].fillna('No')

# ✅ No Height conversion — CSV already has Height_cm


# ✅ Encode categorical columns
label_cols = [
    'Gender', 'Chronic_Disease', 'Genetic_Risk_Factor', 'Allergies',
    'Food_Aversions', 'Alcohol_Consumption', 'Smoking_Habit',
    'Dietary_Habits', 'Preferred_Cuisine', 'Exercise_Frequency'
]

encoders = {}
for col in label_cols:
    df[col] = df[col].astype(str)
    le = LabelEncoder()
    df[col] = le.fit_transform(df[col])
    encoders[col] = le

# ✅ Define Features & Target

y = df[['Recommended_Meal_Plan', 'Recommended_Calories',
        'Recommended_Protein', 'Recommended_Carbs', 'Recommended_Fats']].copy()

X = df.drop(columns=[
    'Patient_ID', 'Recommended_Meal_Plan',
    'Recommended_Calories', 'Recommended_Protein',
    'Recommended_Carbs', 'Recommended_Fats'
])

# ✅ Encode Meal Plan output
meal_plan_encoder = LabelEncoder()
y['Recommended_Meal_Plan'] = meal_plan_encoder.fit_transform(y['Recommended_Meal_Plan'])

# ✅ Train-Test Split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# ✅ Train Model
model = MultiOutputRegressor(RandomForestRegressor(
    n_estimators=100, random_state=42
))
model.fit(X_train, y_train)

# ✅ Evaluate
y_pred = model.predict(X_test)
print("✅ MAE:", mean_absolute_error(y_test, y_pred))
print("✅ R2 Score:", r2_score(y_test, y_pred))

# ✅ Save required model artifacts
joblib.dump(model, "random_forest_model.pkl", compress=3)
joblib.dump(meal_plan_encoder, "meal_plan_encoder.pkl")
joblib.dump(X_train.columns.tolist(), "model_features.pkl")
joblib.dump(encoders, "encoders.pkl")

print("\n🎯 Model Training Complete! Files saved successfully.")
