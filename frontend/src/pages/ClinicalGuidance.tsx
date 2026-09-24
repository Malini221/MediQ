import { useState } from 'react';
import { clinicalGuidanceService } from '../services/clinicalGuidance';
import { ClinicalGuidanceResult } from '../types/models';
import { MediQIcon } from '../components/common/MediQIcon';

const PRESET_TOPICS = [
  'Fall risk protocols',
  'Agitation and confusion management',
  'Medication administration safety',
  'Vital signs escalation',
  'Skin integrity and pressure ulcer care',
  'Hypertension & fluid monitoring'
];

export function ClinicalGuidance() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ClinicalGuidanceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const executeSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    try {
      setLoading(true);
      setError(null);
      const data = await clinicalGuidanceService.searchClinicalGuidance(searchTerm.trim());
      setResults(data);
      setHasSearched(true);
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch clinical guidance protocols.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(query);
  };

  return (
    <div className="space-y-6 mediq-reveal max-w-5xl mx-auto pb-10">
      <section className="mediq-surface p-6 md:p-8">
        <p className="mediq-kicker">Clinical Knowledge Workspace</p>
        <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight mt-1 text-[#0B132B]">
          Approved Clinical Guidance
        </h1>
        <p className="text-slate-500 mt-2 text-sm max-w-xl">
          Search approved care protocols, safety guidelines, and clinical procedures using semantic retrieval.
        </p>
      </section>

      {/* Search Input Box */}
      <section className="mediq-surface p-6">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search clinical topics (e.g. fall risk, agitation, pressure sore)..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm mediq-focus"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="rounded-full bg-[#1A5CFF] text-white px-7 py-3.5 text-sm font-semibold hover:opacity-95 transition-opacity disabled:opacity-40 shrink-0"
          >
            {loading ? 'Searching...' : 'Search Library'}
          </button>
        </form>

        {/* Preset Topic Chips */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">Suggested Topics</p>
          <div className="flex flex-wrap gap-2">
            {PRESET_TOPICS.map(topic => (
              <button
                key={topic}
                onClick={() => {
                  setQuery(topic);
                  executeSearch(topic);
                }}
                className="px-3.5 py-1.5 rounded-full border border-slate-200 bg-slate-50 text-xs font-semibold text-[#0B132B] hover:border-[#1A5CFF] hover:bg-[#1A5CFF]/5 transition-all"
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Results & States */}
      {loading ? (
        <div className="mediq-surface p-8 space-y-4">
          <div className="h-5 w-48 bg-slate-100 animate-pulse rounded" />
          <div className="h-24 bg-slate-100 animate-pulse rounded-xl" />
          <div className="h-24 bg-slate-100 animate-pulse rounded-xl" />
        </div>
      ) : error ? (
        <div className="mediq-surface p-8 text-center text-red-600">
          <p className="font-semibold text-base">{error}</p>
          <button onClick={() => executeSearch(query)} className="mt-4 rounded-full border border-red-200 px-4 py-2 text-xs font-semibold">
            Try Search Again
          </button>
        </div>
      ) : !hasSearched ? (
        <div className="mediq-surface p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#1A5CFF]/10 text-[#1A5CFF] mx-auto flex items-center justify-center mb-4">
            <MediQIcon name="guidance" size={26} />
          </div>
          <h3 className="font-heading text-xl font-bold text-[#0B132B]">Search Approved Guidance</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
            Enter a clinical symptom, care protocol topic, or select one of the suggested topics above to view approved procedures.
          </p>
        </div>
      ) : results.length === 0 ? (
        <div className="mediq-surface p-12 text-center">
          <h3 className="font-heading text-xl font-bold text-[#0B132B]">No guidance protocols found</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-2">
            No approved guidance matched "{query}". Try adjusting your keywords or search phrase.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Matching Clinical Protocols ({results.length})
            </p>
            <span className="text-xs text-slate-400">Approved Knowledge Base</span>
          </div>

          <div className="space-y-4">
            {results.map(g => (
              <div key={g.id} className="mediq-surface p-6 space-y-4 border border-slate-200/90">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <h3 className="font-heading text-xl font-bold text-[#0B132B]">{g.title}</h3>
                  <span className="px-3 py-1 rounded-full bg-[#1A5CFF]/10 text-[#1A5CFF] text-xs font-semibold uppercase tracking-wider self-start sm:self-auto">
                    {g.category}
                  </span>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{g.content}</p>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>Verified Clinical Protocol</span>
                  {g.similarity_score !== undefined && (
                    <span>Relevance: {Math.round(g.similarity_score * 100)}%</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
