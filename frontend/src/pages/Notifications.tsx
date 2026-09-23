import { useMemo, useState } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { MediQIcon } from '../components/common/MediQIcon';

export function Notifications() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [filter,setFilter]=useState('all');
  const rows=useMemo(()=>notifications.filter(n=>filter==='all'||n.type===filter),[notifications,filter]);
  return <div className="space-y-6 mediq-reveal max-w-5xl">
    <section className="mediq-surface p-6 md:p-8 flex flex-col md:flex-row md:items-end justify-between gap-5"><div><p className="mediq-kicker">Notification center</p><h1 className="font-heading text-3xl font-bold mt-2">Stay close to what changed.</h1><p className="text-slate-500 mt-2">Safety, priority and handover events relevant to your authorized care workspace.</p></div>{unreadCount>0&&<button onClick={markAllAsRead} className="rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold">Mark all read</button>}</section>
    <div className="flex gap-2 overflow-x-auto">{[['all','All'],['SAFETY','Safety'],['PRIORITY','Priority'],['HANDOVER','Handovers']].map(([v,l])=><button key={v} onClick={()=>setFilter(v)} className={`px-4 py-2 rounded-full text-sm font-semibold border whitespace-nowrap ${filter===v?'bg-white text-[#0B132B] border-white':'text-white/60 border-white/15 hover:text-white'}`}>{l}</button>)}</div>
    {rows.length===0?<div className="mediq-surface p-14 text-center"><div className="w-14 h-14 rounded-2xl bg-[#1A5CFF]/10 text-[#1A5CFF] mx-auto flex items-center justify-center"><MediQIcon name="notifications" size={25}/></div><h2 className="font-heading text-xl font-bold mt-5">You're all caught up</h2><p className="text-sm text-slate-500 mt-2">New authorized events will appear here.</p></div>:<div className="space-y-3">{rows.map(n=><button key={n.id} onClick={()=>markAsRead(n.id)} className={`w-full mediq-surface p-5 text-left flex gap-4 ${!n.read?'border-[#1A5CFF]/35':''}`}><div className="w-10 h-10 rounded-xl bg-[#1A5CFF]/10 text-[#1A5CFF] flex items-center justify-center shrink-0"><MediQIcon name={n.type==='HANDOVER'?'handovers':n.type==='SAFETY'?'shield':'observations'} size={18}/></div><div className="min-w-0 flex-1"><div className="flex justify-between gap-4"><p className="font-semibold">{n.title}</p>{!n.read&&<span className="w-2 h-2 rounded-full bg-[#1A5CFF] mt-2 shrink-0"/>}</div><p className="text-sm text-slate-500 mt-1">{n.message}</p><p className="text-xs text-slate-400 mt-2">{new Date(n.created_at).toLocaleString()}</p></div></button>)}</div>}
  </div>;
}
