import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { patientService } from '../services/patients';
import { handoversService } from '../services/handovers';
import { Patient, Observation } from '../types/models';
import { LoadingState, ErrorState, EmptyState } from '../components/ui/states';
import { Activity, Calendar, ArrowLeft, Clock, MessageSquareText, ShieldAlert, BadgeCheck } from '@/components/common/Icon';
import { cn } from '../lib/utils';
import { format, differenceInYears } from 'date-fns';
import { PriorityBadge } from '../components/observation/PriorityBadge';

export function PatientDetail() {
  const { patientId } = useParams<{ patientId: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [observations, setObservations] = useState<Observation[]>([]);
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingHandover, setGeneratingHandover] = useState(false);

  useEffect(() => {
    async function loadPatientData() {
      if (!patientId) return;
      
      try {
        setLoading(true);
        // Load patient and timeline simultaneously
        const [patientData, obsData] = await Promise.all([
          patientService.getPatient(patientId),
          patientService.getPatientObservations(patientId)
        ]);
        
        setPatient(patientData);
        setObservations(obsData);
      } catch (err: any) {
        console.error('Failed to fetch patient details:', err);
        if (err.status === 404 || err.status === 403) {
          setError('Patient unavailable. You may not have access to this record.');
        } else {
          setError(err.message || 'Unable to load patient record at this time.');
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
      navigate(`/dashboard/handovers/${handover.id}`);
    } catch (err) {
      console.error('Failed to generate handover:', err);
      alert('Failed to generate handover. Make sure there are pending observations.');
    } finally {
      setGeneratingHandover(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading patient record..." className="h-[60vh]" />;
  }

  if (error || !patient) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <ErrorState 
          title="Access Denied or Unavailable" 
          message={error || "Patient not found."} 
        />
      </div>
    );
  }

  // Format date safely
  const getAge = (dob: string) => {
    try {
      return differenceInYears(new Date(), new Date(dob));
    } catch {
      return null;
    }
  };
  const age = getAge(patient.date_of_birth);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* Header & Back Navigation */}
      <div className="flex items-center gap-4">
        <Link 
          to="/dashboard/patients"
          className="p-2 -ml-2 rounded-full hover:bg-black/5 text-mediq-slate transition-colors"
          aria-label="Back to patients"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-heading text-2xl font-bold text-mediq-navy tracking-tight">Patient Record</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Patient Identity & Baseline (2 cols on large) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-[24px] border border-border p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-mediq-bg-blueTint flex items-center justify-center text-mediq-blue font-bold text-xl">
                {patient.full_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="font-heading text-xl font-bold text-mediq-navy truncate" title={patient.full_name}>
                  {patient.full_name}
                </h2>
                <p className="text-sm text-mediq-slate flex items-center gap-1.5 mt-0.5">
                  <Calendar className="w-4 h-4" />
                  {age !== null ? `${age} years old` : 'Age unknown'}
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-border">
              <div>
                <p className="text-xs font-semibold text-mediq-slate uppercase tracking-wider mb-1">Primary Note</p>
                <p className="text-sm text-foreground">{patient.primary_diagnosis || "None recorded"}</p>
              </div>
              
              {patient.baseline_conditions && Object.keys(patient.baseline_conditions).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-mediq-slate uppercase tracking-wider mb-2">Baseline Info</p>
                  <ul className="space-y-2">
                    {Object.entries(patient.baseline_conditions).map(([key, val]) => (
                      <li key={key} className="flex flex-col">
                        <span className="text-xs text-mediq-slate capitalize">{key.replace(/_/g, ' ')}</span>
                        <span className="text-sm font-medium text-foreground">{String(val)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white rounded-[24px] border border-border p-6 shadow-sm">
            <h3 className="font-heading text-lg font-bold text-mediq-navy mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link 
                to={`/dashboard/patients/${patient.id}/observations/new`}
                className="w-full flex items-center gap-3 bg-background border border-border px-4 py-3 rounded-xl text-sm font-medium hover:bg-mediq-bg-blueTint hover:text-mediq-blue transition-colors group"
              >
                <Activity className="w-5 h-5 text-mediq-slate group-hover:text-mediq-blue transition-colors" />
                Add Observation
              </Link>
              <Link 
                to="/dashboard/handovers"
                className="w-full flex items-center gap-3 bg-background border border-border px-4 py-3 rounded-xl text-sm font-medium hover:bg-mediq-bg-blueTint hover:text-mediq-blue transition-colors group"
              >
                <MessageSquareText className="w-5 h-5 text-mediq-slate group-hover:text-mediq-blue transition-colors" />
                View Handovers
              </Link>
              <button 
                onClick={handleGenerateHandover}
                disabled={generatingHandover}
                className="w-full flex items-center justify-between bg-mediq-blue text-white px-4 py-3 rounded-xl text-sm font-medium hover:bg-mediq-blue/90 hover:-translate-y-0.5 transition-all shadow-sm disabled:opacity-70 disabled:pointer-events-none"
              >
                <span className="flex items-center gap-3">
                  <MessageSquareText className="w-5 h-5 text-white/80" />
                  {generatingHandover ? "Generating handover..." : "Generate Handover"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Observation Timeline (2 cols on large) */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="font-heading text-xl font-bold text-mediq-navy">Recent Timeline</h2>
          
          {observations.length === 0 ? (
            <div className="bg-white rounded-[24px] border border-border p-8 text-center shadow-sm">
              <EmptyState 
                title="No recent observations" 
                description="No observations have been recorded for this patient yet."
                icon={Clock}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {observations.map((obs) => (
                <ObservationItem key={obs.id} observation={obs} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ObservationItem({ observation }: { observation: Observation }) {
  const isHighPriority = observation.priority_score >= 75;
  const isPending = observation.status === 'pending';
  
  let formattedDate = 'Unknown date';
  try {
    formattedDate = format(new Date(observation.created_at), "MMM d, yyyy 'at' h:mm a");
  } catch(e) {}

  return (
    <div className={cn(
      "bg-white rounded-[20px] border p-5 shadow-sm transition-all duration-300",
      isHighPriority ? "border-destructive/30" : "border-border",
      "hover:shadow-md"
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-mediq-slate bg-secondary px-2.5 py-1 rounded-full flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {formattedDate}
          </span>
          
          {isPending && (
            <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
              Processing
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {observation.priority_score > 0 && (
            <PriorityBadge score={observation.priority_score} className="scale-90 origin-left" />
          )}
          {isHighPriority && (
            <span className="flex items-center gap-1 text-xs font-bold text-destructive bg-destructive/10 px-2.5 py-1 rounded-full">
              <ShieldAlert className="w-3.5 h-3.5" />
              High Priority
            </span>
          )}
          {!isHighPriority && observation.status === 'confirmed' && (
            <span className="flex items-center gap-1 text-xs font-medium text-mediq-success bg-mediq-success/10 px-2.5 py-1 rounded-full">
              <BadgeCheck className="w-3.5 h-3.5" />
              Logged
            </span>
          )}
        </div>
      </div>

      <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
        {observation.raw_text}
      </p>

      {/* Extracted Metadata (Only display safely extracted structured fields) */}
      {observation.extracted_metadata && Object.keys(observation.extracted_metadata).length > 0 && (
        <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-2">
          {observation.extracted_metadata.symptoms?.map((sym: string, i: number) => (
            <span key={`sym-${i}`} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-100">
              {sym}
            </span>
          ))}
          {observation.extracted_metadata.category && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-mediq-bg-blueTint text-mediq-blue border border-mediq-blue/10">
              {observation.extracted_metadata.category}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
