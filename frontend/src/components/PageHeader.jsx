import React from 'react';

export default function PageHeader({ title, children }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-base font-semibold text-stone-900">{title}</h2>
      {children}
    </div>
  );
}
