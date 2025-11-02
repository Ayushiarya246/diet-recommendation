import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import FormField from './FormField.jsx';
import { Link } from "react-router-dom";


const LoginPage = () => {
  const [formData, setFormData] = useState({ email: 'demo@example.com', password: 'password123' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.email || !formData.password) {
      setError('Both email and password are required.');
      return;
    }
    setIsLoading(true);
    const result = await login(formData);
    if (!result.success) {
      setError(result.message);
    }
    // On success, the App component will handle the redirect
    setIsLoading(false);
  };

  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 md:p-10 border border-white/80 max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">Welcome Back!</h2>
      {error && (
        <div className="bg-red-100 text-red-800 p-3 rounded-lg mb-4 text-sm font-semibold text-center">{error}</div>
      )}
      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-6">
          <FormField
            label="Email Address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            required
          />
          <FormField
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            required
          />
        </div>
        <div className="mt-8">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:bg-indigo-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 shadow-lg"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </div>
        <p className="text-center text-sm text-slate-600 mt-6">
          Don't have an account?{' '}
           <Link to="/register" className="text-blue-600 underline">
              Sign Up
          </Link>
        </p>
      </form>
    </div>
  );
};

export default LoginPage;