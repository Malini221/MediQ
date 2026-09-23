import { Sparkles } from '@/components/common/Icon';
import { cn } from '../../lib/utils';

interface AnalysisMetadataProps {
  metadata: Record<string, any>;
  className?: string;
}

export function AnalysisMetadata({ metadata, className }: AnalysisMetadataProps) {
  if (!metadata || Object.keys(metadata).length === 0) {
    return null;
  }

  const renderValue = (val: any) => {
    if (Array.isArray(val)) {
      return (
        <div className="flex flex-wrap gap-2 mt-2">
          {val.map((item, idx) => (
            <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-white text-mediq-navy border border-border shadow-sm">
              {String(item)}
            </span>
          ))}
        </div>
      );
    }
    if (typeof val === 'string' || typeof val === 'number') {
      return <p className="text-sm text-foreground mt-1 font-medium">{val}</p>;
    }
    if (typeof val === 'boolean') {
      return <p className="text-sm text-foreground mt-1 font-medium">{val ? 'Yes' : 'No'}</p>;
    }
    return <p className="text-sm text-mediq-slate mt-1 italic">Complex data</p>;
  };

  return (
    <div className={cn("bg-mediq-bg-light border border-border rounded-[24px] p-6 shadow-sm", className)}>
      <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
        <Sparkles className="w-5 h-5 text-mediq-blue" />
        <h3 className="font-heading font-bold text-mediq-navy text-lg tracking-tight">System Analysis</h3>
      </div>
      
      <div className="space-y-6">
        {Object.entries(metadata).map(([key, val]) => {
          // Format key: "concern_indicators" -> "Concern Indicators"
          const formattedKey = key
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
            
          return (
            <div key={key} className="group">
              <h4 className="text-xs font-bold text-mediq-slate uppercase tracking-widest">{formattedKey}</h4>
              {renderValue(val)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
