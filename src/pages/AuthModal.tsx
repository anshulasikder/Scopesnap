import React, { useState } from 'react';
import { X, Lock, Mail, Shield, User, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import type { UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('alex@alexmorgandesign.com');
  const [password, setPassword] = useState('••••••••••••');
  const [displayName, setDisplayName] = useState('Alex Morgan');
  const [role, setRole] = useState<'FREELANCER' | 'CLIENT'>('FREELANCER');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Simulate authenticating while checking credentials
    setTimeout(() => {
      setLoading(false);
      if (mode === 'forgot') {
        setMessage('Password reset instructions dispatched to your email.');
        return;
      }

      const user: UserProfile = {
        id: role === 'FREELANCER' ? 'usr_alex_demo' : 'usr_elena_client',
        email,
        displayName: displayName || (role === 'FREELANCER' ? 'Alex Morgan' : 'Elena Reyes'),
        role,
        onboardingCompleted: true,
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem('scopesnap_user', JSON.stringify(user));
      onLoginSuccess(user);
      onClose();
    }, 400);
  };

  const handleQuickDemoAlex = () => {
    const user: UserProfile = {
      id: 'usr_alex_demo',
      email: 'alex@alexmorgandesign.com',
      displayName: 'Alex Morgan',
      role: 'FREELANCER',
      onboardingCompleted: true,
      createdAt: '2026-11-01T08:00:00Z',
    };
    localStorage.setItem('scopesnap_user', JSON.stringify(user));
    onLoginSuccess(user);
    onClose();
  };

  const handleQuickDemoElena = () => {
    const user: UserProfile = {
      id: 'usr_elena_client',
      email: 'elena@ateliermonolith.com',
      displayName: 'Elena Reyes',
      role: 'CLIENT',
      onboardingCompleted: true,
      createdAt: '2026-11-01T08:00:00Z',
    };
    localStorage.setItem('scopesnap_user', JSON.stringify(user));
    onLoginSuccess(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-[#18201e] border border-stone-700/80 rounded-2xl p-6 shadow-2xl space-y-5 text-left">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-[#D9F36A]" />
            <h3 className="font-heading font-bold text-xl text-[#F4F1E8]">
              {mode === 'login' ? 'Sign In to ScopeSnap' : mode === 'register' ? 'Create Your Account' : 'Reset Password'}
            </h3>
          </div>
          <p className="text-xs font-mono text-stone-400">
            Secure session persistence & user-scoped access control
          </p>
        </div>

        {/* Quick Demo Sign-In Buttons */}
        <div className="bg-[#121716] p-3 rounded-xl border border-stone-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-stone-400">
            <span>Official Synthetic Demo Logins:</span>
            <span className="text-[10px] text-[#D9F36A]">1-Click Access</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleQuickDemoAlex}
              className="px-2.5 py-1.5 rounded-lg border border-[#648D83]/40 bg-[#152e24]/40 hover:bg-[#152e24] text-xs font-mono text-stone-200 transition text-left cursor-pointer"
            >
              <div className="font-semibold text-[#D9F36A]">Alex Morgan</div>
              <div className="text-[10px] text-stone-400">Freelancer (Demo)</div>
            </button>

            <button
              type="button"
              onClick={handleQuickDemoElena}
              className="px-2.5 py-1.5 rounded-lg border border-stone-700 bg-stone-800/40 hover:bg-stone-800 text-xs font-mono text-stone-200 transition text-left cursor-pointer"
            >
              <div className="font-semibold text-amber-300">Elena Reyes</div>
              <div className="text-[10px] text-stone-400">Client (Atelier)</div>
            </button>
          </div>
        </div>

        {message && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-[#152e24] border border-[#D9F36A]/30 text-xs text-[#D9F36A] font-mono">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
          {mode === 'register' && (
            <div>
              <label className="block text-stone-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#121716] border border-stone-700 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-[#D9F36A]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-stone-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@domain.com"
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#121716] border border-stone-700 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-[#D9F36A]"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-stone-300">Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[11px] text-[#648D83] hover:text-[#D9F36A] transition cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#121716] border border-stone-700 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-[#D9F36A]"
                />
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-stone-300 mb-1">Primary Role</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('FREELANCER')}
                  className={`py-2 rounded-lg border text-center transition cursor-pointer ${
                    role === 'FREELANCER'
                      ? 'bg-[#1e2624] border-[#D9F36A] text-[#D9F36A]'
                      : 'border-stone-800 text-stone-400'
                  }`}
                >
                  Freelancer
                </button>
                <button
                  type="button"
                  onClick={() => setRole('CLIENT')}
                  className={`py-2 rounded-lg border text-center transition cursor-pointer ${
                    role === 'CLIENT'
                      ? 'bg-[#1e2624] border-[#D9F36A] text-[#D9F36A]'
                      : 'border-stone-800 text-stone-400'
                  }`}
                >
                  Client
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-[#D9F36A] text-[#151C1B] font-semibold text-xs hover:bg-[#cbf046] transition cursor-pointer shadow flex items-center justify-center gap-1.5"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>{mode === 'login' ? 'Sign In' : mode === 'register' ? 'Register Account' : 'Send Instructions'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Mode Switch */}
        <div className="text-center text-xs font-mono text-stone-400 pt-2 border-t border-stone-800">
          {mode === 'login' ? (
            <p>
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-[#D9F36A] hover:underline cursor-pointer"
              >
                Sign Up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-[#D9F36A] hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
