import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.multioutput import MultiOutputRegressor
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor

# ✅ Load Dataset
df = pd.read_csv("diet_dataset.csv")

# ✅ Encode Meal Plan Category
label_encoder = LabelEncoder()
df["Recommended_Meal_Plan"] = label_encoder.fit_transform(df["Recommended_Meal_Plan"])

# ✅ Features & Targets
X = df[["BMI", "Age", "Activity_Level"]]
y_class = df["Recommended_Meal_Plan"]
y_reg = df[["Calories", "Protein", "Carbohydrates", "Fats"]]

X_train, X_test, y_class_train, y_class_test = train_test_split(
    X, y_class, test_size=0.2, random_state=42)

# ✅ Classification Model
clf = RandomForestClassifier()
clf.fit(X_train, y_class_train)

# ✅ Regression Model
reg = MultiOutputRegressor(RandomForestRegressor())
reg.fit(X_train, y_reg.loc[y_class_train.index])

# ✅ Save Models + Files
joblib.dump(clf, "model_classifier.pkl")
joblib.dump(reg, "model_regressor.pkl")
joblib.dump(label_encoder, "meal_plan_encoder.pkl")
joblib.dump(list(X.columns), "model_features.pkl")

print("✅ Models trained and saved successfully!")
