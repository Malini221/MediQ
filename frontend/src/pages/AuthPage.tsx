import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { AuthBackground } from '../components/auth/AuthBackground';
import { cn } from '../lib/utils';
import { CheckCircle2, Loader2 } from '@/components/common/Icon';

interface AuthPageProps {
  initialMode?: 'signin' | 'register';
}

export function AuthPage({ initialMode = 'signin' }: AuthPageProps) {
  const [mode, setMode] = useState<'signin' | 'register'>(initialMode);
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountType, setAccountType] = useState<'caregiver' | 'patient'>('caregiver');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [submitted, setSubmitted] = useState(false);

  const [speech, setSpeech] = useState({ 
    text: 'Syncing live patient telemetry across your multidisciplinary team. Access handovers instantly during rounds`', 
    icon: 'pulse' 
  });
  const [speechKey, setSpeechKey] = useState(0); 
  const [isPortraitFocused, setIsPortraitFocused] = useState(false);

  const updateSpeech = (icon: string, text: string) => {
    setSpeech({ icon, text });
    setSpeechKey(prev => prev + 1);
  };

  useEffect(() => {
    setError('');
  }, [mode]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (mode === 'register') {
      if (password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setLoading(true);
    updateSpeech('shield', 'Handshake authorized. Establishing secure channel...');

    if (mode === 'signin') {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          setError('Invalid email or password.');
        } else if (signInError.message.includes('Email not confirmed')) {
          setError('Please verify your email address before signing in.');
        } else {
          setError(signInError.message || 'An error occurred during sign in.');
        }
        setLoading(false);
        updateSpeech('pulse', 'Authentication failed. Please check credentials.');
      }
    } else {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            system_role: accountType === 'patient' ? 'patient' : 'family_caregiver',
          }
        }
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        updateSpeech('pulse', 'Registration failed. Please check your details.');
        return;
      }

      setSubmitted(true);
      setLoading(false);
    }
  };

  const SpeechIcon = () => {
    switch (speech.icon) {
      case 'pulse': 
        return (
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
        );
      case 'search': 
        return (
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        );
      case 'shield': 
        return (
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
        );
      case 'check': 
        return (
          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5"></path>
          </svg>
        );
      case 'user': 
        return (
          <svg className="w-4 h-4 text-mediq-blue" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        );
      default: 
        return (
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
        );
    }
  };

  if (submitted && mode === 'register') {
    return (
      <div className="min-h-screen w-full bg-transparent text-slate-800 antialiased relative font-sans flex flex-col justify-center px-4 py-12">
        <AuthBackground />
        <div className="relative z-10 w-full max-w-md bg-white rounded-[24px] shadow-xl shadow-mediq-blue/10 border border-slate-200 p-8 md:p-10 text-center animate-in fade-in zoom-in-95 duration-500 mx-auto">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-6">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-slate-900 mb-3">Check your email</h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-8">
            Your MediQ account has been created. We've sent a verification link to <span className="font-medium text-slate-900">{email}</span>. Please verify your email before signing in.
          </p>
          <button 
            onClick={() => {
              setSubmitted(false);
              setMode('signin');
            }} 
            className="inline-flex w-full bg-white border border-slate-200 text-slate-900 py-3.5 rounded-full font-medium hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-mediq-blue/10 transition-all justify-center items-center shadow-sm"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-transparent text-slate-800 antialiased relative selection:bg-mediq-blue selection:text-white font-sans flex flex-col justify-between">
      <AuthBackground />

      {/* BEGIN: Perfectly Centered Main Authentication Split Container */}
      <main className="relative z-10 w-full min-h-[calc(100vh-140px)] flex items-center justify-center py-6 px-4 sm:px-6">
        <div className="w-full max-w-[1180px] bg-white rounded-[28px] shadow-2xl shadow-blue-950/60 overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-white/30 backdrop-blur-sm">
          
          {/* ========================================== */}
          {/* LEFT PANEL: Authentication Form           */}
          {/* ========================================== */}
          <section className="lg:col-span-6 bg-white p-7 sm:p-10 lg:p-12 flex flex-col justify-between order-2 lg:order-1" data-purpose="auth-form-panel">
            <div>
              <h2 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 tracking-tight" id="form-heading">
                {mode === 'signin' ? 'Sign in to console' : 'Create Account'}
              </h2>
              <p className="text-sm text-slate-500 mt-1">Access secure patient handovers and live telemetry.</p>
              
              {/* Segmented Tab Switch with active indicator */}
              <div className="mt-6 p-1 bg-slate-100 rounded-xl flex items-center border border-slate-200/70 text-xs font-semibold relative">
                <button 
                  type="button"
                  onClick={() => { setMode('signin'); updateSpeech('user', 'Welcome back, Caregiver. Enter your clinical credentials to begin.'); }}
                  className={cn(
                    "flex-1 py-2.5 rounded-lg transition-all text-center cursor-pointer font-medium",
                    mode === 'signin' ? "bg-white text-slate-900 shadow-sm font-bold" : "text-slate-700 hover:text-slate-900"
                  )}
                >
                  Sign In
                </button>
                <button 
                  type="button"
                  onClick={() => { setMode('register'); updateSpeech('user', 'New clinical team member onboarding. Setting up provider identity.'); }}
                  className={cn(
                    "flex-1 py-2.5 rounded-lg transition-all text-center cursor-pointer font-medium",
                    mode === 'register' ? "bg-white text-slate-900 shadow-sm font-bold" : "text-slate-700 hover:text-slate-900"
                  )}
                >
                  Create Account
                </button>
              </div>

              {mode === 'register' && (
                <div className="mt-6">
                  <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">ACCOUNT TYPE</p>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200/70">
                    <button type="button" onClick={() => setAccountType('caregiver')} className={cn('py-2.5 rounded-lg text-sm font-semibold transition-all', accountType === 'caregiver' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500')}>Caregiver</button>
                    <button type="button" onClick={() => setAccountType('patient')} className={cn('py-2.5 rounded-lg text-sm font-semibold transition-all', accountType === 'patient' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500')}>Patient</button>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Patient accounts open the patient-facing MediQ workspace after verification.</p>
                </div>
              )}

              {/* Auth Form Elements */}
              <form onSubmit={handleAuth} className="mt-6 space-y-4">
                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 rounded-xl border border-red-200 text-center animate-in fade-in zoom-in-95">
                    {error}
                  </div>
                )}

                {mode === 'register' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="name-input">
                      FULL NAME
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                      </div>
                      <input 
                        className="block w-full pl-10 pr-4 py-3 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-mediq-blue focus:border-mediq-blue transition-all font-sans" 
                        id="name-input" 
                        placeholder="Jane Doe" 
                        required 
                        type="text" 
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        onFocus={() => {
                          updateSpeech('user', 'Setting up caregiver identity record.');
                          setIsPortraitFocused(true);
                        }}
                        onBlur={() => setIsPortraitFocused(false)}
                      />
                    </div>
                  </div>
                )}

                {/* Email Input Field */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="email-input">
                    WORK EMAIL ADDRESS
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <rect height="16" rx="2" width="20" x="2" y="4"></rect>
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                      </svg>
                    </div>
                    <input 
                      className="block w-full pl-10 pr-4 py-3 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-mediq-blue focus:border-mediq-blue transition-all font-sans" 
                      id="email-input" 
                      placeholder="yourname@hospital.org" 
                      required 
                      type="email" 
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (e.target.value.includes('@') && e.target.value.includes('.')) {
                          updateSpeech('check', 'Institutional domain recognized. Please proceed with your secure key.');
                        } else if (e.target.value.length > 4) {
                          updateSpeech('pulse', 'Typing detected... validating clinician identity record.');
                        }
                      }}
                      onFocus={() => {
                        updateSpeech('search', 'Verifying institutional directory... Enter your clinical hospital mail.');
                        setIsPortraitFocused(true);
                      }}
                      onBlur={() => setIsPortraitFocused(false)}
                    />
                  </div>
                </div>

                {/* Password Input Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider" htmlFor="password-input">
                      PASSWORD
                    </label>
                    {mode === 'signin' && (
                      <span className="text-xs font-semibold text-mediq-blue hover:text-blue-700 transition-colors opacity-50 cursor-not-allowed">
                        Forgot password?
                      </span>
                    )}
                  </div>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <rect height="11" rx="2" ry="2" width="18" x="3" y="11"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                    </div>
                    <input 
                      className="block w-full pl-10 pr-11 py-3 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-mediq-blue focus:border-mediq-blue transition-all font-mono" 
                      id="password-input" 
                      placeholder="••••••••" 
                      required 
                      type={showPassword ? "text" : "password"} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => {
                        updateSpeech('shield', 'Secured 256-bit stream active. Workstation privacy enabled.');
                        setIsPortraitFocused(true);
                      }}
                      onBlur={() => setIsPortraitFocused(false)}
                    />
                    {/* Interactive Toggle Password Visibility Button */}
                    <button 
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors" 
                      type="button"
                      onClick={() => {
                        setShowPassword(!showPassword);
                        updateSpeech('shield', !showPassword ? 'Password displayed. Ensure workstation privacy in common areas.' : 'Password masked for clinical privacy.');
                      }}
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {mode === 'register' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <rect height="11" rx="2" ry="2" width="18" x="3" y="11"></rect>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                      </div>
                      <input 
                        className="block w-full pl-10 pr-11 py-3 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-mediq-blue focus:border-mediq-blue transition-all font-mono" 
                        placeholder="Confirm your password" 
                        required 
                        type={showPassword ? "text" : "password"} 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onFocus={() => {
                          updateSpeech('shield', 'Confirming password security.');
                          setIsPortraitFocused(true);
                        }}
                        onBlur={() => setIsPortraitFocused(false)}
                      />
                    </div>
                  </div>
                )}

                {/* Keep Session Active Checkbox */}
                {mode === 'signin' && (
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input className="w-4 h-4 rounded text-mediq-blue border-slate-300 focus:ring-mediq-blue transition-all cursor-pointer" type="checkbox" defaultChecked />
                      <span className="text-xs text-slate-600 font-medium">Stay logged in for this shift (12 hours)</span>
                    </label>
                  </div>
                )}

                {/* Primary Action Button */}
                <button 
                  className="w-full mt-3 py-3.5 px-6 rounded-xl bg-gradient-to-r from-mediq-blue to-[#0045d1] hover:from-[#0045d1] hover:to-[#062fe0] active:scale-[0.99] text-white font-heading font-bold text-sm shadow-lg shadow-mediq-blue/35 hover:shadow-mediq-blue/50 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-70 disabled:hover:translate-y-0 disabled:active:scale-100" 
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <span>{mode === 'signin' ? 'Access Clinical Console →' : 'Register Workstation →'}</span>
                  )}
                </button>
              </form>

              {/* SSO / Federated Access Separator */}
              <div className="relative my-6 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <span className="relative bg-white px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  OR AUTHENTICATE VIA
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
              </div>

              {/* Footer Switch Link */}
              <div className="mt-8 pt-5 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-500">
                  {mode === 'signin' ? "Don't have an institutional account?" : "Already have an institutional account?"}
                  <button 
                    className="font-bold text-mediq-blue hover:text-blue-700 hover:underline transition-colors ml-1 cursor-pointer" 
                    type="button"
                    onClick={() => {
                      setMode(mode === 'signin' ? 'register' : 'signin');
                      updateSpeech('user', mode === 'signin' ? 'New clinical team member onboarding. Setting up provider identity.' : 'Welcome back. Sign in to your workspace.');
                    }}
                  >
                    {mode === 'signin' ? 'Create Account' : 'Sign In'}
                  </button>
                </p>
              </div>

            </div>
          </section>

          {/* ========================================== */}
          {/* RIGHT PANEL: High-Fidelity Medical Hero Visual */}
          {/* ========================================== */}
          <section className="lg:col-span-6 bg-gradient-to-br from-[#1A5CFF] via-[#0b4ae2] to-[#072d9e] text-white p-7 sm:p-10 lg:p-11 flex flex-col justify-between relative overflow-hidden order-1 lg:order-2">
            {/* Ambient decorative geometry & subtle lines */}
            <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full border border-white/10 pointer-events-none"></div>
            <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full border border-white/10 pointer-events-none"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
            
            {/* Right Top: Badging & Headline */}
            <div className="relative z-10">
              <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-heading font-bold tracking-tight text-white leading-[1.12]">
                Care information,<br />
                <span className="text-blue-200">connected.</span>
              </h1>
              <p className="mt-3 text-blue-100/90 text-sm sm:text-base leading-relaxed max-w-lg font-normal">
                Syncing live patient telemetry across your multidisciplinary team. Access handovers instantly during rounds
              </p>
            </div>

            {/* Banner: Dynamic Status Banner with Crisp SVG Icon */}
            <div className="relative z-20 my-4 h-14 flex items-center">
              <div key={speechKey} className="bubble-react bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 flex items-center gap-3 w-fit pr-5">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <SpeechIcon />
                </div>
                <p className="text-xs font-medium text-white/95 max-w-[240px] leading-snug">
                  {speech.text}
                </p>
              </div>
            </div>

            {/* Right Visual: Clean 3D Clinical Character Card */}
            <div className="relative z-10 my-1 flex items-center justify-center">
              <div className="relative w-full max-w-[380px] flex items-center justify-center">
                
                {/* Radar Telemetry Pulse Ring */}
                <div className="absolute inset-0 rounded-3xl border-2 border-cyan-300/30 radar-ring pointer-events-none"></div>
                
                {/* Portrait Card Wrapper with Clean Fitting Container */}
                <div className="relative w-72 h-80 sm:w-80 sm:h-92 rounded-3xl overflow-hidden border border-white/30 shadow-2xl bg-[#3668e8] backdrop-blur-sm group flex items-center justify-center">
                  {/* Studio Depth Background Gradient matching image palette */}
                  <div className="absolute inset-0 bg-gradient-to-b from-[#4975f5] via-[#3363e0] to-[#1a44b8]"></div>
                  
                  {/* Replaced Doctor Image with Perfect Object-Cover & Clear Framing */}
                  <img 
                    alt="MEDIQ Care Specialist Character" 
                    className={cn(
                      "relative z-10 w-full h-full object-cover object-center transition-transform duration-700 ease-out",
                      isPortraitFocused ? "scale-105" : "scale-100"
                    )}
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCv5oBEULxDuLB5ynGK5sv3amRjXQzJDiM9EROQ05f5-DBQQNpf9UgreKVJwYtMPBp74jwe4XFGd0A17vUWrimAAAgQgNZVuxrq_mF82EoAy_9-vJ5bo1DJkEXcLhSuPAkCqx_IbO1kWguNP1rVnuD7VF1VTYc5pVtCNQ7OT1JT7PRSlKLnISOLKj1xso7nwbQEUvjjWJMe4Yk_r0SaX5NRHsQvj0TOomOixWFKNaUQJytGE3dEtV0GXF8-lYE9SwdnVA" 
                  />
                  
                  {/* Elegant Lower Status Bar Overlay */}
                  <div className="absolute inset-x-0 bottom-0 z-20 h-24 bg-gradient-to-t from-blue-950/90 via-blue-950/40 to-transparent flex items-end p-4">
                    <div className="text-xs text-blue-100 flex items-center justify-between w-full">
                      <span className="font-medium text-[11px] tracking-wide text-white/95 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-cyan-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                          <polyline points="9 22 9 12 15 12 15 22"></polyline>
                        </svg>
                        Hospital Command Center
                      </span>
                    </div>
                  </div>
                </div>

                {/* FLOATING BADGE: Board Certified Specialist with Crisp SVG */}
                <div className="absolute -top-3 -left-3 sm:-left-6 bg-white/95 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 shadow-xl border border-white/80 flex items-center gap-2.5 float-slow z-20">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="m4.5 12.75 6 6 9-13.5" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="text-[11px] sm:text-xs font-bold text-slate-800 flex items-center gap-1">
                      Board Certified Specialist
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">Verified Care Provider</div>
                  </div>
                </div>
              </div>
            </div>

          </section>
        </div>
      </main>
    </div>
  );
}
