// controllers/prediction.controller.js
import axios from "axios";
import { UserHealth } from "../models/index.js";

const ML_SERVER_BASE = process.env.PYTHON_API_URL || "https://diet-recommendation-1-7t28.onrender.com";

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
    const convertHeight = (h) => {
    const feet = Math.floor(h);
    const inches = (h - feet) * 10;
    return Math.round((feet * 30.48) + (inches * 2.54));
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
  age: safe(Number(healthData.age), 0),
  gender: normalize(healthData.gender, "Male"),
  height: healthData.height < 100
    ? convertHeight(Number(healthData.height))
    : Number(healthData.height),
  weight: safe(Number(healthData.weight), 0),

  bmi: healthData.bmi ? Number(healthData.bmi) : 0,
  blood_pressure_systolic: safe(Number(healthData.blood_pressure_systolic), 0),
  blood_pressure_diastolic: safe(Number(healthData.blood_pressure_diastolic), 0),
  cholesterol_level: safe(Number(healthData.cholesterol_level), 0),
  blood_sugar_level: safe(Number(healthData.blood_sugar_level), 0),

  chronic_disease: normalize(healthData.chronic_disease, "No Disease"),
  genetic_risk_factor: normalize(healthData.genetic_risk_factor, "No"),
  allergies: normalize(healthData.allergies, "No"),
  food_aversion: normalize(healthData.food_aversion, "No"),
  daily_steps: safe(Number(healthData.daily_steps), 0),
  exercise_frequency: normalize(healthData.exercise_frequency, "Never"),
  sleep_hours: safe(Number(healthData.sleep_hours), 6),
  alcohol_consumption: normalize(healthData.alcohol_consumption, "No"),
  smoking_habit: normalize(healthData.smoking_habit, "No"),
  dietary_habits: normalize(healthData.dietary_habits, "Balanced"),
  preferred_cuisine: normalize(healthData.preferred_cuisine, "Indian"),

  userId: userId,
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
