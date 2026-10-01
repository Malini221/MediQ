import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { patientService } from '../services/patients';
import { handoversService } from '../services/handovers';
import { useNotifications } from '../contexts/NotificationContext';
import { Patient, Observation, Handover } from '../types/models';
import { Link, Navigate } from 'react-router-dom';
import { MediQIcon } from '../components/common/MediQIcon';
import { ErrorState, EmptyState, SkeletonCard } from '../components/ui/states';

interface OverviewData {
  patients: Patient[];
  observations: (Observation & { patientName?: string })[];
  handovers: (Handover & { patientName?: string })[];
}

export function Overview() {
  const { user } = useAuth();
  const { notifications } = useNotifications();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const systemRole = user?.user_metadata?.system_role;

  useEffect(() => {
    async function loadOverview() {
      if (systemRole && systemRole !== 'caregiver' && systemRole !== 'professional_caregiver' && systemRole !== 'family_caregiver') {
        return;
      }
      try {
        setLoading(true);
        setError(null);
        // Fetch real authorized patients
        const pts = await patientService.getPatients();
        
        // Fetch observations and handovers across patients concurrently
        const obsPromises = pts.map(async p => {
          try {
            const list = await patientService.getPatientObservations(p.id);
            return list.map(o => ({ ...o, patientName: p.full_name }));
          } catch {
            return [];
          }
        });

        const handoverPromises = pts.map(async p => {
          try {
            const list = await handoversService.getPatientHandovers(p.id);
            return list.map(h => ({ ...h, patientName: p.full_name }));
          } catch {
            return [];
          }
        });

        const [obsResults, handoverResults] = await Promise.all([
          Promise.all(obsPromises),
          Promise.all(handoverPromises)
        ]);

        const allObs = obsResults.flat().sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
        const allHandovers = handoverResults.flat().sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));

        setData({
          patients: pts,
          observations: allObs,
          handovers: allHandovers
        });
      } catch (err: any) {
        console.error('Failed to load overview data:', err);
        setError(err?.message || 'Unable to load workspace overview.');
      } finally {
        setLoading(false);
      }
    }

    loadOverview();
  }, [systemRole]);

  // Role redirects for non-caregivers
  if (systemRole === 'patient') return <Navigate to="/dashboard/patient" replace />;
  if (systemRole === 'clinician') return <Navigate to="/dashboard/clinician" replace />;
  if (systemRole === 'coordinator') return <Navigate to="/dashboard/coordinator" replace />;

  const displayName = user?.user_metadata?.full_name || user?.email || 'Caregiver';

  if (loading) {
    return (
      <div className="space-y-6 mediq-reveal">
        <section className="mediq-surface p-6 md:p-8">
          <div className="h-4 w-28 bg-slate-100 animate-pulse rounded mb-2" />
          <div className="h-8 w-64 bg-slate-100 animate-pulse rounded mb-2" />
          <div className="h-4 w-96 bg-slate-100 animate-pulse rounded" />
        </section>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Overview Unavailable" message={error} onRetry={() => window.location.reload()} />;
  }

  const { patients = [], observations = [], handovers = [] } = data || {};
  const pendingObsCount = observations.filter(o => o.status === 'pending').length;
  const escalatedObs = observations.filter(o => o.status === 'escalated' || o.priority_score >= 8);
  const unacknowledgedHandovers = handovers.filter(h => !h.acknowledged_by);
  const unreadAlerts = notifications.filter(n => !n.read && (n.type === 'SAFETY' || n.type === 'PRIORITY'));

  return (
    <div className="space-y-8 mediq-reveal pb-10">
      {/* Header Banner */}
      <section className="mediq-surface p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <p className="mediq-kicker">Caregiver Command Center</p>
          <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight mt-1 text-[#0B132B]">
            Welcome back, {displayName}
          </h1>
          <p className="text-slate-500 mt-2 text-sm max-w-xl">
            Here is your daily care summary, active patient tasks, and high-priority items requiring attention.
          </p>
        </div>
        <Link
          to="/dashboard/observations/new"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1A5CFF] text-white px-5 py-3 text-sm font-semibold hover:opacity-95 transition-opacity shrink-0"
        >
          <MediQIcon name="plus" size={17} />
          New Observation
        </Link>
      </section>

      {/* Today's Care Snapshot Grid */}
      <section className="space-y-4">
        <h2 className="font-heading text-lg font-bold text-[#0B132B]">Today's Care Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="mediq-surface p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400 font-semibold">Assigned Patients</p>
              <div className="w-8 h-8 rounded-xl bg-[#1A5CFF]/10 text-[#1A5CFF] flex items-center justify-center">
                <MediQIcon name="patients" size={16} />
              </div>
            </div>
            <p className="font-heading text-3xl font-bold mt-3 text-[#0B132B]">{patients.length}</p>
            <Link to="/dashboard/patients" className="text-xs font-semibold text-[#1A5CFF] mt-2 inline-block">
              View Directory &rarr;
            </Link>
          </div>

          <div className="mediq-surface p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400 font-semibold">Pending Review</p>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <MediQIcon name="observations" size={16} />
              </div>
            </div>
            <p className="font-heading text-3xl font-bold mt-3 text-[#0B132B]">{pendingObsCount}</p>
            <Link to="/dashboard/observations" className="text-xs font-semibold text-[#1A5CFF] mt-2 inline-block">
              Confirm Observations &rarr;
            </Link>
          </div>

          <div className="mediq-surface p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400 font-semibold">Pending Handovers</p>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <MediQIcon name="handovers" size={16} />
              </div>
            </div>
            <p className="font-heading text-3xl font-bold mt-3 text-[#0B132B]">{unacknowledgedHandovers.length}</p>
            <Link to="/dashboard/handovers" className="text-xs font-semibold text-[#1A5CFF] mt-2 inline-block">
              Acknowledge Shift &rarr;
            </Link>
          </div>

          <div className="mediq-surface p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400 font-semibold">Priority Alerts</p>
              <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <MediQIcon name="shield" size={16} />
              </div>
            </div>
            <p className="font-heading text-3xl font-bold mt-3 text-[#0B132B]">{escalatedObs.length + unreadAlerts.length}</p>
            <Link to="/dashboard/notifications" className="text-xs font-semibold text-[#1A5CFF] mt-2 inline-block">
              Review Alerts &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Attention Required Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-[#0B132B]">Attention Required</h2>
          <span className="text-xs text-slate-500 font-medium">Real-time status</span>
        </div>

        {escalatedObs.length === 0 && unacknowledgedHandovers.length === 0 ? (
          <div className="mediq-surface p-6 text-center border-dashed">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-3">
              <MediQIcon name="check" size={20} />
            </div>
            <p className="font-semibold text-sm text-[#0B132B]">No high-priority alerts right now</p>
            <p className="text-xs text-slate-500 mt-1">All observations and shift handovers are up to date for your assigned patients.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {escalatedObs.map((obs) => (
              <div key={obs.id} className="mediq-surface p-5 border-l-4 border-l-red-500 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-wider">
                      Priority Escalation
                    </span>
                    <span className="text-xs font-semibold text-[#1A5CFF]">{obs.patientName}</span>
                  </div>
                  <p className="font-semibold text-sm mt-1.5 text-[#0B132B] line-clamp-1">
                    {obs.raw_text || 'Priority voice observation'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{new Date(obs.created_at).toLocaleString()}</p>
                </div>
                <Link
                  to={`/dashboard/observations/${obs.id}`}
                  className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold hover:border-[#1A5CFF] transition-colors shrink-0 text-center"
                >
                  Review Record
                </Link>
              </div>
            ))}

            {unacknowledgedHandovers.map((h) => (
              <div key={h.id} className="mediq-surface p-5 border-l-4 border-l-amber-500 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold uppercase tracking-wider">
                      Unacknowledged Handover
                    </span>
                    <span className="text-xs font-semibold text-[#1A5CFF]">{h.patientName}</span>
                  </div>
                  <p className="font-semibold text-sm mt-1.5 text-[#0B132B] line-clamp-1">
                    {h.summary_text || 'Shift handover awaiting review'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{new Date(h.created_at).toLocaleString()}</p>
                </div>
                <Link
                  to={`/dashboard/handovers/${h.id}`}
                  className="rounded-full bg-[#1A5CFF] text-white px-4 py-2 text-xs font-semibold hover:opacity-95 transition-opacity shrink-0 text-center"
                >
                  Acknowledge Shift
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Quick Actions Panel */}
      <section className="space-y-4">
        <h2 className="font-heading text-lg font-bold text-[#0B132B]">Caregiver Shortcuts</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/dashboard/observations/new"
            className="mediq-surface p-5 hover:border-[#1A5CFF]/40 transition-colors flex items-center gap-4 group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#1A5CFF]/10 text-[#1A5CFF] flex items-center justify-center shrink-0 group-hover:bg-[#1A5CFF] group-hover:text-white transition-colors">
              <MediQIcon name="plus" size={18} />
            </div>
            <div>
              <p className="font-semibold text-sm text-[#0B132B]">New Observation</p>
              <p className="text-xs text-slate-400 mt-0.5">Record voice or text</p>
            </div>
          </Link>

          <Link
            to="/dashboard/patients"
            className="mediq-surface p-5 hover:border-[#1A5CFF]/40 transition-colors flex items-center gap-4 group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <MediQIcon name="patients" size={18} />
            </div>
            <div>
              <p className="font-semibold text-sm text-[#0B132B]">View Patients</p>
              <p className="text-xs text-slate-400 mt-0.5">Access authorized list</p>
            </div>
          </Link>

          <Link
            to="/dashboard/handovers"
            className="mediq-surface p-5 hover:border-[#1A5CFF]/40 transition-colors flex items-center gap-4 group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <MediQIcon name="handovers" size={18} />
            </div>
            <div>
              <p className="font-semibold text-sm text-[#0B132B]">Review Handovers</p>
              <p className="text-xs text-slate-400 mt-0.5">Check shift updates</p>
            </div>
          </Link>

          <Link
            to="/dashboard/guidance"
            className="mediq-surface p-5 hover:border-[#1A5CFF]/40 transition-colors flex items-center gap-4 group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <MediQIcon name="guidance" size={18} />
            </div>
            <div>
              <p className="font-semibold text-sm text-[#0B132B]">Clinical Guidance</p>
              <p className="text-xs text-slate-400 mt-0.5">Search approved protocols</p>
            </div>
          </Link>
        </div>
      </section>

      {/* Recent Activity Timeline */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-[#0B132B]">Recent Activity</h2>
          <Link to="/dashboard/observations" className="text-xs font-semibold text-[#1A5CFF]">
            View all &rarr;
          </Link>
        </div>

        {observations.length === 0 ? (
          <EmptyState
            title="No recent care observations"
            description="When you or your team create observations for assigned patients, recent activity will appear here."
            actionText="Record First Observation"
            actionLink="/dashboard/observations/new"
            icon="observations"
          />
        ) : (
          <div className="space-y-3">
            {observations.slice(0, 5).map((obs) => (
              <Link
                key={obs.id}
                to={`/dashboard/observations/${obs.id}`}
                className="block mediq-surface p-5 hover:border-[#1A5CFF]/35 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#1A5CFF]">{obs.patientName || 'Assigned Patient'}</p>
                    <p className="font-semibold text-sm mt-1 text-[#0B132B] truncate">{obs.raw_text || 'Voice observation'}</p>
                    <p className="text-xs text-slate-400 mt-2">{new Date(obs.created_at).toLocaleString()}</p>
                  </div>
                  <div className="shrink-0 flex items-center gap-3">
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
      </section>
    </div>
  );
}

