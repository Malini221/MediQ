import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { patientService } from '../services/patients';
import { Patient } from '../types/models';
import { LoadingState, ErrorState, EmptyState } from '../components/ui/states';
import { Users, ChevronRight, Calendar } from '@/components/common/Icon';

export function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPatients() {
      try {
        const data = await patientService.getPatients();
        setPatients(data);
      } catch (err: any) {
        console.error('Failed to fetch patients:', err);
        setError(err.message || 'Unable to load patients at this time.');
      } finally {
        setLoading(false);
      }
    }
    loadPatients();
  }, []);

  if (loading) {
    return <LoadingState message="Loading assigned patients..." className="h-[60vh]" />;
  }

  if (error) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <ErrorState title="Access Error" message={error} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <header className="space-y-3 bg-white p-8 rounded-[24px] border border-border shadow-sm">
        <p className="text-sm font-semibold text-mediq-blue tracking-wider uppercase">Patients</p>
        <h1 className="font-heading text-3xl font-bold text-mediq-navy tracking-tight">
          Your assigned patients
        </h1>
        <p className="text-mediq-slate max-w-2xl">
          Access the care information you're authorized to view.
        </p>
      </header>

      {patients.length === 0 ? (
        <EmptyState 
          title="No patients assigned yet" 
          description="Patients assigned to your care will appear here automatically."
          icon={Users}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {patients.map((patient) => (
            <PatientCard key={patient.id} patient={patient} />
          ))}
        </div>
      )}
    </div>
  );
}

function PatientCard({ patient }: { patient: Patient }) {
  // Format age safely if date_of_birth exists
  const getAge = (dob: string) => {
    try {
      const diff_ms = Date.now() - new Date(dob).getTime();
      const age_dt = new Date(diff_ms); 
      return Math.abs(age_dt.getUTCFullYear() - 1970);
    } catch {
      return null;
    }
  };

  const age = getAge(patient.date_of_birth);

  return (
    <div className="group bg-white rounded-[24px] border border-border p-6 shadow-sm hover:shadow-md hover:shadow-mediq-blue/5 hover:border-mediq-blue/20 hover:-translate-y-1 transition-all duration-300 flex flex-col">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="font-heading text-xl font-bold text-mediq-navy tracking-tight truncate max-w-[200px]" title={patient.full_name}>
            {patient.full_name}
          </h3>
          <p className="text-sm text-mediq-slate mt-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {age !== null ? `${age} yrs` : 'Age unknown'}
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-mediq-bg-blueTint flex items-center justify-center text-mediq-blue font-bold text-sm">
          {patient.full_name.charAt(0).toUpperCase()}
        </div>
      </div>

      <div className="flex-1 space-y-4 mb-6">
        <div>
          <p className="text-xs font-semibold text-mediq-slate uppercase tracking-wider mb-1">Primary Note</p>
          <p className="text-sm text-foreground line-clamp-2">
            {patient.primary_diagnosis || "No primary record available"}
          </p>
        </div>
      </div>

      <Link
        to={`/dashboard/patients/${patient.id}`}
        className="w-full inline-flex items-center justify-center gap-2 bg-mediq-bg-light text-mediq-navy border border-border py-2.5 rounded-full text-sm font-medium hover:bg-mediq-blue hover:text-white hover:border-mediq-blue focus:outline-none focus:ring-4 focus:ring-mediq-blue/20 transition-all group-hover:bg-mediq-blue group-hover:text-white"
      >
        View patient <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
