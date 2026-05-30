import React from 'react';
import { Link } from 'react-router-dom';
import Badge from './ui/Badge';
import { SearchIcon, PackageIcon } from './ui/Icons';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

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

function CalIcon() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

export default function ItemCard({ item, view = 'grid' }) {
  if (view === 'list') {
    return (
      <Link to={`/items/${item.id}`} className="group block focus-visible:outline-2 focus-visible:outline-coral-500 rounded-xl">
        <div className="bg-white dark:bg-eggplant-900 rounded-xl shadow-sm ring-1 ring-slate-200/60 dark:ring-eggplant-600/80 hover:shadow-md hover:-translate-y-px transition-all duration-200 flex items-center gap-4 px-4 py-3 overflow-hidden">
          {/* Color bar */}
          <div className={`w-1 self-stretch rounded-full shrink-0 ${item.type === 'lost' ? 'bg-coral-400' : 'bg-seafoam-300'}`} />

          {/* Thumbnail */}
          {item.image_url ? (
            <img
              src={`${API_BASE}${item.image_url}`}
              alt={item.title}
              className="w-14 h-14 rounded-lg object-cover shrink-0 bg-slate-100 dark:bg-eggplant-800"
            />
          ) : (
            <div className="w-14 h-14 rounded-lg shrink-0 bg-slate-100 dark:bg-eggplant-800 flex items-center justify-center text-2xl select-none">
              {item.type === 'lost'
                ? <SearchIcon className="w-6 h-6 text-slate-400" />
                : <PackageIcon className="w-6 h-6 text-slate-400" />}
            </div>
          )}

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <Badge variant={item.type}>{item.type}</Badge>
              {item.status === 'pending' && <Badge variant="pending">Pending</Badge>}
              {item.status === 'claimed' && <Badge variant="claimed">Claimed</Badge>}
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">{item.category}</span>
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white leading-snug group-hover:text-coral-600 dark:group-hover:text-coral-400 transition-colors truncate">
              {item.title}
            </h3>
            {item.description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 truncate mt-0.5">{item.description}</p>
            )}
          </div>

          {/* Meta — right side */}
          <div className="hidden sm:flex flex-col items-end gap-1.5 shrink-0 text-right">
            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <PinIcon />
              <span className="max-w-[120px] truncate">{item.location}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
              <CalIcon />
              <span>{formatDate(item.created_at)}</span>
            </div>
            {item.reporter_name && (
              <span className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-[120px]">
                by <span className="font-medium text-slate-600 dark:text-slate-400">{item.reporter_name}</span>
              </span>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // Grid view (default)
  return (
    <Link to={`/items/${item.id}`} className="group block focus-visible:outline-2 focus-visible:outline-coral-500 rounded-2xl">
      <div className="bg-white dark:bg-eggplant-900 rounded-2xl shadow-sm ring-1 ring-slate-200/60 dark:ring-eggplant-600/80 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 h-full flex flex-col">
        {/* Type accent stripe */}
        <div className={`h-1 w-full shrink-0 ${item.type === 'lost' ? 'bg-coral-400' : 'bg-seafoam-300'}`} />

        {/* Image */}
        {item.image_url && (
          <div className="w-full h-36 overflow-hidden bg-slate-100 dark:bg-eggplant-800">
            <img
              src={`${API_BASE}${item.image_url}`}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}

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
