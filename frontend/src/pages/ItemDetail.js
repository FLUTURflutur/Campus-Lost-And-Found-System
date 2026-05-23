import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/ui/Badge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import api, { BACKEND_URL } from '../services/api';

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}

function BackArrow() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
}

export default function ItemDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [claimMessage, setClaimMessage] = useState('');
  const [claimSubmitting, setClaimSubmitting] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [alreadyClaimed, setAlreadyClaimed] = useState(false);
  const [claimError, setClaimError] = useState('');

  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [itemClaims, setItemClaims] = useState([]);
  const [itemClaimsLoading, setItemClaimsLoading] = useState(false);

  const [resolving, setResolving] = useState(false);
  const [resolveSuccess, setResolveSuccess] = useState(false);
  const resolveSuccessTimer = useRef(null);

  useEffect(() => {
    api.get(`/items/${id}`)
      .then(res => setItem(res.data))
      .catch(() => setError('Item not found or failed to load.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!item || !user || user.id !== item.reported_by) return;
    setItemClaimsLoading(true);
    api.get(`/claims/item/${item.id}`)
      .then(res => setItemClaims(res.data))
      .catch(() => {})
      .finally(() => setItemClaimsLoading(false));
  }, [item, user]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/items/${id}`);
      navigate('/my-items');
    } catch {
      setDeleting(false);
      setDeleteConfirm(false);
    }
  };

  const handleResolve = async () => {
    setResolving(true);
    try {
      await api.put(`/items/${id}`, { status: 'resolved' });
      setItem(prev => ({ ...prev, status: 'resolved' }));
      setResolveSuccess(true);
      if (resolveSuccessTimer.current) clearTimeout(resolveSuccessTimer.current);
      resolveSuccessTimer.current = setTimeout(() => setResolveSuccess(false), 3000);
    } catch {
      // silent
    } finally {
      setResolving(false);
    }
  };

  // Clear resolveSuccess when item status changes away from the moment
  useEffect(() => {
    if (item?.status !== 'resolved') {
      setResolveSuccess(false);
    }
  }, [item?.status]);

  const handleClaim = async e => {
    e.preventDefault();
    if (!claimMessage.trim()) {
      setClaimError('Please describe why this item belongs to you.');
      return;
    }
    setClaimSubmitting(true);
    setClaimError('');
    try {
      await api.post(`/claims/${id}`, { message: claimMessage.trim() });
      setClaimSuccess(true);
      setClaimMessage('');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || '';
      if (msg.toLowerCase().includes('already')) {
        setAlreadyClaimed(true);
      } else {
        setClaimError(msg || 'Failed to submit claim. Please try again.');
      }
    } finally {
      setClaimSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <LoadingSpinner text="Loading item…" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4">😕</div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Item Not Found</h2>
        <p className="text-sm text-slate-500 dark:text-slate-300 mb-6">{error || 'This item does not exist.'}</p>
        <button
          onClick={() => navigate('/')}
          className="px-5 py-2.5 rounded-lg bg-coral-600 hover:bg-coral-700 text-white text-sm font-semibold transition-all active:scale-95"
        >
          Back to Browse
        </button>
      </div>
    );
  }

  const canClaim =
    item.status === 'approved' &&
    user &&
    user.id !== item.reported_by &&
    !claimSuccess &&
    !alreadyClaimed;

  const isOwner = user && user.id === item.reported_by;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors mb-6"
      >
        <BackArrow />
        Back to Items
      </Link>

      <div className="bg-white dark:bg-eggplant-900 rounded-2xl shadow-sm ring-1 ring-slate-200/60 dark:ring-eggplant-600/80 overflow-hidden">
        {item.image_url && (
          <img
            src={item.image_url.startsWith('/') ? BACKEND_URL + item.image_url : item.image_url}
            alt={item.title}
            className="w-full h-56 sm:h-72 object-cover"
            onError={e => { e.target.style.display = 'none'; }}
          />
        )}

        <div className="p-6 sm:p-8">
          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <Badge variant={item.type}>{item.type}</Badge>
            {item.status === 'pending' && <Badge variant="pending">Pending Review</Badge>}
            {item.status === 'claimed' && <Badge variant="claimed">Claimed</Badge>}
            {item.status === 'resolved' && <Badge variant="resolved">Resolved</Badge>}
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
            {item.title}
          </h1>

          {/* Detail grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
            <div>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Category</p>
              <p className="text-sm text-slate-800 dark:text-slate-200 font-medium">{item.category}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Location</p>
              <p className="text-sm text-slate-800 dark:text-slate-200 font-medium flex items-center gap-1">
                <span>📍</span>{item.location}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Reported By</p>
              <p className="text-sm text-slate-800 dark:text-slate-200 font-medium">{item.reporter_name || 'Anonymous'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Date Reported</p>
              <p className="text-sm text-slate-800 dark:text-slate-200 font-medium">{formatDate(item.created_at)}</p>
            </div>
            {item.description && (
              <div className="sm:col-span-2">
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Description</p>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{item.description}</p>
              </div>
            )}
          </div>

          {/* Status notices */}
          {item.status === 'resolved' && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-seafoam-50 dark:bg-seafoam-950/30 text-seafoam-700 dark:text-seafoam-400 text-sm ring-1 ring-seafoam-200 dark:ring-seafoam-800 mb-6">
              <span className="text-base">✅</span>
              <span>This item has been marked as resolved by the reporter.</span>
            </div>
          )}

          {item.status === 'claimed' && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-400 text-sm ring-1 ring-violet-200 dark:ring-violet-800 mb-6">
              <span className="text-base">✅</span>
              <span>This item has been claimed and is no longer available.</span>
            </div>
          )}

          {item.status === 'pending' && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-sm ring-1 ring-amber-200 dark:ring-amber-800 mb-6">
              <span className="text-base">⏳</span>
              <span>This item is pending admin review and not yet available to claim.</span>
            </div>
          )}

          {/* ── Claim section ── */}
          <div className="border-t border-slate-100 dark:border-eggplant-700 pt-6 mt-2">
            {claimSuccess ? (
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-sm ring-1 ring-emerald-200 dark:ring-emerald-800">
                <span className="text-base">✅</span>
                <span>Your claim has been submitted! We'll notify you of the outcome.</span>
              </div>
            ) : alreadyClaimed ? (
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-50 dark:bg-eggplant-800 text-slate-600 dark:text-slate-300 text-sm ring-1 ring-slate-200 dark:ring-eggplant-600">
                <span className="text-base">ℹ️</span>
                <span>You have already submitted a claim for this item.</span>
              </div>
            ) : canClaim ? (
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Claim This Item</h2>
                <p className="text-sm text-slate-500 dark:text-slate-300 mb-4">
                  Describe why this item belongs to you or how you can identify it.
                </p>
                <form onSubmit={handleClaim} className="flex flex-col gap-3">
                  <textarea
                    placeholder="e.g. My black laptop bag has a red keychain attached, and my initials JD are written inside…"
                    value={claimMessage}
                    onChange={e => setClaimMessage(e.target.value)}
                    rows={4}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-eggplant-600 bg-white dark:bg-eggplant-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-transparent transition-all resize-none"
                  />
                  {claimError && (
                    <p className="text-xs text-rose-600 dark:text-rose-400">{claimError}</p>
                  )}
                  <div>
                    <button
                      type="submit"
                      disabled={claimSubmitting}
                      className="px-5 py-2.5 rounded-lg bg-coral-600 hover:bg-coral-700 text-white text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {claimSubmitting ? 'Submitting…' : 'Submit Claim'}
                    </button>
                  </div>
                </form>
              </div>
            ) : !user && item.status === 'approved' ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Login to claim this item if it belongs to you.
                </p>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg bg-coral-600 hover:bg-coral-700 text-white text-sm font-semibold transition-colors shrink-0"
                >
                  Login to Claim
                </Link>
              </div>
            ) : isOwner ? (
              <div className="flex flex-col gap-5">
                {/* Submitted Claims */}
                {(itemClaimsLoading || itemClaims.length > 0) && (
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3">Submitted Claims</h2>
                    {itemClaimsLoading ? (
                      <p className="text-sm text-slate-500 dark:text-slate-300">Loading claims…</p>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {itemClaims.map(claim => (
                          <div
                            key={claim.id}
                            className="bg-slate-50 dark:bg-eggplant-800 rounded-xl p-4 ring-1 ring-slate-200 dark:ring-eggplant-600"
                          >
                            <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                              <div>
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{claim.claimer_name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{claim.claimer_email}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={claim.status}>{claim.status}</Badge>
                                <span className="text-xs text-slate-400 dark:text-slate-500">{formatDate(claim.created_at)}</span>
                              </div>
                            </div>
                            {claim.message && (
                              <p className="text-sm text-slate-600 dark:text-slate-300 italic">"{claim.message}"</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {!itemClaimsLoading && itemClaims.some(c => c.status === 'approved') && (
                      <div className="mt-3 flex items-start gap-2.5 px-4 py-3 rounded-xl bg-eggplant-50 dark:bg-eggplant-800/60 text-eggplant-700 dark:text-eggplant-300 text-sm ring-1 ring-eggplant-200 dark:ring-eggplant-600">
                        <span className="text-base shrink-0">📬</span>
                        <span>A claim has been approved — the item is now marked as claimed. You can contact the claimant to coordinate pickup.</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  {resolveSuccess && (
                    <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-seafoam-50 dark:bg-seafoam-950/30 text-seafoam-700 dark:text-seafoam-400 text-xs font-semibold ring-1 ring-seafoam-200 dark:ring-seafoam-800">
                      <span>✅</span>
                      <span>Marked as resolved!</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <p className="text-sm text-slate-500 dark:text-slate-300 italic">This is your reported item.</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {item.status === 'approved' && (
                      <button
                        onClick={handleResolve}
                        disabled={resolving}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-seafoam-700 dark:text-seafoam-400 hover:bg-seafoam-50 dark:hover:bg-seafoam-950/30 ring-1 ring-seafoam-200 dark:ring-seafoam-800 transition-all disabled:opacity-50"
                      >
                        {resolving ? 'Saving…' : 'Mark as Resolved'}
                      </button>
                    )}
                    {deleteConfirm ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-600 dark:text-slate-300">Delete this posting?</span>
                        <button
                          onClick={handleDelete}
                          disabled={deleting}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-all disabled:opacity-50"
                        >
                          {deleting ? 'Deleting…' : 'Yes, delete'}
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(false)}
                          className="px-3 py-1.5 rounded-lg bg-white dark:bg-eggplant-800 text-slate-600 dark:text-slate-300 text-xs font-semibold ring-1 ring-slate-300 dark:ring-eggplant-600 hover:bg-slate-50 dark:hover:bg-eggplant-700 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(true)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 ring-1 ring-rose-200 dark:ring-rose-800 transition-all"
                      >
                        Delete Post
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
