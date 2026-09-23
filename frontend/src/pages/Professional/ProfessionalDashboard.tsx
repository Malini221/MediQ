import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../services/api';
import { Patient, Handover } from '../../types/models';
import { LoadingState } from '../../components/ui/states';
import { ClipboardList, Activity, ArrowRight } from '@/components/common/Icon';
import { Link } from 'react-router-dom';

export function ProfessionalDashboard() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [handovers, setHandovers] = useState<Handover[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfessionalData() {
      try {
        const patientsData = await apiClient.get<Patient[]>('/api/v1/patients');
        setPatients(patientsData);
        
        const allHandovers: Handover[] = [];
        await Promise.all(patientsData.map(async (patient) => {
          try {
            const h = await apiClient.get<Handover[]>(`/api/v1/patients/${patient.id}/handovers`);
            allHandovers.push(...h);
          } catch (e) {
            console.error(`Failed to fetch handovers for ${patient.id}`, e);
          }
        }));
        
        setHandovers(allHandovers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      } catch (error) {
        console.error("Failed to fetch professional dashboard data", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProfessionalData();
  }, []);

  if (loading) {
    return <LoadingState message="Loading your shift dashboard..." className="h-[60vh]" />;
  }

  const displayName = user?.user_metadata?.full_name || 'Professional';
  const unacknowledgedHandovers = handovers.filter(h => !h.acknowledged_by);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <header className="bg-emerald-600 p-8 rounded-[32px] text-white shadow-md relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-sm font-semibold tracking-wider uppercase opacity-80 mb-2">Professional View</p>
          <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight mb-2">
            Shift Dashboard, {displayName}
          </h1>
          <p className="text-lg opacity-90 max-w-2xl">
            You have {unacknowledgedHandovers.length} pending handovers requiring acknowledgment for your upcoming shift.
          </p>
        </div>
        <div className="absolute -right-10 -bottom-10 opacity-10">
          <ClipboardList className="w-64 h-64" />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-[24px] border border-border shadow-sm">
            <h2 className="font-heading text-xl font-bold text-mediq-navy mb-4">Pending Shift Handovers</h2>
            
            <div className="space-y-4">
              {unacknowledgedHandovers.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-border rounded-xl">
                  <Activity className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                  <p className="text-mediq-slate font-medium">All caught up! No pending handovers.</p>
                </div>
              ) : (
                unacknowledgedHandovers.map(handover => {
                  const patient = patients.find(p => p.id === handover.patient_id);
                  return (
                    <Link key={handover.id} to={`/dashboard/handovers/${handover.id}`} className="block p-5 bg-mediq-bg-light rounded-xl border border-border hover:border-mediq-blue hover:shadow-sm transition-all group">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-mediq-navy text-lg">{patient?.full_name || 'Unknown Patient'}</h3>
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-bold">Needs Acknowledgment</span>
                      </div>
                      <p className="text-sm text-mediq-slate line-clamp-2 mb-3">{handover.summary_text}</p>
                      <div className="flex items-center text-sm font-medium text-mediq-blue group-hover:translate-x-1 transition-transform">
                        Review Handover <ArrowRight className="w-4 h-4 ml-1" />
                      </div>
                    </Link>
                  )
                })
              )}
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[24px] border border-border shadow-sm">
            <h2 className="font-heading text-lg font-bold text-mediq-navy mb-4">My Patients</h2>
            <div className="space-y-3">
              {patients.map(p => (
                <Link key={p.id} to={`/dashboard/patients/${p.id}/observations/new`} className="flex justify-between items-center p-3 hover:bg-mediq-bg-blueTint rounded-xl transition-colors border border-transparent hover:border-mediq-blue/20">
                  <span className="font-medium text-mediq-navy">{p.full_name}</span>
                  <span className="text-xs font-medium bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md">
                    + Note
                  </span>
                </Link>
              ))}
              {patients.length === 0 && (
                <p className="text-sm text-mediq-slate text-center py-4">No active assignments</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
