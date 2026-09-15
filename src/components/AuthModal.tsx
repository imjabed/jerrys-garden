import { useState, useEffect, type FormEvent } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Lock, 
  KeyRound, 
  ArrowRight, 
  CheckCircle2, 
  RefreshCw, 
  ShieldCheck, 
  Eye, 
  EyeOff,
  Sparkles,
  Loader2
} from 'lucide-react';
import { UserAccount } from '../types';
import { registerUser, loginUser, OWNER_CREDENTIALS, verifyAndLoginOwner } from '../services/storage';
import { apiRegisterCustomer, apiLoginCustomer } from '../services/api';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserAccount) => void;
  onRegisterSuccess: (user: UserAccount) => void;
  onOwnerLoginSuccess?: () => void;
}

export default function AuthModal({
  isOpen,
  onClose,
  onLoginSuccess,
  onRegisterSuccess,
  onOwnerLoginSuccess,
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'otp_verify'>('login');
  
  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // OTP Verification state (Code is sent to email only, never displayed on screen)
  const [enteredOtp, setEnteredOtp] = useState('');
  const [resendTimer, setResendTimer] = useState<number>(60);
  const [otpSentMessage, setOtpSentMessage] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Status & Notifications
  const [error, setError] = useState('');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Resend countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOpen && mode === 'otp_verify' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOpen, mode, resendTimer]);

  if (!isOpen) return null;

  // Send real OTP to user's email via backend Gmail SMTP service
  const handleSendOtp = async (targetEmail: string, targetName: string) => {
    setError('');
    setIsSendingOtp(true);
    try {
      const response = await fetch(`${API_URL}/api/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, name: targetName }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to dispatch verification code.');
      }

      setEnteredOtp('');
      setResendTimer(60);
      setOtpSentMessage(data.message || `A 6-digit verification code was emailed to ${targetEmail}. Please check your inbox or spam folder.`);
      setMode('otp_verify');
    } catch (err: any) {
      setError(err.message || 'Could not send verification email. Please check your email address.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // 1. Submit Registration Form -> Request OTP email
  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!regName.trim() || !regEmail.trim() || !regPhone.trim()) {
      setError('Please provide your name, email, and mobile number.');
      return;
    }

    if (regPassword.length < 4) {
      setError('Please create a password of at least 4 characters.');
      return;
    }

    await handleSendOtp(regEmail.trim(), regName.trim());
  };

  // 2. Submit OTP Verification -> Verify via backend, create account, and redirect to password login
  const handleVerifyOtpSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!enteredOtp.trim() || enteredOtp.trim().length !== 6) {
      setError('Please enter the complete 6-digit code received in your email.');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const response = await fetch(`${API_URL}/api/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: regEmail.trim(),
          otp: enteredOtp.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Invalid verification code.');
      }

      // Register user in local storage
      const newUser = registerUser(
        regName.trim(),
        regEmail.trim(),
        regPhone.trim(),
        regAddress.trim(),
        regPassword
      );

      // Save to MongoDB Atlas collection 'customers'
      try {
        await apiRegisterCustomer({
          id: newUser.id,
          name: regName.trim(),
          email: regEmail.trim(),
          phone: regPhone.trim(),
          address: regAddress.trim(),
          password: regPassword,
          isVerified: true,
        });
      } catch (mongoErr) {
        console.warn('MongoDB customer sync warning:', mongoErr);
      }

      onRegisterSuccess(newUser);

      // Set success notice and redirect to login screen
      setSuccessNotice(`Email verified successfully! Your JericasGarden account is active. Please log in with your password.`);
      setLoginEmail(regEmail.trim());
      setLoginPassword('');
      setMode('login');
      setError('');
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please double check the code from your email.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // 3. Submit Login Form
  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const emailInput = loginEmail.trim().toLowerCase();
    const passwordInput = loginPassword.trim();

    if (!emailInput || !passwordInput) {
      setError('Please enter your email and password.');
      return;
    }

    // Check if this is the Owner logging in
    if (
      emailInput === OWNER_CREDENTIALS.email.toLowerCase() &&
      passwordInput === OWNER_CREDENTIALS.adminCode
    ) {
      verifyAndLoginOwner(emailInput, passwordInput);
      if (onOwnerLoginSuccess) {
        onOwnerLoginSuccess();
      }
      onClose();
      return;
    }

    setIsLoggingIn(true);
    try {
      // 1. First try verifying against MongoDB Atlas
      const mongoResult = await apiLoginCustomer(emailInput, passwordInput);

      if (mongoResult.connected) {
        if (mongoResult.success && mongoResult.user) {
          // Successfully verified in MongoDB Atlas!
          onLoginSuccess(mongoResult.user);
          onClose();
          return;
        } else {
          setError(mongoResult.error || 'Invalid email or password. Please verify and try again.');
          return;
        }
      }

      // 2. Fallback to client storage if MongoDB is not connected or offline
      const user = loginUser(emailInput, passwordInput);
      if (!user) {
        setError('Invalid email or password. If you are new, please sign up and verify your email.');
        return;
      }

      onLoginSuccess(user);
      onClose();
    } catch (err: any) {
      // Offline fallback
      const user = loginUser(emailInput, passwordInput);
      if (user) {
        onLoginSuccess(user);
        onClose();
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-8">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-rose-50/80 via-white to-amber-50/60 border-b border-stone-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Jerry's Garden</span>
            <h2 className="font-serif text-2xl font-bold text-stone-900 mt-0.5">
              {mode === 'login' && 'Sign In to Your Account'}
              {mode === 'register' && 'Create Customer Account'}
              {mode === 'otp_verify' && 'Verify Email with OTP'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector (only on login / register) */}
        {mode !== 'otp_verify' && (
          <div className="grid grid-cols-2 border-b border-stone-100 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`py-3 text-center border-b-2 transition-all cursor-pointer ${
                mode === 'login'
                  ? 'border-rose-600 text-rose-700 bg-rose-50/40 font-bold'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              Sign In with Password
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError('');
              }}
              className={`py-3 text-center border-b-2 transition-all cursor-pointer ${
                mode === 'register'
                  ? 'border-rose-600 text-rose-700 bg-rose-50/40 font-bold'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              Sign Up (OTP Verification)
            </button>
          </div>
        )}

        <div className="p-6 space-y-4">
          
          {/* Notifications */}
          {error && (
            <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl">
              {error}
            </div>
          )}

          {successNotice && (
            <div className="p-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* VIEW 1: LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3.5 rounded-xl bg-stone-900 hover:bg-rose-700 disabled:opacity-60 text-white font-semibold text-xs tracking-wider uppercase transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-rose-300" />
                    <span>Verifying with MongoDB Atlas...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError('');
                  }}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                >
                  Don't have an account? Sign up with OTP
                </button>
              </div>
            </form>
          )}

          {/* VIEW 2: SIGNUP FORM (Gathers details, then sends OTP) */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Your Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priyo Sen"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Email Address (for OTP verification) *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Mobile Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 98451 23456"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Choose a Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    minLength={4}
                    placeholder="At least 4 characters"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Delivery Address (optional)
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Street, Landmark, Berhampore..."
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSendingOtp}
                className="w-full py-3.5 rounded-xl bg-stone-900 hover:bg-rose-700 disabled:opacity-60 text-white font-semibold text-xs tracking-wider uppercase transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {isSendingOtp ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-rose-300" />
                    <span>Sending Code to Email...</span>
                  </>
                ) : (
                  <>
                    <span>Send OTP to Email</span>
                    <Mail className="w-4 h-4 text-rose-300" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* VIEW 3: OTP VERIFICATION STEP (Code sent to email only, never displayed on screen) */}
          {mode === 'otp_verify' && (
            <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
              
              {/* Email dispatch notice */}
              {otpSentMessage && (
                <div className="p-3.5 bg-rose-50/80 border border-rose-200 rounded-2xl text-xs text-rose-950 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-rose-900">
                    <Mail className="w-4 h-4 text-rose-600" />
                    <span>Verification Code Sent</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-stone-700">
                    A 6-digit verification code has been dispatched to <strong className="text-stone-900">{regEmail}</strong>. Please check your inbox or spam folder.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center justify-between">
                  <span>Enter 6-Digit Email Code *</span>
                  <span className="text-[10px] text-stone-400">JericasGarden Email Verification</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-5 h-5 text-rose-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="• • • • • •"
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-11 pr-4 py-3 text-lg tracking-[0.4em] font-mono font-bold rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-stone-50/50 text-center text-stone-900 placeholder:tracking-normal placeholder:font-normal placeholder:text-stone-400"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
                <span>Didn't receive email?</span>
                {resendTimer > 0 ? (
                  <span className="font-mono text-stone-400">Resend in {resendTimer}s</span>
                ) : (
                  <button
                    type="button"
                    disabled={isSendingOtp}
                    onClick={() => handleSendOtp(regEmail, regName)}
                    className="text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSendingOtp ? 'animate-spin' : ''}`} />
                    <span>{isSendingOtp ? 'Resending...' : 'Resend Code'}</span>
                  </button>
                )}
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={isVerifyingOtp}
                  className="w-full py-3.5 rounded-xl bg-stone-900 hover:bg-rose-700 disabled:opacity-60 text-white font-bold text-xs tracking-wider uppercase transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isVerifyingOtp ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-rose-300" />
                      <span>Verifying Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify Email & Activate Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError('');
                  }}
                  className="w-full py-2 text-xs text-stone-500 hover:text-stone-800 transition-colors text-center cursor-pointer"
                >
                  ← Edit Registration Details
                </button>
              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  );
}
