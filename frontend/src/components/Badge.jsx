import React from 'react';

export default function Badge({ children, variant = 'neutral' }) {
  let styles = 'bg-stone-100 text-stone-700 border border-stone-200';
  if (variant === 'warning') {
    styles = 'bg-amber-50 text-amber-800 border border-amber-300';
  } else if (variant === 'danger') {
    styles = 'bg-red-50 text-red-800 border border-red-300';
  } else if (variant === 'success') {
    styles = 'bg-emerald-50 text-emerald-800 border border-emerald-300';
  }

  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${styles}`}>
      {children}
    </span>
  );
}
