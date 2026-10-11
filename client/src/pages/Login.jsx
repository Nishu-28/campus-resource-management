import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  HiOutlineEnvelope,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineShieldCheck,
  HiOutlineArrowRight,
  HiOutlineCalendarDays,
  HiOutlineClipboardDocumentCheck,
  HiOutlineWrench,
} from 'react-icons/hi2';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Login successful');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* Top institutional bar */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center px-6 shrink-0">
        <div className="flex items-center gap-3">
          <img
            src="/srm-logo.png"
            alt="SRM Institute of Science & Technology"
            className="h-9 w-auto object-contain"
          />
          <div className="hidden sm:block pl-3 border-l border-slate-200 leading-tight">
            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500 font-semibold">
              SRM Institute of Science & Technology
            </p>
            <p className="text-[11px] text-slate-400">Kattankulathur Campus</p>
          </div>
        </div>
        <div className="ml-auto hidden md:flex items-center gap-2 text-[11px] text-slate-500">
          <HiOutlineShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Secure sign-in</span>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 grid lg:grid-cols-[1.05fr_1fr]">
        {/* Brand panel */}
        <div className="hidden lg:flex relative bg-[#0f2d57] text-white p-14 xl:p-20 flex-col justify-between overflow-hidden">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0f2d57] via-[#143a6e] to-[#1e4d8c]" />
          {/* Hairline grid */}
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
              backgroundSize: '64px 64px',
            }}
          />
          {/* Soft accent */}
          <div className="absolute -bottom-40 -right-32 w-[32rem] h-[32rem] rounded-full bg-[#2a6fc4]/30 blur-3xl" />

          <div className="relative z-10 max-w-lg">
            <p className="text-[11px] uppercase tracking-[0.22em] text-blue-200/70 font-semibold mb-5">
              Campus Resource Management Portal
            </p>
            <h1 className="text-[2.5rem] xl:text-[2.85rem] font-semibold leading-[1.1] tracking-tight">
              A unified system for campus facility &amp; resource access.
            </h1>
            <p className="mt-5 text-[15px] leading-relaxed text-blue-100/80 max-w-md">
              Authorized portal for SRM students, faculty and administrative staff
              to request, approve and manage shared campus resources.
            </p>

            <div className="mt-12 grid grid-cols-3 gap-5 max-w-lg">
              {[
                { icon: HiOutlineCalendarDays, label: 'Resource Booking', sub: 'Halls, labs & equipment' },
                { icon: HiOutlineClipboardDocumentCheck, label: 'Approval Workflow', sub: 'HOD & admin reviews' },
                { icon: HiOutlineWrench, label: 'Maintenance', sub: 'Report & track issues' },
              ].map((m) => (
                <div key={m.label} className="border-t border-white/15 pt-4">
                  <m.icon className="w-5 h-5 text-blue-200/90 mb-2.5" />
                  <p className="text-[13px] font-semibold text-white leading-tight">
                    {m.label}
                  </p>
                  <p className="text-[11px] text-blue-200/70 mt-1 leading-snug">
                    {m.sub}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between text-[11px] text-blue-200/60">
            <p>&copy; 2026 SRM Institute of Science &amp; Technology</p>
            <p className="hidden xl:block">v1.0 &middot; Production</p>
          </div>
        </div>

        {/* Form panel */}
        <div className="flex items-center justify-center bg-white p-6 sm:p-10">
          <div className="w-full max-w-[400px]">
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center gap-3 mb-10">
              <img
                src="/srm-logo.png"
                alt="SRM"
                className="h-10 w-auto object-contain"
              />
              <p className="text-sm font-semibold text-[#1e4d8c] leading-tight">
                Campus Resource<br />Management Portal
              </p>
            </div>

            <div className="mb-8">
              <h2 className="text-[1.65rem] font-semibold text-slate-900 tracking-tight">
                Sign in to your account
              </h2>
              <p className="text-sm text-slate-500 mt-2">
                Use your SRM credentials to continue.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-[12px] font-semibold text-slate-700 mb-1.5 tracking-wide"
                >
                  Email address
                </label>
                <div className="relative">
                  <HiOutlineEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400 pointer-events-none" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="w-full pl-10 pr-3 h-11 bg-white border border-slate-300 rounded-md text-[14px] text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#2a6fc4]/25 focus:border-[#2a6fc4] outline-none transition"
                    placeholder="firstname.lastname@srmist.edu.in"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="password"
                    className="block text-[12px] font-semibold text-slate-700 tracking-wide"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => toast('Please contact your administrator to reset your password.', { icon: 'ℹ️' })}
                    className="text-[12px] font-medium text-[#1e4d8c] hover:text-[#2a6fc4] transition"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400 pointer-events-none" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="w-full pl-10 pr-11 h-11 bg-white border border-slate-300 rounded-md text-[14px] text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#2a6fc4]/25 focus:border-[#2a6fc4] outline-none transition"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <HiOutlineEyeSlash className="w-[18px] h-[18px]" />
                    ) : (
                      <HiOutlineEye className="w-[18px] h-[18px]" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group w-full h-11 bg-[#1e4d8c] text-white rounded-md font-semibold text-[14px] tracking-wide hover:bg-[#1a4480] active:bg-[#163a6e] disabled:opacity-60 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <HiOutlineArrowRight className="w-4 h-4 opacity-80 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-8 pt-6 border-t border-slate-200 text-[11px] text-slate-400 leading-relaxed">
              By signing in you acknowledge the SRM IT acceptable-use policy.
              Unauthorized access is prohibited and may be monitored.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
