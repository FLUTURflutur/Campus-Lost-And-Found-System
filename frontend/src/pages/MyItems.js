import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Badge from '../components/ui/Badge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function MyItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      await api.delete(`/items/${id}`);
      setItems(prev => prev.filter(i => i.id !== id));
    } finally {
      setDeleting(false);
      setConfirmDeleteId(null);
    }
  };

  useEffect(() => {
    api.get('/items/user/my-items')
      .then(res => setItems(res.data))
      .catch(() => setError('Failed to load your items.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      {/* Page header */}
      <div className="flex items-center justify-between mb-7 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Items</h1>
          <p className="text-sm text-slate-500 dark:text-slate-300 mt-0.5">Items you've reported — track their status here.</p>
        </div>
        <Link
          to="/report"
          className="px-4 py-2 rounded-lg bg-coral-600 hover:bg-coral-700 text-white text-sm font-semibold shadow-sm transition-all active:scale-95"
        >
          + Report New Item
        </Link>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading your items…" />
      ) : error ? (
        <EmptyState icon="⚠️" title="Something went wrong" description={error} />
      ) : items.length === 0 ? (
        <EmptyState
          icon="📦"
          title="No items yet"
          description="You haven't reported any lost or found items yet."
          action={
            <Link
              to="/report"
              className="px-4 py-2 rounded-lg bg-coral-600 hover:bg-coral-700 text-white text-sm font-semibold transition-colors"
            >
              Report an Item
            </Link>
          }
        />
      ) : (
        <>
          {/* Table */}
          <div className="bg-white dark:bg-eggplant-900 rounded-2xl shadow-sm ring-1 ring-slate-200/60 dark:ring-eggplant-600/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-eggplant-700">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Title</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Type</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Status</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider hidden sm:table-cell">Category</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider hidden md:table-cell">Location</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider hidden lg:table-cell">Date</th>
                    <th className="px-5 py-3.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-eggplant-700">
                  {items.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-eggplant-800/50 transition-colors">
                      <td className="px-5 py-4">
                        <Link
                          to={`/items/${item.id}`}
                          className="font-semibold text-coral-600 dark:text-coral-400 hover:text-coral-700 dark:hover:text-coral-300 hover:underline transition-colors"
                        >
                          {item.title}
                        </Link>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={item.type}>{item.type}</Badge>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={item.status}>{item.status}</Badge>
                      </td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-300 hidden sm:table-cell">
                        {item.category}
                      </td>
                      <td className="px-5 py-4 text-slate-500 dark:text-slate-300 hidden md:table-cell">
                        <span className="flex items-center gap-1 truncate max-w-[180px]">
                          <span>📍</span>
                          {item.location}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-400 dark:text-slate-500 text-xs hidden lg:table-cell whitespace-nowrap">
                        {formatDate(item.created_at)}
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        {confirmDeleteId === item.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs text-slate-500 dark:text-slate-300">Sure?</span>
                            <button
                              onClick={() => handleDelete(item.id)}
                              disabled={deleting}
                              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-all disabled:opacity-50"
                            >
                              {deleting ? '…' : 'Yes'}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-300 ring-1 ring-slate-300 dark:ring-eggplant-600 hover:bg-slate-50 dark:hover:bg-eggplant-700 transition-all"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(item.id)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 ring-1 ring-rose-200 dark:ring-rose-800 transition-all"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">
            {items.length} item{items.length !== 1 ? 's' : ''} total
          </p>
        </>
      )}
    </div>
  );
}
