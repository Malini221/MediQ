import { useState, useEffect, useRef } from 'react';
import { patientService } from '../../services/patients';
import { Patient } from '../../types/models';
import { cn } from '../../lib/utils';
import { MediQIcon } from './MediQIcon';

interface SelectPatientDropdownProps {
  value: string;
  onChange: (patientId: string) => void;
  className?: string;
  placeholder?: string;
}

export function SelectPatientDropdown({ value, onChange, className, placeholder = 'Select patient' }: SelectPatientDropdownProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchPatients = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await patientService.getPatients();
        setPatients(data);
      } catch (err: any) {
        setError(err?.message || 'Unable to load patients. Please try again.');
        console.error('SelectPatientDropdown Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredPatients = patients.filter(p => 
    p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.primary_diagnosis && p.primary_diagnosis.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedPatient = patients.find(p => p.id === value);

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between mediq-focus rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-left transition-colors hover:border-slate-300"
      >
        <span className={cn("truncate", !selectedPatient && "text-slate-400")}>
          {loading ? 'Loading patients...' : (selectedPatient ? `${selectedPatient.full_name} · ${selectedPatient.primary_diagnosis || 'No condition set'}` : placeholder)}
        </span>
        {loading ? (
          <div className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-[#1A5CFF] animate-spin" />
        ) : (
          <MediQIcon name="chevron-down" className="text-slate-400 w-4 h-4" />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white/95 backdrop-blur-xl border border-slate-200/50 rounded-2xl shadow-[0_8px_30px_rgba(30,90,160,0.12)] overflow-hidden flex flex-col max-h-[300px]">
          {error ? (
            <div className="p-4 text-center">
              <p className="text-sm font-semibold text-red-600">Unable to load patients</p>
              <p className="text-xs text-slate-500 mt-1">{error}</p>
            </div>
          ) : patients.length === 0 && !loading ? (
            <div className="p-5 text-center">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-400">
                <MediQIcon name="patients" />
              </div>
              <p className="text-sm font-semibold text-slate-900">No patients assigned</p>
              <p className="text-xs text-slate-500 mt-1">Your assigned patients will appear here.</p>
            </div>
          ) : (
            <>
              <div className="p-2 border-b border-slate-100 shrink-0">
                <div className="relative">
                  <MediQIcon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-[#1A5CFF] focus:ring-1 focus:ring-[#1A5CFF] transition-all"
                    placeholder="Search patients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
              
              <div className="overflow-y-auto p-1 flex-1">
                {filteredPatients.length === 0 ? (
                  <p className="text-center text-sm text-slate-500 py-4">No patients match your search.</p>
                ) : (
                  filteredPatients.map(patient => (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => {
                        onChange(patient.id);
                        setIsOpen(false);
                        setSearchQuery('');
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition-colors group",
                        value === patient.id ? "bg-[#1A5CFF]/10" : "hover:bg-slate-50"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-colors",
                        value === patient.id ? "bg-[#1A5CFF] text-white" : "bg-blue-100 text-blue-700 group-hover:bg-[#1A5CFF] group-hover:text-white"
                      )}>
                        {patient.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className={cn("text-sm font-semibold truncate transition-colors", value === patient.id ? "text-[#1A5CFF]" : "text-slate-900 group-hover:text-[#1A5CFF]")}>
                          {patient.full_name}
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                          {patient.primary_diagnosis || 'Condition not set'}
                        </div>
                      </div>
                      {value === patient.id && (
                        <MediQIcon name="check" className="w-4 h-4 text-[#1A5CFF] shrink-0" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
