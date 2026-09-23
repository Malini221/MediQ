import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { patientService } from '../services/patients';
import { Patient, Observation } from '../types/models';
import { MediQIcon } from '../components/common/MediQIcon';

export function Observations() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [observations, setObservations] = useState<(Observation & { patientName?: string })[]>([]);
  const [patientFilter, setPatientFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const ps = await patientService.getPatients();
      setPatients(ps);
      const rows = (await Promise.all(ps.map(async p => {
        try { return (await patientService.getPatientObservations(p.id)).map(o => ({ ...o, patientName: p.full_name })); }
        catch { return []; }
      }))).flat();
      rows.sort((a,b) => +new Date(b.created_at) - +new Date(a.created_at));
      setObservations(rows);
    } catch (e: any) {
      setError(e?.message || 'Unable to load observations. Check that the API is running and your session is active.');
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => observations.filter(o => (patientFilter === 'all' || o.patient_id === patientFilter) && (statusFilter === 'all' || o.status === statusFilter)), [observations, patientFilter, statusFilter]);

  return <div className="space-y-6 mediq-reveal">
    <section className="mediq-surface p-6 md:p-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
      <div><p className="mediq-kicker">Observation workspace</p><h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight mt-2">What the care team noticed.</h1><p className="text-slate-500 mt-2 max-w-2xl">Capture, review and confirm patient observations without leaving this workspace.</p></div>
      <Link to="/dashboard/observations/new" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1A5CFF] text-white px-5 py-3 text-sm font-semibold hover:scale-[1.01] transition-transform"><MediQIcon name="plus" size={17}/>Create observation</Link>
    </section>

    <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[['Total', observations.length], ['Pending', observations.filter(o=>o.status==='pending').length], ['Escalated', observations.filter(o=>o.status==='escalated').length]].map(([label,value]) => <div key={String(label)} className="mediq-surface p-5"><p className="text-xs uppercase tracking-[0.16em] text-slate-400">{label}</p><p className="font-heading text-3xl font-bold mt-2">{value}</p></div>)}
    </section>

    <section className="mediq-surface p-4 md:p-5">
      <div className="flex flex-col md:flex-row gap-3">
        <select value={patientFilter} onChange={e=>setPatientFilter(e.target.value)} className="mediq-focus flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"><option value="all">All patients</option>{patients.map(p=><option key={p.id} value={p.id}>{p.full_name}</option>)}</select>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="mediq-focus rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"><option value="all">All statuses</option><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="escalated">Escalated</option></select>
      </div>
    </section>

    {loading ? <div className="mediq-surface p-8 space-y-4"><div className="h-5 w-44 bg-slate-100 animate-pulse rounded"/><div className="h-16 bg-slate-100 animate-pulse rounded-xl"/><div className="h-16 bg-slate-100 animate-pulse rounded-xl"/></div> : error ? <div className="mediq-surface p-8"><p className="font-semibold text-[#0B132B]">Observations could not be loaded.</p><p className="text-sm text-slate-500 mt-2">{error}</p><button onClick={load} className="mt-5 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold">Retry</button></div> : filtered.length === 0 ? <div className="mediq-surface p-12 text-center"><div className="w-14 h-14 mx-auto rounded-2xl bg-[#1A5CFF]/10 text-[#1A5CFF] flex items-center justify-center"><MediQIcon name="observations" size={25}/></div><h2 className="font-heading text-xl font-bold mt-5">No observations here yet</h2><p className="text-sm text-slate-500 max-w-md mx-auto mt-2">Start with a text note or a voice observation. Your confirmed records will stay in this workspace.</p><Link to="/dashboard/observations/new" className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#1A5CFF] text-white px-5 py-3 text-sm font-semibold"><MediQIcon name="plus" size={17}/>Create observation</Link></div> : <div className="space-y-3">{filtered.map(o=><Link key={o.id} to={`/dashboard/observations/${o.id}`} className="block mediq-surface p-5 hover:border-[#1A5CFF]/35 transition-colors"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="text-xs font-semibold text-[#1A5CFF]">{o.patientName}</p><p className="font-semibold mt-1 truncate">{o.raw_text || 'Voice observation'}</p><p className="text-xs text-slate-400 mt-2">{new Date(o.created_at).toLocaleString()}</p></div><div className="shrink-0 flex items-center gap-3"><span className="px-2.5 py-1 rounded-full bg-slate-100 text-xs font-semibold capitalize">{o.status}</span><span className="text-xs text-slate-500">Priority {o.priority_score}</span><MediQIcon name="arrow" size={17} className="text-[#1A5CFF]"/></div></div></Link>)}</div>}
  </div>;
}
