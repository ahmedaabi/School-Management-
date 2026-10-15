import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import {
  GraduationCap,
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  KeyRound,
  School,
  Building2,
} from 'lucide-react';

interface LoginPageProps {
  onSuccessRedirect?: (role: Role) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccessRedirect }) => {
  const { login, resetPassword, availableRoles, switchRole } = useAuth();

  const [emailOrRole, setEmailOrRole] = useState('e.vance@staugustine.edu');
  const [password, setPassword] = useState('AcademyAdmin2025!');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Forgot password state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccessMessage, setForgotSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const result = await login(emailOrRole, password, rememberMe);
      if (result.success && result.role) {
        if (onSuccessRedirect) {
          onSuccessRedirect(result.role);
        }
      } else {
        setErrorMessage(result.error || 'Authentication failed. Please verify credentials.');
      }
    } catch {
      setErrorMessage('Unexpected connection error during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoSelect = async (roleObj: (typeof availableRoles)[0]) => {
    setEmailOrRole(roleObj.email);
    setPassword('AcademyPortal2025!');
    setErrorMessage(null);
    setLoading(true);
    try {
      switchRole(roleObj.role);
      if (onSuccessRedirect) {
        onSuccessRedirect(roleObj.role);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotSuccessMessage(null);
    try {
      const res = await resetPassword(forgotEmail);
      if (res.success) {
        setForgotSuccessMessage(res.message);
      } else {
        setErrorMessage(res.message);
      }
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div id="login-page-container" className="min-h-screen bg-slate-100 flex flex-col justify-between selection:bg-navy-700 selection:text-white">
      {/* Top institution bar */}
      <header className="w-full bg-slate-900 border-b border-slate-800 text-slate-300 py-3 px-6 sm:px-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-serif font-bold text-sm shadow-sm">
            SA
          </div>
          <div>
            <span className="font-serif tracking-wide text-white text-sm sm:text-base font-semibold block leading-tight">
              St. Augustine International Academy
            </span>
            <span className="text-[11px] text-slate-400 font-sans tracking-wider uppercase block">
              Enterprise Academic Management & AI Portal
            </span>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Cloud Cluster Active
          </span>
          <span className="text-slate-700">|</span>
          <span>Academic Term: 2024–2025 (Term 2)</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Left Hero Brand Panel */}
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
            {/* Subtle background decoration */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-indigo-500/10 pointer-events-none blur-2xl"></div>
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-emerald-500/10 pointer-events-none blur-2xl"></div>

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-emerald-400 text-xs font-medium mb-6">
                <ShieldCheck className="w-3.5 h-3.5" />
                Role-Based Academic Security
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight mb-4">
                Unified Portal for Faculty, Families & Students
              </h1>
              <p className="text-slate-300 text-sm leading-relaxed font-sans">
                Access your personalized workspace with institutional governance, real-time classroom registries, academic records, and secure student telemetry.
              </p>
            </div>

            <div className="relative z-10 space-y-4 my-8">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 shrink-0">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Teacher & Student Desks</h4>
                  <p className="text-[12px] text-slate-300">Gradebooks, syllabus schedules, assignments & attendance rosters.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Family & Bursar Link</h4>
                  <p className="text-[12px] text-slate-300">Itemized tuition receipts, verified attendance calendar & leave tickets.</p>
                </div>
              </div>
            </div>

            <div className="relative z-10 border-t border-slate-700/60 pt-4 flex items-center justify-between text-xs text-slate-400">
              <span>Security Standard ISO/IEC 27001</span>
              <span>Encrypted Session</span>
            </div>
          </div>

          {/* Right Authentication Form Panel */}
          <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-serif">
                    Sign In to Your Account
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Enter institutional credentials or choose a pre-configured role profile.
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                  <Lock className="w-5 h-5 text-slate-700" />
                </div>
              </div>

              {errorMessage && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3 animate-in fade-in">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="leading-snug">{errorMessage}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Institutional Email / Role ID
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="login-email-input"
                      type="text"
                      required
                      value={emailOrRole}
                      onChange={(e) => setEmailOrRole(e.target.value)}
                      placeholder="e.g. e.vance@staugustine.edu or principal"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Security Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="login-password-input"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your confidential password"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="text-xs text-slate-600">Keep session authenticated for 24 hours</span>
                  </label>
                </div>

                <button
                  id="login-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-medium text-sm transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      <span>Verifying Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>Authenticate & Enter Portal</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Quick Demo Switcher Section */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Instant Role Tester & Demo Access
                </span>
                <span className="text-[11px] text-slate-400">Click any role to test portal</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {availableRoles.map((roleObj) => (
                  <button
                    key={roleObj.role}
                    type="button"
                    onClick={() => handleQuickDemoSelect(roleObj)}
                    className="p-2.5 text-left rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all group relative"
                  >
                    <div className="text-[12px] font-semibold text-slate-800 group-hover:text-indigo-700 flex items-center justify-between">
                      <span className="truncate">{roleObj.label.split('(')[0]}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">
                      {roleObj.email}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Institutional Footer */}
      <footer className="w-full bg-slate-200/70 border-t border-slate-300/80 py-3 px-6 text-center text-xs text-slate-500 font-sans">
        © 2025 St. Augustine International Academy. All rights reserved. Role-Based Access Enforced at Service Layer.
      </footer>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 sm:p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5 text-slate-900 font-semibold text-base font-serif">
                <KeyRound className="w-5 h-5 text-indigo-600" />
                Reset Portal Access Password
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotSuccessMessage(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {forgotSuccessMessage ? (
              <div className="space-y-4 py-2">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="leading-snug">{forgotSuccessMessage}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="w-full py-2.5 px-4 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Enter your registered institutional email address. Our access controller will generate a single-use verification token to reset your password.
                </p>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Registered Email
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="e.g. a.pendelton@staugustine.edu"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-1.5"
                  >
                    {forgotLoading ? 'Processing...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
