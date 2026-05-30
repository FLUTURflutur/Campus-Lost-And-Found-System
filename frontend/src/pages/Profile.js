import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { CheckCircleIcon, AlertTriangleIcon } from '../components/ui/Icons';

export default function Profile() {
  const { user } = useAuth();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (form.newPassword !== form.confirmPassword) { setError('New passwords do not match.'); return; }
    if (form.newPassword.length < 6) { setError('New password must be at least 6 characters.'); return; }
    setSubmitting(true);
    try {
      await api.put('/auth/profile', { currentPassword: form.currentPassword, newPassword: form.newPassword });
      setSuccess('Password updated successfully.');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-10">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Profile</h1>
        <p className="text-sm text-slate-500 dark:text-slate-300 mt-0.5">Manage your account settings.</p>
      </div>

      <div className="bg-white dark:bg-eggplant-900 rounded-2xl shadow-sm ring-1 ring-slate-200/60 dark:ring-eggplant-600/80 p-6 mb-5">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">Account Info</h2>
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Username</p>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{user?.username}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Email</p>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{user?.email}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Role</p>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-eggplant-900 rounded-2xl shadow-sm ring-1 ring-slate-200/60 dark:ring-eggplant-600/80 p-6">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">Change Password</h2>

        {success && (
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-sm ring-1 ring-emerald-200 dark:ring-emerald-800 mb-4">
            <CheckCircleIcon className="w-4 h-4 shrink-0" /> {success}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 text-sm ring-1 ring-rose-200 dark:ring-rose-800 mb-4">
            <AlertTriangleIcon className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {[
            { name: 'currentPassword', label: 'Current Password' },
            { name: 'newPassword', label: 'New Password' },
            { name: 'confirmPassword', label: 'Confirm New Password' },
          ].map(field => (
            <div key={field.name} className="flex flex-col gap-1.5">
              <label htmlFor={field.name} className="text-sm font-medium text-slate-700 dark:text-slate-300">{field.label}</label>
              <input
                id={field.name} name={field.name} type="password"
                value={form[field.name]} onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-eggplant-600 bg-white dark:bg-eggplant-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-transparent transition-all"
              />
            </div>
          ))}
          <div className="pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-lg bg-coral-600 hover:bg-coral-700 text-white text-sm font-semibold transition-all active:scale-95 disabled:opacity-50"
            >
              {submitting ? 'Saving…' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
