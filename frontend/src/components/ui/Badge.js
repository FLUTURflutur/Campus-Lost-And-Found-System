import React from 'react';

const variants = {
  lost:     'bg-rose-100 text-rose-700 ring-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:ring-rose-800',
  found:    'bg-seafoam-100 text-seafoam-600 ring-seafoam-200 dark:bg-seafoam-900/30 dark:text-seafoam-300 dark:ring-seafoam-700',
  pending:  'bg-honey-100 text-honey-600 ring-honey-200 dark:bg-honey-900/30 dark:text-honey-300 dark:ring-honey-700',
  claimed:  'bg-eggplant-100 text-eggplant-600 ring-eggplant-200 dark:bg-eggplant-900/30 dark:text-eggplant-300 dark:ring-eggplant-700',
  resolved: 'bg-seafoam-100 text-seafoam-700 ring-seafoam-200 dark:bg-seafoam-900/30 dark:text-seafoam-300 dark:ring-seafoam-700',
  approved: 'bg-seafoam-100 text-seafoam-600 ring-seafoam-200 dark:bg-seafoam-900/30 dark:text-seafoam-300 dark:ring-seafoam-700',
  rejected: 'bg-rose-100 text-rose-700 ring-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:ring-rose-800',
  default:  'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-eggplant-800 dark:text-slate-300 dark:ring-eggplant-600',
};

export default function Badge({ variant = 'default', children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset capitalize ${variants[variant] ?? variants.default} ${className}`}
    >
      {children}
    </span>
  );
}
