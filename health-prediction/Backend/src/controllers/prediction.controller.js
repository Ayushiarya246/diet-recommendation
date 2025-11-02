// controllers/prediction.controller.js
import axios from "axios";
import { UserHealth } from "../models/index.js";

const ML_SERVER_BASE = process.env.PYTHON_API_URL || process.env.ML_SERVER_URL || "https://diet-recommendation-1-7t28.onrender.com";

export const predictHealthRisk = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized ❌" });
    }

    const healthData = await UserHealth.findOne({ where: { userId } });
    if (!healthData) {
      return res.status(404).json({ success: false, message: "No health data found ❌" });
    }

    // Build payload expected by Python API. Convert to numbers where necessary.
    const payload = {
      Age: Number(healthData.age),
      Gender: healthData.gender || "",
      Height_cm: Number(healthData.height),
      Weight_kg: Number(healthData.weight),
      Chronic_Disease: healthData.chronic_disease || "No",
      Genetic_Risk_Factor: healthData.genetic_risk_factor || "No",
      Allergies: healthData.allergies || "No",
      Food_Aversions: healthData.food_aversion || "No",
      Alcohol_Consumption: healthData.alcohol_consumption || "No",
      Smoking_Habit: healthData.smoking_habit || "Non-smoker",
      Dietary_Habits: healthData.dietary_habits || "Other",
      Preferred_Cuisine: healthData.preferred_cuisine || "Other",
      Daily_Steps: Number(healthData.daily_steps) || 0,
      Sleep_Hours: Number(healthData.sleep_hours) || 0,
      Blood_Pressure_Systolic: Number(healthData.blood_pressure_systolic) || 0,
      Blood_Pressure_Diastolic: Number(healthData.blood_pressure_diastolic) || 0,
    };

    // Ensure ML_SERVER_BASE is the base URL (no trailing path)
    const mlUrl = `${ML_SERVER_BASE.replace(/\/+$/, "")}/predict/recommendation`;

    console.log("➡️ Forwarding to ML server:", mlUrl, payload);

    const response = await axios.post(mlUrl, payload, { timeout: 30000 });

    // If python returns {...} directly, wrap it under "prediction"
    const prediction = response.data;

    return res.json({
      success: true,
      prediction,
    });

  } catch (err) {
    console.error("❌ Prediction Error:", err?.response?.data || err.message || err);
    const message = err?.response?.data?.message || err?.message || "Prediction failed ❌";
    return res.status(500).json({
      success: false,
      error: message,
    });
  }
};
