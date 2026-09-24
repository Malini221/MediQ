import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { observationService } from '../services/observations';
import { MediQIcon } from '../components/common/MediQIcon';
import { LoadingState } from '../components/ui/states';

type PatientRecord = { id: string; full_name: string; date_of_birth?: string | null; primary_diagnosis: string };
type Observation = { id: string; raw_text: string; status: string; priority_score: number; created_at: string };
type Handover = { id: string; summary_text: string; created_at: string };
type CareTeamMember = { id: string; full_name: string; system_role: string };

export function PatientDashboard() {
  const { user } = useAuth();
  const [patient, setPatient] = useState<PatientRecord | null>(null);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [handovers, setHandovers] = useState<Handover[]>([]);
  const [careTeam, setCareTeam] = useState<CareTeamMember[]>([]);
  const [feeling, setFeeling] = useState<string | null>(localStorage.getItem('mediq_patient_feeling_today'));
  const [feelingSubmitting, setFeelingSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPatientDashboard() {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        const { data: directPatient, error: directError } = await supabase
          .from('patients')
          .select('id, full_name, date_of_birth, primary_diagnosis')
          .eq('auth_user_id', user.id)
          .maybeSingle();
        if (directError) throw directError;

        let patientRecord = directPatient as PatientRecord | null;
        if (!patientRecord) {
          const { data: membership, error: membershipError } = await supabase
            .from('patient_memberships')
            .select('patient_id, patients(id, full_name, date_of_birth, primary_diagnosis)')
            .eq('user_id', user.id)
            .maybeSingle();
          if (membershipError) throw membershipError;
          if (membership?.patients) patientRecord = membership.patients as unknown as PatientRecord;
        }

        setPatient(patientRecord);
        if (!patientRecord) return;

        const [observationsResult, handoversResult, teamResult] = await Promise.all([
          supabase.from('observations').select('id, raw_text, status, priority_score, created_at').eq('patient_id', patientRecord.id).order('created_at', { ascending: false }).limit(5),
          supabase.from('handover_summaries').select('id, summary_text, created_at').eq('patient_id', patientRecord.id).order('created_at', { ascending: false }).limit(3),
          supabase.from('patient_memberships').select('user_id, profiles(id, full_name, system_role)').eq('patient_id', patientRecord.id)
        ]);

        if (observationsResult.error) throw observationsResult.error;
        if (handoversResult.error) throw handoversResult.error;
        if (teamResult.error) throw teamResult.error;

        setObservations((observationsResult.data || []) as Observation[]);
        setHandovers((handoversResult.data || []) as Handover[]);
        setCareTeam((teamResult.data || []).map((item: any) => item.profiles).filter(Boolean) as CareTeamMember[]);
      } catch (err) {
        console.error('Error loading patient dashboard:', err);
        setError('We could not load some of your care information. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    loadPatientDashboard();
  }, [user]);

  const handleFeelingSelect = async (status: string) => {
    setFeeling(status);
    localStorage.setItem('mediq_patient_feeling_today', status);
    if (!patient || feelingSubmitting) return;
    setFeelingSubmitting(true);
    try {
      await observationService.createObservation(patient.id, `[Patient Feeling Check-in] ${status}`);
    } catch (err) {
      console.error('Feeling check-in submission failed:', err);
      setError('Your check-in could not reach your care team. You can retry from My Reports.');
    } finally {
      setFeelingSubmitting(false);
    }
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formatDate = (value: string) => new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
  const roleLabel = (role: string) => role.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

  if (loading) return <LoadingState message="Loading your patient space..." className="h-[60vh]" />;

  const name = patient?.full_name || user?.user_metadata?.full_name || user?.email || 'Patient';

  return (
    <div className="space-y-6 mediq-reveal max-w-6xl mx-auto pb-10">
      <section className="mediq-surface p-7 md:p-9">
        <span className="px-3 py-1 bg-[#1A5CFF]/10 text-[#1A5CFF] text-xs font-semibold rounded-full uppercase tracking-wider">Patient Portal</span>
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-[#0B132B] mt-3">{getTimeGreeting()}, {name}.</h1>
        <p className="text-slate-500 mt-2 max-w-2xl text-sm leading-relaxed">
          {patient?.primary_diagnosis ? <span>Current care profile: <strong className="text-[#0B132B]">{patient.primary_diagnosis}</strong></span> : 'Your care information has not been added yet.'}
        </p>
        {error && <p className="mt-4 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">{error}</p>}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="mediq-surface p-5"><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Care status</p><p className="font-heading text-xl font-bold text-[#0B132B] mt-2">Active care</p><p className="text-xs text-slate-500 mt-1">Your MediQ care space is connected.</p></div>
        <div className="mediq-surface p-5"><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Recent reports</p><p className="font-heading text-xl font-bold text-[#0B132B] mt-2">{observations.length}</p><p className="text-xs text-slate-500 mt-1">Latest reports available to you.</p></div>
        <div className="mediq-surface p-5"><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Care team</p><p className="font-heading text-xl font-bold text-[#0B132B] mt-2">{careTeam.length}</p><p className="text-xs text-slate-500 mt-1">People connected to your care.</p></div>
      </section>

      <section className="mediq-surface p-6 md:p-7 space-y-4">
        <div><h2 className="font-heading text-lg font-bold text-[#0B132B]">How are you feeling today?</h2><p className="text-xs text-slate-500 mt-1">A quick check-in signal for your care team.</p></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[{ id: 'Good', label: 'Good 😊', color: 'border-emerald-200 bg-emerald-50/50 text-emerald-700' }, { id: 'Okay', label: 'Okay 🙂', color: 'border-blue-200 bg-blue-50/50 text-blue-700' }, { id: 'Not Great', label: 'Not Great 🙁', color: 'border-amber-200 bg-amber-50/50 text-amber-700' }, { id: 'Uncomfortable', label: 'Uncomfortable 😣', color: 'border-red-200 bg-red-50/50 text-red-700' }].map(item => (
            <button key={item.id} disabled={feelingSubmitting} onClick={() => handleFeelingSelect(item.id)} className={`p-4 rounded-2xl border text-center transition-all disabled:opacity-60 ${feeling === item.id ? 'border-[#1A5CFF] bg-[#1A5CFF]/10 font-bold text-[#1A5CFF] ring-2 ring-[#1A5CFF]/30' : `${item.color} hover:border-[#1A5CFF]/30`}`}><p className="text-sm font-semibold">{item.label}</p></button>
          ))}
        </div>
        {feeling && <p className="text-xs text-emerald-600 font-medium">✓ Check-in saved and shared with your care team ({feeling}).</p>}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="mediq-surface p-6 space-y-4">
          <div className="flex items-center justify-between"><div><h2 className="font-heading text-lg font-bold text-[#0B132B]">Recent care updates</h2><p className="text-xs text-slate-500 mt-1">Latest information connected to your care.</p></div><Link to="/dashboard/reports" className="text-xs font-semibold text-[#1A5CFF]">View reports →</Link></div>
          {observations.length === 0 ? <div className="rounded-xl border border-slate-100 bg-slate-50 p-5 text-sm text-slate-500">No care updates have been recorded yet.</div> : <div className="space-y-3">{observations.map(observation => <div key={observation.id} className="rounded-xl border border-slate-100 p-4"><div className="flex items-center justify-between gap-3"><span className="text-xs font-semibold text-[#1A5CFF] capitalize">{observation.status.replaceAll('_', ' ')}</span><span className="text-[11px] text-slate-400">{formatDate(observation.created_at)}</span></div><p className="text-sm text-slate-700 mt-2 line-clamp-2">{observation.raw_text}</p></div>)}</div>}
        </div>

        <div className="mediq-surface p-6 space-y-4">
          <div><h2 className="font-heading text-lg font-bold text-[#0B132B]">Latest handover</h2><p className="text-xs text-slate-500 mt-1">Recent continuity information from your care team.</p></div>
          {handovers.length === 0 ? <div className="rounded-xl border border-slate-100 bg-slate-50 p-5 text-sm text-slate-500">No handover summary is available yet.</div> : <div className="rounded-xl border border-slate-100 p-4"><p className="text-[11px] text-slate-400">{formatDate(handovers[0].created_at)}</p><p className="text-sm text-slate-700 mt-2 line-clamp-5">{handovers[0].summary_text}</p><Link to="/dashboard/handovers" className="inline-block mt-3 text-xs font-semibold text-[#1A5CFF]">View handovers →</Link></div>}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="mediq-surface p-6 space-y-4"><div><h2 className="font-heading text-lg font-bold text-[#0B132B]">My care team</h2><p className="text-xs text-slate-500 mt-1">Only people assigned to this patient are shown.</p></div>{careTeam.length === 0 ? <div className="rounded-xl border border-slate-100 bg-slate-50 p-5 text-sm text-slate-500">No care-team members are assigned yet.</div> : <div className="space-y-2">{careTeam.map(member => <div key={member.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-4"><div><p className="text-sm font-semibold text-[#0B132B]">{member.full_name}</p><p className="text-xs text-slate-500 mt-0.5">{roleLabel(member.system_role)}</p></div><span className="w-2 h-2 rounded-full bg-emerald-500" /></div>)}</div>}</div>
        <div className="mediq-surface p-6 space-y-4"><div><h2 className="font-heading text-lg font-bold text-[#0B132B]">Patient information</h2><p className="text-xs text-slate-500 mt-1">Your basic care profile from MediQ.</p></div><div className="grid grid-cols-2 gap-3"><div className="rounded-xl bg-slate-50 p-4"><p className="text-[11px] text-slate-500">Name</p><p className="text-sm font-semibold text-[#0B132B] mt-1">{patient?.full_name || name}</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-[11px] text-slate-500">Date of birth</p><p className="text-sm font-semibold text-[#0B132B] mt-1">{patient?.date_of_birth ? formatDate(patient.date_of_birth) : 'Not added'}</p></div><div className="rounded-xl bg-slate-50 p-4 col-span-2"><p className="text-[11px] text-slate-500">Primary care profile</p><p className="text-sm font-semibold text-[#0B132B] mt-1">{patient?.primary_diagnosis || 'Not specified'}</p></div></div></div>
      </section>

      <section className="space-y-4"><h2 className="font-heading text-lg font-bold text-[#0B132B]">Quick actions</h2><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><Link to="/dashboard/reports" className="mediq-surface p-6 hover:border-[#1A5CFF]/40 transition-all flex items-start gap-4 group"><div className="w-12 h-12 rounded-2xl bg-[#1A5CFF]/10 text-[#1A5CFF] flex items-center justify-center shrink-0 group-hover:bg-[#1A5CFF] group-hover:text-white transition-colors"><MediQIcon name="reports" size={24} /></div><div><p className="font-bold text-base text-[#0B132B]">My Reports</p><p className="text-xs text-slate-500 mt-1">View and manage your submitted care reports.</p></div></Link><Link to="/dashboard/guidance" className="mediq-surface p-6 hover:border-[#1A5CFF]/40 transition-all flex items-start gap-4 group"><div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors"><MediQIcon name="guidance" size={24} /></div><div><p className="font-bold text-base text-[#0B132B]">Care Guidance</p><p className="text-xs text-slate-500 mt-1">Open approved guidance available in MediQ.</p></div></Link></div></section>
    </div>
  );
}
