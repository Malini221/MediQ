import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../services/api';
import { Patient, Observation } from '../../types/models';
import { LoadingState } from '../../components/ui/states';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, Activity, AlertCircle } from '@/components/common/Icon';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';

export function ClinicianDashboard() {
  const { } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPatients() {
      try {
        const data = await apiClient.get<Patient[]>('/api/v1/patients');
        setPatients(data);
        if (data.length > 0) {
          setSelectedPatientId(data[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch patients", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPatients();
  }, []);

  useEffect(() => {
    async function fetchObservations() {
      if (!selectedPatientId) return;
      try {
        const data = await apiClient.get<Observation[]>(`/api/v1/patients/${selectedPatientId}/observations`);
        // Filter out unconfirmed and sort chronologically for chart
        const confirmed = data.filter(o => o.status === 'confirmed').sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        setObservations(confirmed);
      } catch (error) {
        console.error("Failed to fetch observations", error);
      }
    }
    fetchObservations();
  }, [selectedPatientId]);

  if (loading) {
    return <LoadingState message="Loading Clinician Dashboard..." className="h-[60vh]" />;
  }

  // Derive trends from observations
  const chartData = observations.map(obs => {
    const sleep = parseFloat(obs.extracted_metadata?.sleep_hours) || 0;
    const moodScore = obs.extracted_metadata?.mood?.toLowerCase() === 'agitated' ? 2 : 
                      obs.extracted_metadata?.mood?.toLowerCase() === 'calm' ? 8 : 5;
    
    return {
      date: format(parseISO(obs.created_at), 'MMM dd HH:mm'),
      sleep: sleep,
      moodScore: moodScore,
      priority: obs.priority_score,
      rawDate: obs.created_at
    };
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <header className="bg-white p-6 rounded-[24px] border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-mediq-blue tracking-wider uppercase">Clinician View</p>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-mediq-navy tracking-tight">
            Patient Longitudinal Trends
          </h1>
        </div>
        
        {patients.length > 0 && (
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-mediq-slate" />
            <select 
              className="border border-border rounded-lg p-2 bg-mediq-bg-light text-mediq-navy focus:outline-none focus:ring-2 focus:ring-mediq-blue"
              value={selectedPatientId || ''}
              onChange={(e) => setSelectedPatientId(e.target.value)}
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.full_name}</option>
              ))}
            </select>
          </div>
        )}
      </header>

      {patients.length === 0 ? (
        <div className="bg-white p-8 rounded-[24px] border border-dashed border-border text-center">
          <Activity className="w-12 h-12 text-mediq-slate mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-mediq-navy">No Patients Assigned</h2>
          <p className="text-mediq-slate mt-2">You currently have no patients assigned to your clinician profile.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-[24px] border border-border shadow-sm">
              <h2 className="font-heading text-xl font-bold text-mediq-navy mb-6">Patient Health Trends</h2>
              {chartData.length > 0 ? (
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="date" tick={{fontSize: 12, fill: '#64748b'}} tickMargin={10} />
                      <YAxis yAxisId="left" tick={{fontSize: 12, fill: '#64748b'}} />
                      <YAxis yAxisId="right" orientation="right" tick={{fontSize: 12, fill: '#64748b'}} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      <Line yAxisId="left" type="monotone" name="Sleep (Hours)" dataKey="sleep" stroke="#0ea5e9" strokeWidth={3} dot={{r: 4, fill: '#0ea5e9'}} activeDot={{r: 6}} />
                      <Line yAxisId="right" type="monotone" name="Mood (Score)" dataKey="moodScore" stroke="#8b5cf6" strokeWidth={3} dot={{r: 4, fill: '#8b5cf6'}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[400px] flex flex-col items-center justify-center border border-dashed border-border rounded-xl">
                  <Activity className="w-10 h-10 text-mediq-slate mb-3" />
                  <p className="text-mediq-slate font-medium">No confirmed observations to display trends</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-[24px] border border-border shadow-sm">
              <h2 className="font-heading text-xl font-bold text-mediq-navy mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                Recent Alerts
              </h2>
              <div className="space-y-4">
                {observations.filter(o => o.priority_score > 50).slice(0, 5).map(obs => (
                  <Link key={obs.id} to={`/dashboard/observations/${obs.id}`} className="block p-4 bg-amber-50 rounded-xl border border-amber-100 hover:bg-amber-100 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-amber-700 bg-amber-200 px-2 py-1 rounded-full">High Priority</span>
                      <span className="text-xs text-amber-600 font-medium">{format(parseISO(obs.created_at), 'MMM dd')}</span>
                    </div>
                    <p className="text-sm text-mediq-navy line-clamp-2">{obs.raw_text}</p>
                  </Link>
                ))}
                {observations.filter(o => o.priority_score > 50).length === 0 && (
                  <p className="text-sm text-mediq-slate text-center py-6">No high priority alerts</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
