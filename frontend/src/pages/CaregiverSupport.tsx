import { useEffect, useState } from 'react';
import { BurnoutMetrics } from '../types/models';
import { getBurnoutMetrics } from '../services/burnout';
import { StrainMeter } from '../components/support/StrainMeter';
import { InterventionCard } from '../components/support/InterventionCard';
import { HeartHandshake, Shield, Info, Loader2, AlertCircle, RefreshCw } from '@/components/common/Icon';
import { format } from 'date-fns';

export function CaregiverSupport() {
  const [metrics, setMetrics] = useState<BurnoutMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getBurnoutMetrics();
      
      // Select the most recent log if it exists
      if (data && data.length > 0) {
        setMetrics(data[0]);
      } else {
        setMetrics(null);
      }
    } catch (err: any) {
      console.error('Failed to fetch burnout metrics:', err);
      setError('Unable to load your support metrics at this time.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-mediq-blue mb-4" />
        <p className="text-mediq-slate font-medium">Loading your well-being dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50/50 border border-red-100 rounded-2xl p-8 flex flex-col items-center text-center max-w-lg mx-auto mt-12">
        <AlertCircle className="w-10 h-10 text-red-500 mb-4" />
        <h3 className="text-lg font-heading font-bold text-red-900 mb-2">Something went wrong</h3>
        <p className="text-red-700/80 text-sm mb-6">{error}</p>
        <button 
          onClick={fetchMetrics}
          className="flex items-center gap-2 bg-white text-red-700 px-4 py-2 rounded-lg font-medium border border-red-200 hover:bg-red-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl font-bold text-mediq-navy flex items-center gap-3">
          <HeartHandshake className="w-8 h-8 text-mediq-blue" />
          Caregiver Support
        </h1>
        <p className="text-mediq-slate mt-2 text-lg">
          Your personal well-being and strain indicators.
        </p>
      </div>

      {/* Privacy Notice */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3">
        <Shield className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-slate-700">Strictly Private</h4>
          <p className="text-sm text-slate-500 mt-1">
            This information is visible only to you. Your strain scores and interactions here are completely unmonitored by supervisors or coordinators.
          </p>
        </div>
      </div>

      {metrics ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Strain Gauge */}
            <div className="lg:col-span-1">
              <StrainMeter 
                score={metrics.strain_score} 
                status={
                  metrics.strain_score < 25 ? 'low' : 
                  metrics.strain_score < 50 ? 'moderate' : 
                  metrics.strain_score < 75 ? 'high' : 'critical'
                } 
              />
            </div>

            {/* Intervention Card */}
            <div className="lg:col-span-2">
              <InterventionCard intervention={metrics.intervention_offered} />
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-mediq-slate opacity-75">
            <Info className="w-4 h-4" />
            <span>Last assessed: {format(new Date(metrics.created_at), "MMM d, yyyy 'at' h:mm a")}</span>
          </div>
        </>
      ) : (
        /* Empty State */
        <div className="bg-white border border-border rounded-2xl p-10 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-mediq-bg-blueTint rounded-full flex items-center justify-center mb-5">
            <HeartHandshake className="w-8 h-8 text-mediq-blue opacity-80" />
          </div>
          <h3 className="text-xl font-heading font-bold text-mediq-navy mb-2">
            We're observing quietly
          </h3>
          <p className="text-mediq-slate max-w-md mx-auto">
            You don't have any strain logs yet. As you capture complex observations and interact with the system, we will quietly assess your strain and offer supportive interventions here.
          </p>
        </div>
      )}
    </div>
  );
}
