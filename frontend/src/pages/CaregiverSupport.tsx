import { useEffect, useState } from 'react';
import { getBurnoutMetrics, analyzeBurnout } from '../services/burnout';
import { BurnoutMetrics, Patient } from '../types/models';
import { patientService } from '../services/patients';
import { LoadingState, ErrorState } from '../components/ui/states';
import { MediQIcon } from '../components/common/MediQIcon';

export function CaregiverSupport() {
  const [metrics, setMetrics] = useState<BurnoutMetrics | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Decompression timer modal state
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathingSeconds, setBreathingSeconds] = useState(120);

  const loadSupportData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [metricsData, ptsData] = await Promise.all([
        getBurnoutMetrics().catch(() => []),
        patientService.getPatients().catch(() => [])
      ]);

      setPatients(ptsData);
      if (metricsData && metricsData.length > 0) {
        setMetrics(metricsData[0]);
      } else {
        setMetrics(null);
      }
    } catch (err: any) {
      console.error('Failed to fetch caregiver support metrics:', err);
      setError('Unable to load your well-being dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSupportData();
  }, []);

  // Timer effect for 2-min decompression break
  useEffect(() => {
    let interval: any = null;
    if (breathingActive && breathingSeconds > 0) {
      interval = setInterval(() => {
        setBreathingSeconds(s => s - 1);
      }, 1000);
    } else if (breathingSeconds === 0) {
      setBreathingActive(false);
      setBreathingSeconds(120);
    }
    return () => clearInterval(interval);
  }, [breathingActive, breathingSeconds]);

  const handleRunCheckin = async () => {
    try {
      setAnalyzing(true);
      const result = await analyzeBurnout();
      setMetrics(result);
    } catch (err: any) {
      console.error('Checkin failed:', err);
      alert('Unable to analyze strain signal right now.');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading caregiver well-being workspace..." />;
  }

  if (error) {
    return <ErrorState title="Support Workspace Error" message={error} onRetry={loadSupportData} />;
  }

  const score = metrics?.strain_score ?? 15;
  const getStatusText = (s: number) => {
    if (s < 25) return { label: 'Optimal Energy', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (s < 50) return { label: 'Moderate Workload', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    if (s < 75) return { label: 'Elevated Shift Strain', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    return { label: 'High Strain Alert', color: 'bg-red-50 text-red-700 border-red-200' };
  };

  const statusInfo = getStatusText(score);

  return (
    <div className="space-y-6 mediq-reveal max-w-5xl mx-auto pb-10">
      <section className="mediq-surface p-6 md:p-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="mediq-kicker">Caregiver Well-being Workspace</p>
          <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight mt-1 text-[#0B132B]">
            Caregiver Support & Well-being
          </h1>
          <p className="text-slate-500 mt-2 text-sm max-w-xl">
            A private space dedicated to your shift energy, strain balance, and wellness micro-interventions.
          </p>
        </div>

        <button
          onClick={handleRunCheckin}
          disabled={analyzing}
          className="inline-flex items-center gap-2 rounded-full bg-[#1A5CFF] text-white px-5 py-3 text-sm font-semibold hover:opacity-95 transition-opacity disabled:opacity-50 shrink-0"
        >
          <MediQIcon name="support" size={17} />
          {analyzing ? 'Checking Signal...' : 'Refresh Strain Signal'}
        </button>
      </section>

      {/* Strict Privacy Banner */}
      <section className="mediq-surface p-5 border-l-4 border-l-[#1A5CFF] flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-[#1A5CFF]/10 text-[#1A5CFF] flex items-center justify-center shrink-0">
          <MediQIcon name="shield" size={20} />
        </div>
        <div>
          <h3 className="font-heading text-sm font-bold text-[#0B132B]">Strictly Private & Confidential</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Your well-being metrics are confidential support signals for you. They are unmonitored by supervisors and are not a medical diagnosis.
          </p>
        </div>
      </section>

      {/* Main Grid: Workload vs Strain */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Workload Column */}
        <div className="mediq-surface p-6 space-y-4 md:col-span-1">
          <h2 className="font-heading text-base font-bold text-[#0B132B]">Shift Workload Context</h2>
          <div className="space-y-3">
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">Assigned Patients</p>
                <p className="font-heading text-2xl font-bold text-[#0B132B] mt-1">{patients.length}</p>
              </div>
              <MediQIcon name="patients" size={22} className="text-[#1A5CFF]" />
            </div>

            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">Active Status</p>
                <p className="font-heading text-sm font-bold text-[#0B132B] mt-1">Shift In Progress</p>
              </div>
              <MediQIcon name="overview" size={22} className="text-emerald-600" />
            </div>
          </div>
        </div>

        {/* Strain Signal Gauge & Intervention */}
        <div className="mediq-surface p-6 space-y-5 md:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-base font-bold text-[#0B132B]">Current Strain Indicator</h2>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>

          {/* Meter Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-400 font-semibold">
              <span>Resting (0)</span>
              <span>Score: {score} / 100</span>
              <span>High Strain (100)</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  score < 25 ? 'bg-emerald-500' : score < 50 ? 'bg-blue-500' : score < 75 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
              />
            </div>
          </div>

          {/* Intervention Advice */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 space-y-3">
            <p className="text-xs font-semibold text-[#1A5CFF] uppercase tracking-wider">Suggested Support Action</p>
            <p className="font-semibold text-sm text-[#0B132B]">
              {(metrics?.intervention_offered as any)?.type
                ? String((metrics?.intervention_offered as any).type).replace(/_/g, ' ')
                : 'Shift Micro-Break'}
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              {(metrics?.intervention_offered as any)?.message ||
                (typeof metrics?.intervention_offered === 'string' ? metrics.intervention_offered : null) ||
                'Take 2 minutes to reset focus and practice rhythmic decompression between patient tasks.'}
            </p>

            <div className="pt-2 flex gap-3">
              <button
                onClick={() => {
                  setBreathingActive(true);
                  setBreathingSeconds(120);
                }}
                className="rounded-full bg-[#1A5CFF] text-white px-5 py-2 text-xs font-semibold hover:opacity-95 transition-opacity"
              >
                Start 2-Min Decompression Exercise
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Decompression Modal */}
      {breathingActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#061024]/80 backdrop-blur-sm p-4">
          <div className="mediq-surface p-8 max-w-md w-full text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-[#1A5CFF]/10 text-[#1A5CFF] mx-auto flex items-center justify-center animate-pulse">
              <MediQIcon name="support" size={36} />
            </div>
            <div>
              <h3 className="font-heading text-2xl font-bold text-[#0B132B]">2-Minute Reset</h3>
              <p className="text-xs text-slate-500 mt-1">Inhale slowly for 4s, hold for 4s, exhale slowly for 4s.</p>
            </div>
            <div className="font-heading text-4xl font-bold text-[#1A5CFF]">
              {Math.floor(breathingSeconds / 60)}:{String(breathingSeconds % 60).padStart(2, '0')}
            </div>
            <button
              onClick={() => setBreathingActive(false)}
              className="w-full rounded-full border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:text-[#0B132B]"
            >
              Finish Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
