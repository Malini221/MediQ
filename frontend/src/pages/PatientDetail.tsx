import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { patientService } from '../services/patients';
import { handoversService } from '../services/handovers';
import { clinicalGuidanceService } from '../services/clinicalGuidance';
import { Patient, Observation, Handover, ClinicalGuidanceResult } from '../types/models';
import { ErrorState, EmptyState, SkeletonCard } from '../components/ui/states';
import { MediQIcon } from '../components/common/MediQIcon';

type WorkspaceTab = 'overview' | 'observations' | 'handovers' | 'guidance';

export function PatientDetail() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [handovers, setHandovers] = useState<Handover[]>([]);
  const [guidance, setGuidance] = useState<ClinicalGuidanceResult[]>([]);
  
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingHandover, setGeneratingHandover] = useState(false);

  useEffect(() => {
    async function loadPatientData() {
      if (!patientId) return;

      try {
        setLoading(true);
        setError(null);
        
        const [pData, obsData, hData] = await Promise.all([
          patientService.getPatient(patientId),
          patientService.getPatientObservations(patientId),
          handoversService.getPatientHandovers(patientId).catch(() => [])
        ]);

        setPatient(pData);
        setObservations(obsData.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)));
        setHandovers(hData.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)));

        // Automatically fetch relevant clinical guidance if diagnosis exists
        if (pData.primary_diagnosis) {
          clinicalGuidanceService.searchClinicalGuidance(pData.primary_diagnosis, 3)
            .then(setGuidance)
            .catch(() => {});
        }
      } catch (err: any) {
        console.error('Failed to fetch patient details:', err);
        if (err?.status === 404 || err?.status === 403) {
          setError('Patient unavailable or you are not authorized to view this record.');
        } else {
          setError(err?.message || 'Unable to load patient record at this time.');
        }
      } finally {
        setLoading(false);
      }
    }

    loadPatientData();
  }, [patientId]);

  const handleGenerateHandover = async () => {
    if (!patientId) return;
    try {
      setGeneratingHandover(true);
      const handover = await handoversService.generateHandover(patientId);
      setHandovers(prev => [handover, ...prev]);
      setActiveTab('handovers');
    } catch (err: any) {
      console.error('Failed to generate handover:', err);
      alert('Failed to generate handover. Make sure there are recent observations for this patient.');
    } finally {
      setGeneratingHandover(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 mediq-reveal">
        <section className="mediq-surface p-6 md:p-8">
          <div className="h-4 w-32 bg-slate-100 animate-pulse rounded mb-2" />
          <div className="h-8 w-64 bg-slate-100 animate-pulse rounded" />
        </section>
        <SkeletonCard />
      </div>
    );
  }

  if (error || !patient) {
    return <ErrorState title="Patient Unavailable" message={error || 'Patient record not found.'} onRetry={() => window.location.reload()} />;
  }

  const getAge = (dob?: string) => {
    if (!dob) return null;
    try {
      const diff = Date.now() - new Date(dob).getTime();
      const ageDate = new Date(diff);
      return Math.abs(ageDate.getUTCFullYear() - 1970);
    } catch {
      return null;
    }
  };
  const age = getAge(patient.date_of_birth);

  return (
    <div className="space-y-6 mediq-reveal pb-10">
      {/* Patient Workspace Header */}
      <section className="mediq-surface p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Link
            to="/dashboard/patients"
            className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:text-[#0B132B] hover:border-slate-300 transition-colors shrink-0"
            aria-label="Back to Patients"
          >
            <MediQIcon name="arrow" size={16} className="rotate-180" />
          </Link>
          <div className="w-14 h-14 rounded-2xl bg-[#1A5CFF]/10 text-[#1A5CFF] font-bold text-xl flex items-center justify-center shrink-0">
            {patient.full_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-2xl md:text-3xl font-bold text-[#0B132B]">{patient.full_name}</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                {age !== null ? `${age} yrs` : 'Age unknown'}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Primary Diagnosis: <span className="font-semibold text-[#0B132B]">{patient.primary_diagnosis || 'Not set'}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to={`/dashboard/patients/${patient.id}/observations/new`}
            className="inline-flex items-center gap-2 rounded-full bg-[#1A5CFF] text-white px-5 py-2.5 text-sm font-semibold hover:opacity-95 transition-opacity"
          >
            <MediQIcon name="plus" size={16} />
            Record Note
          </Link>

          <button
            onClick={handleGenerateHandover}
            disabled={generatingHandover}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-semibold text-[#0B132B] hover:border-[#1A5CFF] transition-all disabled:opacity-50"
          >
            <MediQIcon name="handovers" size={16} />
            {generatingHandover ? 'Generating...' : 'Generate Handover'}
          </button>
        </div>
      </section>

      {/* Navigation Tabs for Workspace Context */}
      <section className="mediq-surface p-2 flex gap-1 overflow-x-auto">
        {(['overview', 'observations', 'handovers', 'guidance'] as WorkspaceTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold capitalize whitespace-nowrap transition-all ${
              activeTab === tab
                ? 'bg-[#1A5CFF] text-white'
                : 'text-slate-600 hover:text-[#0B132B] hover:bg-slate-50'
            }`}
          >
            {tab === 'overview' ? 'Patient Overview' : tab}
            {tab === 'observations' && ` (${observations.length})`}
            {tab === 'handovers' && ` (${handovers.length})`}
          </button>
        ))}
      </section>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Baseline Conditions */}
            <div className="mediq-surface p-6 space-y-4">
              <h2 className="font-heading text-lg font-bold text-[#0B132B]">Baseline Health Indicators</h2>
              {patient.baseline_conditions && Object.keys(patient.baseline_conditions).length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(patient.baseline_conditions).map(([key, val]) => (
                    <div key={key} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider capitalize">{key.replace(/_/g, ' ')}</p>
                      <p className="text-sm font-semibold text-[#0B132B] mt-1">{String(val)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No baseline health indicators logged yet for this patient.</p>
              )}
            </div>

            {/* Recent Observations Timeline */}
            <div className="mediq-surface p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-lg font-bold text-[#0B132B]">Recent Care Observations</h2>
                <button onClick={() => setActiveTab('observations')} className="text-xs font-semibold text-[#1A5CFF]">
                  View all ({observations.length})
                </button>
              </div>

              {observations.length === 0 ? (
                <EmptyState
                  title="No observations logged for this patient"
                  description="Start by capturing a text note or recording a voice observation."
                  actionText="Add First Observation"
                  onAction={() => navigate(`/dashboard/patients/${patient.id}/observations/new`)}
                  icon="observations"
                />
              ) : (
                <div className="space-y-3">
                  {observations.slice(0, 4).map(obs => (
                    <Link
                      key={obs.id}
                      to={`/dashboard/observations/${obs.id}`}
                      className="block rounded-2xl border border-slate-100 bg-slate-50 p-4 hover:border-[#1A5CFF]/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-sm text-[#0B132B]">{obs.raw_text || 'Voice observation'}</p>
                          <p className="text-xs text-slate-400 mt-1">{new Date(obs.created_at).toLocaleString()}</p>
                        </div>
                        <span className="px-2 py-1 rounded-full bg-slate-200 text-slate-700 text-xs font-semibold capitalize shrink-0">
                          {obs.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column Context Panel */}
          <div className="space-y-6">
            <div className="mediq-surface p-6 space-y-4">
              <h2 className="font-heading text-lg font-bold text-[#0B132B]">Shift Handover Status</h2>
              {handovers.length === 0 ? (
                <div>
                  <p className="text-sm text-slate-500">No shift handovers generated yet.</p>
                  <button
                    onClick={handleGenerateHandover}
                    disabled={generatingHandover}
                    className="mt-4 w-full rounded-full bg-[#1A5CFF] text-white py-2.5 text-xs font-semibold"
                  >
                    Generate First Handover
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                    <p className="text-xs font-semibold text-[#1A5CFF]">Latest Handover</p>
                    <p className="text-xs text-slate-500 mt-1">{new Date(handovers[0].created_at).toLocaleString()}</p>
                    <p className="text-sm text-[#0B132B] mt-2 line-clamp-2">{handovers[0].summary_text}</p>
                    <button
                      onClick={() => setActiveTab('handovers')}
                      className="text-xs font-semibold text-[#1A5CFF] mt-3 block"
                    >
                      Open Handover Detail &rarr;
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Condition Guidance Context */}
            {guidance.length > 0 && (
              <div className="mediq-surface p-6 space-y-3">
                <p className="mediq-kicker">Condition Guidance</p>
                <h3 className="font-heading text-base font-bold text-[#0B132B]">Approved Protocol Match</h3>
                <div className="rounded-xl border border-[#1A5CFF]/20 bg-[#1A5CFF]/5 p-4">
                  <p className="font-semibold text-sm text-[#0B132B]">{guidance[0].title}</p>
                  <p className="text-xs text-slate-600 mt-1.5 line-clamp-3">{guidance[0].content}</p>
                  <button
                    onClick={() => setActiveTab('guidance')}
                    className="text-xs font-semibold text-[#1A5CFF] mt-3 inline-block"
                  >
                    Read full protocol &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'observations' && (
        <div className="space-y-4">
          {observations.length === 0 ? (
            <EmptyState
              title="No observations for this patient yet"
              description="Capture text notes or voice dictations for this patient."
              actionText="Record Note"
              onAction={() => navigate(`/dashboard/patients/${patient.id}/observations/new`)}
              icon="observations"
            />
          ) : (
            <div className="space-y-3">
              {observations.map(obs => (
                <Link
                  key={obs.id}
                  to={`/dashboard/observations/${obs.id}`}
                  className="block mediq-surface p-5 hover:border-[#1A5CFF]/35 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-[#0B132B]">{obs.raw_text || 'Voice observation'}</p>
                      <p className="text-xs text-slate-400 mt-1">{new Date(obs.created_at).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-xs font-semibold capitalize text-slate-600">
                        {obs.status}
                      </span>
                      <MediQIcon name="arrow" size={16} className="text-[#1A5CFF]" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'handovers' && (
        <div className="space-y-4">
          {handovers.length === 0 ? (
            <EmptyState
              title="No handovers generated"
              description="Handovers compile recent patient observations into shift summaries."
              actionText="Generate Handover Now"
              onAction={handleGenerateHandover}
              icon="handovers"
            />
          ) : (
            <div className="space-y-3">
              {handovers.map(h => (
                <Link
                  key={h.id}
                  to={`/dashboard/handovers/${h.id}`}
                  className="block mediq-surface p-5 hover:border-[#1A5CFF]/35 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold">
                          Shift Handover
                        </span>
                        <span className="text-xs text-slate-400">{new Date(h.created_at).toLocaleString()}</span>
                      </div>
                      <p className="font-semibold text-sm text-[#0B132B] mt-2">{h.summary_text}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${h.acknowledged_by ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {h.acknowledged_by ? 'Acknowledged' : 'Needs Review'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'guidance' && (
        <div className="space-y-4">
          {guidance.length === 0 ? (
            <EmptyState
              title="No condition guidance loaded"
              description="Search the clinical guidance library for condition protocols."
              actionText="Open Guidance Search"
              actionLink="/dashboard/guidance"
              icon="guidance"
            />
          ) : (
            <div className="space-y-4">
              {guidance.map(g => (
                <div key={g.id} className="mediq-surface p-6 space-y-3">
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                    {g.category}
                  </span>
                  <h3 className="font-heading text-lg font-bold text-[#0B132B]">{g.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{g.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
