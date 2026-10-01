import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { handoversService } from '../services/handovers';
import { patientService } from '../services/patients';
import { Handover, Patient } from '../types/models';
import { ErrorState, EmptyState, SkeletonList } from '../components/ui/states';
import { MediQIcon } from '../components/common/MediQIcon';

interface HandoverWithPatient extends Handover {
  patient: Patient;
}

type HandoverTab = 'all' | 'needs_review' | 'acknowledged';

export function Handovers() {
  const [handovers, setHandovers] = useState<HandoverWithPatient[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState('all');
  const [activeTab, setActiveTab] = useState<HandoverTab>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHandovers = async () => {
    try {
      setLoading(true);
      setError(null);
      const pts = await patientService.getPatients();
      setPatients(pts);

      const promises = pts.map(async (p: Patient) => {
        try {
          const list = await handoversService.getPatientHandovers(p.id);
          return list.map(h => ({ ...h, patient: p }));
        } catch {
          return [];
        }
      });

      const results = await Promise.all(promises);
      const all = results.flat().sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
      setHandovers(all);
    } catch (err: any) {
      console.error('Failed to load handovers:', err);
      setError('Unable to load shift handovers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHandovers();
  }, []);

  const filteredHandovers = handovers.filter(h => {
    const matchesPatient = selectedPatient === 'all' || h.patient_id === selectedPatient;
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'needs_review' && !h.acknowledged_by) ||
      (activeTab === 'acknowledged' && !!h.acknowledged_by);
    return matchesPatient && matchesTab;
  });

  return (
    <div className="space-y-6 mediq-reveal pb-10">
      <section className="mediq-surface p-6 md:p-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="mediq-kicker">Shift Continuity Workspace</p>
          <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight mt-1 text-[#0B132B]">
            Shift Handovers
          </h1>
          <p className="text-slate-500 mt-2 text-sm max-w-xl">
            Review incoming/outgoing shift continuity summaries, watch items, and safety flags without losing state.
          </p>
        </div>

        {patients.length > 0 && (
          <Link
            to={`/dashboard/patients/${patients[0].id}`}
            className="inline-flex items-center gap-2 rounded-full bg-[#1A5CFF] text-white px-5 py-3 text-sm font-semibold hover:opacity-95 transition-opacity shrink-0"
          >
            <MediQIcon name="plus" size={17} />
            Generate Shift Handover
          </Link>
        )}
      </section>

      {/* Filter Tabs & Patient Selector */}
      <section className="mediq-surface p-4 md:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex gap-1.5 w-full sm:w-auto overflow-x-auto">
          {(['all', 'needs_review', 'acknowledged'] as HandoverTab[]).map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
                activeTab === t
                  ? 'bg-[#1A5CFF] text-white'
                  : 'bg-slate-100 text-slate-600 hover:text-[#0B132B]'
              }`}
            >
              {t === 'all' ? 'All Handovers' : t === 'needs_review' ? 'Needs Review' : 'Acknowledged'}
            </button>
          ))}
        </div>

        {patients.length > 0 && (
          <select
            value={selectedPatient}
            onChange={e => setSelectedPatient(e.target.value)}
            className="w-full sm:w-64 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold mediq-focus"
          >
            <option value="all">All Assigned Patients</option>
            {patients.map(p => (
              <option key={p.id} value={p.id}>{p.full_name}</option>
            ))}
          </select>
        )}
      </section>

      {/* Content Area */}
      {loading ? (
        <div className="mediq-surface p-6">
          <SkeletonList count={3} />
        </div>
      ) : error ? (
        <ErrorState title="Handover Error" message={error} onRetry={loadHandovers} />
      ) : filteredHandovers.length === 0 ? (
        <EmptyState
          title={activeTab !== 'all' || selectedPatient !== 'all' ? 'No matching handovers' : 'No shift handovers yet'}
          description={
            activeTab !== 'all' || selectedPatient !== 'all'
              ? 'Try changing your filter settings.'
              : 'Generate a shift handover from an authorized patient profile workspace.'
          }
          icon="handovers"
        />
      ) : (
        <div className="space-y-4">
          {filteredHandovers.map(h => (
            <Link
              key={h.id}
              to={`/dashboard/handovers/${h.id}`}
              className="block mediq-surface p-6 hover:border-[#1A5CFF]/35 transition-all group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#1A5CFF] uppercase tracking-wider">{h.patient.full_name}</span>
                    <span className="text-xs text-slate-400">• {new Date(h.created_at).toLocaleString()}</span>
                  </div>
                  <h3 className="font-heading text-lg font-bold text-[#0B132B] mt-1 group-hover:text-[#1A5CFF] transition-colors">
                    Shift Handover Summary
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      h.acknowledged_by
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                        : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                    }`}
                  >
                    {h.acknowledged_by ? 'Acknowledged' : 'Needs Review'}
                  </span>
                  <MediQIcon name="arrow" size={18} className="text-[#1A5CFF]" />
                </div>
              </div>

              {/* SBAR & Summary Preview */}
              <div className="mt-4 space-y-3">
                <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">{h.summary_text}</p>

                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold">
                    {h.source_observation_ids?.length || 0} Observations Compiled
                  </span>
                  {h.priority_watch_items?.safety_flags && h.priority_watch_items.safety_flags.length > 0 && (
                    <span className="px-2.5 py-1 rounded-lg bg-red-50 text-red-700 text-xs font-semibold border border-red-100">
                      Safety Flags Active ({h.priority_watch_items.safety_flags.length})
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
