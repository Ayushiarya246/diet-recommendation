import React from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import HealthForm from "./Components/HealthForm.jsx";
import LoginPage from "./Components/LoginPage.jsx";
import RegisterPage from "./Components/RegisterPage.jsx";
import { useAuth } from './context/AuthContext.jsx';
import ResultPage from "./Components/PredictionPage.jsx"

const Website = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen text-slate-800 font-sans p-4 sm:p-6 lg:p-8">
      <main className="max-w-5xl mx-auto">
        <header className="text-center mb-10">
          <div className="flex justify-between items-center">
            <div></div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 via-purple-600 to-rose-500 tracking-tight">
              {user ? `Welcome, ${user.username}!` : 'Personalized Health'}
            </h1>
            <div>
              {user && (
                <button
                  onClick={logout}
                  className="px-4 py-2 text-sm font-semibold text-white bg-rose-500 rounded-lg shadow-md hover:bg-rose-600 transition-colors duration-300"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
          <p className="mt-4 text-lg text-slate-700 max-w-2xl mx-auto">
            {user
              ? 'Complete the form below to help us understand your health and lifestyle.'
              : 'Please log in or register to create your personalized health profile.'}
          </p>
        </header>

        {/* ✅ React Router Instead of renderContent() */}
     <Routes>
    {!user ? (
      <>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </>
    ) : (
      <>
        <Route path="/" element={<Navigate to="/health" />} />
        <Route path="/health" element={<HealthForm />} />
        <Route path="/prediction" element={<ResultPage />} />
        <Route path="*" element={<Navigate to="/health" />} />
      </>
    )}
  </Routes>

      </main>

      <footer className="text-center mt-12 text-sm text-slate-500">
        <p>&copy; {new Date().getFullYear()} Health Profile Builder. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Website;
