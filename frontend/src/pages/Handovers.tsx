import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { handoversService } from '../services/handovers';
import { patientService } from '../services/patients';
import { Handover, Patient } from '../types/models';
import { LoadingState, ErrorState, EmptyState } from '../components/ui/states';
import { Clock, CheckCircle2, AlertCircle, Calendar, FileText, ChevronRight } from '@/components/common/Icon';
import { format } from 'date-fns';

interface HandoverWithPatient extends Handover {
  patient: Patient;
}

export function Handovers() {
  const [handovers, setHandovers] = useState<HandoverWithPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadHandovers() {
      try {
        setLoading(true);
        // 1. Get all accessible patients
        const patients = await patientService.getPatients();
        
        // 2. Fetch handovers for all patients
        const handoverPromises = patients.map(async (patient: Patient) => {
          try {
            const patientHandovers = await handoversService.getPatientHandovers(patient.id);
            return patientHandovers.map(h => ({ ...h, patient }));
          } catch (e) {
            console.error(`Failed to load handovers for patient ${patient.id}`, e);
            return []; // Skip if error fetching for one patient
          }
        });
        
        const results = await Promise.all(handoverPromises);
        const allHandovers = results.flat();
        
        // Sort by created_at descending
        allHandovers.sort((a: HandoverWithPatient, b: HandoverWithPatient) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        setHandovers(allHandovers);
      } catch (err) {
        setError('Failed to load handovers.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    loadHandovers();
  }, []);

  if (loading) {
    return <LoadingState message="Loading handovers..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  if (handovers.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No handovers yet"
        description="Generate a handover from the patient's recent observations."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-display">Handovers</h1>
        <p className="text-muted-foreground mt-1">Shift summaries and important watch items.</p>
      </div>

      <div className="grid gap-4">
        {handovers.map((handover) => (
          <Link
            key={handover.id}
            to={`/dashboard/handovers/${handover.id}`}
            className="block group"
          >
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm group-hover:-translate-y-1 group-hover:shadow-md transition-all duration-300">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg text-foreground group-hover:text-mediq-blue transition-colors">
                    {handover.patient.full_name}
                  </h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(handover.created_at), "MMM d, yyyy")}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {format(new Date(handover.created_at), "h:mm a")}
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  {handover.acknowledged_by ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-mediq-success/10 text-mediq-success">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Acknowledged
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Needs Review
                    </span>
                  )}
                  
                  <div className="p-1.5 rounded-full bg-secondary text-muted-foreground group-hover:bg-mediq-blue group-hover:text-white transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
              
              {/* Preview */}
              <div className="mt-4 pt-4 border-t border-border/50">
                <p className="text-sm text-foreground/80 line-clamp-2">
                  {handover.summary_text}
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-xs font-medium px-2 py-1 bg-secondary rounded-md text-muted-foreground">
                    {handover.source_observation_ids.length} Observations
                  </span>
                  {handover.priority_watch_items?.safety_flags?.length > 0 && (
                    <span className="text-xs font-medium px-2 py-1 bg-destructive/10 rounded-md text-destructive">
                      Safety Flags Active
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
