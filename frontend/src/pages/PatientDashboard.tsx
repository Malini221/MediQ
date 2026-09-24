import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { MediQIcon } from '../components/common/MediQIcon';
import { LoadingState } from '../components/ui/states';

export function PatientDashboard() {
  const { user } = useAuth();
  const [patientRecord, setPatientRecord] = useState<{ id?: string; full_name?: string; date_of_birth?: string; primary_diagnosis?: string } | null>(null);
  const [feeling, setFeeling] = useState<string | null>(localStorage.getItem('mediq_patient_feeling_today'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPatientData() {
      if (!user) return;
      try {
        const { data: memberData } = await supabase
          .from('patient_memberships')
          .select('patient_id, patients(id, full_name, date_of_birth, primary_diagnosis)')
          .eq('user_id', user.id)
          .maybeSingle();

        if (memberData?.patients) {
          setPatientRecord(memberData.patients as any);
        } else {
          const { data: directPatient } = await supabase
            .from('patients')
            .select('id, full_name, date_of_birth, primary_diagnosis')
            .eq('auth_user_id', user.id)
            .maybeSingle();
          if (directPatient) {
            setPatientRecord(directPatient);
          }
        }
      } catch (err) {
        console.error('Error fetching patient record:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPatientData();
  }, [user]);

  const handleFeelingSelect = (status: string) => {
    setFeeling(status);
    localStorage.setItem('mediq_patient_feeling_today', status);
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return <LoadingState message="Loading your patient space..." className="h-[60vh]" />;
  }

  const name = patientRecord?.full_name || user?.user_metadata?.full_name || user?.email || 'Patient';

  return (
    <div className="space-y-6 mediq-reveal max-w-5xl mx-auto pb-10">
      {/* Welcome Header */}
      <section className="mediq-surface p-7 md:p-9">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-[#1A5CFF]/10 text-[#1A5CFF] text-xs font-semibold rounded-full uppercase tracking-wider">
            Patient Portal
          </span>
        </div>
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-[#0B132B] mt-3">
          {getTimeGreeting()}, {name}.
        </h1>
        <p className="text-slate-500 mt-2 max-w-2xl text-sm leading-relaxed">
          {patientRecord?.primary_diagnosis ? (
            <span>Condition Profile: <strong className="text-[#0B132B]">{patientRecord.primary_diagnosis}</strong></span>
          ) : (
            'Your care information hasn\'t been added yet.'
          )}
        </p>
      </section>

      {/* How are you feeling today? Check-in */}
      <section className="mediq-surface p-6 md:p-7 space-y-4">
        <div>
          <h2 className="font-heading text-lg font-bold text-[#0B132B]">How are you feeling today?</h2>
          <p className="text-xs text-slate-500 mt-1">Select a quick check-in signal for your care team.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { id: 'Good', label: 'Good 😊', color: 'border-emerald-200 bg-emerald-50/50 text-emerald-700' },
            { id: 'Okay', label: 'Okay 🙂', color: 'border-blue-200 bg-blue-50/50 text-blue-700' },
            { id: 'Not Great', label: 'Not Great 🙁', color: 'border-amber-200 bg-amber-50/50 text-amber-700' },
            { id: 'Uncomfortable', label: 'Uncomfortable 😣', color: 'border-red-200 bg-red-50/50 text-red-700' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => handleFeelingSelect(item.id)}
              className={`p-4 rounded-2xl border text-center transition-all ${
                feeling === item.id
                  ? 'border-[#1A5CFF] bg-[#1A5CFF]/10 font-bold text-[#1A5CFF] ring-2 ring-[#1A5CFF]/30'
                  : `${item.color} hover:border-[#1A5CFF]/30`
              }`}
            >
              <p className="text-sm font-semibold">{item.label}</p>
            </button>
          ))}
        </div>

        {feeling && (
          <p className="text-xs text-emerald-600 font-medium">
            ✓ Check-in saved for today ({feeling}).
          </p>
        )}
      </section>

      {/* Quick Report Actions */}
      <section className="space-y-4">
        <h2 className="font-heading text-lg font-bold text-[#0B132B]">Quick Report Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/dashboard/reports"
            className="mediq-surface p-6 hover:border-[#1A5CFF]/40 transition-all flex items-start gap-4 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#1A5CFF]/10 text-[#1A5CFF] flex items-center justify-center shrink-0 group-hover:bg-[#1A5CFF] group-hover:text-white transition-colors">
              <MediQIcon name="mic" size={24} />
            </div>
            <div>
              <p className="font-bold text-base text-[#0B132B]">Record a Voice Report</p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Speak naturally in your preferred language to share symptoms or updates with your care team.
              </p>
            </div>
          </Link>

          <Link
            to="/dashboard/reports"
            className="mediq-surface p-6 hover:border-[#1A5CFF]/40 transition-all flex items-start gap-4 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <MediQIcon name="reports" size={24} />
            </div>
            <div>
              <p className="font-bold text-base text-[#0B132B]">Write a Text Report</p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Submit a written note about discomfort, sleep, or changes to keep your team informed.
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* Patient Guidance & Resources */}
      <section className="mediq-surface p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-base font-bold text-[#0B132B]">Approved Patient Guidance</h2>
            <p className="text-xs text-slate-500 mt-0.5">Read verified care advice and daily wellness routines.</p>
          </div>
          <Link to="/dashboard/guidance" className="text-xs font-semibold text-[#1A5CFF]">
            View all guidance &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link to="/dashboard/guidance" className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:border-[#1A5CFF]/30 transition-colors">
            <p className="font-semibold text-xs text-[#1A5CFF]">Rest & Sleep</p>
            <p className="text-xs text-slate-600 mt-1 line-clamp-2">Tips for maintaining rest cycles and nighttime comfort.</p>
          </Link>

          <Link to="/dashboard/guidance" className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:border-[#1A5CFF]/30 transition-colors">
            <p className="font-semibold text-xs text-[#1A5CFF]">Managing Symptoms</p>
            <p className="text-xs text-slate-600 mt-1 line-clamp-2">When to report changes to your authorized care team.</p>
          </Link>

          <Link to="/dashboard/guidance" className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:border-[#1A5CFF]/30 transition-colors">
            <p className="font-semibold text-xs text-[#1A5CFF]">Daily Activity</p>
            <p className="text-xs text-slate-600 mt-1 line-clamp-2">Gentle physical exercises and safety recommendations.</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
