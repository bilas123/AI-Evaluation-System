import React from 'react';

export default function Textarea({
  label,
  id,
  value,
  onChange,
  placeholder = '',
  required = false,
  rows = 3,
  className = '',
}) {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-xs font-medium text-stone-700">
          {label}
        </label>
      )}
      <textarea
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        rows={rows}
        className="w-full border border-stone-300 rounded px-3 py-2 text-sm text-stone-800 bg-white placeholder-stone-400 focus:outline-none focus:border-teal-700 transition-colors duration-150 resize-vertical"
      />
    </div>
  );
}
