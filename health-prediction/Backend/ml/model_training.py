from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor, VotingRegressor
from sklearn.multioutput import MultiOutputRegressor
from sklearn.metrics import mean_absolute_error, r2_score
import pandas as pd
import numpy as np
import zipfile, os, joblib

zip_path = os.path.join(os.path.dirname(__file__), "archive.zip")
with zipfile.ZipFile(zip_path, 'r') as zip_ref:
    zip_ref.extractall(os.path.dirname(__file__))

csv_filename = "Personalized_Diet_Recommendations.csv"
csv_path = os.path.join(os.path.dirname(__file__), csv_filename)
df = pd.read_csv(csv_path)

df['Chronic_Disease'] = df['Chronic_Disease'].fillna('No Disease')
df['Allergies'] = df['Allergies'].fillna('No')
df['Food_Aversions'] = df['Food_Aversions'].fillna('No')

label_cols = [
    'Gender', 'Chronic_Disease', 'Genetic_Risk_Factor', 'Allergies',
    'Food_Aversions', 'Alcohol_Consumption', 'Smoking_Habit',
    'Dietary_Habits', 'Preferred_Cuisine'
]

for col in label_cols:
    df[col] = df[col].astype(str)

le_features = {}
for col in label_cols:
    le = LabelEncoder()
    df[col] = le.fit_transform(df[col])
    le_features[col] = le

df = pd.get_dummies(df, columns=['Dietary_Habits', 'Preferred_Cuisine'], drop_first=True)

X = df.drop(columns=['Patient_ID', 'Recommended_Meal_Plan',
                     'Recommended_Calories', 'Recommended_Protein',
                     'Recommended_Carbs', 'Recommended_Fats'])

y = df[['Recommended_Meal_Plan', 'Recommended_Calories',
        'Recommended_Protein', 'Recommended_Carbs',
        'Recommended_Fats']]

meal_plan_encoder = LabelEncoder()
y['Recommended_Meal_Plan'] = meal_plan_encoder.fit_transform(y['Recommended_Meal_Plan'])

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

rf = RandomForestRegressor(n_estimators=30, random_state=42)
gb = GradientBoostingRegressor(n_estimators=30, random_state=42)

ensemble = VotingRegressor([('rf', rf), ('gb', gb)])
model = MultiOutputRegressor(ensemble)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)

print("MAE:", mean_absolute_error(y_test, y_pred))
print("R2:", r2_score(y_test, y_pred))

# ✅ Save model and meal encoder
joblib.dump(model, "random_forest_model.pkl")
joblib.dump(meal_plan_encoder, "meal_plan_encoder.pkl")
