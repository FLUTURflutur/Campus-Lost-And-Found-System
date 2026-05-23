import React from 'react';

const variants = {
  primary:   'bg-coral-600 hover:bg-coral-700 active:bg-coral-800 text-white shadow-sm',
  secondary: 'bg-white dark:bg-eggplant-800 hover:bg-slate-50 dark:hover:bg-eggplant-700 text-slate-700 dark:text-slate-200 ring-1 ring-slate-300 dark:ring-eggplant-500 shadow-sm',
  danger:    'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-sm',
  success:   'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm',
  ghost:     'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-eggplant-800 hover:text-slate-900 dark:hover:text-white',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-2.5 text-sm',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  as: Tag = 'button',
  children,
  ...props
}) {
  return (
    <Tag
      className={`inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 ${variants[variant] ?? variants.primary} ${sizes[size] ?? sizes.md} ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}
