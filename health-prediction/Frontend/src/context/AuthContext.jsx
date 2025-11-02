import React, { createContext, useState, useContext, useEffect } from 'react';

const NODE_API = import.meta.env.VITE_NODE_API_URL;
const PY_API = import.meta.env.VITE_PYTHON_API_URL;


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
const submitHealthForm = async (formData, navigateToPrediction) => {
  try {
    const token = localStorage.getItem("authToken");
    if (!token || !user?.id) {
      return { success: false, message: "User not authenticated ❌" };
    }

    const fullData = { ...formData, userId: user.id };
    console.log("➡️ Submitting Health Form:", fullData);

    const res = await fetch(`${NODE_API}/api/health/form`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(fullData),
    });

    const data = await res.json();
    console.log("⬅️ Health Form Response:", data);

    if (!res.ok) {
      return { success: false, message: data.message || "Health data failed ❌" };
    }

    // ✅ After saving → Send request to Python server
    console.log("➡️ Requesting Prediction...");
    const predictRes = await fetch(`${NODE_API}/predict/recommendation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });


    const predictData = await predictRes.json();
    console.log("⬅️ Prediction Result:", predictData);

    if (!predictRes.ok) {
      return { success: false, message: predictData.error || "Prediction failed ❌" };
    }

    localStorage.setItem("prediction", JSON.stringify(predictData.prediction));

    if (navigateToPrediction) {
      navigateToPrediction(`/prediction`);
    }

    return { success: true, message: "Prediction ready ✅" };

  } catch (err) {
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
