import { DataTypes } from "sequelize";

export const createUserHealthModel = (sequelize) => {
  const UserHealth = sequelize.define("UserHealth", {

    userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
        model: "Users",
        key: "id",
    },
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  },


    age: { type: DataTypes.INTEGER, allowNull: false },
    gender: { type: DataTypes.STRING, allowNull: false },
    height: { type: DataTypes.FLOAT, allowNull: false },
    weight: { type: DataTypes.FLOAT, allowNull: false },
    bmi: { type: DataTypes.FLOAT, allowNull: false },

    chronic_disease: {
      type: DataTypes.STRING,
      allowNull: true, // ✅ Not mandatory always
    },

    blood_pressure_systolic: {
      type: DataTypes.FLOAT,
      allowNull: true, // ✅ Optional values allowed
    },
    blood_pressure_diastolic: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },

    cholesterol_level: { type: DataTypes.FLOAT, allowNull: true },
    blood_sugar_level: { type: DataTypes.FLOAT, allowNull: true },

    genetic_risk_factor: {
      type: DataTypes.STRING,
      allowNull: true, // ✅ Can be "No"
    },

    allergies: { type: DataTypes.STRING, allowNull: true },
    food_aversion: { type: DataTypes.STRING, allowNull: true },

    daily_steps: { type: DataTypes.INTEGER, allowNull: true },
    exercise_frequency: { type: DataTypes.STRING, allowNull: true },

    sleep_hours: { type: DataTypes.FLOAT, allowNull: true },

    alcohol_consumption: { type: DataTypes.STRING, allowNull: true },
    smoking_habit: { type: DataTypes.STRING, allowNull: true },
    dietary_habits: { type: DataTypes.STRING, allowNull: true },
    preferred_cuisine: { type: DataTypes.STRING, allowNull: true },

  });

  return UserHealth;
};

