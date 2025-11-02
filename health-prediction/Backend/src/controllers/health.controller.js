import { UserHealth } from "../models/index.js";

export const healthdata = async (req, res) => {
  try {
    const {
      userId,
      age,
      gender,
      height,
      weight,
      chronic_disease,
      blood_pressure_systolic,
      blood_pressure_diastolic,
      cholesterol_level,
      blood_sugar_level,
      genetic_risk_factor,
      allergies,
      food_aversion,
      daily_steps,
      exercise_frequency,
      sleep_hours,
      alcohol_consumption,
      smoking_habit,
      dietary_habits,
      preferred_cuisine,
    } = req.body;

    if (!height || !weight || !age || !gender) {
      return res.status(400).json({
        message: "age, gender, height & weight are required",
      });
    }

    // ✅ Convert height (ft) to meters for BMI
    const heightM = Number(height) * 0.3048;
    const weightKg = Number(weight);

    const bmi =
      heightM > 0 && weightKg > 0
        ? Number((weightKg / heightM ** 2).toFixed(2))
        : null;

    // ✅ Safe conversion helpers for optional numeric fields
    const safeNumber = (value) =>
      value === "" || value === null || value === undefined
        ? null
        : Number(value);

    const updatedData = {
      age: Number(age),
      gender,
      height: Number(height),
      weight: Number(weight),
      bmi,
      chronic_disease,
      blood_pressure_systolic: safeNumber(blood_pressure_systolic),
      blood_pressure_diastolic: safeNumber(blood_pressure_diastolic),
      cholesterol_level: safeNumber(cholesterol_level),
      blood_sugar_level: safeNumber(blood_sugar_level),
      genetic_risk_factor,
      allergies,
      food_aversion,
      daily_steps: safeNumber(daily_steps),
      exercise_frequency,
      sleep_hours: safeNumber(sleep_hours),
      alcohol_consumption,
      smoking_habit,
      dietary_habits,
      preferred_cuisine,
    };

    // ✅ Check if Health data already exists
    const existingHealth = await UserHealth.findOne({ where: { userId } });

    if (existingHealth) {
      await existingHealth.update(updatedData);

      return res.status(200).json({
        message: "Health data updated ✅",
        health: existingHealth,
      });
    }

    // ✅ Create New
    const newHealth = await UserHealth.create({
      userId: Number(userId),
      ...updatedData,
    });

    return res.status(201).json({
      message: "Health data saved ✅",
      health: newHealth,
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
