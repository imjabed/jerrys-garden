import { useState, type FormEvent } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { ownerLogin } from '../services/api';

interface OwnerLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOwnerLoginSuccess: () => void;
}

export default function OwnerLoginModal({ isOpen, onClose, onOwnerLoginSuccess }: OwnerLoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (!isOpen) return null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await ownerLogin(email.trim(), password, otp.trim());
      onOwnerLoginSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Unable to sign in.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-md flex items-center justify-center p-5" role="dialog" aria-modal="true">
      <div className="w-full max-w-md relative bg-[#FAF8F5] p-9 sm:p-12 shadow-2xl">
        <button aria-label="Close" className="absolute top-5 right-5 text-stone-500 hover:text-stone-900" onClick={onClose}><X size={20} /></button>
        <p className="text-[10px] tracking-[0.3em] uppercase text-stone-500">Jame Bouquets</p>
        <h2 className="font-serif text-4xl font-normal text-stone-900 mt-5 mb-2">Welcome back.</h2>
        <p className="text-stone-500 text-sm mb-10">Sign in to your atelier.</p>
        <form className="space-y-5" onSubmit={submit}>
          <label className="block text-[11px] text-stone-600 uppercase tracking-wider">Email
            <input required type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} className="mt-2 block w-full rounded-none bg-transparent border-b border-stone-300 py-3 outline-none focus:border-stone-900 text-sm text-stone-900" />
          </label>
          <label className="block text-[11px] text-stone-600 uppercase tracking-wider">Password
            <input required type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} className="mt-2 block w-full rounded-none bg-transparent border-b border-stone-300 py-3 outline-none focus:border-stone-900 text-sm text-stone-900" />
          </label>
          <label className="block text-[11px] text-stone-600 uppercase tracking-wider">Authenticator code (if enabled)
            <input type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6}
              value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              className="mt-2 block w-full rounded-none bg-transparent border-b border-stone-300 py-3 outline-none focus:border-stone-900 text-sm text-stone-900" />
          </label>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <button type="submit" disabled={busy} className="w-full bg-stone-900 text-white px-6 py-4 text-xs tracking-widest uppercase flex items-center justify-center gap-3 hover:bg-stone-700 disabled:opacity-50">
            {busy ? 'Signing in...' : 'Sign in'} <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
