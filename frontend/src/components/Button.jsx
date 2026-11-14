import React from 'react';

export default function Button({
  children,
  variant = 'primary',
  type = 'button',
  disabled = false,
  onClick,
  className = '',
}) {
  let variantStyles = 'bg-teal-700 hover:bg-teal-800 text-white';
  if (variant === 'secondary') {
    variantStyles = 'border border-stone-300 bg-white text-stone-700 hover:bg-stone-50';
  } else if (variant === 'danger') {
    variantStyles = 'border border-red-300 bg-white text-red-700 hover:bg-red-50';
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`rounded text-sm font-medium py-2 px-4 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles} ${className}`}
    >
      {children}
    </button>
  );
}
