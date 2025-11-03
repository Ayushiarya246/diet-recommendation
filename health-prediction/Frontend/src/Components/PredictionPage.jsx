import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";


const ResultPage = () => {
  const prediction = JSON.parse(localStorage.getItem("prediction"));
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();


  if (!prediction) {
    return (
      <div className="text-center mt-20 text-red-600 font-semibold text-xl">
        ❌ No prediction available!
      </div>
    );
  }

  // Calculate Health Score (simple logic: closer to 2000 = better)
  const healthScore = Math.max(
    0,
    100 - Math.abs(prediction.Recommended_Calories - 2000) / 20
  );

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const nutrients = [
    { label: "Protein", value: prediction.Recommended_Protein, icon: "🥩" },
    { label: "Carbs", value: prediction.Recommended_Carbs, icon: "🍞" },
    { label: "Fats", value: prediction.Recommended_Fats, icon: "🥑" },
  ];

  return (
    <div className={`${darkMode ? "bg-gray-900 text-white" : "bg-gradient-to-br from-indigo-50 to-purple-100"} min-h-screen p-6`}>
      
      {/* Dark Mode Toggle */}
      <div className="flex justify-end mb-4">
        <button 
          onClick={toggleDarkMode}
          className="px-4 py-2 rounded-full bg-gray-800 text-white hover:bg-gray-700 transition"
        >
          {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-xl mx-auto border border-indigo-100 dark:border-gray-700">
        <h2 className="text-4xl font-extrabold text-indigo-700 dark:text-indigo-400 text-center mb-8 animate-fadeIn">
          Your Personalized Plan 💪🔥
        </h2>

        {/* Meal Plan */}
        <div className="bg-indigo-600 text-white rounded-xl p-4 text-center text-xl mb-6 font-bold shadow animate-slideUp">
          🍽️ {prediction.Recommended_Meal_Plan} Plan
        </div>

        {/* Nutrient Cards */}
        <div className="space-y-3">
          {nutrients.map((item, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-700 rounded-xl p-4 shadow flex justify-between items-center animate-slideUp"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <span className="font-semibold">{item.icon} {item.label}</span>
              <span className="text-indigo-600 dark:text-indigo-300 font-bold">{item.value} g</span>
            </div>
          ))}
        </div>

        {/* Calorie Info */}
        <div className="bg-white dark:bg-gray-700 mt-4 rounded-xl p-4 shadow text-center animate-slideUp" style={{ animationDelay: "0.6s" }}>
          <span className="font-semibold text-gray-700 dark:text-gray-200">🔥 Calories:</span>
          <p className="text-indigo-600 dark:text-indigo-300 font-bold text-xl">
            {prediction.Recommended_Calories} kcal
          </p>
        </div>

        {/* Health Score Meter */}
        <h3 className="text-lg font-semibold mt-6 mb-2 animate-fadeIn">🎯 Health Score</h3>
        <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-3">
          <div
            className="bg-green-500 h-3 rounded-full"
            style={{ width: `${healthScore}%` }}
          ></div>
        </div>
        <p className="text-center font-bold mt-1">{Math.round(healthScore)} / 100</p>

        {/* Bar Graph */}
        <h3 className="text-lg font-semibold mt-6 animate-fadeIn">📊 Nutrient Breakdown</h3>
        <div className="flex justify-center items-end gap-3 h-32 mt-3">
          {nutrients.map((item, i) => (
            <div key={i} className="flex flex-col items-center">
              <div
                className="w-10 bg-indigo-500 hover:bg-indigo-600 rounded-t-lg animate-grow"
                style={{ height: `${item.value * 0.8}px`, animationDelay: `${i * 0.2}s` }}
              />
              <span className="text-sm font-medium mt-2">{item.icon}</span>
            </div>
          ))}
        </div>

        {/* Back Button */}
        <button
          className="mt-8 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl transition font-semibold shadow-md"
          onClick={() => navigate("/")}>
          Go Back 🔙
        </button>

      </div>

      {/* Animation Utilities */}
      <style>{`
        .animate-fadeIn { animation: fadeIn 0.8s ease-in-out; }
        .animate-slideUp { animation: slideUp 0.8s ease-in-out forwards; opacity: 0; }
        .animate-grow { animation: grow 1s ease-out forwards; opacity: 0; }
        @keyframes fadeIn { from {opacity:0;} to {opacity:1;} }
        @keyframes slideUp { from {opacity:0; transform:translateY(10px);} to {opacity:1; transform:translateY(0);} }
        @keyframes grow { from {opacity:0; height:0;} to {opacity:1;} }
      `}</style>

    </div>
  );
};

export default ResultPage;
