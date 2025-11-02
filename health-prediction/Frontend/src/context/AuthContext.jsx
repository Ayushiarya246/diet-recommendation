import React, { createContext, useState, useContext, useEffect } from 'react';

const NODE_API = import.meta.env.VITE_NODE_API_URL;

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("authToken");
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // ✅ REGISTER USER
  const register = async ({ username, email, password }) => {
    try {
      const res = await fetch(`${NODE_API}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message };

      return { success: true, message: "Registered successfully ✅" };
    } catch (err) {
      return { success: false, message: "Server error ❌" };
    }
  };

  // ✅ LOGIN USER
  const login = async ({ email, password }) => {
    try {
      const res = await fetch(`${NODE_API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      console.log("⬅️ Login Response:", data);

      if (!res.ok) {
        return { success: false, message: data.message || "Login failed ❌" };
      }

      const token = data.accessToken;
      const userData = data.user;

      if (token) localStorage.setItem("authToken", token);
      if (userData) localStorage.setItem("user", JSON.stringify(userData));

      setUser(userData);

      return { success: true, message: "Login successful ✅" };
    } catch (err) {
      return { success: false, message: "Server error ❌" };
    }
  };

  // ✅ SUBMIT HEALTH FORM + Predict + Navigate 🧠
  const submitHealthForm = async (formData, navigateToPrediction) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token || !user?.id) {
        return { success: false, message: "User not authenticated ❌" };
      }

      // ✅ Sanitize numeric values
      const sanitized = {
        ...formData,
        age: Number(formData.age) || 0,
        height: Number(formData.height) || 0,
        weight: Number(formData.weight) || 0,
        bmi: formData.bmi ? Number(formData.bmi) : 0,
        blood_pressure_systolic: Number(formData.blood_pressure_systolic) || 0,
        blood_pressure_diastolic: Number(formData.blood_pressure_diastolic) || 0,
        cholesterol_level: Number(formData.cholesterol_level) || 0,
        blood_sugar_level: Number(formData.blood_sugar_level) || 0,
        daily_steps: Number(formData.daily_steps) || 0,
        sleep_hours: Number(formData.sleep_hours) || 0,
        userId: user.id
      };

      console.log("➡️ Submitting Health Form (sanitized):", sanitized);

      // ✅ Save data to DB
      const res = await fetch(`${NODE_API}/api/health/form`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(sanitized),
      });

      const data = await res.json();
      console.log("⬅️ Health Form Response:", data);

      if (!res.ok) {
        return { success: false, message: data.message || "Health data failed ❌" };
      }

      // ✅ Send FULL sanitized data for ML prediction
      console.log("➡️ Requesting Prediction from Node backend...");
      const predictRes = await fetch(`${NODE_API}/api/predict/recommendation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(sanitized),
      });

      const predictData = await predictRes.json();
      console.log("⬅️ Prediction Result:", predictData);

      if (!predictRes.ok) {
        return { success: false, message: predictData.message || "Prediction failed ❌" };
      }

      // ✅ Store prediction for UI page
      localStorage.setItem("prediction", JSON.stringify(predictData.prediction));

      if (navigateToPrediction) {
        navigateToPrediction(`/prediction`);
      }

      return { success: true, message: "Prediction ready ✅" };

    } catch (err) {
      console.error("submitHealthForm error:", err);
      return { success: false, message: err.message || "Server error ❌" };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
    window.location.hash = "#login";
  };

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, register, login, logout, submitHealthForm }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
