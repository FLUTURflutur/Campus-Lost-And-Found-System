import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ItemCard from '../components/ItemCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import api from '../services/api';

const CATEGORIES = [
  'All Categories', 'Electronics', 'Clothing', 'Accessories',
  'Books & Documents', 'Keys', 'Wallet / Bag', 'Sports Equipment', 'Other',
];

const LIMIT = 20;

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const itemsRef = useRef(null);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [page, setPage] = useState(1);

  // Debounce search input by 300ms
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleTypeFilter = val => { setTypeFilter(val); setPage(1); };
  const handleCategoryFilter = val => { setCategoryFilter(val); setPage(1); };
  const handleClear = () => { setSearchInput(''); setSearch(''); setTypeFilter('all'); setCategoryFilter('All Categories'); setPage(1); };

  const fetchItems = useCallback(() => {
    setLoading(true);
    setError('');
    const params = { page, limit: LIMIT };
    if (search) params.search = search;
    if (typeFilter !== 'all') params.type = typeFilter;
    if (categoryFilter !== 'All Categories') params.category = categoryFilter;
    api.get('/items', { params })
      .then(res => {
        // Support both paginated { items, total, pages } and plain array responses
        if (Array.isArray(res.data)) {
          setItems(res.data);
          setTotal(res.data.length);
          setTotalPages(1);
        } else {
          setItems(res.data.items);
          setTotal(res.data.total);
          setTotalPages(res.data.pages);
        }
      })
      .catch(() => setError('Failed to load items. Please try again.'))
      .finally(() => setLoading(false));
  }, [page, search, typeFilter, categoryFilter]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const scrollToItems = () => itemsRef.current?.scrollIntoView({ behavior: 'smooth' });
  const hasFilters = searchInput || typeFilter !== 'all' || categoryFilter !== 'All Categories';

  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-coral-50 via-honey-50 to-seafoam-50 dark:from-eggplant-900 dark:via-eggplant-900 dark:to-eggplant-900 border-b border-slate-200 dark:border-eggplant-700">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-coral-100 dark:bg-coral-950/30 rounded-full blur-3xl opacity-60" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-violet-100 dark:bg-violet-950/30 rounded-full blur-3xl opacity-50" />
        </div>

        <div className="relative max-w-3xl mx-auto px-4 py-20 sm:py-28 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-coral-100 dark:bg-coral-950/60 text-coral-700 dark:text-coral-300 text-xs font-semibold mb-6 ring-1 ring-coral-200 dark:ring-coral-800">
            <span className="w-1.5 h-1.5 rounded-full bg-coral-500 animate-pulse" />
            CampusFind
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4 leading-tight">
            Reuniting students with
            <br />
            <span className="text-eggplant-700 dark:text-coral-400">their belongings</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 mb-9 max-w-lg mx-auto leading-relaxed">
            Lost something on campus? Found an item? Help reconnect students with what's theirs.
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={scrollToItems}
              className="px-6 py-2.5 rounded-xl bg-coral-600 hover:bg-coral-700 active:scale-95 text-white font-semibold text-sm shadow-sm transition-all"
            >
              Browse Items
            </button>
            <button
              onClick={() => navigate(user ? '/report' : '/login')}
              className="px-6 py-2.5 rounded-xl bg-white dark:bg-eggplant-800 text-slate-700 dark:text-slate-200 ring-1 ring-slate-300 dark:ring-eggplant-500 font-semibold text-sm shadow-sm hover:bg-slate-50 dark:hover:bg-eggplant-700 active:scale-95 transition-all"
            >
              Report an Item
            </button>
          </div>
        </div>
      </section>

      {/* ── Items section ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10" ref={itemsRef}>
        <div className="mb-7">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-0.5">All Items</h2>
          <p className="text-sm text-slate-500 dark:text-slate-300">Browse lost and found items reported by students</p>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col gap-3 mb-6">
          <div className="relative">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by title, description, or location…"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-eggplant-600 bg-white dark:bg-eggplant-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-transparent transition-all"
            />
            {searchInput && (
              <button
                onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-eggplant-800 rounded-lg p-1">
              {[
                { key: 'all', label: 'All' },
                { key: 'lost', label: 'Lost' },
                { key: 'found', label: 'Found' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => handleTypeFilter(key)}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    typeFilter === key
                      ? 'bg-white dark:bg-eggplant-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <select
              value={categoryFilter}
              onChange={e => handleCategoryFilter(e.target.value)}
              className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-eggplant-600 bg-white dark:bg-eggplant-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-transparent transition-all"
            >
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>

            {hasFilters && (
              <button onClick={handleClear} className="text-xs text-coral-600 dark:text-coral-400 hover:underline font-medium">
                Clear filters
              </button>
            )}
          </div>
        </div>

        {!loading && !error && (
          <p className="text-xs text-slate-500 dark:text-slate-300 mb-5">
            Showing{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-300">{items.length}</span>
            {' '}of <span className="font-semibold text-slate-700 dark:text-slate-300">{total}</span> items
          </p>
        )}

        {loading ? (
          <LoadingSpinner text="Loading items…" />
        ) : error ? (
          <EmptyState icon="⚠️" title="Something went wrong" description={error} />
        ) : items.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="No items found"
            description={
              hasFilters
                ? 'Try adjusting your filters or search term.'
                : 'No items have been reported yet. Be the first!'
            }
            action={
              !user && (
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-coral-600 hover:bg-coral-700 text-white text-sm font-semibold transition-colors"
                >
                  Login to Report
                </Link>
              )
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {items.map(item => <ItemCard key={item.id} item={item} />)}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3.5 py-2 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 ring-1 ring-slate-300 dark:ring-eggplant-600 hover:bg-slate-50 dark:hover:bg-eggplant-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  ← Prev
                </button>
                <span className="text-sm text-slate-500 dark:text-slate-300 px-2">
                  Page <span className="font-semibold text-slate-800 dark:text-white">{page}</span> of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3.5 py-2 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 ring-1 ring-slate-300 dark:ring-eggplant-600 hover:bg-slate-50 dark:hover:bg-eggplant-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
