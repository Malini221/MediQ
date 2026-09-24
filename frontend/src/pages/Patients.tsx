import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { patientService } from '../services/patients';
import { Patient } from '../types/models';
import { ErrorState, EmptyState, SkeletonCard } from '../components/ui/states';
import { MediQIcon } from '../components/common/MediQIcon';

export function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [conditionFilter, setConditionFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await patientService.getPatients();
      setPatients(data);
    } catch (err: any) {
      console.error('Failed to fetch patients:', err);
      setError(err?.message || 'Unable to load authorized patients at this time.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const conditions = useMemo(() => {
    const set = new Set<string>();
    patients.forEach(p => {
      if (p.primary_diagnosis) set.add(p.primary_diagnosis);
    });
    return Array.from(set);
  }, [patients]);

  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      const matchesSearch =
        p.full_name.toLowerCase().includes(search.toLowerCase()) ||
        (p.primary_diagnosis && p.primary_diagnosis.toLowerCase().includes(search.toLowerCase()));
      const matchesCondition = conditionFilter === 'all' || p.primary_diagnosis === conditionFilter;
      return matchesSearch && matchesCondition;
    });
  }, [patients, search, conditionFilter]);

  return (
    <div className="space-y-6 mediq-reveal pb-10">
      <section className="mediq-surface p-6 md:p-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="mediq-kicker">Patient Directory Workspace</p>
          <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight mt-1 text-[#0B132B]">
            Your Authorized Patients
          </h1>
          <p className="text-slate-500 mt-2 text-sm max-w-xl">
            Access patient profiles, review baseline health conditions, and inspect history without leaving this workspace.
          </p>
        </div>
        <div className="shrink-0 rounded-2xl bg-[#1A5CFF]/10 text-[#1A5CFF] px-4 py-2.5 text-xs font-bold uppercase tracking-wider">
          {patients.length} Active {patients.length === 1 ? 'Patient' : 'Patients'}
        </div>
      </section>

      {/* Filter & Search Bar */}
      <section className="mediq-surface p-4 md:p-5 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search patients by name or condition..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm mediq-focus"
          />
        </div>
        {conditions.length > 0 && (
          <select
            value={conditionFilter}
            onChange={e => setConditionFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm mediq-focus md:w-64"
          >
            <option value="all">All Conditions</option>
            {conditions.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
      </section>

      {/* Content Rendering */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : error ? (
        <ErrorState title="Access Error" message={error} onRetry={loadPatients} />
      ) : filteredPatients.length === 0 ? (
        <EmptyState
          title={search || conditionFilter !== 'all' ? 'No matching patients found' : 'No patients assigned yet'}
          description={
            search || conditionFilter !== 'all'
              ? 'Try adjusting your search terms or clearing filters.'
              : 'Patients assigned to your care will automatically appear here once authorized.'
          }
          icon="patients"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map(patient => (
            <PatientCard key={patient.id} patient={patient} />
          ))}
        </div>
      )}
    </div>
  );
}

function PatientCard({ patient }: { patient: Patient }) {
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
    <div className="mediq-surface p-6 flex flex-col justify-between hover:border-[#1A5CFF]/35 transition-all">
      <div>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="font-heading text-xl font-bold text-[#0B132B] truncate" title={patient.full_name}>
              {patient.full_name}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {age !== null ? `${age} yrs old` : 'Age not recorded'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#1A5CFF]/10 text-[#1A5CFF] font-bold flex items-center justify-center text-sm shrink-0">
            {patient.full_name.charAt(0).toUpperCase()}
          </div>
        </div>

        <div className="space-y-3 pt-3 border-t border-slate-100">
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Primary Condition</p>
            <p className="text-sm font-semibold text-[#0B132B] mt-0.5">
              {patient.primary_diagnosis || 'No primary diagnosis set'}
            </p>
          </div>

          {patient.baseline_conditions && Object.keys(patient.baseline_conditions).length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Baseline Indicators</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(patient.baseline_conditions).slice(0, 3).map(([k, v]) => (
                  <span key={k} className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-medium capitalize">
                    {k.replace(/_/g, ' ')}: {String(v)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100">
        <Link
          to={`/dashboard/patients/${patient.id}`}
          className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-[#0B132B] hover:bg-[#1A5CFF] hover:text-white hover:border-[#1A5CFF] transition-all"
        >
          Open Patient Workspace
          <MediQIcon name="arrow" size={16} />
        </Link>
      </div>
    </div>
  );
}

