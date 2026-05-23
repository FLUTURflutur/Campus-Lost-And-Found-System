import React from 'react';

export default function Input({ label, hint, error, id, className = '', required, textarea, rows, ...props }) {
  const base = `w-full px-3.5 py-2.5 rounded-lg border text-sm transition-all outline-none
    bg-white dark:bg-eggplant-800 text-slate-900 dark:text-white
    placeholder:text-slate-400 dark:placeholder:text-slate-500
    ${error
      ? 'border-rose-400 focus:ring-2 focus:ring-rose-400/30 dark:border-rose-600'
      : 'border-slate-300 dark:border-eggplant-500 focus:border-coral-500 focus:ring-2 focus:ring-coral-500/20'
    } ${className}`;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
          {required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
      )}
      {textarea ? (
        <textarea id={id} rows={rows ?? 4} className={base} {...props} />
      ) : (
        <input id={id} className={base} {...props} />
      )}
      {hint && <p className="text-xs text-slate-500 dark:text-slate-300">{hint}</p>}
      {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  );
}
