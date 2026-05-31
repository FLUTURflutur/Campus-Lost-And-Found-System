import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { CheckCircleIcon, XCircleIcon } from '../../components/ui/Icons';

function fmt(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold animate-fade-in ${
      type === 'success'
        ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800'
        : 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 ring-1 ring-rose-200 dark:ring-rose-800'
    }`}>
      {type === 'success' ? <CheckCircleIcon className="w-5 h-5 shrink-0" /> : <XCircleIcon className="w-5 h-5 shrink-0" />} {message}
      <button onClick={onClose} className="ml-1 opacity-60 hover:opacity-100">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

function Pagination({ page, pages, onPage }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center gap-2 mt-4">
      <button
        onClick={() => onPage(p => Math.max(1, p - 1))}
        disabled={page === 1}
        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 ring-1 ring-slate-300 dark:ring-eggplant-600 hover:bg-slate-50 dark:hover:bg-eggplant-800 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        ← Prev
      </button>
      <span className="text-xs text-slate-500 dark:text-slate-300 px-2">
        Page <span className="font-semibold text-slate-800 dark:text-white">{page}</span> of {pages}
      </span>
      <button
        onClick={() => onPage(p => Math.min(pages, p + 1))}
        disabled={page === pages}
        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 ring-1 ring-slate-300 dark:ring-eggplant-600 hover:bg-slate-50 dark:hover:bg-eggplant-800 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Next →
      </button>
    </div>
  );
}

function SearchInput({ value, onChange, placeholder }) {
  return (
    <div className="relative">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-4 py-2 rounded-lg border border-slate-300 dark:border-eggplant-600 bg-white dark:bg-eggplant-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent w-64"
      />
    </div>
  );
}

const inputCls = 'w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-eggplant-600 bg-white dark:bg-eggplant-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent';
const btnPrimary = 'px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors disabled:opacity-50';
const btnSecondary = 'px-3.5 py-1.5 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 ring-1 ring-slate-300 dark:ring-eggplant-500 hover:bg-slate-50 dark:hover:bg-eggplant-800 transition-all';
const btnDanger = 'px-3.5 py-1.5 rounded-lg text-sm font-semibold text-rose-600 dark:text-rose-400 ring-1 ring-rose-300 dark:ring-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all';

const TABS = [
  { key: 'users',  label: 'Users' },
  { key: 'items',  label: 'Items' },
  { key: 'claims', label: 'Claims' },
];

export default function SuperAdminPanel() {
  const [tab, setTab] = useState('users');
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => setToast({ message, type });

  // ── Users ─────────────────────────────────────────────────────────────────
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [userPages, setUserPages] = useState(1);
  const [userTotal, setUserTotal] = useState(0);
  const [userLoading, setUserLoading] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [editDraft, setEditDraft] = useState({});
  const [addingUser, setAddingUser] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: 'user' });
  const [userActionLoading, setUserActionLoading] = useState({});

  const fetchUsers = useCallback(() => {
    setUserLoading(true);
    api.get('/superadmin/users', { params: { search: userSearch, page: userPage } })
      .then(r => { setUsers(r.data.users); setUserPages(r.data.pages); setUserTotal(r.data.total); })
      .catch(() => showToast('Failed to load users', 'error'))
      .finally(() => setUserLoading(false));
  }, [userSearch, userPage]);

  useEffect(() => { if (tab === 'users') fetchUsers(); }, [tab, fetchUsers]);

  const handleAddUser = async () => {
    try {
      await api.post('/superadmin/users', newUser);
      showToast('User created');
      setAddingUser(false);
      setNewUser({ username: '', email: '', password: '', role: 'user' });
      fetchUsers();
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to create user', 'error');
    }
  };

  const handleEditUser = async () => {
    try {
      await api.put(`/superadmin/users/${editUser.id}`, editDraft);
      showToast('User updated');
      setEditUser(null);
      fetchUsers();
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to update user', 'error');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Permanently delete this user? This cannot be undone.')) return;
    setUserActionLoading(p => ({ ...p, [id]: 'delete' }));
    try {
      await api.delete(`/superadmin/users/${id}`);
      showToast('User deleted');
      fetchUsers();
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to delete user', 'error');
    } finally {
      setUserActionLoading(p => ({ ...p, [id]: null }));
    }
  };

  const handleUnlockUser = async (id) => {
    setUserActionLoading(p => ({ ...p, [id]: 'unlock' }));
    try {
      await api.put(`/superadmin/users/${id}/unlock`);
      showToast('Account unlocked');
      fetchUsers();
    } catch (e) {
      showToast('Failed to unlock account', 'error');
    } finally {
      setUserActionLoading(p => ({ ...p, [id]: null }));
    }
  };

  // ── Items ─────────────────────────────────────────────────────────────────
  const [saItems, setSaItems] = useState([]);
  const [saItemSearch, setSaItemSearch] = useState('');
  const [saItemPage, setSaItemPage] = useState(1);
  const [saItemPages, setSaItemPages] = useState(1);
  const [saItemTotal, setSaItemTotal] = useState(0);
  const [saItemStatus, setSaItemStatus] = useState('');
  const [saItemLoading, setSaItemLoading] = useState(false);
  const [saItemActionLoading, setSaItemActionLoading] = useState({});
  const [editItem, setEditItem] = useState(null);
  const [editItemDraft, setEditItemDraft] = useState({});

  const fetchSaItems = useCallback(() => {
    setSaItemLoading(true);
    api.get('/superadmin/items', { params: { search: saItemSearch, page: saItemPage, status: saItemStatus } })
      .then(r => { setSaItems(r.data.items); setSaItemPages(r.data.pages); setSaItemTotal(r.data.total); })
      .catch(() => showToast('Failed to load items', 'error'))
      .finally(() => setSaItemLoading(false));
  }, [saItemSearch, saItemPage, saItemStatus]);

  useEffect(() => { if (tab === 'items') fetchSaItems(); }, [tab, fetchSaItems]);

  const handleEditItem = async () => {
    try {
      await api.put(`/superadmin/items/${editItem.id}`, editItemDraft);
      showToast('Item updated');
      setEditItem(null);
      fetchSaItems();
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to update item', 'error');
    }
  };

  const handleHardDeleteItem = async (id) => {
    if (!window.confirm('Permanently delete this item and all its claims? This cannot be undone.')) return;
    setSaItemActionLoading(p => ({ ...p, [id]: 'delete' }));
    try {
      await api.delete(`/superadmin/items/${id}`);
      showToast('Item permanently deleted');
      fetchSaItems();
    } catch (e) {
      showToast('Failed to delete item', 'error');
    } finally {
      setSaItemActionLoading(p => ({ ...p, [id]: null }));
    }
  };

  const handleRestoreItem = async (id) => {
    setSaItemActionLoading(p => ({ ...p, [id]: 'restore' }));
    try {
      await api.put(`/superadmin/items/${id}/restore`);
      showToast('Item restored');
      fetchSaItems();
    } catch (e) {
      showToast('Failed to restore item', 'error');
    } finally {
      setSaItemActionLoading(p => ({ ...p, [id]: null }));
    }
  };

  // ── Claims ────────────────────────────────────────────────────────────────
  const [saClaims, setSaClaims] = useState([]);
  const [saClaimSearch, setSaClaimSearch] = useState('');
  const [saClaimPage, setSaClaimPage] = useState(1);
  const [saClaimPages, setSaClaimPages] = useState(1);
  const [saClaimTotal, setSaClaimTotal] = useState(0);
  const [saClaimLoading, setSaClaimLoading] = useState(false);
  const [saClaimActionLoading, setSaClaimActionLoading] = useState({});
  const [editClaim, setEditClaim] = useState(null);
  const [editClaimDraft, setEditClaimDraft] = useState({});

  const fetchSaClaims = useCallback(() => {
    setSaClaimLoading(true);
    api.get('/superadmin/claims', { params: { search: saClaimSearch, page: saClaimPage } })
      .then(r => { setSaClaims(r.data.claims); setSaClaimPages(r.data.pages); setSaClaimTotal(r.data.total); })
      .catch(() => showToast('Failed to load claims', 'error'))
      .finally(() => setSaClaimLoading(false));
  }, [saClaimSearch, saClaimPage]);

  useEffect(() => { if (tab === 'claims') fetchSaClaims(); }, [tab, fetchSaClaims]);

  const handleEditClaim = async () => {
    try {
      await api.put(`/superadmin/claims/${editClaim.id}`, editClaimDraft);
      showToast('Claim updated');
      setEditClaim(null);
      fetchSaClaims();
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to update claim', 'error');
    }
  };

  const handleDeleteClaim = async (id) => {
    if (!window.confirm('Delete this claim? This cannot be undone.')) return;
    setSaClaimActionLoading(p => ({ ...p, [id]: true }));
    try {
      await api.delete(`/superadmin/claims/${id}`);
      showToast('Claim deleted');
      fetchSaClaims();
    } catch (e) {
      showToast('Failed to delete claim', 'error');
    } finally {
      setSaClaimActionLoading(p => ({ ...p, [id]: false }));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="mb-7">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 text-xs font-semibold mb-3 ring-1 ring-violet-200 dark:ring-violet-800">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
          Superadmin
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">SuperAdmin Panel</h1>
        <p className="text-sm text-slate-500 dark:text-slate-300 mt-0.5">Full control over users, listings, and claims.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-eggplant-800 rounded-xl p-1 mb-7 w-fit">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t.key
                ? 'bg-white dark:bg-eggplant-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Users Tab ────────────────────────────────────────────────────────── */}
      {tab === 'users' && (
        <div>
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <SearchInput value={userSearch} onChange={v => { setUserSearch(v); setUserPage(1); }} placeholder="Search by name or email…" />
            <span className="text-xs text-slate-500 dark:text-slate-300 ml-auto">{userTotal} users total</span>
            <button onClick={() => { setAddingUser(p => !p); setEditUser(null); }} className={btnPrimary}>
              {addingUser ? 'Cancel' : '+ Add User'}
            </button>
          </div>

          {/* Add user form */}
          {addingUser && (
            <div className="mb-5 p-5 bg-violet-50 dark:bg-violet-950/30 rounded-2xl ring-1 ring-violet-200 dark:ring-violet-800">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">New User</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <input className={inputCls} placeholder="Username" value={newUser.username} onChange={e => setNewUser(p => ({ ...p, username: e.target.value }))} />
                <input className={inputCls} placeholder="Email" type="email" value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} />
                <input className={inputCls} placeholder="Password (min 6 chars)" type="password" value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} />
                <select className={inputCls} value={newUser.role} onChange={e => setNewUser(p => ({ ...p, role: e.target.value }))}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Superadmin</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={handleAddUser} className={btnPrimary}>Create User</button>
                <button onClick={() => setAddingUser(false)} className={btnSecondary}>Cancel</button>
              </div>
            </div>
          )}

          {/* Edit user form */}
          {editUser && (
            <div className="mb-5 p-5 bg-amber-50 dark:bg-amber-950/30 rounded-2xl ring-1 ring-amber-200 dark:ring-amber-800">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">Edit User — {editUser.username}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <input className={inputCls} placeholder="New username" value={editDraft.username || ''} onChange={e => setEditDraft(p => ({ ...p, username: e.target.value }))} />
                <input className={inputCls} placeholder="New email" type="email" value={editDraft.email || ''} onChange={e => setEditDraft(p => ({ ...p, email: e.target.value }))} />
                <input className={inputCls} placeholder="New password (leave blank to keep)" type="password" value={editDraft.password || ''} onChange={e => setEditDraft(p => ({ ...p, password: e.target.value }))} />
                <select className={inputCls} value={editDraft.role || editUser.role} onChange={e => setEditDraft(p => ({ ...p, role: e.target.value }))}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Superadmin</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={handleEditUser} className={btnPrimary}>Save Changes</button>
                <button onClick={() => setEditUser(null)} className={btnSecondary}>Cancel</button>
              </div>
            </div>
          )}

          {userLoading ? <LoadingSpinner text="Loading users…" /> : (
            <div className="bg-white dark:bg-eggplant-900 rounded-2xl ring-1 ring-slate-200/60 dark:ring-eggplant-600/80 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-eggplant-700">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">ID</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Username</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Role</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Joined</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-eggplant-700">
                  {users.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-10 text-slate-400 dark:text-slate-500">No users found</td></tr>
                  ) : users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-eggplant-800/40 transition-colors">
                      <td className="px-4 py-3 text-slate-400 dark:text-slate-500 font-mono text-xs">{u.id}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{u.username}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${
                          u.role === 'superadmin'
                            ? 'bg-violet-100 text-violet-700 ring-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:ring-violet-700'
                            : u.role === 'admin'
                            ? 'bg-coral-100 text-coral-700 ring-coral-200 dark:bg-coral-900/30 dark:text-coral-300 dark:ring-coral-700'
                            : 'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-eggplant-800 dark:text-slate-300 dark:ring-eggplant-600'
                        }`}>{u.role}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">{fmt(u.created_at)}</td>
                      <td className="px-4 py-3">
                        {u.locked_until && new Date(u.locked_until) > new Date() ? (
                          <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold">Locked</span>
                        ) : (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Active</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 justify-end">
                          {u.locked_until && new Date(u.locked_until) > new Date() && (
                            <button
                              onClick={() => handleUnlockUser(u.id)}
                              disabled={!!userActionLoading[u.id]}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-amber-600 dark:text-amber-400 ring-1 ring-amber-300 dark:ring-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-all disabled:opacity-40"
                            >
                              Unlock
                            </button>
                          )}
                          <button
                            onClick={() => { setEditUser(u); setEditDraft({ role: u.role }); setAddingUser(false); }}
                            className={btnSecondary}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            disabled={!!userActionLoading[u.id]}
                            className={btnDanger}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination page={userPage} pages={userPages} onPage={setUserPage} />
        </div>
      )}

      {/* ── Items Tab ────────────────────────────────────────────────────────── */}
      {tab === 'items' && (
        <div>
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <SearchInput value={saItemSearch} onChange={v => { setSaItemSearch(v); setSaItemPage(1); }} placeholder="Search items…" />
            <select
              value={saItemStatus}
              onChange={e => { setSaItemStatus(e.target.value); setSaItemPage(1); }}
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-eggplant-600 bg-white dark:bg-eggplant-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">All Items</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="claimed">Claimed</option>
              <option value="resolved">Resolved</option>
              <option value="deleted">Soft-Deleted</option>
            </select>
            <span className="text-xs text-slate-500 dark:text-slate-300 ml-auto">{saItemTotal} items total</span>
          </div>

          {/* Edit item form */}
          {editItem && (
            <div className="mb-5 p-5 bg-amber-50 dark:bg-amber-950/30 rounded-2xl ring-1 ring-amber-200 dark:ring-amber-800">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">Edit Item — {editItem.title}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <input
                  className={inputCls}
                  placeholder="Title"
                  value={editItemDraft.title ?? editItem.title}
                  onChange={e => setEditItemDraft(p => ({ ...p, title: e.target.value }))}
                />
                <input
                  className={inputCls}
                  placeholder="Location"
                  value={editItemDraft.location ?? editItem.location}
                  onChange={e => setEditItemDraft(p => ({ ...p, location: e.target.value }))}
                />
                <input
                  className={inputCls}
                  placeholder="Category"
                  value={editItemDraft.category ?? editItem.category}
                  onChange={e => setEditItemDraft(p => ({ ...p, category: e.target.value }))}
                />
                <div className="flex gap-2">
                  <select
                    className={inputCls}
                    value={editItemDraft.type ?? editItem.type}
                    onChange={e => setEditItemDraft(p => ({ ...p, type: e.target.value }))}
                  >
                    <option value="lost">Lost</option>
                    <option value="found">Found</option>
                  </select>
                  <select
                    className={inputCls}
                    value={editItemDraft.status ?? editItem.status}
                    onChange={e => setEditItemDraft(p => ({ ...p, status: e.target.value }))}
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="claimed">Claimed</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
                <textarea
                  className={`${inputCls} sm:col-span-2`}
                  rows={3}
                  placeholder="Description"
                  value={editItemDraft.description ?? editItem.description}
                  onChange={e => setEditItemDraft(p => ({ ...p, description: e.target.value }))}
                />
              </div>
              <div className="flex gap-2">
                <button onClick={handleEditItem} className={btnPrimary}>Save Changes</button>
                <button onClick={() => setEditItem(null)} className={btnSecondary}>Cancel</button>
              </div>
            </div>
          )}

          {saItemLoading ? <LoadingSpinner text="Loading items…" /> : (
            <div className="bg-white dark:bg-eggplant-900 rounded-2xl ring-1 ring-slate-200/60 dark:ring-eggplant-600/80 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-eggplant-700">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">ID</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Title</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Reporter</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-eggplant-700">
                  {saItems.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-10 text-slate-400 dark:text-slate-500">No items found</td></tr>
                  ) : saItems.map(item => (
                    <tr key={item.id} className={`hover:bg-slate-50 dark:hover:bg-eggplant-800/40 transition-colors ${item.deleted_at ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-3 text-slate-400 dark:text-slate-500 font-mono text-xs">{item.id}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200 max-w-[200px] truncate">
                        {item.deleted_at && <span className="mr-1.5 text-xs bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded font-semibold">deleted</span>}
                        {item.title}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.reporter_name || '—'}</td>
                      <td className="px-4 py-3"><Badge variant={item.type}>{item.type}</Badge></td>
                      <td className="px-4 py-3"><Badge variant={item.status}>{item.status}</Badge></td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">{fmt(item.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 justify-end">
                          {!item.deleted_at && (
                            <button
                              onClick={() => { setEditItem(item); setEditItemDraft({}); }}
                              className={btnSecondary}
                            >
                              Edit
                            </button>
                          )}
                          {item.deleted_at ? (
                            <button
                              onClick={() => handleRestoreItem(item.id)}
                              disabled={!!saItemActionLoading[item.id]}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-300 dark:ring-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-all disabled:opacity-40"
                            >
                              Restore
                            </button>
                          ) : null}
                          <button
                            onClick={() => handleHardDeleteItem(item.id)}
                            disabled={!!saItemActionLoading[item.id]}
                            className={btnDanger}
                          >
                            Hard Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination page={saItemPage} pages={saItemPages} onPage={setSaItemPage} />
        </div>
      )}

      {/* ── Claims Tab ───────────────────────────────────────────────────────── */}
      {tab === 'claims' && (
        <div>
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <SearchInput value={saClaimSearch} onChange={v => { setSaClaimSearch(v); setSaClaimPage(1); }} placeholder="Search by user or item…" />
            <span className="text-xs text-slate-500 dark:text-slate-300 ml-auto">{saClaimTotal} claims total</span>
          </div>

          {/* Edit claim form */}
          {editClaim && (
            <div className="mb-5 p-5 bg-amber-50 dark:bg-amber-950/30 rounded-2xl ring-1 ring-amber-200 dark:ring-amber-800">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">
                Edit Claim — {editClaim.claimer_name} on "{editClaim.item_title}"
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <select
                  className={inputCls}
                  value={editClaimDraft.status ?? editClaim.status}
                  onChange={e => setEditClaimDraft(p => ({ ...p, status: e.target.value }))}
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <input
                  className={inputCls}
                  placeholder="Rejection reason (optional)"
                  value={editClaimDraft.rejection_reason ?? (editClaim.rejection_reason || '')}
                  onChange={e => setEditClaimDraft(p => ({ ...p, rejection_reason: e.target.value }))}
                />
                <textarea
                  className={`${inputCls} sm:col-span-2`}
                  rows={3}
                  placeholder="Message"
                  value={editClaimDraft.message ?? (editClaim.message || '')}
                  onChange={e => setEditClaimDraft(p => ({ ...p, message: e.target.value }))}
                />
              </div>
              <div className="flex gap-2">
                <button onClick={handleEditClaim} className={btnPrimary}>Save Changes</button>
                <button onClick={() => setEditClaim(null)} className={btnSecondary}>Cancel</button>
              </div>
            </div>
          )}

          {saClaimLoading ? <LoadingSpinner text="Loading claims…" /> : (
            <div className="bg-white dark:bg-eggplant-900 rounded-2xl ring-1 ring-slate-200/60 dark:ring-eggplant-600/80 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-eggplant-700">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">ID</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Claimer</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Item</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Message</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-eggplant-700">
                  {saClaims.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-10 text-slate-400 dark:text-slate-500">No claims found</td></tr>
                  ) : saClaims.map(claim => (
                    <tr key={claim.id} className="hover:bg-slate-50 dark:hover:bg-eggplant-800/40 transition-colors">
                      <td className="px-4 py-3 text-slate-400 dark:text-slate-500 font-mono text-xs">{claim.id}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{claim.claimer_name}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300 max-w-[180px] truncate">{claim.item_title}</td>
                      <td className="px-4 py-3"><Badge variant={claim.status}>{claim.status}</Badge></td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 max-w-[200px] truncate text-xs">{claim.message || '—'}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">{fmt(claim.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => { setEditClaim(claim); setEditClaimDraft({}); }}
                            className={btnSecondary}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteClaim(claim.id)}
                            disabled={!!saClaimActionLoading[claim.id]}
                            className={btnDanger}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination page={saClaimPage} pages={saClaimPages} onPage={setSaClaimPage} />
        </div>
      )}
    </div>
  );
}
