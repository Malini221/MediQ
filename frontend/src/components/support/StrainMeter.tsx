import React from 'react';
import { cn } from '../../lib/utils';
import { Activity } from '@/components/common/Icon';

interface StrainMeterProps {
  score: number;
  status: 'low' | 'moderate' | 'high' | 'critical';
}

export const StrainMeter: React.FC<StrainMeterProps> = ({ score, status }) => {
  // SVG properties
  const radius = 60;
  const stroke = 12;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let colorClass = 'text-mediq-slate';

  switch (status) {
    case 'low':
      colorClass = 'text-emerald-500';
      break;
    case 'moderate':
      colorClass = 'text-amber-500';
      break;
    case 'high':
      colorClass = 'text-orange-500';
      break;
    case 'critical':
      colorClass = 'text-red-600';
      break;
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-sm border border-border">
      <div className="relative flex items-center justify-center mb-4">
        {/* Background circle */}
        <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
          <circle
            stroke="currentColor"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className="text-slate-100"
          />
          {/* Progress circle */}
          <circle
            stroke="currentColor"
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s ease-out' }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className={colorClass}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <Activity className={cn("w-6 h-6 mb-1", colorClass)} />
          <span className="text-3xl font-heading font-bold text-mediq-navy leading-none">
            {score}
          </span>
        </div>
      </div>
      
      <div className="text-center">
        <h3 className="font-heading font-semibold text-mediq-navy capitalize text-lg">
          {status} Strain
        </h3>
        <p className="text-sm text-mediq-slate mt-1 max-w-[200px]">
          Personal strain score based on recent observation complexity.
        </p>
      </div>
    </div>
  );
};
