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

const statusMeta = {
  approved: { label: 'Claim approved!',   color: 'text-emerald-600 dark:text-emerald-400' },
  rejected: { label: 'Claim rejected',    color: 'text-rose-600 dark:text-rose-400'    },
  pending:  { label: 'Awaiting review',   color: 'text-amber-600 dark:text-amber-400'  },
};

export default function MyClaims() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/claims/user/my-claims')
      .then(res => setClaims(res.data))
      .catch(() => setError('Failed to load your claims.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Page header */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Claims</h1>
        <p className="text-sm text-slate-500 dark:text-slate-300 mt-0.5">Items you've submitted a claim for — check their status here.</p>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading your claims…" />
      ) : error ? (
        <EmptyState icon="⚠️" title="Something went wrong" description={error} />
      ) : claims.length === 0 ? (
        <EmptyState
          icon="🏷️"
          title="No claims yet"
          description="You haven't claimed any items. Browse items to find something that belongs to you."
          action={
            <Link
              to="/"
              className="px-4 py-2 rounded-lg bg-coral-600 hover:bg-coral-700 text-white text-sm font-semibold transition-colors"
            >
              Browse Items
            </Link>
          }
        />
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {claims.map(claim => {
              const meta = statusMeta[claim.status] ?? statusMeta.pending;
              return (
                <div
                  key={claim.id}
                  className="bg-white dark:bg-eggplant-900 rounded-2xl shadow-sm ring-1 ring-slate-200/60 dark:ring-eggplant-600/80 p-5"
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      {claim.item_title ? (
                        <Link
                          to={`/items/${claim.item_id}`}
                          className="font-semibold text-slate-900 dark:text-white hover:text-coral-600 dark:hover:text-coral-400 transition-colors"
                        >
                          {claim.item_title}
                        </Link>
                      ) : (
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Item #{claim.item_id}</span>
                      )}
                      {claim.item_type && <Badge variant={claim.item_type}>{claim.item_type}</Badge>}
                    </div>
                    <Badge variant={claim.status}>{claim.status}</Badge>
                  </div>

                  {/* Message */}
                  {claim.message && (
                    <p className="text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed mb-3">
                      "{claim.message}"
                    </p>
                  )}

                  {/* Rejection reason */}
                  {claim.status === 'rejected' && claim.rejection_reason && (
                    <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 text-xs ring-1 ring-rose-200 dark:ring-rose-800 mb-3">
                      <span className="shrink-0 mt-0.5">💬</span>
                      <span><span className="font-semibold">Reason: </span>{claim.rejection_reason}</span>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-eggplant-700">
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      Submitted {formatDate(claim.created_at)}
                    </span>
                    <span className={`text-xs font-semibold ${meta.color}`}>
                      {meta.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">
            {claims.length} claim{claims.length !== 1 ? 's' : ''} total
          </p>
        </>
      )}
    </div>
  );
}
