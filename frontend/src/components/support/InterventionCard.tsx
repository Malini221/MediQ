import React from 'react';
import { Heart, Sparkles, CheckCircle2 } from '@/components/common/Icon';

interface InterventionCardProps {
  intervention: string | null;
}

export const InterventionCard: React.FC<InterventionCardProps> = ({ intervention }) => {
  if (!intervention) {
    return (
      <div className="bg-emerald-50/50 rounded-2xl border border-emerald-100 p-6 flex flex-col items-center justify-center text-center h-full">
        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-heading font-bold text-emerald-900 mb-2">
          Doing Great
        </h3>
        <p className="text-emerald-700/80 text-sm">
          No urgent interventions recommended at this time. Keep up the excellent care.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-mediq-blue/20 p-6 shadow-sm flex flex-col h-full">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-mediq-blue/10 flex items-center justify-center">
          <Heart className="w-5 h-5 text-mediq-blue" />
        </div>
        <div>
          <h3 className="font-heading font-bold text-mediq-navy">Support Recommendation</h3>
          <p className="text-xs text-mediq-blue font-medium uppercase tracking-wider">For Your Well-being</p>
        </div>
      </div>
      
      <div className="bg-white rounded-xl p-5 border border-slate-100 flex-1 flex items-start gap-3 shadow-sm">
        <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-mediq-slate text-sm leading-relaxed">
          {intervention}
        </p>
      </div>
    </div>
  );
};
