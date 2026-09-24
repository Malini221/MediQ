import { cn } from '../../lib/utils';
import { MediQIcon } from '../common/MediQIcon';

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('mediq-surface p-6 space-y-4 animate-pulse', className)}>
      <div className="flex items-center justify-between">
        <div className="h-4 w-1/3 bg-slate-100 rounded-md" />
        <div className="h-8 w-8 bg-slate-100 rounded-full" />
      </div>
      <div className="h-6 w-3/4 bg-slate-100 rounded-md" />
      <div className="space-y-2 pt-2">
        <div className="h-3 w-full bg-slate-100 rounded" />
        <div className="h-3 w-5/6 bg-slate-100 rounded" />
      </div>
      <div className="h-10 w-full bg-slate-100 rounded-full pt-4" />
    </div>
  );
}

export function SkeletonList({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="mediq-surface p-5 animate-pulse flex items-center justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="h-4 w-1/4 bg-slate-100 rounded" />
            <div className="h-5 w-2/3 bg-slate-100 rounded-md" />
            <div className="h-3 w-1/3 bg-slate-100 rounded" />
          </div>
          <div className="h-8 w-24 bg-slate-100 rounded-full shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function LoadingState({ message = 'Loading workspace data...', className }: { message?: string; className?: string }) {
  return (
    <div className={cn('p-2 space-y-4 mediq-reveal', className)}>
      <div className="mediq-surface p-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-full border-2 border-[#1A5CFF] border-t-transparent animate-spin" />
          <p className="text-sm font-semibold text-[#0B132B]">{message}</p>
        </div>
        <SkeletonList count={2} />
      </div>
    </div>
  );
}

export function ErrorState({ title = 'Unable to load workspace data', message, onRetry }: { title?: string; message?: string; onRetry?: () => void }) {
  return (
    <div className="mediq-surface p-8 md:p-12 text-center max-w-xl mx-auto mediq-reveal">
      <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 mx-auto flex items-center justify-center border border-red-100">
        <MediQIcon name="shield" size={26} />
      </div>
      <h3 className="font-heading text-xl font-bold mt-5 text-[#0B132B]">{title}</h3>
      {message && <p className="text-sm text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">{message}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#1A5CFF] text-white px-6 py-2.5 text-sm font-semibold hover:opacity-95 transition-opacity"
        >
          Retry request
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  actionText,
  onAction,
  actionLink,
  icon = 'plus'
}: {
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  actionLink?: string;
  icon?: string;
}) {
  return (
    <div className="mediq-surface p-10 md:p-14 text-center max-w-2xl mx-auto mediq-reveal">
      <div className="w-14 h-14 rounded-2xl bg-[#1A5CFF]/10 text-[#1A5CFF] mx-auto flex items-center justify-center border border-[#1A5CFF]/15">
        <MediQIcon name={icon as any || 'plus'} size={26} />
      </div>
      <h3 className="font-heading text-xl font-bold mt-5 text-[#0B132B]">{title}</h3>
      {description && <p className="text-sm text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">{description}</p>}
      {actionText && (
        <div className="mt-6">
          {actionLink ? (
            <a
              href={actionLink}
              className="inline-flex items-center gap-2 rounded-full bg-[#1A5CFF] text-white px-6 py-2.5 text-sm font-semibold hover:opacity-95 transition-opacity"
            >
              {actionText}
            </a>
          ) : (
            <button
              onClick={onAction}
              className="inline-flex items-center gap-2 rounded-full bg-[#1A5CFF] text-white px-6 py-2.5 text-sm font-semibold hover:opacity-95 transition-opacity"
            >
              {actionText}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

