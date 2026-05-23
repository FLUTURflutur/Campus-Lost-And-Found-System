import React from 'react';
import { Link } from 'react-router-dom';
import Badge from './ui/Badge';

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function PinIcon() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

export default function ItemCard({ item }) {
  return (
    <Link to={`/items/${item.id}`} className="group block focus-visible:outline-2 focus-visible:outline-coral-500 rounded-2xl">
      <div className="bg-white dark:bg-eggplant-900 rounded-2xl shadow-sm ring-1 ring-slate-200/60 dark:ring-eggplant-600/80 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 h-full flex flex-col">
        {/* Type accent stripe */}
        <div className={`h-1 w-full shrink-0 ${item.type === 'lost' ? 'bg-coral-400' : 'bg-seafoam-300'}`} />

        <div className="p-5 flex flex-col flex-1">
          {/* Badges */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Badge variant={item.type}>{item.type}</Badge>
            {item.status === 'pending' && <Badge variant="pending">Pending</Badge>}
            {item.status === 'claimed' && <Badge variant="claimed">Claimed</Badge>}
          </div>

          {/* Title */}
          <h3 className="font-semibold text-slate-900 dark:text-white leading-snug group-hover:text-coral-600 dark:group-hover:text-coral-400 transition-colors line-clamp-1 mb-1">
            {item.title}
          </h3>

          {/* Category */}
          <p className="text-xs text-slate-500 dark:text-slate-300 font-medium mb-2">{item.category}</p>

          {/* Description */}
          {item.description && (
            <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed mb-4 flex-1">
              {item.description}
            </p>
          )}

          {/* Location */}
          <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-300 mb-4">
            <PinIcon />
            <span className="truncate">{item.location}</span>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-eggplant-700 mt-auto">
            {item.reporter_name ? (
              <span className="text-xs text-slate-500 dark:text-slate-300 truncate mr-2">
                by <span className="font-medium text-slate-700 dark:text-slate-300">{item.reporter_name}</span>
              </span>
            ) : <span />}
            <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">{formatDate(item.created_at)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
