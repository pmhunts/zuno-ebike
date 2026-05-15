import { useState } from 'react';
import './LocationSearch.css';

/**
 * LocationSearch
 * Uses OpenStreetMap Nominatim API — free, no key required.
 * onResult({ lat, lng, displayName }) is called when a location is found.
 */
export default function LocationSearch({ onResult, placeholder = 'Search a location...' }) {
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [open,    setOpen]    = useState(false);

  const search = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setResults([]);

    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=in`;
      const res  = await fetch(url, { headers: { 'Accept-Language': 'en' } });
      const data = await res.json();

      if (!data.length) {
        setError('No results found. Try a different place name.');
        setOpen(false);
        return;
      }

      setResults(data);
      setOpen(true);
    } catch {
      setError('Could not search right now. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const pick = (item) => {
    setQuery(item.display_name.split(',')[0]);
    setOpen(false);
    setResults([]);
    onResult({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      displayName: item.display_name,
    });
  };

  return (
    <div className="loc-search">
      <form onSubmit={search} className="loc-form">
        <div className="loc-input-wrap">
          <svg className="loc-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            className="input loc-input"
            placeholder={placeholder}
            value={query}
            onChange={e => { setQuery(e.target.value); if (!e.target.value) { setOpen(false); setResults([]); } }}
            autoComplete="off"
          />
          {query && (
            <button type="button" className="loc-clear" onClick={() => { setQuery(''); setResults([]); setOpen(false); setError(''); }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          )}
        </div>
        <button type="submit" className="btn btn-primary btn-sm loc-btn" disabled={loading}>
          {loading ? <span className="loc-spinner" /> : 'Go'}
        </button>
      </form>

      {error && <p className="loc-error">{error}</p>}

      {open && results.length > 0 && (
        <ul className="loc-results">
          {results.map((item) => (
            <li key={item.place_id}>
              <button className="loc-result-row" onClick={() => pick(item)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, color: 'var(--accent)' }}>
                  <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                <span className="loc-result-text">{item.display_name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
