import React, { useState, useCallback, useEffect, useRef } from 'react';
import FormField from './FormField.jsx';
import SelectField from './SelectField.jsx';
import RadioGroupField from './RadioGroupField.jsx';


import {
    GENDER_OPTIONS,
    YES_NO_OPTIONS,
    EXERCISE_FREQUENCY_OPTIONS,
    ALCOHOL_CONSUMPTION_OPTIONS,
    SMOKING_HABIT_OPTIONS,
    DIETARY_HABITS_OPTIONS,
    CUISINE_OPTIONS,
} from '../constants.js';
import { useAuth } from "../context/AuthContext.jsx"; // Import useAuth hook

import { useNavigate } from "react-router-dom";

const initialFormData = {
    age: '',
    gender: '',
    height: '',
    weight: '',
    chronic_disease: '',
    blood_pressure_systolic: '',
    blood_pressure_diastolic: '',
    cholesterol_level: '',
    blood_sugar_level: '',
    genetic_risk_factor: '',
    allergies: '',
    food_aversion: '',
    daily_steps: '',
    exercise_frequency: '',
    sleep_hours: '',
    alcohol_consumption: '',
    smoking_habit: '',
    dietary_habits: '',
    preferred_cuisine: '',
};

const REQUIRED_FIELDS = [
    'age', 'gender', 'height', 'weight', 'chronic_disease', 
    'blood_pressure_systolic', 'blood_pressure_diastolic', 
    'genetic_risk_factor','daily_steps', 'exercise_frequency', 'sleep_hours', 
    'alcohol_consumption', 'smoking_habit', 'dietary_habits', 'preferred_cuisine'
];

const SectionHeader = ({ title, icon }) => (
    <legend className="flex items-center text-2xl font-bold text-slate-800 border-b-2 border-indigo-200/80 pb-3 mb-6 w-full">
        <span className="mr-3 text-indigo-600">{icon}</span>
        {title}
    </legend>
);

const HealthForm = () => {
    const { submitHealthForm } = useAuth();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [formData, setFormData] = useState(initialFormData);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [submissionStatus, setSubmissionStatus] = useState(null);
    const [bmi, setBmi] = useState({
        value: null,
        category: '',
        color: 'text-slate-700'
    });

    useEffect(() => {
        const heightM = Number(formData.height) * 0.3048;
        const weightKg = Number(formData.weight);

        if (heightM > 0 && weightKg > 0) {
            const bmiValue = Number((weightKg / (heightM * heightM)).toFixed(1));
            let category = '';
            let color = '';

            if (bmiValue < 18.5) {
                category = 'Underweight';
                color = 'text-blue-600';
            } else if (bmiValue < 25) {
                category = 'Normal weight';
                color = 'text-green-600 font-semibold';
            } else if (bmiValue < 30) {
                category = 'Overweight';
                color = 'text-amber-600';
            } else {
                category = 'Obesity';
                color = 'text-red-600';
            }
            setBmi({ value: bmiValue, category, color });
        } else {
            setBmi({ value: null, category: '', color: 'text-slate-700' });
        }
    }, [formData.height, formData.weight]);


    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    }, [errors]);
    
    const validateForm = () => {
    const newErrors = {};
    REQUIRED_FIELDS.forEach(field => {
        if (!formData[field] || formData[field].toString().trim() === '') {
            newErrors[field] = 'This field is required.';
        }
    });

    if (formData.age && (isNaN(Number(formData.age)) || Number(formData.age) <= 0 || !Number.isInteger(Number(formData.age)))) {
        newErrors.age = 'Please enter a valid age.';
    }
    if (formData.height && (isNaN(Number(formData.height)) || Number(formData.height) <= 0)) {
        newErrors.height = 'Please enter a valid height in feet.';
    }
    if (formData.weight && (isNaN(Number(formData.weight)) || Number(formData.weight) <= 0)) {
        newErrors.weight = 'Please enter a valid weight in kg.';
    }
    if (formData.sleep_hours && (isNaN(Number(formData.sleep_hours)) || Number(formData.sleep_hours) < 0 || Number(formData.sleep_hours) > 24)) {
        newErrors.sleep_hours = 'Please enter a valid number of hours (0-24).';
    }

    setErrors(newErrors);

    // ✅ Return true if no errors exist
    return Object.keys(newErrors).length === 0;
};

    const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmissionStatus(null);
    if (!validateForm()) return;

    setIsLoading(true);

    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            setSubmissionStatus({ success: false, message: 'Please log in again.' });
            setIsLoading(false);
            return;
        }

        const submissionData = { ...formData, bmi: bmi.value ,userId: user?.id};
        const response = await submitHealthForm(submissionData);

        if (response.success) {
            navigate("/prediction", {
                state: { healthData: submissionData }
            });
            return;
        } else {
            setSubmissionStatus(response);
        }
    } catch (error) {
        setSubmissionStatus({ success: false, message: 'Unexpected error occurred' });
    } finally {
        setIsLoading(false);
    }
};


    return (
        <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 md:p-10 border border-white/80">
            {submissionStatus && (
                 <div
                    className={`flex items-center p-4 mb-6 rounded-lg text-sm font-semibold ${
                        submissionStatus.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                    role="alert"
                >
                    {submissionStatus.success ? (
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                    )}
                    {submissionStatus.message}
                </div>
            )}
            <form onSubmit={handleSubmit} noValidate>
                {/* Personal Information */}
                <fieldset className="mb-8">
                    <SectionHeader title="Personal Information" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>} />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                        <div className="lg:col-span-1"><FormField label="Age" name="age" value={formData.age} onChange={handleChange} type="number" placeholder="e.g., 30" required error={errors.age} /></div>
                        <div className="lg:col-span-1"><SelectField label="Gender" name="gender" value={formData.gender} onChange={handleChange} options={GENDER_OPTIONS} required error={errors.gender} /></div>
                        <div className="lg:col-span-1"><FormField label="Height (feet)" name="height" value={formData.height} onChange={handleChange} type="number" placeholder="e.g., 5.4" required error={errors.height} /></div>
                        <div className="lg:col-span-1"><FormField label="Weight (kg)" name="weight" value={formData.weight} onChange={handleChange} type="number" placeholder="e.g., 70" required error={errors.weight} /></div>
                        <div className="w-full lg:col-span-1">
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Calculated BMI</label>
                            <div className="w-full h-[46px] px-3 py-2.5 bg-slate-100/80 border border-slate-300 rounded-lg flex items-center justify-center">
                                {bmi.value ? (
                                    <p className="text-sm text-center font-bold">
                                        <span className="text-slate-800">{bmi.value}</span>
                                        <span className={`ml-1.5 ${bmi.color}`}>{`(${bmi.category})`}</span>
                                    </p>
                                ) : (
                                    <p className="text-slate-500 text-sm">--</p>
                                )}
                            </div>
                        </div>
                    </div>
                </fieldset>

                {/* Health Metrics */}
                <fieldset className="mb-8">
                     <SectionHeader title="Health Metrics" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                        <div className="space-y-6">
                           <RadioGroupField legend="Chronic Disease" name="chronic_disease" selectedValue={formData.chronic_disease} onChange={handleChange} options={YES_NO_OPTIONS} required error={errors.chronic_disease} />
                           <FormField label="Blood Pressure (Systolic)" name="blood_pressure_systolic" value={formData.blood_pressure_systolic} onChange={handleChange} type="number" placeholder="e.g., 120" required error={errors.blood_pressure_systolic} />
                           <FormField label="Cholesterol Level" name="cholesterol_level" value={formData.cholesterol_level} onChange={handleChange} type="number" placeholder="e.g., 200 mg/dL" />
                           <FormField label="Allergies (if any)" name="allergies" value={formData.allergies} onChange={handleChange} as="textarea" placeholder="e.g., Peanuts, Shellfish" error={errors.allergies}/>
                        </div>
                        <div className="space-y-6">
                            <RadioGroupField legend="Genetic Risk Factor" name="genetic_risk_factor" selectedValue={formData.genetic_risk_factor} onChange={handleChange} options={YES_NO_OPTIONS} required error={errors.genetic_risk_factor} />
                            <FormField label="Blood Pressure (Diastolic)" name="blood_pressure_diastolic" value={formData.blood_pressure_diastolic} onChange={handleChange} type="number" placeholder="e.g., 80" required error={errors.blood_pressure_diastolic} />
                            <FormField label="Blood Sugar Level" name="blood_sugar_level" value={formData.blood_sugar_level} onChange={handleChange} type="number" placeholder="e.g., 90 mg/dL" />
                            <FormField label="Food Aversions (if any)" name="food_aversion" value={formData.food_aversion} onChange={handleChange} as="textarea" placeholder="e.g., Cilantro, Mushrooms" error={errors.food_aversion}/>
                        </div>
                    </div>
                </fieldset>

                 {/* Lifestyle Information */}
                <fieldset className="mb-8">
                    <SectionHeader title="Lifestyle & Habits" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor"><path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V5a1 1 0 00-1.447-.894l-4 2A1 1 0 0011 7v10zM4 17a1 1 0 001.447.894l4-2A1 1 0 0010 15V5a1 1 0 00-1.447-.894l-4 2A1 1 0 004 7v10z" /></svg>} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField label="Daily Steps (Average)" name="daily_steps" value={formData.daily_steps} onChange={handleChange} type="number" placeholder="e.g., 8000" required error={errors.daily_steps} />
                        <SelectField label="Exercise Frequency" name="exercise_frequency" value={formData.exercise_frequency} onChange={handleChange} options={EXERCISE_FREQUENCY_OPTIONS} required error={errors.exercise_frequency} />
                        <FormField label="Sleep Hours (Average per night)" name="sleep_hours" value={formData.sleep_hours} onChange={handleChange} type="number" placeholder="e.g., 7.5" required error={errors.sleep_hours} />
                        <SelectField label="Alcohol Consumption" name="alcohol_consumption" value={formData.alcohol_consumption} onChange={handleChange} options={ALCOHOL_CONSUMPTION_OPTIONS} required error={errors.alcohol_consumption} />
                        <SelectField label="Smoking Habit" name="smoking_habit" value={formData.smoking_habit} onChange={handleChange} options={SMOKING_HABIT_OPTIONS} required error={errors.smoking_habit} />
                        <SelectField label="Dietary Habits" name="dietary_habits" value={formData.dietary_habits} onChange={handleChange} options={DIETARY_HABITS_OPTIONS} required error={errors.dietary_habits} />
                        <div className="md:col-span-2">
                             <SelectField label="Preferred Cuisine" name="preferred_cuisine" value={formData.preferred_cuisine} onChange={handleChange} options={CUISINE_OPTIONS} required error={errors.preferred_cuisine} />
                        </div>
                    </div>
                </fieldset>

                <div className="mt-10 flex justify-end">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-3.5 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:bg-indigo-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                        {isLoading ? (
                           <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Submitting...
                           </>
                        ) : 'Update My Profile'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default HealthForm;