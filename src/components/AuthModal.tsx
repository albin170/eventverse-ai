import React, { useState } from 'react';
import {
  loginUser,
  registerUser,
  provisionAdminAccount,
  getPersistenceMode,
} from '@/services/auth';
import { IconCheck, IconShield } from './icons';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const persistenceMode = getPersistenceMode();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await loginUser(email, password);
      } else {
        await registerUser(email, password, displayName);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickProvision = async (role: 'user' | 'admin') => {
    setError(null);
    setLoading(true);
    try {
      if (role === 'admin') {
        try {
          await loginUser('admin@eventverse.internal', 'AdminSecure2026!');
        } catch {
          await provisionAdminAccount('admin@eventverse.internal', 'AdminSecure2026!', 'Platform Administrator');
        }
      } else {
        try {
          await loginUser('user@eventverse.test', 'UserSecure2026!');
        } catch {
          await registerUser('user@eventverse.test', 'UserSecure2026!', 'Alex Morgan', 'user');
        }
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Quick sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight-950/80 backdrop-blur-sm"
    >
      <div className="bg-surface-card border border-surface-border w-full max-w-md rounded-2xl p-6 sm:p-8 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white text-lg p-1 rounded-lg"
          aria-label="Close authentication modal"
        >
          ✕
        </button>

        <div className="flex items-center space-x-2 mb-2">
          <span className="w-2.5 h-2.5 rounded-full bg-violet-400"></span>
          <span className="text-xs font-semibold uppercase tracking-wider text-violet-300">
            {persistenceMode === 'cloud_firebase' ? 'Cloud Firebase Auth' : 'Local Persistent Storage'}
          </span>
        </div>

        <h2 id="auth-modal-title" className="text-2xl font-bold font-display text-white mb-2">
          {mode === 'login' ? 'Sign In to EventVerse' : 'Create Your Account'}
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          {mode === 'login'
            ? 'Access your saved events, budgets, timelines, and enquiries.'
            : 'Start organizing your weddings, anniversaries, and celebrations.'}
        </p>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label htmlFor="auth-display-name" className="block text-xs font-medium text-slate-300 mb-1">
                Full Name
              </label>
              <input
                id="auth-display-name"
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Eleanor Vance"
                className="w-full px-3.5 py-2.5 rounded-xl bg-midnight-900 border border-surface-border text-white text-sm focus:border-violet-500 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="block text-xs font-medium text-slate-300 mb-1">
              Email Address
            </label>
            <input
              id="auth-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-midnight-900 border border-surface-border text-white text-sm focus:border-violet-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="auth-password" className="block text-xs font-medium text-slate-300 mb-1">
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full px-3.5 py-2.5 rounded-xl bg-midnight-900 border border-surface-border text-white text-sm focus:border-violet-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm shadow-glow transition-all disabled:opacity-50"
          >
            {loading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-surface-border text-center">
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError(null);
            }}
            className="text-xs text-violet-400 hover:text-violet-300 font-medium"
          >
            {mode === 'login'
              ? "Don't have an account? Create one"
              : 'Already have an account? Sign in'}
          </button>
        </div>

        {/* Quick Testing Provisioning Shortcuts */}
        <div className="mt-6 pt-4 border-t border-surface-border">
          <span className="text-[11px] font-semibold text-slate-400 block mb-2 uppercase tracking-wider text-center">
            One-Click Test Accounts
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickProvision('user')}
              disabled={loading}
              className="px-2.5 py-2 rounded-lg bg-midnight-900 hover:bg-surface-elevated border border-surface-border text-[11px] font-medium text-slate-300 flex items-center justify-center space-x-1.5 transition-colors"
            >
              <IconCheck className="w-3 h-3 text-cyan-400" />
              <span>Standard User</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickProvision('admin')}
              disabled={loading}
              className="px-2.5 py-2 rounded-lg bg-coral-500/10 hover:bg-coral-500/20 border border-coral-500/30 text-[11px] font-medium text-coral-300 flex items-center justify-center space-x-1.5 transition-colors"
            >
              <IconShield className="w-3 h-3 text-coral-400" />
              <span>Admin Role</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
