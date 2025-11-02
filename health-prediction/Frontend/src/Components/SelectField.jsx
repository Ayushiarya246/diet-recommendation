import React from 'react';

const SelectField = ({
  label,
  name,
  value,
  onChange,
  options,
  error,
  required = false,
}) => (
  <div className="w-full">
    <label htmlFor={name} className="block text-sm font-semibold text-slate-700 mb-1.5">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    <div className="relative">
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className={`w-full px-4 py-2.5 bg-white/70 border rounded-lg transition-all duration-300 ease-in-out appearance-none pr-10
          ${error
            ? 'border-red-400 focus:ring-red-500/50'
            : 'border-slate-300 focus:ring-indigo-500/50'
          }
          focus:outline-none focus:ring-2 focus:border-indigo-500 focus:bg-white`}
      >
        <option value="" disabled>Select an option</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700">
        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M10 3a.75.75 0 01.53.22l3.5 3.5a.75.75 0 01-1.06 1.06L10 4.81 6.53 8.28a.75.75 0 01-1.06-1.06l3.5-3.5A.75.75 0 0110 3zm-3.72 9.28a.75.75 0 011.06 0L10 15.19l3.47-3.47a.75.75 0 111.06 1.06l-4 4a.75.75 0 01-1.06 0l-4-4a.75.75 0 010-1.06z" clipRule="evenodd" />
        </svg>
      </div>
    </div>
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);

export default SelectField;