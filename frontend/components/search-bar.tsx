"use client";

type SearchBarProps = {
  value: string;
  suggestions: string[];
  recentSearches: string[];
  onChange: (value: string) => void;
  onSubmit: () => void;
  onSelect: (value: string) => void;
};


export function SearchBar({ value, suggestions, recentSearches, onChange, onSubmit, onSelect }: SearchBarProps) {
  return (
    <div>
      <div className="panel flex flex-col gap-3 p-3 lg:flex-row">
        <div className="flex h-12 flex-1 items-center gap-3 rounded-md border border-line bg-card px-4">
          <svg aria-hidden="true" className="h-4 w-4 text-steel" fill="none" viewBox="0 0 16 16">
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.6" />
            <path d="M11 11L14.5 14.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
          </svg>
          <input
            className="w-full border-0 bg-transparent p-0 text-sm text-taupe outline-none placeholder:text-steel"
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                onSubmit();
              }
            }}
            placeholder="Search any grocery item, not just recommended ones"
            value={value}
          />
        </div>
        <button className="btn-primary h-12 px-6" onClick={onSubmit} type="button">
          Search Buying Options
        </button>
      </div>
      {suggestions.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {suggestions.slice(0, 8).map((suggestion) => (
            <button className="chip" key={suggestion} onClick={() => onSelect(suggestion)} type="button">
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}
      {recentSearches.length ? (
        <div className="mt-4 text-sm text-steel">
          Recent searches:{" "}
          {recentSearches.map((search, index) => (
            <button className="mr-2 text-taupe underline decoration-rose decoration-2 underline-offset-4" key={`${search}-${index}`} onClick={() => onSelect(search)} type="button">
              {search}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
