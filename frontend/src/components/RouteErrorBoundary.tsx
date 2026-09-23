import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom';
import { MediQIcon } from './common/MediQIcon';

export function RouteErrorBoundary() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : 'The workspace could not be displayed.';

  return (
    <div className="min-h-screen bg-[#0B132B] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-[28px] bg-white text-[#0B132B] border border-slate-200 p-8 md:p-10">
        <div className="w-12 h-12 rounded-2xl bg-[#1A5CFF]/10 text-[#1A5CFF] flex items-center justify-center">
          <MediQIcon name="shield" size={24} />
        </div>
        <p className="mediq-kicker mt-6">Workspace recovery</p>
        <h1 className="font-heading text-3xl font-bold mt-2">Something interrupted this page.</h1>
        <p className="text-slate-500 mt-3">{message}</p>
        <div className="flex flex-wrap gap-3 mt-7">
          <button onClick={() => window.location.reload()} className="rounded-full bg-[#1A5CFF] text-white px-5 py-3 text-sm font-semibold">Reload page</button>
          <Link to="/dashboard/overview" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold">Back to overview</Link>
        </div>
      </div>
    </div>
  );
}
