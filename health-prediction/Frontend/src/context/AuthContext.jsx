import React, { createContext, useState, useContext, useEffect } from 'react';

const NODE_API = import.meta.env.VITE_NODE_API_URL;
//const PY_API = import.meta.env.VITE_PYTHON_API_URL;


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

  // ✅ SUBMIT HEALTH FORM + attach userId automatically
  // ✅ SUBMIT HEALTH FORM + Predict + Navigate 🧠
  // SUBMIT HEALTH FORM => Store in DB via Node and request prediction via Node route
  const submitHealthForm = async (formData, navigateToPrediction) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token || !user?.id) {
        return { success: false, message: "User not authenticated ❌" };
      }

      // Convert numeric-like strings to numbers to avoid backend parsing errors
      const sanitized = {
        ...formData,
        age: formData.age !== undefined ? Number(formData.age) : null,
        height: formData.height !== undefined ? Number(formData.height) : null,
        weight: formData.weight !== undefined ? Number(formData.weight) : null,
        bmi: formData.bmi !== undefined ? (formData.bmi === null ? null : Number(formData.bmi)) : null,
        blood_pressure_systolic: formData.blood_pressure_systolic !== undefined ? (formData.blood_pressure_systolic === "" ? null : Number(formData.blood_pressure_systolic)) : null,
        blood_pressure_diastolic: formData.blood_pressure_diastolic !== undefined ? (formData.blood_pressure_diastolic === "" ? null : Number(formData.blood_pressure_diastolic)) : null,
        cholesterol_level: formData.cholesterol_level ? Number(formData.cholesterol_level) : null,
        blood_sugar_level: formData.blood_sugar_level ? Number(formData.blood_sugar_level) : null,
        daily_steps: formData.daily_steps !== undefined ? Number(formData.daily_steps) : null,
        sleep_hours: formData.sleep_hours !== undefined ? Number(formData.sleep_hours) : null,
        userId: user.id
      };

      console.log("➡️ Submitting Health Form (sanitized):", sanitized);

      // 1) Save to Node backend -> DB
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

      // 2) Ask Node backend to get prediction (Node will forward to Python ML server)
      console.log("➡️ Requesting Prediction from Node backend...");
      const predictRes = await fetch(`${NODE_API}/api/predict/recommendation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: user.id }), // Node will fetch saved health row by userId and call Python
      });

      const predictData = await predictRes.json();
      console.log("⬅️ Prediction Result:", predictData);

      if (!predictRes.ok) {
        // return server-provided error message if present
        return { success: false, message: predictData.error || predictData.message || "Prediction failed ❌" };
      }

      // store prediction for UI
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
