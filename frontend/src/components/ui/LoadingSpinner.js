import React from 'react';

export default function LoadingSpinner({ text }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-9 h-9 border-[3px] border-slate-200 dark:border-slate-700 border-t-coral-600 rounded-full animate-spin" />
      {text && <p className="text-sm text-slate-500 dark:text-slate-400">{text}</p>}
    </div>
  );
}
