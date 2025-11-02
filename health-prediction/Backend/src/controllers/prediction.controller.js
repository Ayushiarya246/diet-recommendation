// controllers/prediction.controller.js
import axios from "axios";
import { UserHealth } from "../models/index.js";

const ML_SERVER_BASE = process.env.PYTHON_API_URL || process.env.ML_SERVER_URL || "https://diet-recommendation-1-7t28.onrender.com";

function makeMlUrl(base) {
  if (!base) return "https://diet-recommendation-1-7t28.onrender.com/predict/recommendation";
  // if base already contains the endpoint, return as-is
  if (base.endsWith("/predict/recommendation")) return base;
  // remove trailing slash
  return base.replace(/\/+$/, "") + "/predict/recommendation";
}

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

    // helper to produce safe defaults
    const safe = (v, fallback = 0) => {
      if (v === "" || v === null || v === undefined) return fallback;
      return v;
    };

    // convert height in feet (frontend stored feet like 5.5) -> cm as model expects Height_cm
    const toCm = (feet) => {
      const f = Number(feet) || 0;
      return Number((f * 30.48).toFixed(1));
    };

    // normalize some categorical tokens (make defaults consistent with training)
    const normalize = (v, fallback = "No") => {
      if (v === null || v === undefined || v === "") return fallback;
      if (typeof v === "string") {
        const s = v.trim();
        if (s === "Non-smoker" || s === "Never") return "No";
        return s;
      }
      return v;
    };

    const payload = {
    Age: Number(healthData.age) || null,
    Gender: healthData.gender || null,
    Height_cm: toCm(healthData.height) || null,
    Weight_kg: Number(healthData.weight) || null,
    Chronic_Disease: healthData.chronic_disease || null,
    Genetic_Risk_Factor: healthData.genetic_risk_factor || null,
    Allergies: healthData.allergies || null,
    Food_Aversions: healthData.food_aversion || null,
    Alcohol_Consumption: healthData.alcohol_consumption || null,
    Smoking_Habit: healthData.smoking_habit || null,
    Dietary_Habits: healthData.dietary_habits || null,
    Preferred_Cuisine: healthData.preferred_cuisine || null,
    Daily_Steps: Number(healthData.daily_steps) || null,
    Sleep_Hours: Number(healthData.sleep_hours) || null,
    Blood_Pressure_Systolic: Number(healthData.blood_pressure_systolic) || null,
    Blood_Pressure_Diastolic: Number(healthData.blood_pressure_diastolic) || null,
    };



    const mlUrl = makeMlUrl(ML_SERVER_BASE);
    console.log("➡️ Sending Payload to ML API:", mlUrl, payload);

    const response = await axios.post(mlUrl, payload, {
      timeout: 30000,
    });

    return res.json({
      success: true,
      prediction: response.data,
    });

  } catch (err) {
    console.error("❌ Prediction API Error:", err.response?.data || err.message || err);
    const message = err.response?.data || err.message || "Prediction failed ❌";
    res.status(500).json({
      success: false,
      error: message,
    });
  }
};
