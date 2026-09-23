import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { patientService } from '../../services/patients';
import { Patient } from '../../types/models';

export default function GlobalSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setIsFocused(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setPatients([]);
      return;
    }
    const fetchResults = async () => {
      setIsSearching(true);
      try {
        const data = await patientService.getPatients();
        const lowerQ = query.toLowerCase();
        setPatients(data.filter(p => p.full_name.toLowerCase().includes(lowerQ) || (p.primary_diagnosis && p.primary_diagnosis.toLowerCase().includes(lowerQ))));
      } catch (err) {
        console.error('Search error', err);
      } finally {
        setIsSearching(false);
      }
    };
    const debounceId = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounceId);
  }, [query]);

  const hasResults = query.length >= 2;

  return (
    <div className="relative z-50 w-full max-w-md hidden md:block" ref={containerRef}>
      <div className={cn(
        "relative flex items-center w-[300px] lg:w-[400px] rounded-full transition-all duration-300 border",
        isFocused ? "bg-white/95 border-white shadow-[0_4px_20px_rgba(30,90,160,0.15)]" : "bg-white/75 border-white/50 hover:bg-white/85 shadow-[0_4px_14px_rgba(30,90,160,0.08)]"
      )}>
        <div className="pl-4 pr-2 py-2 flex items-center justify-center text-[#16345f]">
          <svg className="w-4 h-4 stroke-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
        <input
          type="text"
          className="w-full bg-transparent border-none focus:outline-none text-sm text-[#16345f] placeholder-[#16345f]/50 py-2.5 pr-4 rounded-r-full"
          placeholder="Search patients, observations..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
        />
        {query && (
          <button 
            className="absolute right-3 text-[#16345f]/50 hover:text-[#16345f] focus:outline-none"
            onClick={() => setQuery('')}
          >
            <svg className="w-4 h-4 stroke-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isFocused && hasResults && (
        <div className="absolute top-full right-0 mt-3 w-full bg-white/95 backdrop-blur-xl border border-slate-200/50 rounded-2xl shadow-[0_8px_30px_rgba(30,90,160,0.12)] overflow-hidden">
          {isSearching ? (
            <div className="flex flex-col items-center justify-center py-8">
              <svg className="w-6 h-6 text-[#1A5CFF] animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              <span className="text-sm text-slate-500 mt-3 font-medium">Searching records...</span>
            </div>
          ) : patients.length === 0 ? (
            <div className="py-8 text-center"><p className="text-sm text-slate-500">No results found.</p></div>
          ) : (
            <div className="py-2 max-h-[300px] overflow-y-auto">
              <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Patients</div>
              {patients.map(patient => (
                <button key={patient.id} onClick={() => { setIsFocused(false); setQuery(''); navigate('/dashboard/observations'); }} className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-[#1A5CFF]/10 transition-colors text-left group">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0 group-hover:bg-[#1A5CFF] group-hover:text-white transition-colors">
                    {patient.full_name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900 group-hover:text-[#1A5CFF]">{patient.full_name}</div>
                    <div className="text-xs text-slate-500">{patient.primary_diagnosis || 'Condition not set'}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
