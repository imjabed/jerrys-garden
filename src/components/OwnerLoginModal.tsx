import { useState, type FormEvent } from 'react';
import { X, ShieldAlert, KeyRound, Mail, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';
import { OWNER_CREDENTIALS } from '../services/storage';

interface OwnerLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOwnerLoginSuccess: () => void;
}

export default function OwnerLoginModal({ isOpen, onClose, onOwnerLoginSuccess }: OwnerLoginModalProps) {
  const [email, setEmail] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedCode = adminCode.trim();

    if (
      normalizedEmail === OWNER_CREDENTIALS.email.toLowerCase() &&
      trimmedCode === OWNER_CREDENTIALS.adminCode
    ) {
      setSuccess(true);
      setTimeout(() => {
        onOwnerLoginSuccess();
        onClose();
      }, 700);
    } else {
      setError(
        'Access Denied. Invalid authorized store owner credentials or secret admin code.'
      );
    }
  };

  const handleQuickFillDemo = () => {
    setEmail(OWNER_CREDENTIALS.email);
    setAdminCode(OWNER_CREDENTIALS.adminCode);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-8">
        
        {/* Top Security Banner */}
        <div className="p-6 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400">
                Restricted Access
              </span>
              <h2 className="font-serif text-xl font-bold">
                Owner Portal Verification
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-white rounded-full hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informative Notice */}
        <div className="px-6 py-3 bg-amber-50 border-b border-amber-100 flex items-start gap-2.5 text-xs text-amber-900">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p className="leading-snug">
            Protected area for <strong>Jerry's Garden</strong> management. Customers cannot switch to owner mode.
          </p>
        </div>

        {/* Verification Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 text-xs text-red-800 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Identity Verified. Opening Owner Dashboard...</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Authorized Owner Email *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder="Enter authorized owner email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Secret Admin Code *
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                placeholder="Enter secret code..."
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 bg-white"
              />
            </div>
          </div>

          {/* Quick Demo Helper Button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleQuickFillDemo}
              className="text-[11px] text-stone-500 hover:text-stone-800 underline font-medium cursor-pointer"
            >
              Fill Authorized Credentials (Demo)
            </button>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={success}
              className="w-full py-3.5 rounded-xl bg-stone-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>Verify & Access Owner Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
