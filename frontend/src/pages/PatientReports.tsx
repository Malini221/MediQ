import { useEffect, useRef, useState } from 'react';
import { patientService } from '../services/patients';
import { observationService } from '../services/observations';
import { Patient, Observation } from '../types/models';
import { MediQIcon } from '../components/common/MediQIcon';
import { LoadingState, EmptyState } from '../components/ui/states';

type ReportMode = 'text' | 'voice';
type RecordingState = 'idle' | 'recording' | 'recorded' | 'processing';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'ta', label: 'Tamil' },
  { code: 'te', label: 'Telugu' }
];

export function PatientReports() {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [reports, setReports] = useState<Observation[]>([]);
  const [mode, setMode] = useState<ReportMode>('text');
  const [text, setText] = useState('');
  const [language, setLanguage] = useState(localStorage.getItem('mediq_voice_language') || 'en');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Voice recording state
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const ps = await patientService.getPatients();
      const p = ps[0];
      if (!p) {
        setError('No patient profile is linked to this account yet.');
        return;
      }
      setPatient(p);
      const obs = await patientService.getPatientObservations(p.id);
      setReports(obs.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)));
    } catch (e: any) {
      setError(e?.message || 'Unable to load your reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  }, [audioUrl]);

  // Voice recording handlers
  const startRecording = async () => {
    if (!patient) return;
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = e => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setRecordingState('recorded');
        stream.getTracks().forEach(t => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);
      };
      recorder.start();
      setRecordingState('recording');
      setRecordingDuration(0);
      timerRef.current = setInterval(() => setRecordingDuration(v => v + 1), 1000);
    } catch {
      setError('Microphone access is required for voice reports. Please allow microphone access.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const resetRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setAudioBlob(null);
    setRecordingState('idle');
    setRecordingDuration(0);
  };

  const submitTextReport = async () => {
    if (!patient || !text.trim()) return;
    setSubmitting(true);
    setError('');
    setSuccessMessage('');
    try {
      await observationService.createObservation(patient.id, `[Patient Report] ${text.trim()}`);
      setText('');
      setSuccessMessage('Your report has been submitted to your care team.');
      await loadData();
    } catch (e: any) {
      setError(e?.message || 'Unable to submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  const submitVoiceReport = async () => {
    if (!patient || !audioBlob) return;
    setRecordingState('processing');
    setError('');
    setSuccessMessage('');
    try {
      const obs = await observationService.createObservation(patient.id, '[Patient Voice Report] Audio pending transcription.');
      await observationService.uploadObservationAudio(obs.id, audioBlob, language);
      resetRecording();
      setSuccessMessage('Your voice report has been transcribed and submitted.');
      await loadData();
    } catch (e: any) {
      setError(e?.message || 'Voice report submission failed.');
      setRecordingState('recorded');
    }
  };

  if (loading) {
    return <LoadingState message="Loading your reports..." />;
  }

  return (
    <div className="space-y-6 mediq-reveal max-w-5xl mx-auto pb-10">
      <section className="mediq-surface p-6 md:p-8">
        <p className="mediq-kicker">My Reports Workspace</p>
        <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight mt-1 text-[#0B132B]">
          Tell Your Care Team
        </h1>
        <p className="text-slate-500 mt-2 text-sm max-w-xl">
          Share voice or text reports about symptoms, discomfort, or changes. Your authorized care team will receive your report.
        </p>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
          {successMessage}
        </div>
      )}

      {/* Report Input Form */}
      <section className="mediq-surface p-6 space-y-5">
        <div className="flex gap-2 rounded-full bg-slate-100 p-1 w-fit">
          <button
            onClick={() => setMode('text')}
            className={`px-5 py-2 rounded-full text-xs font-semibold ${
              mode === 'text' ? 'bg-white text-[#0B132B] shadow-sm' : 'text-slate-500'
            }`}
          >
            Text Report
          </button>
          <button
            onClick={() => setMode('voice')}
            className={`px-5 py-2 rounded-full text-xs font-semibold ${
              mode === 'voice' ? 'bg-white text-[#0B132B] shadow-sm' : 'text-slate-500'
            }`}
          >
            Voice Report
          </button>
        </div>

        {mode === 'text' ? (
          <div className="space-y-4">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              className="w-full h-36 rounded-2xl border border-slate-200 bg-slate-50 p-4 mediq-focus text-sm"
              placeholder="What would you like to tell your care team? (e.g., discomfort, sleep problems, changes noticed)..."
            />
            <div className="flex justify-end">
              <button
                onClick={submitTextReport}
                disabled={!patient || !text.trim() || submitting}
                className="rounded-full bg-[#1A5CFF] text-white px-6 py-2.5 text-sm font-semibold hover:opacity-95 transition-opacity disabled:opacity-40"
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Speaking Language</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {LANGUAGES.map(l => (
                  <button
                    key={l.code}
                    disabled={recordingState !== 'idle'}
                    onClick={() => {
                      setLanguage(l.code);
                      localStorage.setItem('mediq_voice_language', l.code);
                    }}
                    className={`rounded-xl border p-3 text-xs font-semibold text-left ${
                      language === l.code
                        ? 'border-[#1A5CFF] bg-[#1A5CFF]/5 text-[#1A5CFF]'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {recordingState === 'idle' && (
              <div className="text-center py-6">
                <button
                  onClick={startRecording}
                  className="mx-auto w-20 h-20 rounded-full bg-[#1A5CFF] text-white flex items-center justify-center hover:scale-[1.03] transition-transform"
                >
                  <MediQIcon name="mic" size={28} />
                </button>
                <p className="font-heading font-bold text-base mt-3 text-[#0B132B]">Start Voice Report</p>
                <p className="text-xs text-slate-400 mt-1">{LANGUAGES.find(l => l.code === language)?.label} selected</p>
              </div>
            )}

            {recordingState === 'recording' && (
              <div className="text-center py-6">
                <div className="mx-auto w-20 h-20 rounded-full bg-red-50 text-red-500 border border-red-200 flex items-center justify-center animate-pulse">
                  <MediQIcon name="mic" size={28} />
                </div>
                <p className="font-heading text-2xl font-bold mt-3 text-[#0B132B]">
                  {Math.floor(recordingDuration / 60)}:{String(recordingDuration % 60).padStart(2, '0')}
                </p>
                <button
                  onClick={stopRecording}
                  className="mt-4 rounded-full bg-[#0B132B] text-white px-6 py-2.5 text-sm font-semibold"
                >
                  Stop Recording
                </button>
              </div>
            )}

            {recordingState === 'recorded' && audioUrl && (
              <div className="space-y-3">
                <audio src={audioUrl} controls className="w-full" />
                <div className="flex gap-3">
                  <button
                    onClick={resetRecording}
                    className="flex-1 rounded-full border border-slate-200 py-2.5 text-xs font-semibold text-slate-600"
                  >
                    Record Again
                  </button>
                  <button
                    onClick={submitVoiceReport}
                    className="flex-1 rounded-full bg-[#1A5CFF] text-white py-2.5 text-xs font-semibold"
                  >
                    Upload & Submit Report
                  </button>
                </div>
              </div>
            )}

            {recordingState === 'processing' && (
              <div className="text-center py-8">
                <div className="mx-auto w-10 h-10 border-4 border-[#1A5CFF]/20 border-t-[#1A5CFF] rounded-full animate-spin" />
                <p className="font-semibold text-sm mt-3 text-[#0B132B]">Transcribing & Submitting</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Report History */}
      <section className="space-y-4">
        <h2 className="font-heading text-lg font-bold text-[#0B132B]">My Submitted Reports ({reports.length})</h2>

        {reports.length === 0 ? (
          <EmptyState
            title="No reports submitted yet"
            description="Tell your care team how you are feeling or record your first report above."
            icon="reports"
          />
        ) : (
          <div className="space-y-3">
            {reports.map(r => (
              <div key={r.id} className="mediq-surface p-5 space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#1A5CFF]/10 text-[#1A5CFF] flex items-center justify-center shrink-0">
                      <MediQIcon name="reports" size={17} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-[#0B132B]">
                        {r.raw_text?.replace('[Patient Report] ', '').replace('[Patient Voice Report] ', '') || 'Voice Report'}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(r.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold capitalize shrink-0">
                    {r.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
