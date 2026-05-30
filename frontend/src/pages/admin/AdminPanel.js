import React, { useState, useEffect, useCallback } from 'react';
import api, { BACKEND_URL } from '../../services/api';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { CheckCircleIcon, XCircleIcon, CameraIcon, AlertTriangleIcon, PackageIcon, ClipboardIcon, CheckIcon, XMarkIcon } from '../../components/ui/Icons';

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold animate-fade-in ${
      type === 'success'
        ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800'
        : 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 ring-1 ring-rose-200 dark:ring-rose-800'
    }`}>
      {type === 'success' ? <CheckCircleIcon className="w-5 h-5 shrink-0" /> : <XCircleIcon className="w-5 h-5 shrink-0" />}
      <span>{message}</span>
      <button onClick={onClose} className="ml-1 opacity-60 hover:opacity-100 transition-opacity">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

function StatCard({ label, value, color }) {
  const colors = {
    pending:  'text-amber-600 dark:text-amber-400',
    approved: 'text-emerald-600 dark:text-emerald-400',
    rejected: 'text-rose-600 dark:text-rose-400',
    default:  'text-coral-600 dark:text-coral-400',
  };
  return (
    <div className="bg-white dark:bg-eggplant-900 rounded-2xl shadow-sm ring-1 ring-slate-200/60 dark:ring-eggplant-600/80 p-5">
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-3xl font-extrabold ${colors[color] ?? colors.default}`}>{value}</p>
    </div>
  );
}

function RefreshButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="ml-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-eggplant-800 text-slate-600 dark:text-slate-300 ring-1 ring-slate-300 dark:ring-eggplant-500 hover:bg-slate-50 dark:hover:bg-eggplant-700 transition-all"
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      Refresh
    </button>
  );
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('items');
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => setToast({ message, type });

  // ── Items state ──────────────────────────────────────────────────────────────
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [itemsError, setItemsError] = useState('');
  const [itemFilter, setItemFilter] = useState('pending');
  const [itemSearch, setItemSearch] = useState('');
  const [itemPage, setItemPage] = useState(1);
  const [itemActionLoading, setItemActionLoading] = useState({});
  const ITEMS_PER_PAGE = 20;

  const fetchItems = useCallback(() => {
    setItemsLoading(true);
    setItemsError('');
    api.get('/items/admin/all')
      .then(res => setItems(res.data))
      .catch(() => setItemsError('Failed to load items.'))
      .finally(() => setItemsLoading(false));
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleItemApprove = async (itemId) => {
    setItemActionLoading(prev => ({ ...prev, [itemId]: 'approve' }));
    try {
      await api.put(`/items/${itemId}`, { status: 'approved' });
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, status: 'approved' } : i));
      showToast('Item approved and is now live.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to approve item.', 'error');
    } finally {
      setItemActionLoading(prev => ({ ...prev, [itemId]: null }));
    }
  };

  const handleItemDelete = async (itemId) => {
    setItemActionLoading(prev => ({ ...prev, [itemId]: 'delete' }));
    try {
      await api.delete(`/items/${itemId}`);
      setItems(prev => prev.filter(i => i.id !== itemId));
      showToast('Item removed.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to remove item.', 'error');
    } finally {
      setItemActionLoading(prev => ({ ...prev, [itemId]: null }));
    }
  };

  const pendingItems   = items.filter(i => i.status === 'pending');
  const approvedItems  = items.filter(i => i.status === 'approved');
  const claimedItems   = items.filter(i => i.status === 'claimed');
  const resolvedItems  = items.filter(i => i.status === 'resolved');
  const filteredItems  = (() => {
    const byStatus = itemFilter === 'all' ? items : items.filter(i => i.status === itemFilter);
    if (!itemSearch.trim()) return byStatus;
    const q = itemSearch.trim().toLowerCase();
    return byStatus.filter(i =>
      (i.title       || '').toLowerCase().includes(q) ||
      (i.reporter_name || '').toLowerCase().includes(q) ||
      (i.category    || '').toLowerCase().includes(q) ||
      (i.location    || '').toLowerCase().includes(q)
    );
  })();
  const paginatedItems = filteredItems.slice((itemPage - 1) * ITEMS_PER_PAGE, itemPage * ITEMS_PER_PAGE);
  const itemTotalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));

  // ── Claims state ─────────────────────────────────────────────────────────────
  const [claims, setClaims] = useState([]);
  const [claimsLoading, setClaimsLoading] = useState(false);
  const [claimsError, setClaimsError] = useState('');
  const [claimFilter, setClaimFilter] = useState('all');
  const [claimSearch, setClaimSearch] = useState('');
  const [claimPage, setClaimPage] = useState(1);
  const [claimActionLoading, setClaimActionLoading] = useState({});
  const CLAIMS_PER_PAGE = 20;
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectDraft, setRejectDraft] = useState('');

  const fetchClaims = useCallback(() => {
    setClaimsLoading(true);
    setClaimsError('');
    api.get('/claims/admin/all')
      .then(res => setClaims(res.data))
      .catch(() => setClaimsError('Failed to load claims.'))
      .finally(() => setClaimsLoading(false));
  }, []);

  useEffect(() => { if (activeTab === 'claims') fetchClaims(); }, [activeTab, fetchClaims]);

  // Reset pages when filter or search changes
  useEffect(() => { setItemPage(1); }, [itemFilter, itemSearch]);
  useEffect(() => { setClaimPage(1); }, [claimFilter, claimSearch]);

  const handleClaimAction = async (claimId, status, rejectionReason) => {
    setClaimActionLoading(prev => ({ ...prev, [claimId]: true }));
    setRejectingId(null);
    setRejectDraft('');
    try {
      const body = { status };
      if (rejectionReason) body.rejection_reason = rejectionReason;
      await api.put(`/claims/admin/${claimId}`, body);
      setClaims(prev => prev.map(c => c.id === claimId ? { ...c, status, rejection_reason: rejectionReason || c.rejection_reason } : c));
      showToast(`Claim ${status === 'approved' ? 'approved' : 'rejected'} successfully.`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Action failed.', 'error');
    } finally {
      setClaimActionLoading(prev => ({ ...prev, [claimId]: false }));
    }
  };

  const filteredClaims  = (() => {
    const byStatus = claims.filter(c => claimFilter === 'all' || c.status === claimFilter);
    if (!claimSearch.trim()) return byStatus;
    const q = claimSearch.trim().toLowerCase();
    return byStatus.filter(c =>
      (c.claimer_name || '').toLowerCase().includes(q) ||
      (c.item_title   || '').toLowerCase().includes(q)
    );
  })();
  const paginatedClaims = filteredClaims.slice((claimPage - 1) * CLAIMS_PER_PAGE, claimPage * CLAIMS_PER_PAGE);
  const claimTotalPages = Math.max(1, Math.ceil(filteredClaims.length / CLAIMS_PER_PAGE));
  const pendingClaims   = claims.filter(c => c.status === 'pending').length;
  const approvedClaims  = claims.filter(c => c.status === 'approved').length;
  const rejectedClaims  = claims.filter(c => c.status === 'rejected').length;
  const resolutionRate  = claims.length > 0
    ? Math.round(((approvedClaims + rejectedClaims) / claims.length) * 100)
    : 0;

  // ── Shared helpers ────────────────────────────────────────────────────────────
  const tabClass = active =>
    `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
      active
        ? 'bg-coral-600 text-white shadow-sm'
        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-eggplant-800'
    }`;

  const filterBtnClass = active =>
    `px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
      active
        ? 'bg-coral-600 text-white shadow-sm'
        : 'bg-white dark:bg-eggplant-800 text-slate-600 dark:text-slate-300 ring-1 ring-slate-300 dark:ring-eggplant-500 hover:bg-slate-50 dark:hover:bg-eggplant-700'
    }`;

  const BadgeCount = ({ count, active }) => (
    <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
      active
        ? 'bg-white/20 text-white'
        : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'
    }`}>
      {count}
    </span>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Page header */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Panel</h1>
        <p className="text-sm text-slate-500 dark:text-slate-300 mt-0.5">
          Review pending items, manage claims, and oversee platform activity.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-7 flex-wrap">
        <button onClick={() => setActiveTab('items')} className={tabClass(activeTab === 'items')}>
          Approve Items
          {pendingItems.length > 0 && (
            <BadgeCount count={pendingItems.length} active={activeTab === 'items'} />
          )}
        </button>
        <button onClick={() => setActiveTab('claims')} className={tabClass(activeTab === 'claims')}>
          Manage Claims
          {pendingClaims > 0 && (
            <BadgeCount count={pendingClaims} active={activeTab === 'claims'} />
          )}
        </button>
        <button onClick={() => setActiveTab('overview')} className={tabClass(activeTab === 'overview')}>
          Overview
        </button>
      </div>

      {/* ── Items Tab ────────────────────────────────────────────────────────────── */}
      {activeTab === 'items' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <StatCard label="Pending Approval" value={pendingItems.length}  color="pending"  />
            <StatCard label="Live Items"        value={approvedItems.length} color="approved" />
            <StatCard label="Claimed Items"     value={claimedItems.length}  color="default"  />
            <StatCard label="Resolved Items"    value={resolvedItems.length} color="approved" />
          </div>

          {/* Search */}
          <div className="mb-3">
            <input
              type="text"
              value={itemSearch}
              onChange={e => setItemSearch(e.target.value)}
              placeholder="Search by title, reporter, category, location…"
              className="w-full sm:w-80 px-3.5 py-2 rounded-lg border border-slate-300 dark:border-eggplant-600 bg-white dark:bg-eggplant-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Filter + refresh */}
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-300 uppercase tracking-wider mr-1">Filter</span>
            {[
              { key: 'pending',  label: 'Pending',  count: pendingItems.length  },
              { key: 'approved', label: 'Approved', count: approvedItems.length },
              { key: 'claimed',  label: 'Claimed',  count: claimedItems.length  },
              { key: 'resolved', label: 'Resolved', count: resolvedItems.length },
              { key: 'all',      label: 'All',      count: items.length         },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setItemFilter(f.key)}
                className={filterBtnClass(itemFilter === f.key)}
              >
                {f.label}
                <span className="ml-1 opacity-70">({f.count})</span>
              </button>
            ))}
            <RefreshButton onClick={fetchItems} />
          </div>

          {itemsLoading ? (
            <LoadingSpinner text="Loading items…" />
          ) : itemsError ? (
            <EmptyState icon={<AlertTriangleIcon />} title="Error" description={itemsError} />
          ) : filteredItems.length === 0 ? (
            <EmptyState
              icon={<PackageIcon />}
              title="No items here"
              description={
                itemSearch.trim()
                  ? 'No items match your search.'
                  : itemFilter === 'pending'
                  ? 'No items are waiting for approval.'
                  : `No ${itemFilter} items found.`
              }
            />
          ) : (
            <>
              <div className="bg-white dark:bg-eggplant-900 rounded-2xl shadow-sm ring-1 ring-slate-200/60 dark:ring-eggplant-600/80 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-eggplant-700">
                        {['Photo', 'Title', 'Type', 'Status', 'Category', 'Location', 'Reporter', 'Date', 'Actions'].map(h => (
                          <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-eggplant-700">
                      {paginatedItems.map(item => {
                        const loading = itemActionLoading[item.id];
                        return (
                          <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-eggplant-800/50 transition-colors">
                            {/* Photo */}
                            <td className="px-4 py-3">
                              {item.image_url ? (
                                <img
                                  src={item.image_url.startsWith('/') ? BACKEND_URL + item.image_url : item.image_url}
                                  alt={item.title}
                                  className="w-12 h-12 rounded-lg object-cover ring-1 ring-slate-200 dark:ring-eggplant-600"
                                  onError={e => { e.target.style.display = 'none'; }}
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-eggplant-800 flex items-center justify-center text-slate-400 text-lg">
                                  <CameraIcon className="w-6 h-6 text-slate-400" />
                                </div>
                              )}
                            </td>

                            {/* Title */}
                            <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200 max-w-[160px]">
                              <span className="line-clamp-2 leading-snug">{item.title}</span>
                            </td>

                            {/* Type */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <Badge variant={item.type}>{item.type}</Badge>
                            </td>

                            {/* Status */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <Badge variant={item.status}>{item.status}</Badge>
                            </td>

                            {/* Category */}
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap text-xs">
                              {item.category}
                            </td>

                            {/* Location */}
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300 max-w-[140px]">
                              <span className="truncate block text-xs">{item.location}</span>
                            </td>

                            {/* Reporter */}
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap text-xs font-medium">
                              {item.reporter_name || '—'}
                            </td>

                            {/* Date */}
                            <td className="px-4 py-3 text-slate-400 dark:text-slate-500 text-xs whitespace-nowrap">
                              {formatDate(item.created_at)}
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-3">
                              {item.status === 'pending' ? (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleItemApprove(item.id)}
                                    disabled={!!loading}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                  >
                                    {loading === 'approve' ? '…' : <span className="flex items-center gap-1"><CheckIcon className="w-3.5 h-3.5" />Approve</span>}
                                  </button>
                                  <button
                                    onClick={() => handleItemDelete(item.id)}
                                    disabled={!!loading}
                                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                  >
                                    {loading === 'delete' ? '…' : <span className="flex items-center gap-1"><XMarkIcon className="w-3.5 h-3.5" />Remove</span>}
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-slate-400 dark:text-slate-500 italic">
                                    {item.status === 'approved' ? 'Live' : item.status === 'claimed' ? 'Claimed' : 'Resolved'}
                                  </span>
                                  <button
                                    onClick={() => handleItemDelete(item.id)}
                                    disabled={!!loading}
                                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-eggplant-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-500 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-semibold ring-1 ring-slate-200 dark:ring-eggplant-600 transition-all disabled:opacity-50"
                                  >
                                    {loading === 'delete' ? '…' : 'Delete'}
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Items pagination */}
              {itemTotalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-4">
                  <button
                    onClick={() => setItemPage(p => Math.max(1, p - 1))}
                    disabled={itemPage === 1}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-eggplant-800 text-slate-600 dark:text-slate-300 ring-1 ring-slate-300 dark:ring-eggplant-500 hover:bg-slate-50 dark:hover:bg-eggplant-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Prev
                  </button>
                  <span className="text-xs text-slate-500 dark:text-slate-300 font-medium">
                    Page {itemPage} of {itemTotalPages}
                  </span>
                  <button
                    onClick={() => setItemPage(p => Math.min(itemTotalPages, p + 1))}
                    disabled={itemPage === itemTotalPages}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-eggplant-800 text-slate-600 dark:text-slate-300 ring-1 ring-slate-300 dark:ring-eggplant-500 hover:bg-slate-50 dark:hover:bg-eggplant-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── Claims Tab ───────────────────────────────────────────────────────────── */}
      {activeTab === 'claims' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <StatCard label="Pending Claims"  value={pendingClaims}  color="pending"  />
            <StatCard label="Approved Claims" value={approvedClaims} color="approved" />
            <StatCard label="Rejected Claims" value={rejectedClaims} color="rejected" />
          </div>

          {/* Search */}
          <div className="mb-3">
            <input
              type="text"
              value={claimSearch}
              onChange={e => setClaimSearch(e.target.value)}
              placeholder="Search by claimer name or item title…"
              className="w-full sm:w-80 px-3.5 py-2 rounded-lg border border-slate-300 dark:border-eggplant-600 bg-white dark:bg-eggplant-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Filter + refresh */}
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-300 uppercase tracking-wider mr-1">Filter</span>
            {['all', 'pending', 'approved', 'rejected'].map(f => (
              <button
                key={f}
                onClick={() => setClaimFilter(f)}
                className={filterBtnClass(claimFilter === f)}
              >
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                {f !== 'all' && (
                  <span className="ml-1 opacity-70">({claims.filter(c => c.status === f).length})</span>
                )}
              </button>
            ))}
            <RefreshButton onClick={fetchClaims} />
          </div>

          {claimsLoading ? (
            <LoadingSpinner text="Loading claims…" />
          ) : claimsError ? (
            <EmptyState icon={<AlertTriangleIcon />} title="Error" description={claimsError} />
          ) : filteredClaims.length === 0 ? (
            <EmptyState
              icon={<ClipboardIcon />}
              title="No claims found"
              description={
                claimSearch.trim()
                  ? 'No claims match your search.'
                  : claimFilter === 'all'
                  ? 'No claims have been submitted yet.'
                  : `No ${claimFilter} claims found.`
              }
            />
          ) : (
            <>
              <div className="bg-white dark:bg-eggplant-900 rounded-2xl shadow-sm ring-1 ring-slate-200/60 dark:ring-eggplant-600/80 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-eggplant-700">
                        {['Claimer', 'Item', 'Type', 'Message', 'Status', 'Date', 'Actions'].map(h => (
                          <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-eggplant-700">
                      {paginatedClaims.map(claim => (
                        <tr key={claim.id} className="hover:bg-slate-50 dark:hover:bg-eggplant-800/50 transition-colors">
                          <td className="px-4 py-4 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            {claim.claimer_name || `User #${claim.user_id}`}
                          </td>
                          <td className="px-4 py-4 font-semibold text-coral-600 dark:text-coral-400 whitespace-nowrap max-w-[180px]">
                            <span className="truncate block">{claim.item_title || `Item #${claim.item_id}`}</span>
                          </td>
                          <td className="px-4 py-4">
                            {claim.item_type && <Badge variant={claim.item_type}>{claim.item_type}</Badge>}
                          </td>
                          <td className="px-4 py-4 max-w-[220px]">
                            <p className="text-slate-600 dark:text-slate-300 italic text-xs truncate" title={claim.message}>
                              {claim.message ? `"${claim.message}"` : '—'}
                            </p>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <Badge variant={claim.status}>{claim.status}</Badge>
                          </td>
                          <td className="px-4 py-4 text-slate-400 dark:text-slate-500 text-xs whitespace-nowrap">
                            {formatDate(claim.created_at)}
                          </td>
                          <td className="px-4 py-4">
                            {claim.status === 'pending' ? (
                              rejectingId === claim.id ? (
                                <div className="flex flex-col gap-1.5 min-w-[180px]">
                                  <input
                                    type="text"
                                    value={rejectDraft}
                                    onChange={e => setRejectDraft(e.target.value)}
                                    placeholder="Reason (optional)…"
                                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-eggplant-600 bg-white dark:bg-eggplant-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-400"
                                  />
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      onClick={() => handleClaimAction(claim.id, 'rejected', rejectDraft)}
                                      disabled={!!claimActionLoading[claim.id]}
                                      className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-all disabled:opacity-50"
                                    >
                                      {claimActionLoading[claim.id] ? '…' : 'Confirm'}
                                    </button>
                                    <button
                                      onClick={() => { setRejectingId(null); setRejectDraft(''); }}
                                      className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-300 ring-1 ring-slate-300 dark:ring-eggplant-600 hover:bg-slate-50 dark:hover:bg-eggplant-700 transition-all"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleClaimAction(claim.id, 'approved')}
                                    disabled={!!claimActionLoading[claim.id]}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                  >
                                    {claimActionLoading[claim.id] ? '…' : <span className="flex items-center gap-1"><CheckIcon className="w-3.5 h-3.5" />Approve</span>}
                                  </button>
                                  <button
                                    onClick={() => { setRejectingId(claim.id); setRejectDraft(''); }}
                                    disabled={!!claimActionLoading[claim.id]}
                                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                  >
                                    <span className="flex items-center gap-1"><XMarkIcon className="w-3.5 h-3.5" />Reject</span>
                                  </button>
                                </div>
                              )
                            ) : (
                              <span className="text-xs text-slate-400 dark:text-slate-500 italic">Resolved</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Claims pagination */}
              {claimTotalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-4">
                  <button
                    onClick={() => setClaimPage(p => Math.max(1, p - 1))}
                    disabled={claimPage === 1}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-eggplant-800 text-slate-600 dark:text-slate-300 ring-1 ring-slate-300 dark:ring-eggplant-500 hover:bg-slate-50 dark:hover:bg-eggplant-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Prev
                  </button>
                  <span className="text-xs text-slate-500 dark:text-slate-300 font-medium">
                    Page {claimPage} of {claimTotalPages}
                  </span>
                  <button
                    onClick={() => setClaimPage(p => Math.min(claimTotalPages, p + 1))}
                    disabled={claimPage === claimTotalPages}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-eggplant-800 text-slate-600 dark:text-slate-300 ring-1 ring-slate-300 dark:ring-eggplant-500 hover:bg-slate-50 dark:hover:bg-eggplant-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── Overview Tab ─────────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Items"     value={items.length}         color="default"  />
            <StatCard label="Pending Items"   value={pendingItems.length}  color="pending"  />
            <StatCard label="Total Claims"    value={claims.length}        color="default"  />
            <StatCard label="Pending Claims"  value={pendingClaims}        color="pending"  />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Items summary */}
            <div className="bg-white dark:bg-eggplant-900 rounded-2xl shadow-sm ring-1 ring-slate-200/60 dark:ring-eggplant-600/80 p-6">
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">Items Summary</h2>
              <div className="flex flex-col divide-y divide-slate-100 dark:divide-eggplant-700">
                {[
                  { label: 'Total Reported',  value: items.length,           color: '' },
                  { label: 'Pending Review',  value: pendingItems.length,    color: 'text-amber-600 dark:text-amber-400' },
                  { label: 'Live (Approved)', value: approvedItems.length,   color: 'text-emerald-600 dark:text-emerald-400' },
                  { label: 'Claimed',         value: claimedItems.length,    color: 'text-eggplant-600 dark:text-eggplant-400' },
                  { label: 'Resolved',        value: resolvedItems.length,   color: 'text-seafoam-600 dark:text-seafoam-400' },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between py-3">
                    <span className="text-sm text-slate-600 dark:text-slate-300">{row.label}</span>
                    <span className={`text-sm font-bold ${row.color || 'text-slate-900 dark:text-white'}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Claims summary */}
            <div className="bg-white dark:bg-eggplant-900 rounded-2xl shadow-sm ring-1 ring-slate-200/60 dark:ring-eggplant-600/80 p-6">
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">Claims Summary</h2>
              <div className="flex flex-col divide-y divide-slate-100 dark:divide-eggplant-700">
                {[
                  { label: 'Total Claims',    value: claims.length,  color: '' },
                  { label: 'Approved',        value: approvedClaims, color: 'text-emerald-600 dark:text-emerald-400' },
                  { label: 'Rejected',        value: rejectedClaims, color: 'text-rose-600 dark:text-rose-400' },
                  { label: 'Pending',         value: pendingClaims,  color: 'text-amber-600 dark:text-amber-400' },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between py-3">
                    <span className="text-sm text-slate-600 dark:text-slate-300">{row.label}</span>
                    <span className={`text-sm font-bold ${row.color || 'text-slate-900 dark:text-white'}`}>{row.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-eggplant-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-300">Resolution Rate</span>
                  <span className="text-sm font-bold text-coral-600 dark:text-coral-400">{resolutionRate}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action prompts */}
          {(pendingItems.length > 0 || pendingClaims > 0) && (
            <div className="flex flex-col gap-3">
              {pendingItems.length > 0 && (
                <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-800">
                  <PackageIcon className="w-5 h-5 shrink-0" />
                  <span className="text-sm font-medium flex-1">
                    <strong>{pendingItems.length}</strong> item{pendingItems.length !== 1 ? 's' : ''} waiting for approval.{' '}
                    <button onClick={() => setActiveTab('items')} className="font-bold underline hover:no-underline">
                      Review now
                    </button>
                  </span>
                </div>
              )}
              {pendingClaims > 0 && (
                <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-800">
                  <ClipboardIcon className="w-5 h-5 shrink-0" />
                  <span className="text-sm font-medium flex-1">
                    <strong>{pendingClaims}</strong> claim{pendingClaims !== 1 ? 's' : ''} waiting for review.{' '}
                    <button onClick={() => setActiveTab('claims')} className="font-bold underline hover:no-underline">
                      Review now
                    </button>
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
