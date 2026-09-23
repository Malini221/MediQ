import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { observationService } from '../services/observations';
import { patientService } from '../services/patients';
import { Patient } from '../types/models';
import { MediQIcon } from '../components/common/MediQIcon';
import { cn } from '../lib/utils';
import { SelectPatientDropdown } from '../components/common/SelectPatientDropdown';

type Mode = 'text' | 'voice';
type RecordingState = 'idle' | 'recording' | 'recorded' | 'processing';
const languages = [{code:'en',label:'English'},{code:'hi',label:'Hindi'},{code:'ta',label:'Tamil'},{code:'te',label:'Telugu'}];

export function NewObservation() {
  const { patientId: routePatientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientId, setPatientId] = useState(routePatientId || '');
  const [mode, setMode] = useState<Mode>('text');
  const [language, setLanguage] = useState(localStorage.getItem('mediq_voice_language') || 'en');
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [audioBlob, setAudioBlob] = useState<Blob|null>(null);
  const [audioUrl, setAudioUrl] = useState<string|null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder|null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>|null>(null);

  useEffect(() => { if (!routePatientId) patientService.getPatients().then(setPatients).catch(e=>setError(e?.message||'Unable to load patients.')); }, [routePatientId]);
  useEffect(() => () => { if(timerRef.current) clearInterval(timerRef.current); if(audioUrl) URL.revokeObjectURL(audioUrl); }, [audioUrl]);

  const startRecording = async () => {
    if (!patientId) { setError('Select a patient before recording.'); return; }
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio:true});
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder; chunksRef.current=[];
      recorder.ondataavailable=e=>{ if(e.data.size) chunksRef.current.push(e.data); };
      recorder.onstop=()=>{ const blob=new Blob(chunksRef.current,{type:'audio/webm'}); setAudioBlob(blob); setAudioUrl(URL.createObjectURL(blob)); setRecordingState('recorded'); stream.getTracks().forEach(t=>t.stop()); if(timerRef.current) clearInterval(timerRef.current); };
      recorder.start(); setRecordingState('recording'); setRecordingDuration(0); timerRef.current=setInterval(()=>setRecordingDuration(v=>v+1),1000);
    } catch { setError('Microphone access is required for voice observations. Allow microphone access and try again.'); }
  };
  const stopRecording=()=>{ if(mediaRecorderRef.current?.state==='recording') mediaRecorderRef.current.stop(); };
  const resetRecording=()=>{ if(audioUrl) URL.revokeObjectURL(audioUrl); setAudioUrl(null); setAudioBlob(null); setRecordingState('idle'); setRecordingDuration(0); };
  const submitText=async()=>{ if(!patientId||!text.trim()) return; setSubmitting(true); setError(''); try { const o=await observationService.createObservation(patientId,text.trim()); navigate(`/dashboard/observations/${o.id}`); } catch(e:any){setError(e?.message||'Failed to save observation.');} finally{setSubmitting(false);} };
  const submitVoice=async()=>{ if(!patientId||!audioBlob) return; if(audioBlob.size>10*1024*1024){setError('Audio file is too large. Maximum size is 10MB.');return;} setRecordingState('processing'); setError(''); try { const o=await observationService.createObservation(patientId,'Audio observation pending transcription.'); await observationService.uploadObservationAudio(o.id,audioBlob,language); navigate(`/dashboard/observations/${o.id}`); } catch(e:any){setError(e?.message||'Voice processing failed.');setRecordingState('recorded');} };

  return <div className="max-w-4xl mx-auto space-y-6 mediq-reveal">
    <section className="mediq-surface p-6 md:p-8"><div className="flex items-start justify-between gap-5"><div><p className="mediq-kicker">Create observation</p><h1 className="font-heading text-3xl font-bold mt-2">Capture what you noticed.</h1><p className="text-slate-500 mt-2">Text and voice observations follow the same review and safety flow.</p></div><Link to="/dashboard/observations" className="text-sm font-semibold text-[#1A5CFF]">Back</Link></div></section>
    <section className="mediq-surface p-6 md:p-8 space-y-7">
      <div><label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Patient</label>{routePatientId ? <div className="mt-2 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm font-semibold">{patients.find(p=>p.id===routePatientId)?.full_name || 'Selected patient'}</div> : <SelectPatientDropdown value={patientId} onChange={setPatientId} className="mt-2" />}</div>
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <div className="flex gap-2 rounded-full bg-slate-100 p-1 w-fit"><button onClick={()=>setMode('text')} className={cn('px-5 py-2.5 rounded-full text-sm font-semibold',mode==='text'?'bg-white text-[#0B132B]':'text-slate-500')}>Text</button><button onClick={()=>setMode('voice')} className={cn('px-5 py-2.5 rounded-full text-sm font-semibold',mode==='voice'?'bg-white text-[#0B132B]':'text-slate-500')}>Voice</button></div>
      {mode==='text' ? <div className="space-y-4"><textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Describe what you observed..." className="w-full h-52 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm mediq-focus resize-none"/><div className="flex justify-end"><button onClick={submitText} disabled={!patientId||!text.trim()||submitting} className="rounded-full bg-[#1A5CFF] text-white px-6 py-3 text-sm font-semibold disabled:opacity-40">{submitting?'Saving...':'Save observation'}</button></div></div> : <div className="space-y-6">
        <div><p className="text-sm font-semibold">Choose your speaking language</p><p className="text-xs text-slate-400 mt-1">You must choose a language before recording.</p><div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">{languages.map(l=><button key={l.code} disabled={recordingState!=='idle'} onClick={()=>{setLanguage(l.code);localStorage.setItem('mediq_voice_language',l.code)}} className={cn('rounded-xl border px-4 py-3 text-sm font-semibold',language===l.code?'border-[#1A5CFF] bg-[#1A5CFF]/5 text-[#1A5CFF]':'border-slate-200 text-slate-600')}>{l.label}</button>)}</div></div>
        {recordingState==='idle' && <div className="text-center py-8"><button onClick={startRecording} className="mx-auto w-24 h-24 rounded-full bg-[#1A5CFF] text-white flex items-center justify-center transition-transform hover:scale-[1.03]"><MediQIcon name="mic" size={34}/></button><p className="font-heading font-bold text-lg mt-5">Start voice observation</p><p className="text-sm text-slate-400 mt-1">{languages.find(l=>l.code===language)?.label} selected</p></div>}
        {recordingState==='recording' && <div className="text-center py-8"><div className="mx-auto w-24 h-24 rounded-full bg-red-50 text-red-500 border border-red-200 flex items-center justify-center"><MediQIcon name="mic" size={32}/></div><p className="font-heading text-3xl font-bold mt-5">{Math.floor(recordingDuration/60)}:{String(recordingDuration%60).padStart(2,'0')}</p><button onClick={stopRecording} className="mt-5 rounded-full bg-[#0B132B] text-white px-6 py-3 text-sm font-semibold">Stop recording</button></div>}
        {recordingState==='recorded' && audioUrl && <div className="space-y-4"><audio src={audioUrl} controls className="w-full"/><div className="flex gap-3"><button onClick={resetRecording} className="flex-1 rounded-full border border-slate-200 py-3 text-sm font-semibold">Record again</button><button onClick={submitVoice} className="flex-1 rounded-full bg-[#1A5CFF] text-white py-3 text-sm font-semibold">Upload & transcribe</button></div></div>}
        {recordingState==='processing' && <div className="text-center py-10"><div className="mx-auto w-12 h-12 border-4 border-[#1A5CFF]/20 border-t-[#1A5CFF] rounded-full animate-spin"/><p className="font-semibold mt-4">Transcribing locally</p><p className="text-sm text-slate-400 mt-1">Your audio is processed by the local Whisper pipeline.</p></div>}
      </div>}
    </section>
  </div>;
}
