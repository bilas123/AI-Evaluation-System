import React from 'react';

export default function Input({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  required = false,
  error = '',
  className = '',
}) {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-xs font-medium text-stone-700">
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full border border-stone-300 rounded px-3 py-2 text-sm text-stone-800 bg-white placeholder-stone-400 focus:outline-none focus:border-teal-700 transition-colors duration-150"
      />
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
}
