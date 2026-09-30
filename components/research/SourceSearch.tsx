// src/components/research/SourceSearch.tsx
// Reusable, accessible search input for source discovery with debounced async suggestions.
// Uses React, shadcn UI primitives, and the existing `fetchSources` API (app/api/collectors/search).

import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";

/**
 * Props for the SourceSearch component.
 */
interface SourceSearchProps {
  /** Callback when a source is selected */
  onSelect: (sourceId: string) => void;
  /** Placeholder text */
  placeholder?: string;
}

/**
 * Debounce hook – waits `delay` ms after the last change before invoking `callback`.
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

export const SourceSearch: React.FC<SourceSearchProps> = ({ onSelect, placeholder = "Search sources..." }) => {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [results, setResults] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const abortCtrl = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      return;
    }
    setLoading(true);
    // Cancel previous request
    abortCtrl.current?.abort();
    abortCtrl.current = new AbortController();
    fetch(`/api/collectors/search?q=${encodeURIComponent(debouncedQuery)}`, {
      signal: abortCtrl.current.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch sources");
        return res.json();
      })
      .then((data) => setResults(data.sources ?? []))
      .catch((err) => {
        if (err.name !== "AbortError") {
          toast({ title: "Error", description: err.message, variant: "destructive" });
        }
      })
      .finally(() => setLoading(false));
  }, [debouncedQuery, toast]);

  return (
    <div className="relative w-full max-w-md">
      <Input
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Source search"
        className="pr-10"
      />
      {loading && (
        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
          <Spinner size="sm" />
        </div>
      )}
      {results.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
          {results.map((src) => (
            <li
              key={src.id}
              className="px-3 py-2 hover:bg-accent cursor-pointer"
              onClick={() => {
                onSelect(src.id);
                setQuery("");
                setResults([]);
              }}
            >
              {src.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// Export for easy import elsewhere
export default SourceSearch;
