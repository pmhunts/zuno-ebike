import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useGeolocation } from '../hooks/useGeolocation';
import MapView from '../components/MapView';
import StationCard from '../components/StationCard';
import LocationSearch from '../components/LocationSearch';
import './Stations.css';

export default function Stations() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [params]  = useSearchParams();

  const [cities,   setCities]   = useState([]);
  const [city,     setCity]     = useState(params.get('city') || '');
  const [stations, setStations] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);
  const [starting, setStarting] = useState(null);
  const [error,    setError]    = useState('');
  const [view,     setView]     = useState('map');
  const [autoCity, setAutoCity] = useState(false);
  const [manualLocation, setManualLocation] = useState(null);
  const [showLocSearch, setShowLocSearch] = useState(false);

  const { location: gpsLoc, error: geoError, loading: geoLoading } = useGeolocation({ enabled: true });
  const userLoc = manualLocation || gpsLoc;

  useEffect(() => { api.getCities().then(setCities).catch(() => {}); }, []);

  useEffect(() => {
    setLoading(true);
    api.getStations(city).then(setStations).finally(() => setLoading(false));
  }, [city]);

  useEffect(() => {
    if (userLoc && stations.length > 0 && !city && !autoCity) {
      const nearest = stations.reduce((best, s) =>
        dist(userLoc.lat, userLoc.lng, s.lat, s.lng) < dist(userLoc.lat, userLoc.lng, best.lat, best.lng) ? s : best
      );
      setCity(nearest.city);
      setSelected(nearest);
      setAutoCity(true);
    }
  }, [userLoc, stations]); // eslint-disable-line

  const handleStationClick = useCallback((station) => setSelected(station), []);

  const handleUnlock = async (station) => {
    if (!user) { navigate('/login'); return; }
    if (starting) return;
    setStarting(station.id);
    setError('');
    try {
      const data = await api.startRide(station.id);
      navigate('/ride', { state: { ride: data.ride, message: data.message } });
    } catch (err) {
      setError(err.message);
      setStarting(null);
    }
  };

  const mapCenter = userLoc
    ? { lat: userLoc.lat, lng: userLoc.lng }
    : stations.length > 0
      ? { lat: stations[0].lat, lng: stations[0].lng }
      : { lat: 12.9716, lng: 77.5946 };

  return (
    <main className="stations-page">
      <div className="stations-header">
        <div className="container sh-inner">
          <div>
            <h1 className="h1">Find a Bike</h1>
            <p className="text-muted mt-4">Select a station on the map or list to unlock a bike.</p>
          </div>
          <div className="sh-controls">
            <select className="input" value={city} onChange={e => { setCity(e.target.value); setSelected(null); }}>
              <option value="">All cities</option>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="view-toggle">
              <button className={view === 'map'  ? 'active' : ''} onClick={() => setView('map')}>Map</button>
              <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>List</button>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {!user && <div className="notice notice-info mt-16"><a href="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign in</a> to unlock a bike.</div>}
        {geoError && <div className="notice notice-info mt-16">Location access denied — allow location to see your nearest station.</div>}
        {geoLoading && <div className="geo-loading mt-16"><div className="spinner" style={{ width: '16px', height: '16px', marginRight: '8px' }} /><span className="text-sm text-muted">Getting your location...</span></div>}
        {error && <div className="notice notice-error mt-16">{error}</div>}

        {/* Manual location bar */}
        <div className="station-loc-bar mt-16">
          <div className="slb-left">
            {manualLocation ? (
              <>
                <span className="lb-dot manual" />
                <span className="text-xs" style={{ color: 'var(--blue)' }}>
                  Location set: {manualLocation.displayName?.split(',')[0] || `${manualLocation.lat.toFixed(4)}, ${manualLocation.lng.toFixed(4)}`}
                </span>
                <button className="lb-reset" onClick={() => { setManualLocation(null); setShowLocSearch(false); }}>Use GPS</button>
              </>
            ) : gpsLoc ? (
              <>
                <span className="lb-dot gps" />
                <span className="text-xs text-accent">GPS active {gpsLoc.accuracy ? `· ±${Math.round(gpsLoc.accuracy)}m` : ''}</span>
              </>
            ) : (
              <>
                <span className="lb-dot none" />
                <span className="text-xs text-muted">{geoError ? 'GPS unavailable' : 'Acquiring GPS...'}</span>
              </>
            )}
          </div>
          <button className="lb-manual-btn" onClick={() => setShowLocSearch(v => !v)}>
            {showLocSearch ? 'Cancel' : 'Set my location manually'}
          </button>
        </div>
        {showLocSearch && (
          <div className="loc-search-wrap mt-8">
            <LocationSearch
              onResult={({ lat, lng, displayName }) => { setManualLocation({ lat, lng, displayName }); setShowLocSearch(false); }}
              placeholder="Type your area, landmark or city..."
            />
          </div>
        )}
      </div>

      {loading ? (
        <div className="page-loader" style={{ marginTop: '60px' }}><div className="spinner" /></div>
      ) : (
        <div className="container stations-body">
          {view === 'map' ? (
            <div className="map-layout">
              <div className="map-panel">
                <MapView
                  stations={stations}
                  selectedId={selected?.id}
                  onStationClick={handleStationClick}
                  userLocation={userLoc}
                  center={mapCenter}
                  height="calc(100vh - 200px)"
                />
                {userLoc && (
                  <div className="map-gps-badge">
                    <span className="gps-dot" />
                    GPS active — {userLoc.accuracy ? `±${Math.round(userLoc.accuracy)}m` : 'locked'}
                  </div>
                )}
              </div>

              <div className="map-side">
                {selected ? (
                  <div className="selected-station-panel card">
                    <div className="ssp-header">
                      <div>
                        <div className="ssp-name">{selected.name}</div>
                        <div className="text-sm text-muted">{selected.city} · {selected.id}</div>
                      </div>
                      <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>Clear</button>
                    </div>
                    <div className={`ssp-bikes ${selected.bikeCount > 0 ? 'ok' : 'none'}`}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6h-5l-2 6h9l-2-6z"/><path d="M5.5 17.5L9 10l3 4"/></svg>
                      <span>{selected.bikeCount > 0 ? `${selected.bikeCount} bikes available` : 'No bikes right now'}</span>
                    </div>
                    {userLoc && (
                      <div className="ssp-distance">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
                        {formatDist(dist(userLoc.lat, userLoc.lng, selected.lat, selected.lng))} from you
                      </div>
                    )}
                    <div className="ssp-coords text-xs text-muted">{selected.lat.toFixed(4)}, {selected.lng.toFixed(4)}</div>
                    {selected.bikeCount > 0 ? (
                      <button className="btn btn-primary btn-full mt-16" onClick={() => handleUnlock(selected)} disabled={!!starting}>
                        {starting === selected.id ? 'Unlocking...' : 'Unlock a Bike Here'}
                      </button>
                    ) : (
                      <button className="btn btn-secondary btn-full mt-16" disabled>No Bikes Available</button>
                    )}
                  </div>
                ) : (
                  <div className="no-selected card">
                    <p className="text-muted text-sm">Tap a marker on the map to see station details and unlock a bike.</p>
                  </div>
                )}

                <div className="nearby-list">
                  <div className="label mb-12">{userLoc ? 'Nearest stations' : 'All stations'} ({stations.length})</div>
                  {sortByDistance(stations, userLoc).slice(0, 8).map(s => (
                    <button key={s.id} className={`nearby-row ${selected?.id === s.id ? 'active' : ''}`} onClick={() => handleStationClick(s)}>
                      <div className="nr-left">
                        <div className="nr-name">{s.name}</div>
                        <div className="nr-city text-xs text-muted">{s.city}</div>
                      </div>
                      <div className="nr-right">
                        {userLoc && <div className="nr-dist text-xs text-muted">{formatDist(dist(userLoc.lat, userLoc.lng, s.lat, s.lng))}</div>}
                        <div className={`nr-bikes ${s.bikeCount > 0 ? 'ok' : 'none'}`}>{s.bikeCount}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="list-view">
              {groupByCity(sortByDistance(stations, userLoc)).map(([grpCity, grpStations]) => (
                <div key={grpCity} className="city-group">
                  <div className="city-group-title">{grpCity}</div>
                  <div className="stations-grid">
                    {grpStations.map(s => (
                      <StationCard key={s.id} station={s} selected={selected?.id === s.id} onSelect={handleStationClick} action={handleUnlock} actionLabel={starting === s.id ? 'Unlocking...' : 'Unlock Here'} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}

function dist(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
function formatDist(km) { return km < 1 ? `${Math.round(km*1000)}m` : `${km.toFixed(1)}km`; }
function sortByDistance(stations, userLoc) {
  if (!userLoc) return stations;
  return [...stations].sort((a, b) => dist(userLoc.lat, userLoc.lng, a.lat, a.lng) - dist(userLoc.lat, userLoc.lng, b.lat, b.lng));
}
function groupByCity(stations) {
  const map = new Map();
  for (const s of stations) { if (!map.has(s.city)) map.set(s.city, []); map.get(s.city).push(s); }
  return [...map.entries()];
}
