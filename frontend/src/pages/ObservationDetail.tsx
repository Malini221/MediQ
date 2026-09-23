import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { observationService } from '../services/observations';
import { Observation } from '../types/models';
import { ArrowLeft, CheckCircle2, ShieldAlert, FileAudio, Loader2, BadgeCheck, Zap, Activity } from '@/components/common/Icon';
import { LoadingState, ErrorState } from '../components/ui/states';
import { PriorityBadge } from '../components/observation/PriorityBadge';
import { AnalysisMetadata } from '../components/observation/AnalysisMetadata';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

export function ObservationDetail() {
  const { observationId } = useParams<{ observationId: string }>();
  const [observation, setObservation] = useState<Observation | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [assessingPriority, setAssessingPriority] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchObservation = async () => {
    if (!observationId) return;
    try {
      const data = await observationService.getObservation(observationId);
      setObservation(data);
    } catch (err: any) {
      console.error('Failed to fetch observation:', err);
      setError(err.message || 'Unable to load observation at this time.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchObservation();
  }, [observationId]);

  const handleAnalyze = async () => {
    if (!observationId) return;
    setAnalyzing(true);
    setError(null);
    try {
      const updated = await observationService.analyzeObservation(observationId);
      setObservation(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze observation.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAssessPriority = async () => {
    if (!observationId) return;
    setAssessingPriority(true);
    setError(null);
    try {
      const updated = await observationService.assessObservationPriority(observationId);
      setObservation(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to assess priority.');
    } finally {
      setAssessingPriority(false);
    }
  };

  const handleConfirm = async () => {
    if (!observationId || !observation) return;
    setConfirming(true);
    setError(null);
    try {
      const updated = await observationService.confirmObservation(observationId);
      setObservation(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to confirm observation.');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading observation details..." className="h-[60vh]" />;
  }

  if (!observation) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <ErrorState title="Access Error" message={error || "Observation not found."} />
      </div>
    );
  }

  const isPending = observation.status === 'pending';
  const isHighPriority = observation.priority_score >= 75;
  const hasMetadata = observation.extracted_metadata && Object.keys(observation.extracted_metadata).length > 0;
  
  let formattedDate = 'Unknown date';
  try {
    formattedDate = format(new Date(observation.created_at), "MMMM d, yyyy 'at' h:mm a");
  } catch(e) {}

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 max-w-4xl mx-auto">
      
      {/* Header & Back Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            to={`/dashboard/patients/${observation.patient_id}`}
            className="p-2 -ml-2 rounded-full hover:bg-black/5 text-mediq-slate transition-colors"
            aria-label="Back to patient"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-heading text-2xl font-bold text-mediq-navy tracking-tight">Observation Review</h1>
            <p className="text-sm text-mediq-slate mt-0.5">Recorded {formattedDate}</p>
          </div>
        </div>
        
        {/* Status Badge */}
        <div>
          {isPending ? (
            <span className="flex items-center gap-1.5 text-sm font-semibold text-mediq-blue bg-mediq-bg-blueTint px-4 py-1.5 rounded-full border border-mediq-blue/20">
              <Loader2 className="w-4 h-4 animate-spin" />
              Pending Review
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-sm font-semibold text-mediq-success bg-mediq-success/10 px-4 py-1.5 rounded-full border border-mediq-success/20">
              <BadgeCheck className="w-4 h-4" />
              Confirmed
            </span>
          )}
        </div>
      </div>

      {error && (
        <ErrorState title="Processing Error" message={error} />
      )}

      {/* Critical Safety Alert */}
      {isHighPriority && (
        <div className="bg-red-50 border border-red-200 rounded-[24px] p-6 shadow-sm flex items-start gap-4 animate-in zoom-in-95 duration-300">
          <div className="bg-white p-3 rounded-xl shadow-sm text-red-600">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-red-900 text-lg">Safety attention required</h3>
            <p className="text-red-700 mt-1">
              This observation contains a critical safety indicator. Please review it immediately and escalate if necessary according to protocol.
            </p>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Original Record */}
        <div className="space-y-8">
          <div className="bg-white rounded-[24px] border border-border p-6 shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
              <h2 className="font-heading text-lg font-bold text-mediq-navy uppercase tracking-widest text-xs">
                Your Observation
              </h2>
              {observation.original_audio_path && (
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-mediq-blue bg-mediq-bg-blueTint px-2.5 py-1 rounded-md">
                  <FileAudio className="w-3.5 h-3.5" /> Voice Transcript
                </div>
              )}
            </div>
            
            <div className="prose prose-sm max-w-none text-foreground leading-relaxed whitespace-pre-wrap flex-1 text-base">
              {observation.raw_text}
            </div>
          </div>
        </div>

        {/* Right Column: AI Analysis & Action */}
        <div className="space-y-8 flex flex-col">
          
          {/* System Analysis Box */}
          <div className={cn(
            "transition-all duration-300 h-full flex flex-col",
            hasMetadata ? "" : "bg-white rounded-[24px] border border-border p-6 shadow-sm"
          )}>
            
            {hasMetadata ? (
              <AnalysisMetadata metadata={observation.extracted_metadata} className="h-full" />
            ) : (
              <div className="flex flex-col items-center justify-center text-center h-full py-12 px-6">
                <div className="w-16 h-16 bg-mediq-bg-blueTint rounded-full flex items-center justify-center text-mediq-blue mb-4">
                  <Zap className="w-8 h-8" />
                </div>
                <h3 className="font-heading font-bold text-mediq-navy text-lg mb-2">Unanalyzed Record</h3>
                <p className="text-sm text-mediq-slate mb-8 max-w-[250px]">
                  Extract clinical metadata and organize findings from this observation.
                </p>
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="bg-white border border-border text-mediq-navy px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-secondary transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {analyzing ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> : "Analyze Observation"}
                </button>
              </div>
            )}
          </div>

          {/* Priority & Safety Box */}
          <div className="bg-white rounded-[24px] border border-border p-6 shadow-sm">
             <div className="flex items-center justify-between mb-4 border-b border-border pb-4">
              <h2 className="font-heading text-lg font-bold text-mediq-navy uppercase tracking-widest text-xs">
                Priority & Safety
              </h2>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-mediq-slate font-medium mb-1.5 uppercase tracking-wide">Priority Score</p>
                <PriorityBadge score={observation.priority_score} />
              </div>

              {observation.priority_score === 0 && (
                 <button
                  onClick={handleAssessPriority}
                  disabled={assessingPriority || analyzing}
                  className="bg-mediq-bg-light border border-border text-mediq-navy px-4 py-2 rounded-xl text-sm font-semibold hover:bg-white transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {assessingPriority ? <><Loader2 className="w-4 h-4 animate-spin" /> Assessing...</> : <><Activity className="w-4 h-4" /> Assess Priority</>}
                </button>
              )}
            </div>
          </div>
          
        </div>
      </div>
      
      {/* Human Confirmation Box */}
      {isPending && (
        <div className="bg-white rounded-[24px] border border-border p-8 shadow-sm text-center max-w-2xl mx-auto mt-4 animate-in fade-in duration-500 delay-150">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full mb-4">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="font-heading font-bold text-mediq-navy text-xl mb-2">Review complete?</h3>
          <p className="text-sm text-mediq-slate mb-8 px-4">
            Please verify the observation text and the extracted system analysis before confirming it into the patient's record.
          </p>
          <button
            onClick={handleConfirm}
            disabled={confirming || analyzing || assessingPriority}
            className="w-full sm:w-auto min-w-[240px] bg-mediq-blue text-white px-8 py-3.5 rounded-full font-medium hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-mediq-blue/20 transition-all hover:-translate-y-0.5 active:translate-y-0 flex justify-center items-center gap-2 shadow-sm disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed mx-auto text-base"
          >
            {confirming ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Confirming...
              </>
            ) : (
              "Confirm Observation"
            )}
          </button>
        </div>
      )}

    </div>
  );
}
