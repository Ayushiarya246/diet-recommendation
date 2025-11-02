import axios from "axios";
import { UserHealth } from "../models/index.js";

const ML_SERVER_URL = process.env.PYTHON_API_URL;

export const predictHealthRisk = async (req, res) => {
  try {
    const userId = req.user.id;

    const healthData = await UserHealth.findOne({ where: { userId } });
    if (!healthData) {
      return res.status(404).json({ message: "No health data found ❌" });
    }

    const safe = (v) => (v === "" || v === null || v === undefined ? 0 : v);

    const payload = {
      Age: Number(safe(healthData.age)),
      Gender: healthData.gender || "Unknown",
      Height_cm: Number(safe(healthData.height)),
      Weight_kg: Number(safe(healthData.weight)),
      Chronic_Disease: healthData.chronic_disease || "No",
      Genetic_Risk_Factor: healthData.genetic_risk_factor || "No",
      Allergies: healthData.allergies || "No",
      Food_Aversions: healthData.food_aversion || "No",
      Alcohol_Consumption: healthData.alcohol_consumption || "No",
      Smoking_Habit: healthData.smoking_habit || "No",
      Dietary_Habits: healthData.dietary_habits || "No",
      Preferred_Cuisine: healthData.preferred_cuisine || "Indian",
      Daily_Steps: Number(safe(healthData.daily_steps)),
      Sleep_Hours: Number(safe(healthData.sleep_hours)),
      Blood_Pressure_Systolic: Number(safe(healthData.blood_pressure_systolic)),
      Blood_Pressure_Diastolic: Number(safe(healthData.blood_pressure_diastolic)),
    };

    console.log("➡️ Sending Payload to ML API:", payload);

    const response = await axios.post(ML_SERVER_URL, payload, {
      timeout: 15000,
    });

    return res.json({
      success: true,
      prediction: response.data,
    });

  } catch (err) {
    console.error("❌ Prediction API Error:", err.response?.data || err);
    res.status(500).json({
      success: false,
      error: err.response?.data || err.message,
    });
  }
};
