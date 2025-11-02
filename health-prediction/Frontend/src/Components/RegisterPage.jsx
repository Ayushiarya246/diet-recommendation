import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import FormField from './FormField.jsx';

const RegisterPage = () => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    if (!formData.username || !formData.email || !formData.password) {
      setStatus({ message: 'All fields are required.', success: false });
      return;
    }
    if (formData.password.length < 8) {
        setStatus({ message: 'Password must be at least 8 characters long.', success: false });
        return;
    }
    setIsLoading(true);
    const result = await register(formData);
    setStatus(result);
    if (result.success) {
        // Redirect to login page after a short delay
        setTimeout(() => {
            window.location.hash = '#login';
        }, 2000);
    }
    setIsLoading(false);
  };

  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 md:p-10 border border-white/80 max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">Create Your Account</h2>
      {status && (
        <div className={`${status.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} p-3 rounded-lg mb-4 text-sm font-semibold text-center`}>{status.message}</div>
      )}
      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-6">
          <FormField
            label="Username"
            name="username"
            type="text"
            value={formData.username}
            onChange={handleChange}
            placeholder="e.g., john_doe"
            required
          />
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
            placeholder="Minimum 8 characters"
            required
          />
        </div>
        <div className="mt-8">
          <button
            type="submit"
            disabled={isLoading || status?.success}
            className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 shadow-lg"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </div>
        <p className="text-center text-sm text-slate-600 mt-6">
          Already have an account?{' '}
          <a href="#login" className="font-semibold text-indigo-600 hover:text-indigo-500">
            Sign in
          </a>
        </p>
      </form>
    </div>
  );
};

export default RegisterPage;