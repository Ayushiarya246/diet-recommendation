import React from 'react';

const FormField = ({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  error,
  required = false,
  as = 'input',
  rows = 3
}) => {
  const commonProps = {
    id: name,
    name: name,
    value: value,
    onChange: onChange,
    placeholder: placeholder,
    required: required,
    className: `w-full px-4 py-2.5 bg-white/70 border rounded-lg transition-all duration-300 ease-in-out
      ${error
        ? 'border-red-400 focus:ring-red-500/50'
        : 'border-slate-300 focus:ring-indigo-500/50'
      }
      focus:outline-none focus:ring-2 focus:border-indigo-500 focus:bg-white`
  };

  return (
    <div className="w-full">
      <label htmlFor={name} className="block text-sm font-semibold text-slate-700 mb-1.5">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {as === 'textarea' ? (
        <textarea {...commonProps} rows={rows} />
      ) : (
        <input {...commonProps} type={type} />
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};

export default FormField;