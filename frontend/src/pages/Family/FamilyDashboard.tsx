import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../services/api';
import { Patient, Observation } from '../../types/models';
import { LoadingState } from '../../components/ui/states';
import { Heart, Activity, Stethoscope } from '@/components/common/Icon';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';

export function FamilyDashboard() {
  const { user } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFamilyData() {
      try {
        const patientsData = await apiClient.get<Patient[]>('/api/v1/patients');
        if (patientsData.length > 0) {
          const primaryPatient = patientsData[0];
          setPatient(primaryPatient);
          
          const obsData = await apiClient.get<Observation[]>(`/api/v1/patients/${primaryPatient.id}/observations`);
          setObservations(obsData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
        }
      } catch (error) {
        console.error("Failed to fetch family dashboard data", error);
      } finally {
        setLoading(false);
      }
    }
    fetchFamilyData();
  }, []);

  if (loading) {
    return <LoadingState message="Loading your family dashboard..." className="h-[60vh]" />;
  }

  const displayName = user?.user_metadata?.full_name || 'Caregiver';

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <header className="bg-mediq-blue p-8 rounded-[32px] text-white shadow-md relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-sm font-semibold tracking-wider uppercase opacity-80 mb-2">Family View</p>
          <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight mb-2">
            Hello, {displayName}
          </h1>
          <p className="text-lg opacity-90 max-w-2xl">
            {patient ? `Here is the latest update for ${patient.full_name}.` : 'Welcome to your MediQ family portal.'}
          </p>
        </div>
        <div className="absolute -right-10 -bottom-10 opacity-10">
          <Heart className="w-64 h-64" />
        </div>
      </header>

      {!patient ? (
        <div className="bg-white p-8 rounded-[24px] border border-dashed border-border text-center">
          <Activity className="w-12 h-12 text-mediq-slate mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-mediq-navy">No Patient Connected</h2>
          <p className="text-mediq-slate mt-2">Your account has not been linked to a patient yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-[24px] border border-border shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-heading text-xl font-bold text-mediq-navy">Recent Care Timeline</h2>
                <Link to="/dashboard/observations/new" className="text-sm font-medium bg-mediq-blue text-white px-4 py-2 rounded-full hover:bg-mediq-blue/90 transition-colors">
                  + Add Note
                </Link>
              </div>
              
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                {observations.slice(0, 10).map((obs) => (
                  <div key={obs.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-200 group-[.is-active]:bg-mediq-blue text-white group-[.is-active]:text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white border border-border p-4 rounded-xl shadow-sm">
                      <div className="flex items-center justify-between space-x-2 mb-1">
                        <div className="font-bold text-mediq-navy capitalize">{obs.status} Note</div>
                        <time className="font-mono text-xs text-mediq-slate">{format(parseISO(obs.created_at), 'MMM dd, h:mm a')}</time>
                      </div>
                      <div className="text-sm text-slate-600 line-clamp-3">{obs.raw_text}</div>
                    </div>
                  </div>
                ))}
                
                {observations.length === 0 && (
                  <div className="text-center py-8 text-mediq-slate relative z-10 bg-white">
                    No notes have been added yet. 
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-[24px] border border-border shadow-sm">
              <h2 className="font-heading text-lg font-bold text-mediq-navy mb-4 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-mediq-blue" />
                Quick Guidance
              </h2>
              <p className="text-sm text-mediq-slate mb-4">
                Have a question about caring for {patient.full_name}? Search our approved clinical protocols.
              </p>
              <Link to="/dashboard/guidance" className="block w-full text-center bg-mediq-bg-blueTint text-mediq-blue py-3 rounded-xl font-semibold hover:bg-mediq-blue hover:text-white transition-colors">
                Search Guidance
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
