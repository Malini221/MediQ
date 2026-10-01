import { Link } from 'react-router-dom';
import { AuthBackground } from '../components/auth/AuthBackground';
import { MediQIcon } from '../components/common/MediQIcon';

export function LandingPage() {
  return (
    <div className="min-h-screen w-full bg-transparent text-slate-800 antialiased relative selection:bg-mediq-blue selection:text-white font-sans flex flex-col justify-center px-4 py-12">
      <AuthBackground />
      <div className="relative z-10 w-full max-w-lg bg-white/95 backdrop-blur-xl rounded-[28px] shadow-2xl shadow-blue-950/20 border border-white p-8 md:p-12 text-center animate-in fade-in zoom-in-95 duration-500 mx-auto">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-mediq-blue text-white flex items-center justify-center shadow-lg shadow-mediq-blue/30">
            <MediQIcon name="overview" className="w-8 h-8" />
          </div>
        </div>
        
        <h1 className="font-heading text-3xl font-bold text-slate-900 mb-3 tracking-tight">
          Welcome to MediQ
        </h1>
        <p className="text-slate-500 text-sm leading-relaxed mb-10 max-w-sm mx-auto">
          Please select your portal to continue to your secure workspace.
        </p>

        <div className="space-y-4">
          <Link
            to="/auth/caregiver"
            className="group relative flex items-center justify-between w-full p-5 rounded-2xl border-2 border-slate-100 hover:border-mediq-blue bg-white hover:bg-blue-50/50 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-y-0 left-0 w-1 bg-mediq-blue scale-y-0 group-hover:scale-y-100 transition-transform origin-bottom duration-300"></div>
            <div className="flex items-center gap-4 text-left">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 group-hover:text-mediq-blue transition-colors">Care Team Portal</h3>
                <p className="text-xs text-slate-500 mt-0.5">Clinicians, Nurses, and Coordinators</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-slate-300 group-hover:text-mediq-blue group-hover:translate-x-1 transition-all duration-300" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path>
            </svg>
          </Link>

          <Link
            to="/auth/patient"
            className="group relative flex items-center justify-between w-full p-5 rounded-2xl border-2 border-slate-100 hover:border-emerald-500 bg-white hover:bg-emerald-50/50 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-y-0 left-0 w-1 bg-emerald-500 scale-y-0 group-hover:scale-y-100 transition-transform origin-bottom duration-300"></div>
            <div className="flex items-center gap-4 text-left">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"></path>
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">Patient Portal</h3>
                <p className="text-xs text-slate-500 mt-0.5">Patients and Family Caregivers</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all duration-300" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path>
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
