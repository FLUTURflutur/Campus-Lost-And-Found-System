import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { BACKEND_URL } from '../services/api';
import { SparklesIcon, AlertTriangleIcon } from '../components/ui/Icons';

const CATEGORIES = [
  'Electronics', 'Clothing', 'Accessories', 'Books & Documents',
  'Keys', 'Wallet / Bag', 'Sports Equipment', 'Other',
];

function UploadIcon() {
  return (
    <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  );
}

export default function ReportItem() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    title: '', type: 'lost', category: '', description: '', location: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [imageUrl, setImageUrl] = useState('');
  const [imageId, setImageId] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setUploadError('Only JPEG, PNG, GIF, and WebP images are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File is too large. Maximum size is 5 MB.');
      return;
    }
    setUploadError('');
    setUploading(true);
    try {
      const data = new FormData();
      data.append('image', file);
      const res = await api.post('/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImageUrl(res.data.imageUrl);
      setImageId(res.data.imageId);
      setImagePreview(BACKEND_URL + res.data.imageUrl);
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }, []);

  const handleFileInput = e => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleDrop = e => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const removeImage = () => {
    if (imageId) {
      api.delete(`/upload/${imageId}`).catch(() => {});
    }
    setImageUrl('');
    setImageId(null);
    setImagePreview('');
    setUploadError('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!form.title.trim())       { setError('Title is required.'); return; }
    if (!form.category)           { setError('Please select a category.'); return; }
    if (!form.description.trim()) { setError('Description is required.'); return; }
    if (!form.location.trim())    { setError('Location is required.'); return; }

    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        type: form.type,
        category: form.category,
        description: form.description.trim(),
        location: form.location.trim(),
      };
      if (imageUrl) payload.image_url = imageUrl;
      await api.post('/items', payload);
      setSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to report item. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setSuccess(false);
    setForm({ title: '', type: 'lost', category: '', description: '', location: '' });
    setImageUrl('');
    setImageId(null);
    setImagePreview('');
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="bg-white dark:bg-eggplant-900 rounded-2xl shadow-sm ring-1 ring-slate-200/60 dark:ring-eggplant-600/80 p-10">
          <div className="flex justify-center mb-4 text-coral-500 dark:text-coral-400"><SparklesIcon className="w-14 h-14" /></div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Item Reported!</h2>
          <p className="text-sm text-slate-500 dark:text-slate-300 mb-7 max-w-xs mx-auto leading-relaxed">
            Your item has been submitted for review. It will appear in the browse list after an admin approves it.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={() => navigate('/')}
              className="px-5 py-2.5 rounded-lg bg-coral-600 hover:bg-coral-700 text-white text-sm font-semibold transition-all active:scale-95"
            >
              Browse Items
            </button>
            <button
              onClick={reset}
              className="px-5 py-2.5 rounded-lg bg-white dark:bg-eggplant-800 text-slate-700 dark:text-slate-200 ring-1 ring-slate-300 dark:ring-eggplant-500 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-eggplant-700 transition-all active:scale-95"
            >
              Report Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      {/* Page header */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Report an Item</h1>
        <p className="text-sm text-slate-500 dark:text-slate-300">
          Submit a lost or found item to help reconnect it with its owner.
        </p>
      </div>

      <div className="bg-white dark:bg-eggplant-900 rounded-2xl shadow-sm ring-1 ring-slate-200/60 dark:ring-eggplant-600/80 p-6 sm:p-8">
        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 text-sm ring-1 ring-rose-200 dark:ring-rose-800 mb-5">
            <AlertTriangleIcon className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="title" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              id="title" name="title" type="text"
              placeholder="e.g. Black Laptop Bag, Silver iPhone 14…"
              value={form.title}
              onChange={handleChange}
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-eggplant-600 bg-white dark:bg-eggplant-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Type */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Type <span className="text-rose-500">*</span>
            </p>
            <div className="flex items-center gap-3">
              {[
                { value: 'lost',  label: 'Lost',  accent: 'ring-rose-400 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'  },
                { value: 'found', label: 'Found', accent: 'ring-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' },
              ].map(opt => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg ring-1 cursor-pointer transition-all select-none ${
                    form.type === opt.value
                      ? opt.accent
                      : 'ring-slate-300 dark:ring-eggplant-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-eggplant-800'
                  }`}
                >
                  <input
                    type="radio"
                    name="type"
                    value={opt.value}
                    checked={form.type === opt.value}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                    form.type === opt.value ? 'border-current' : 'border-slate-400'
                  }`}>
                    {form.type === opt.value && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                  </span>
                  <span className="text-sm font-semibold">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="category" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Category <span className="text-rose-500">*</span>
            </label>
            <select
              id="category" name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-eggplant-600 bg-white dark:bg-eggplant-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-transparent transition-all"
            >
              <option value="">Select a category…</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="description" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="description" name="description" rows={4}
              placeholder="Describe the item in detail — color, brand, distinguishing features…"
              value={form.description}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-eggplant-600 bg-white dark:bg-eggplant-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          {/* Location */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="location" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Location <span className="text-rose-500">*</span>
            </label>
            <input
              id="location" name="location" type="text"
              placeholder="e.g. Library 2nd floor, Student Union cafeteria…"
              value={form.location}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-eggplant-600 bg-white dark:bg-eggplant-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-transparent transition-all"
            />
            <p className="text-xs text-slate-500 dark:text-slate-300">Where was it lost or found?</p>
          </div>

          {/* Image Upload */}
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Photo <span className="text-slate-400 font-normal">(optional)</span>
            </p>

            {imagePreview ? (
              /* Preview */
              <div className="relative rounded-xl overflow-hidden ring-1 ring-slate-200 dark:ring-eggplant-600">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
                  aria-label="Remove image"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              /* Drop zone */
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`relative flex flex-col items-center justify-center gap-2 px-6 py-8 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                  dragOver
                    ? 'border-coral-400 bg-coral-50 dark:bg-coral-950/20'
                    : 'border-slate-300 dark:border-eggplant-600 hover:border-coral-400 hover:bg-slate-50 dark:hover:bg-eggplant-800/50'
                }`}
              >
                {uploading ? (
                  <>
                    <svg className="w-6 h-6 text-coral-500 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <p className="text-sm text-slate-500 dark:text-slate-300">Uploading…</p>
                  </>
                ) : (
                  <>
                    <UploadIcon />
                    <div className="text-center">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Drag & drop or <span className="text-coral-600 dark:text-coral-400">click to upload</span>
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">JPEG, PNG, GIF, WebP — max 5 MB</p>
                    </div>
                  </>
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileInput}
              className="sr-only"
            />

            {uploadError && (
              <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
                <AlertTriangleIcon className="w-4 h-4 shrink-0" /> {uploadError}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={submitting || uploading}
              className="px-6 py-2.5 rounded-lg bg-coral-600 hover:bg-coral-700 text-white text-sm font-semibold shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting…' : 'Submit Report'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-5 py-2.5 rounded-lg bg-white dark:bg-eggplant-800 text-slate-700 dark:text-slate-300 ring-1 ring-slate-300 dark:ring-eggplant-500 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-eggplant-700 transition-all active:scale-95"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
