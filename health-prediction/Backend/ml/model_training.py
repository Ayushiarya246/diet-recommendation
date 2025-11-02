import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor, VotingRegressor
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.multioutput import MultiOutputRegressor
from sklearn.model_selection import cross_val_score
import joblib

import zipfile
import pandas as pd
import os

zip_path = os.path.join(os.path.dirname(__file__), "archive (1).zip")

with zipfile.ZipFile(zip_path, 'r') as zip_ref:
    # Extract only the CSV from ZIP into the ml directory
    zip_ref.extractall(os.path.dirname(__file__))

# Find your CSV name inside the ZIP 👇
csv_filename = "Personalized_Diet_Recommendations.csv"

csv_path = os.path.join(os.path.dirname(__file__), csv_filename)


# Load the dataset
df = pd.read_csv(csv_path)

# Show the first few rows of the dataset
print(df.head())

# Handle missing values safely
df['Chronic_Disease'] = df['Chronic_Disease'].fillna('No Disease')
df['Allergies'] = df['Allergies'].fillna('No')
df['Food_Aversions'] = df['Food_Aversions'].fillna('No')
# Create an encoder instance
le = LabelEncoder()

# Encode categorical columns
df['Gender'] = le.fit_transform(df['Gender'])
df['Chronic_Disease'] = le.fit_transform(df['Chronic_Disease'])
df['Genetic_Risk_Factor'] = le.fit_transform(df['Genetic_Risk_Factor'])
df['Allergies'] = le.fit_transform(df['Allergies'])
df['Food_Aversions'] = le.fit_transform(df['Food_Aversions'])
df['Alcohol_Consumption'] = le.fit_transform(df['Alcohol_Consumption'])
df['Smoking_Habit'] = le.fit_transform(df['Smoking_Habit'])
df['Dietary_Habits'] = le.fit_transform(df['Dietary_Habits'])
df['Preferred_Cuisine'] = le.fit_transform(df['Preferred_Cuisine'])

# Apply one-hot encoding for non-ordinal categorical columns
df = pd.get_dummies(df, columns=['Dietary_Habits', 'Preferred_Cuisine'], drop_first=True)

# Define features (X) by dropping unnecessary columns
X = df.drop(columns=['Patient_ID', 'Recommended_Meal_Plan', 'Recommended_Calories', 
                     'Recommended_Protein', 'Recommended_Carbs', 'Recommended_Fats'])

# Define target variable (y)
y = df[['Recommended_Meal_Plan', 'Recommended_Calories', 'Recommended_Protein', 
        'Recommended_Carbs', 'Recommended_Fats']]  # Multi-output target

# Encode the 'Recommended_Meal_Plan' target variable (if not already done)
meal_plan_encoder = LabelEncoder()
y['Recommended_Meal_Plan'] = meal_plan_encoder.fit_transform(y['Recommended_Meal_Plan'])

# Ensure all target variables are numeric
y = y.apply(pd.to_numeric, errors='coerce')

# Ensure y is 2D
print(f"Shape of y before training: {y.shape}")
print("y is a 2D array:", y.ndim == 2)  # Ensure y is 2D

# Split the data into training and testing sets (80/20 split)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Ensure y_train is 2D (multi-output regression requires 2D target)
print(f"Shape of y_train before training: {y_train.shape}")
print("y_train is a 2D array:", y_train.ndim == 2)

# Initialize the RandomForestRegressor model with fewer estimators
rf_model = RandomForestRegressor(n_estimators=10, random_state=42)

# Use MultiOutputRegressor to handle multiple target variables
multi_output_model = MultiOutputRegressor(rf_model)

# Train the model on the training data
multi_output_model.fit(X_train, y_train)

# Evaluate the model
y_pred_rf = multi_output_model.predict(X_test)

# Performance metrics
mae_rf = mean_absolute_error(y_test, y_pred_rf)
r2_rf = r2_score(y_test, y_pred_rf)

print(f"Random Forest Mean Absolute Error: {mae_rf:.2f}")
print(f"Random Forest R-squared: {r2_rf:.2f}")

# Ensemble model - RandomForest and Gradient Boosting
gb_model = GradientBoostingRegressor(n_estimators=10, random_state=42)
rf_model = RandomForestRegressor(n_estimators=10, random_state=42)

# Initialize VotingRegressor with base models
ensemble_model = VotingRegressor(estimators=[('rf', rf_model), ('gb', gb_model)])

# Train the ensemble model using MultiOutputRegressor
multi_output_ensemble_model = MultiOutputRegressor(ensemble_model)

# Ensure y_train has two dimensions
print(f"Shape of y_train before training the ensemble model: {y_train.shape}")

# Train the ensemble model
multi_output_ensemble_model.fit(X_train, y_train)

# Evaluate performance of the ensemble model
y_pred_ensemble = multi_output_ensemble_model.predict(X_test)

# Performance metrics for the ensemble model
mae_ensemble = mean_absolute_error(y_test, y_pred_ensemble)
r2_ensemble = r2_score(y_test, y_pred_ensemble)

print(f"y_test shape: {y_test.shape}")
print(f"y_pred_ensemble shape: {y_pred_ensemble.shape}")
print("Evaluating Ensemble R-squared...")
r2_ensemble = r2_score(y_test, y_pred_ensemble)
print(f"Ensemble R-squared: {r2_ensemble:.2f}")


# Cross-validation for Random Forest
rf_scores = cross_val_score(multi_output_model, X, y, cv=5, scoring='neg_mean_absolute_error')

# Cross-validation for Ensemble Model
ensemble_scores = cross_val_score(multi_output_ensemble_model, X, y, cv=5, scoring='neg_mean_absolute_error')

# Print the results
print(f"Random Forest Cross-Validation MAE scores: {rf_scores}")
print(f"Ensemble Model Cross-Validation MAE scores: {ensemble_scores}")

# Average MAE across folds
print(f"Random Forest average MAE: {-rf_scores.mean():.2f}")
print(f"Ensemble Model average MAE: {-ensemble_scores.mean():.2f}")

# Optional: Plot feature importances from the RandomForest model
#importances = multi_output_model.estimators_[0].feature_importances_

# Sort the feature importances
#indices = np.argsort(importances)[::-1]

# Plot the top 10 most important features
#plt.figure(figsize=(12, 6))
#plt.title("Feature Importances")
#plt.barh(range(10), importances[indices][:10], align="center")
#plt.yticks(range(10), X.columns[indices][:10])
#plt.xlabel("Relative Importance")
#plt.ioff()  # Disable interactive mode
#plt.show()  # Make sure the plot is shown


joblib.dump(multi_output_model, 'random_forest_model.pkl')
joblib.dump(meal_plan_encoder, 'meal_plan_encoder.pkl')

loaded_model = joblib.load('random_forest_model.pkl')
loaded_encoder = joblib.load('meal_plan_encoder.pkl')