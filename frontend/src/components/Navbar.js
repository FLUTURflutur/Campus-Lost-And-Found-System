import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { GraduationCapIcon } from './ui/Icons';

function SunIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v2m0 16v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M2 12h2m16 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

const mobileLinkClass = ({ isActive }) =>
  `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
    isActive
      ? 'bg-coral-50 dark:bg-coral-950/60 text-coral-600 dark:text-coral-400'
      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-eggplant-800/60'
  }`;

export default function Navbar() {
  const auth = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await auth.logout();
    setMenuOpen(false);
    navigate('/login');
  };

  const close = () => setMenuOpen(false);

  const desktopLinkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors ${
      isActive
        ? 'text-coral-600 dark:text-coral-400'
        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
    }`;

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-eggplant-950/90 backdrop-blur-md border-b border-slate-200 dark:border-eggplant-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <Link
            to="/"
            onClick={close}
            className="flex items-center gap-2 font-bold text-eggplant-700 dark:text-coral-400 text-lg tracking-tight shrink-0"
          >
            <GraduationCapIcon className="w-6 h-6" />
            CampusFind
          </Link>

          {/* Desktop center nav */}
          <nav className="hidden md:flex items-center gap-6">
            <NavLink to="/" end className={desktopLinkClass}>Browse</NavLink>
            {auth.user && (
              <NavLink to="/report" className={desktopLinkClass}>Report Item</NavLink>
            )}
          </nav>

          {/* Desktop right */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={toggle}
              aria-label="Toggle dark mode"
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-eggplant-800 transition-colors"
            >
              {dark ? <SunIcon /> : <MoonIcon />}
            </button>

            {auth.user ? (
              <>
                <span className="text-sm text-slate-500 dark:text-slate-300">
                  Hi, <span className="font-semibold text-slate-800 dark:text-slate-200">{auth.user.username}</span>
                </span>
                <Link to="/my-items" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
                  My Items
                </Link>
                <Link to="/my-claims" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
                  My Claims
                </Link>
                <Link to="/profile" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
                  Profile
                </Link>
                {(auth.user.role === 'admin' || auth.user.role === 'superadmin') && (
                  <Link to="/admin" className="text-sm font-semibold text-coral-600 dark:text-coral-400 hover:text-coral-700 dark:hover:text-coral-300 transition-colors">
                    Admin
                  </Link>
                )}
                {auth.user.role === 'superadmin' && (
                  <Link to="/superadmin" className="text-sm font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors">
                    SuperAdmin
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="text-sm font-semibold px-3.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 ring-1 ring-slate-300 dark:ring-eggplant-500 hover:bg-slate-50 dark:hover:bg-eggplant-800 transition-all"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
                  Log in
                </Link>
                <Link to="/register" className="text-sm font-semibold px-3.5 py-1.5 rounded-lg bg-coral-600 text-white hover:bg-coral-700 transition-colors shadow-sm">
                  Sign up
                </Link>
              </>
            )}
          </div>

          {/* Mobile controls */}
          <div className="flex md:hidden items-center gap-1.5">
            <button
              onClick={toggle}
              aria-label="Toggle dark mode"
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-eggplant-800 transition-colors"
            >
              {dark ? <SunIcon /> : <MoonIcon />}
            </button>
            <button
              onClick={() => setMenuOpen(p => !p)}
              aria-label="Toggle menu"
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-eggplant-800 transition-colors"
            >
              {menuOpen ? <XIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-eggplant-700 bg-white/95 dark:bg-eggplant-950/95 backdrop-blur-md px-4 py-2 flex flex-col gap-0.5 animate-fade-in">
          <NavLink to="/" end onClick={close} className={mobileLinkClass}>Browse Items</NavLink>
          {auth.user && (
            <NavLink to="/report" onClick={close} className={mobileLinkClass}>Report Item</NavLink>
          )}

          <div className="my-1.5 border-t border-slate-100 dark:border-eggplant-700" />

          {auth.user ? (
            <>
              <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 dark:text-slate-300 uppercase tracking-wider">
                {auth.user.username}
              </div>
              <NavLink to="/my-items" onClick={close} className={mobileLinkClass}>My Items</NavLink>
              <NavLink to="/my-claims" onClick={close} className={mobileLinkClass}>My Claims</NavLink>
              <NavLink to="/profile" onClick={close} className={mobileLinkClass}>Profile</NavLink>
              {(auth.user.role === 'admin' || auth.user.role === 'superadmin') && (
                <NavLink to="/admin" onClick={close} className={mobileLinkClass}>Admin Panel</NavLink>
              )}
              {auth.user.role === 'superadmin' && (
                <NavLink to="/superadmin" onClick={close} className={mobileLinkClass}>SuperAdmin Panel</NavLink>
              )}
              <div className="my-1.5 border-t border-slate-100 dark:border-eggplant-700" />
              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-eggplant-800/60 text-left transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" onClick={close} className={mobileLinkClass}>Log in</NavLink>
              <Link
                to="/register"
                onClick={close}
                className="px-3 py-2 rounded-lg text-sm font-semibold bg-coral-600 text-white text-center hover:bg-coral-700 transition-colors"
              >
                Sign up
              </Link>
            </>
          )}
          <div className="pb-2" />
        </div>
      )}
    </header>
  );
}
