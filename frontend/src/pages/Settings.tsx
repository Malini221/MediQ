import { useEffect, useState } from 'react';
import { apiClient } from '../services/api';
import { MediQIcon } from '../components/common/MediQIcon';
import { patientService } from '../services/patients';
import { Patient } from '../types/models';
import { SelectPatientDropdown } from '../components/common/SelectPatientDropdown';

const languages = [{code:'en',label:'English'},{code:'hi',label:'Hindi'},{code:'ta',label:'Tamil'},{code:'te',label:'Telugu'}];
const conditions = ["Dementia / Alzheimer's", 'Stroke Recovery', "Parkinson's Disease", 'Diabetes', 'Heart Failure', 'COPD', 'Cancer Supportive Care', 'Other'];

export function Settings() {
  const [language, setLanguage] = useState(localStorage.getItem('mediq_voice_language') || 'en');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [condition, setCondition] = useState('');
  const [saved, setSaved] = useState('');

  // We only fetch patients to find the condition of the selected patient when it changes.
  // The SelectPatientDropdown handles its own loading.
  useEffect(() => { patientService.getPatients().then(ps => { setPatients(ps); if(ps[0]) { setSelectedPatient(ps[0].id); setCondition(ps[0].primary_diagnosis || ''); }}).catch(()=>{}); }, []);
  const saveLanguage = async (value: string) => { setLanguage(value); localStorage.setItem('mediq_voice_language', value); try { await apiClient.patch('/api/v1/auth/profile', { preferred_voice_language: value }); } catch {} setSaved('Voice language saved'); setTimeout(()=>setSaved(''),1800); };
  const saveCondition = async () => { if(!selectedPatient || !condition) return; try { await patientService.updatePatient(selectedPatient, { primary_diagnosis: condition }); setSaved('Patient condition updated'); setTimeout(()=>setSaved(''),1800); } catch(e:any) { setSaved(e?.message || 'Unable to update condition'); } };

  return <div className="space-y-6 mediq-reveal max-w-5xl">
    <section className="mediq-surface p-6 md:p-8"><p className="mediq-kicker">Preferences</p><h1 className="font-heading text-3xl font-bold mt-2">Settings</h1><p className="text-slate-500 mt-2">Control your MediQ experience without changing the secure sign-in flow.</p></section>
    {saved && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{saved}</div>}
    <section className="mediq-surface p-6 md:p-7"><div className="flex items-start gap-4"><div className="w-11 h-11 rounded-xl bg-[#1A5CFF]/10 text-[#1A5CFF] flex items-center justify-center"><MediQIcon name="mic"/></div><div><h2 className="font-heading text-xl font-bold">Voice & language</h2><p className="text-sm text-slate-500 mt-1">Choose the language used when you record caregiver or patient voice observations.</p></div></div><div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">{languages.map(l=><button key={l.code} onClick={()=>saveLanguage(l.code)} className={`rounded-2xl border p-4 text-left transition-all ${language===l.code?'border-[#1A5CFF] bg-[#1A5CFF]/5':'border-slate-200 hover:border-[#1A5CFF]/30'}`}><p className="font-semibold text-sm">{l.label}</p><p className="text-xs text-slate-400 mt-1">{l.code.toUpperCase()}</p></button>)}</div></section>
    <section className="mediq-surface p-6 md:p-7"><div className="flex items-start gap-4"><div className="w-11 h-11 rounded-xl bg-[#1A5CFF]/10 text-[#1A5CFF] flex items-center justify-center"><MediQIcon name="patients"/></div><div><h2 className="font-heading text-xl font-bold">Patient condition profile</h2><p className="text-sm text-slate-500 mt-1">The selected condition shapes future observation prompts, guidance context and handover structure.</p></div></div><div className="grid md:grid-cols-2 gap-4 mt-6">
      <SelectPatientDropdown 
        value={selectedPatient} 
        onChange={(val) => {
          setSelectedPatient(val); 
          const p = patients.find(x => x.id === val); 
          setCondition(p?.primary_diagnosis || '');
        }} 
      />
      <select value={condition} onChange={e=>setCondition(e.target.value)} className="mediq-focus rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"><option value="">Select condition</option>{conditions.map(c=><option key={c} value={c}>{c}</option>)}</select></div><button onClick={saveCondition} disabled={!selectedPatient||!condition} className="mt-4 rounded-full bg-[#1A5CFF] text-white px-5 py-3 text-sm font-semibold disabled:opacity-40">Save condition</button><p className="text-xs text-slate-400 mt-3">Historical observations remain unchanged when the condition is updated.</p></section>
    <section className="mediq-surface p-6 md:p-7"><div className="flex items-start gap-4"><div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center"><MediQIcon name="shield"/></div><div><h2 className="font-heading text-xl font-bold">Privacy</h2><p className="text-sm text-slate-500 mt-1">MediQ keeps private caregiver support data separate from patient-facing workflows. Access remains controlled by authentication, backend authorization and database RLS.</p></div></div></section>
  </div>;
}
