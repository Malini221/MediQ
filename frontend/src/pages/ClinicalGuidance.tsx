import { useState } from 'react';
import { clinicalGuidanceService } from '../services/clinicalGuidance';
import { ClinicalGuidanceResult } from '../types/models';
import { Search, BookOpen, AlertCircle, Sparkles } from '@/components/common/Icon';
import { cn } from '../lib/utils';

export function ClinicalGuidance() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ClinicalGuidanceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!query.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const data = await clinicalGuidanceService.searchClinicalGuidance(query.trim());
      setResults(data);
      setHasSearched(true);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch guidance. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2 mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-foreground font-display">Clinical Guidance</h1>
        <p className="text-muted-foreground text-lg">Search the approved care guidance library.</p>
      </div>

      {/* Search Input */}
      <div className="relative group max-w-2xl mx-auto">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-mediq-blue transition-colors" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search a care topic or concern (e.g., fall risk protocols)..."
          className="w-full bg-card border-2 border-border/60 hover:border-border rounded-full py-4 pl-12 pr-32 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-4 focus:ring-mediq-blue/10 focus:border-mediq-blue transition-all shadow-sm"
        />
        <div className="absolute inset-y-2 right-2">
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className={cn(
              "h-full px-6 rounded-full font-medium text-sm text-white transition-all shadow-sm",
              loading || !query.trim()
                ? "bg-mediq-blue/50 cursor-not-allowed"
                : "bg-mediq-blue hover:bg-mediq-blue/90 hover:-translate-y-0.5 hover:shadow-md"
            )}
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
      </div>

      {/* States */}
      <div className="mt-8">
        {loading && (
          <div className="py-12 flex flex-col items-center justify-center text-muted-foreground space-y-4">
            <div className="w-8 h-8 border-4 border-mediq-blue/30 border-t-mediq-blue rounded-full animate-spin" />
            <p className="font-medium animate-pulse">Searching approved guidance...</p>
          </div>
        )}

        {error && (
          <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-6 text-center text-destructive">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-80" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {!loading && !error && !hasSearched && (
          <div className="py-16 text-center text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>Search approved guidance using a topic or care concern.</p>
          </div>
        )}

        {!loading && !error && hasSearched && results.length === 0 && (
          <div className="py-16 text-center text-muted-foreground">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="font-medium text-foreground">No matching guidance found.</p>
            <p className="text-sm mt-1">Try a different search phrase.</p>
          </div>
        )}

        {/* Results List */}
        {!loading && !error && results.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider pl-1">
              Relevant Guidance
            </h2>
            <div className="grid gap-4">
              {results.map((result) => (
                <div 
                  key={result.id}
                  className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="font-semibold text-lg text-foreground font-display">
                      {result.title}
                    </h3>
                    {result.similarity_score !== undefined && (
                      <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-mediq-blue/10 text-mediq-blue">
                        <Sparkles className="w-3.5 h-3.5" />
                        Relevant
                      </span>
                    )}
                  </div>
                  
                  <span className="inline-block mt-2 px-2.5 py-0.5 rounded text-[10px] font-medium bg-secondary text-mediq-slate border border-border">
                    {result.category}
                  </span>
                  
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed text-sm">
                      {result.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
