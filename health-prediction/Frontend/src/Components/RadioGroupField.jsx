import React from 'react';

const RadioGroupField = ({
  legend,
  name,
  selectedValue,
  onChange,
  options,
  error,
  required = false
}) => (
  <fieldset className="w-full">
    <legend className="block text-sm font-semibold text-slate-700 mb-2">
      {legend} {required && <span className="text-rose-500">*</span>}
    </legend>
    <div className="flex flex-wrap gap-x-6 gap-y-2">
      {options.map((option) => (
        <label
          key={option.value}
          htmlFor={`${name}-${option.value}`}
          className="flex items-center cursor-pointer"
        >
          <input
            id={`${name}-${option.value}`}
            name={name}
            type="radio"
            value={option.value}
            checked={selectedValue === option.value}
            onChange={onChange}
            className="peer sr-only"
          />
          <span className="w-5 h-5 rounded-full border-2 border-slate-400 bg-white transition-all duration-300 peer-checked:bg-indigo-600 peer-checked:border-indigo-600 peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-indigo-500/50 flex items-center justify-center shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-white transition-transform scale-0 peer-checked:scale-100"></span>
          </span>
          <span className="ml-2.5 block text-sm text-slate-800">
            {option.label}
          </span>
        </label>
      ))}
    </div>
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </fieldset>
);

export default RadioGroupField;