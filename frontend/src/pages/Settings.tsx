import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/api';
import { patientService } from '../services/patients';
import { Patient } from '../types/models';
import { MediQIcon } from '../components/common/MediQIcon';
import { SelectPatientDropdown } from '../components/common/SelectPatientDropdown';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'ta', label: 'Tamil' },
  { code: 'te', label: 'Telugu' }
];

const CONDITIONS = [
  "Dementia / Alzheimer's",
  'Stroke Recovery',
  "Parkinson's Disease",
  'Diabetes',
  'Heart Failure',
  'COPD',
  'Cancer Supportive Care',
  'Other'
];

type SettingsTab = 'account' | 'voice' | 'condition' | 'security';

export function Settings() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');

  // Voice Language state
  const [language, setLanguage] = useState(localStorage.getItem('mediq_voice_language') || 'en');

  // Condition Profile state
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [condition, setCondition] = useState('');

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    patientService.getPatients()
      .then(ps => {
        setPatients(ps);
        if (ps[0]) {
          setSelectedPatient(ps[0].id);
          setCondition(ps[0].primary_diagnosis || '');
        }
      })
      .catch(() => {});
  }, []);

  const saveLanguage = async (value: string) => {
    setLanguage(value);
    localStorage.setItem('mediq_voice_language', value);
    try {
      await apiClient.patch('/api/v1/auth/profile', { preferred_voice_language: value });
      showToast('Voice language saved successfully');
    } catch {
      showToast('Voice language updated locally');
    }
  };

  const saveCondition = async () => {
    if (!selectedPatient || !condition) return;
    try {
      await patientService.updatePatient(selectedPatient, { primary_diagnosis: condition });
      showToast('Patient condition profile updated successfully');
    } catch (e: any) {
      showToast(e?.message || 'Unable to update patient condition', 'error');
    }
  };

  const role = user?.user_metadata?.system_role || 'caregiver';
  const isPatient = role === 'patient';

  return (
    <div className="space-y-6 mediq-reveal max-w-5xl mx-auto pb-10">
      <section className="mediq-surface p-6 md:p-8">
        <p className="mediq-kicker">{isPatient ? 'Patient Preferences' : 'Caregiver Preferences'}</p>
        <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight mt-1 text-[#0B132B]">
          Workspace Settings
        </h1>
        <p className="text-slate-500 mt-2 text-sm max-w-xl">
          {isPatient
            ? 'Manage your account profile, voice report language preferences, and security sessions.'
            : 'Manage your caregiver account details, voice input preferences, patient condition models, and security sessions.'}
        </p>
      </section>

      {toast && (
        <div
          className={`rounded-2xl border px-5 py-3.5 text-sm font-semibold mediq-reveal ${
            toast.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Tabs */}
      <section className="mediq-surface p-2 flex gap-1 overflow-x-auto">
        {(isPatient ? ['account', 'voice', 'security'] : ['account', 'voice', 'condition', 'security'] as SettingsTab[]).map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t as SettingsTab)}
            className={`px-5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === t
                ? 'bg-[#1A5CFF] text-white'
                : 'text-slate-600 hover:bg-slate-50 hover:text-[#0B132B]'
            }`}
          >
            {t === 'account' ? 'Profile' : t === 'voice' ? 'Report Language' : t === 'condition' ? 'Patient Condition System' : 'Security & Session'}
          </button>
        ))}
      </section>

      {/* Tab Panels */}
      {activeTab === 'account' && (
        <section className="mediq-surface p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#1A5CFF]/10 text-[#1A5CFF] font-bold text-xl flex items-center justify-center">
              {(user?.user_metadata?.full_name || user?.email || 'C').charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold text-[#0B132B]">
                {user?.user_metadata?.full_name || 'Caregiver User'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Authorized Role</p>
              <p className="text-sm font-bold text-[#0B132B] mt-1 capitalize">{String(role).replace(/_/g, ' ')}</p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Account ID</p>
              <p className="text-sm font-mono font-semibold text-slate-600 mt-1 truncate">{user?.id}</p>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'voice' && (
        <section className="mediq-surface p-6 md:p-8 space-y-6">
          <div>
            <h2 className="font-heading text-xl font-bold text-[#0B132B]">Voice Observation Language</h2>
            <p className="text-sm text-slate-500 mt-1">
              Select your primary spoken language for voice note recording and Whisper speech transcription.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {LANGUAGES.map(l => (
              <button
                key={l.code}
                onClick={() => saveLanguage(l.code)}
                className={`rounded-2xl border p-4 text-left transition-all ${
                  language === l.code
                    ? 'border-[#1A5CFF] bg-[#1A5CFF]/5 text-[#1A5CFF]'
                    : 'border-slate-200 hover:border-[#1A5CFF]/30 text-slate-700'
                }`}
              >
                <p className="font-bold text-sm">{l.label}</p>
                <p className="text-xs text-slate-400 mt-1">{l.code.toUpperCase()}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'condition' && (
        <section className="mediq-surface p-6 md:p-8 space-y-6">
          <div>
            <h2 className="font-heading text-xl font-bold text-[#0B132B]">Patient Condition Profile System</h2>
            <p className="text-sm text-slate-500 mt-1">
              Configuring the patient's primary condition adapts clinical guidance search relevance, observation prompts, and shift handover structure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Select Patient</label>
              <SelectPatientDropdown
                value={selectedPatient}
                onChange={val => {
                  setSelectedPatient(val);
                  const p = patients.find(x => x.id === val);
                  setCondition(p?.primary_diagnosis || '');
                }}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Primary Condition / Diagnosis</label>
              <select
                value={condition}
                onChange={e => setCondition(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm mediq-focus"
              >
                <option value="">Select Primary Condition</option>
                {CONDITIONS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={saveCondition}
              disabled={!selectedPatient || !condition}
              className="rounded-full bg-[#1A5CFF] text-white px-6 py-2.5 text-sm font-semibold hover:opacity-95 transition-opacity disabled:opacity-40"
            >
              Save Condition Profile
            </button>
          </div>
        </section>
      )}

      {activeTab === 'security' && (
        <section className="mediq-surface p-6 md:p-8 space-y-6">
          <div>
            <h2 className="font-heading text-xl font-bold text-[#0B132B]">Security & Session Control</h2>
            <p className="text-sm text-slate-500 mt-1">
              MediQ enforces Supabase JWT session authentication and patient database RLS.
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-5 space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Session Security Status</p>
            <p className="text-sm font-bold text-emerald-600 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Authenticated Session Active
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={signOut}
              className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 text-red-700 px-6 py-2.5 text-sm font-semibold hover:bg-red-100 transition-colors"
            >
              <MediQIcon name="logout" size={16} />
              Sign out of MediQ
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
