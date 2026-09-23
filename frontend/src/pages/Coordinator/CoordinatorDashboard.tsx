import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../services/api';
import { Patient, Observation } from '../../types/models';
import { LoadingState } from '../../components/ui/states';
import { AlertTriangle, Clock, CheckCircle2 } from '@/components/common/Icon';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';

export function CoordinatorDashboard() {
  const { } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [escalations, setEscalations] = useState<(Observation & { patient_name: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTriageFeed() {
      try {
        const patientsData = await apiClient.get<Patient[]>('/api/v1/patients');
        setPatients(patientsData);

        // Fetch observations for all assigned patients to build triage feed
        const allObservations: (Observation & { patient_name: string })[] = [];
        
        await Promise.all(patientsData.map(async (patient) => {
          try {
            const obs = await apiClient.get<Observation[]>(`/api/v1/patients/${patient.id}/observations`);
            obs.forEach(o => {
              allObservations.push({ ...o, patient_name: patient.full_name });
            });
          } catch (e) {
            console.error(`Failed to fetch obs for patient ${patient.id}`, e);
          }
        }));

        // Sort by priority score and then by date
        const sorted = allObservations
          .filter(o => o.status === 'escalated' || o.priority_score > 40)
          .sort((a, b) => b.priority_score - a.priority_score || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          
        setEscalations(sorted);
      } catch (error) {
        console.error("Failed to fetch triage feed", error);
      } finally {
        setLoading(false);
      }
    }
    fetchTriageFeed();
  }, []);

  if (loading) {
    return <LoadingState message="Loading Coordinator Triage Feed..." className="h-[60vh]" />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <header className="bg-white p-6 rounded-[24px] border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-mediq-blue tracking-wider uppercase">Coordinator View</p>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-mediq-navy tracking-tight">
            Triage & Escalation Feed
          </h1>
        </div>
        
        <div className="flex items-center gap-4 bg-red-50 text-red-700 px-4 py-2 rounded-xl border border-red-100">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-semibold">{escalations.filter(e => e.status === 'escalated').length} Active Escalations</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="font-heading text-xl font-bold text-mediq-navy px-1">Priority Alerts</h2>
          
          <div className="space-y-4">
            {escalations.length === 0 ? (
              <div className="bg-white p-8 rounded-[24px] border border-dashed border-border text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-mediq-navy">All Clear</h3>
                <p className="text-mediq-slate mt-1">No pending escalations or high-priority items across your assigned patients.</p>
              </div>
            ) : (
              escalations.map(esc => (
                <div key={esc.id} className="bg-white p-6 rounded-[24px] border border-red-200 shadow-sm relative overflow-hidden flex flex-col md:flex-row gap-6">
                  <div className="absolute left-0 top-0 bottom-0 w-2 bg-red-500"></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 uppercase tracking-wider">
                        {esc.status === 'escalated' ? 'Escalated' : 'High Priority'}
                      </span>
                      <span className="text-sm font-medium text-mediq-slate flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {format(parseISO(esc.created_at), 'MMM dd, HH:mm')}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-mediq-navy mb-1">{esc.patient_name}</h3>
                    <p className="text-mediq-slate">{esc.raw_text}</p>
                    
                    {esc.extracted_metadata && Object.keys(esc.extracted_metadata).length > 0 && (
                      <div className="mt-4 p-3 bg-mediq-bg-light rounded-xl border border-border grid grid-cols-2 gap-2 text-sm">
                        {Object.entries(esc.extracted_metadata).map(([k, v]) => {
                          if (typeof v === 'string' || typeof v === 'number') {
                            return (
                              <div key={k} className="flex flex-col">
                                <span className="text-mediq-slate capitalize">{k.replace('_', ' ')}</span>
                                <span className="font-medium text-mediq-navy">{v}</span>
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col justify-center gap-3 md:border-l md:border-border md:pl-6 min-w-[140px]">
                    <div className="text-center">
                      <div className="text-3xl font-black text-red-500">{esc.priority_score}</div>
                      <div className="text-xs font-medium text-mediq-slate uppercase tracking-wider mt-1">Priority Score</div>
                    </div>
                    <Link 
                      to={`/dashboard/observations/${esc.id}`}
                      className="text-center bg-white border border-border text-mediq-navy py-2 rounded-xl text-sm font-medium hover:bg-secondary transition-colors shadow-sm"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[24px] border border-border shadow-sm">
            <h2 className="font-heading text-lg font-bold text-mediq-navy mb-4">Patient Roster</h2>
            <div className="space-y-3">
              {patients.map(p => (
                <Link key={p.id} to={`/dashboard/patients/${p.id}`} className="flex justify-between items-center p-3 hover:bg-mediq-bg-blueTint rounded-xl transition-colors">
                  <span className="font-medium text-mediq-navy">{p.full_name}</span>
                  <span className="text-xs text-mediq-slate bg-mediq-bg-light px-2 py-1 rounded-md border border-border">
                    {allObservationsCount(p.id)} events
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  function allObservationsCount(patientId: string) {
    return escalations.filter(e => e.patient_id === patientId).length;
  }
}
