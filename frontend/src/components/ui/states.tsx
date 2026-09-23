import { cn } from '../../lib/utils';
import { MediQIcon } from '../common/MediQIcon';

export function LoadingState({ message = 'Loading...', className }: { message?: string; className?: string }) {
  return <div className={cn('p-8 space-y-4', className)}><div className="mediq-surface p-8 space-y-4"><div className="h-5 w-40 bg-slate-100 rounded animate-pulse"/><div className="h-16 bg-slate-100 rounded-xl animate-pulse"/><div className="h-16 bg-slate-100 rounded-xl animate-pulse"/><p className="text-sm text-slate-400">{message}</p></div></div>;
}

export function ErrorState({ title='Something went wrong', message, onRetry }: { title?: string; message?: string; onRetry?: () => void }) {
  return <div className="mediq-surface p-10 text-center"><div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 mx-auto flex items-center justify-center"><MediQIcon name="shield"/></div><h3 className="font-heading text-lg font-bold mt-4">{title}</h3>{message&&<p className="text-sm text-slate-500 max-w-md mx-auto mt-2">{message}</p>}{onRetry&&<button onClick={onRetry} className="mt-5 rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold">Retry</button>}</div>;
}

export function EmptyState({ title, description }: { title: string; description?: string; icon?: React.ElementType }) {
  return <div className="mediq-surface p-12 text-center"><div className="w-14 h-14 rounded-2xl bg-[#1A5CFF]/10 text-[#1A5CFF] mx-auto flex items-center justify-center"><MediQIcon name="plus" size={24}/></div><h3 className="font-heading text-lg font-bold mt-5">{title}</h3>{description&&<p className="text-sm text-slate-500 max-w-md mx-auto mt-2">{description}</p>}</div>;
}
