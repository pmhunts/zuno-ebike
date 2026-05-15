import './StationCard.css';

export default function StationCard({ station, onSelect, selected, action, actionLabel }) {
  const available = station.bikeCount > 0;

  return (
    <div
      className={`station-card card ${selected ? 'selected' : ''} ${!available ? 'unavailable' : ''}`}
      onClick={() => available && onSelect && onSelect(station)}
    >
      <div className="sc-top">
        <div>
          <div className="sc-name">{station.name}</div>
          <div className="sc-city text-sm text-muted">{station.city}</div>
        </div>
        <div className={`sc-bikes ${available ? 'available' : 'none'}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/>
            <path d="M15 6h-5l-2 6h9l-2-6z"/><path d="M5.5 17.5L9 10l3 4"/>
          </svg>
          <span>{available ? `${station.bikeCount} bikes` : 'No bikes'}</span>
        </div>
      </div>
      <div className="sc-id">Station ID: {station.id}</div>
      {action && available && (
        <button className="btn btn-primary btn-sm btn-full sc-action" onClick={(e) => { e.stopPropagation(); action(station); }}>
          {actionLabel || 'Select'}
        </button>
      )}
      {!available && <div className="sc-empty">Currently unavailable</div>}
    </div>
  );
}
