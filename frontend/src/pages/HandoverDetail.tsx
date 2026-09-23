import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { handoversService } from '../services/handovers';
import { patientService } from '../services/patients';
import { Handover, Patient } from '../types/models';
import { LoadingState, ErrorState } from '../components/ui/states';
import { 
  ArrowLeft, Clock, Calendar, CheckCircle2, 
  ShieldAlert, Activity, FileText 
} from '@/components/common/Icon';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { PriorityBadge } from '../components/observation/PriorityBadge';

export function HandoverDetail() {
  const { handoverId } = useParams<{ handoverId: string }>();
  const navigate = useNavigate();
  const [handover, setHandover] = useState<Handover | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acknowledging, setAcknowledging] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!handoverId) return;
      try {
        setLoading(true);
        const data = await handoversService.getHandover(handoverId);
        setHandover(data);
        const patientData = await patientService.getPatient(data.patient_id);
        setPatient(patientData);
      } catch (err) {
        setError('Failed to load handover details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [handoverId]);

  const handleAcknowledge = async () => {
    if (!handover) return;
    try {
      setAcknowledging(true);
      const updated = await handoversService.acknowledgeHandover(handover.id);
      setHandover(updated);
    } catch (err) {
      console.error('Failed to acknowledge:', err);
      // Let it fail silently in UI or add toast notification here
    } finally {
      setAcknowledging(false);
    }
  };

  if (loading) return <LoadingState message="Loading handover..." />;
  if (error || !handover || !patient) return <ErrorState message={error || "Handover not found"} />;

  const watchItems = handover.priority_watch_items || {};
  const highPriority = watchItems.high_priority || [];
  const safetyFlags = watchItems.safety_flags || [];

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold font-display text-foreground">Shift Handover</h1>
            <p className="text-lg font-medium text-mediq-blue mt-1">
              {patient.full_name}
            </p>
            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
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
          
          {handover.acknowledged_by ? (
            <div className="flex flex-col items-end">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-mediq-success/10 text-mediq-success">
                <CheckCircle2 className="w-4 h-4" />
                Acknowledged
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-end gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-amber-50 text-amber-700">
                <Clock className="w-4 h-4" />
                Pending Review
              </span>
            </div>
          )}
        </div>
      </div>

      {safetyFlags.length > 0 && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-6">
          <div className="flex items-center gap-2 text-destructive mb-3">
            <ShieldAlert className="w-5 h-5" />
            <h2 className="font-semibold">Safety Attention</h2>
          </div>
          <ul className="space-y-2">
            {safetyFlags.map((flag: string, i: number) => (
              <li key={i} className="text-sm font-medium text-destructive/90 flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
                {flag}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold font-display text-foreground flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-mediq-slate" />
          Handover Summary
        </h2>
        <div className="prose prose-sm max-w-none text-foreground/90 whitespace-pre-wrap leading-relaxed">
          {handover.summary_text}
        </div>
      </div>

      {(highPriority.length > 0 || watchItems.medium_priority?.length > 0) && (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold font-display text-foreground flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-mediq-slate" />
            Watch Items
          </h2>
          <div className="space-y-6">
            {highPriority.length > 0 && (
              <div className="space-y-3">
                <PriorityBadge score={80} />
                <ul className="space-y-2">
                  {highPriority.map((item: string, i: number) => (
                    <li key={i} className="text-sm text-foreground/90 flex items-start gap-2">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-destructive shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {watchItems.medium_priority?.length > 0 && (
              <div className="space-y-3">
                <PriorityBadge score={50} />
                <ul className="space-y-2">
                  {watchItems.medium_priority.map((item: string, i: number) => (
                    <li key={i} className="text-sm text-foreground/90 flex items-start gap-2">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-amber-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-secondary/50 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Source Observations</h2>
        <p className="text-sm text-foreground/80">
          This handover is generated based on {handover.source_observation_ids.length} recent observations.
        </p>
      </div>

      {!handover.acknowledged_by && (
        <div className="fixed bottom-0 left-0 right-0 md:left-64 p-4 bg-background/80 backdrop-blur-md border-t border-border z-10">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Review and acknowledge this shift handover.
            </p>
            <button
              onClick={handleAcknowledge}
              disabled={acknowledging}
              className={cn(
                "px-6 py-2.5 rounded-full font-medium text-white transition-all shadow-sm",
                acknowledging 
                  ? "bg-mediq-blue/70 cursor-not-allowed" 
                  : "bg-mediq-blue hover:bg-mediq-blue/90 hover:-translate-y-0.5 hover:shadow-md"
              )}
            >
              {acknowledging ? "Acknowledging..." : "Acknowledge Handover"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
