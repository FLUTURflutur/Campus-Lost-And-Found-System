import React from 'react';

export default function Card({ className = '', children, ...props }) {
  return (
    <div
      className={`bg-white dark:bg-eggplant-900 rounded-2xl shadow-sm ring-1 ring-slate-200/60 dark:ring-eggplant-600/80 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
