import axios from "axios";
import { UserHealth } from "../models/index.js";

const ML_SERVER_URL = "http://127.0.0.1:8000/predict/recommendation";


export const predictHealthRisk = async (req, res) => {
  try {
    const userId = req.user.id;

    const healthData = await UserHealth.findOne({ where: { userId } });
    if (!healthData) {
      return res.status(404).json({ message: "No health data found ❌" });
    }

   const payload = {
  Age: Number(healthData.age),
  Gender: healthData.gender,
  Height_cm: Number(healthData.height),
  Weight_kg: Number(healthData.weight),
  Chronic_Disease: healthData.chronic_disease,
  Genetic_Risk_Factor: healthData.genetic_risk_factor,
  Allergies: healthData.allergies,
  Food_Aversions: healthData.food_aversion,
  Alcohol_Consumption: healthData.alcohol_consumption,
  Smoking_Habit: healthData.smoking_habit,
  Dietary_Habits: healthData.dietary_habits,
  Preferred_Cuisine: healthData.preferred_cuisine,
  Daily_Steps: Number(healthData.daily_steps),
  Sleep_Hours: Number(healthData.sleep_hours),
  Blood_Pressure_Systolic: Number(healthData.blood_pressure_systolic),
  Blood_Pressure_Diastolic: Number(healthData.blood_pressure_diastolic),
};


    const response = await axios.post(ML_SERVER_URL, payload);

    const prediction = response.data;

    return res.json({
      success: true,
      prediction
    });

  } catch (err) {
    console.error("❌ Prediction Error:", err.message);
    return res.status(500).json({
      success: false,
      error: err.message || "Prediction failed ❌",
    });
  }
};
