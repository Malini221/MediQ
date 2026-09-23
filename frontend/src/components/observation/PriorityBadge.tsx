import { ShieldAlert, AlertTriangle, AlertCircle, Activity, Info } from '@/components/common/Icon';
import { cn } from '../../lib/utils';

interface PriorityBadgeProps {
  score: number;
  className?: string;
}

export function PriorityBadge({ score, className }: PriorityBadgeProps) {
  if (score === 0) {
    return (
      <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-secondary text-mediq-slate", className)}>
        <Activity className="w-3.5 h-3.5" />
        <span>Unassessed</span>
      </div>
    );
  }

  // Derive level (Backend dictates score, we just map it to visual states based on thresholds)
  let level = 'LOW';
  let colorClass = 'bg-slate-100 text-slate-700 border-slate-200';
  let Icon = Info;

  if (score >= 90) {
    level = 'CRITICAL';
    colorClass = 'bg-red-100 text-red-800 border-red-200';
    Icon = ShieldAlert;
  } else if (score >= 75) {
    level = 'HIGH';
    colorClass = 'bg-orange-100 text-orange-800 border-orange-200';
    Icon = AlertTriangle;
  } else if (score >= 40) {
    level = 'MEDIUM';
    colorClass = 'bg-amber-100 text-amber-800 border-amber-200';
    Icon = AlertCircle;
  } else {
    level = 'LOW';
    colorClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
    Icon = Activity;
  }

  return (
    <div className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-sm", colorClass, className)}>
      <Icon className="w-4 h-4" />
      <span className="tracking-wide uppercase">{level}</span>
      <span className="opacity-70 ml-1 border-l border-current pl-2 font-mono">{score}</span>
    </div>
  );
}
