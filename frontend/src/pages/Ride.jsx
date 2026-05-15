import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useGeolocation } from '../hooks/useGeolocation';
import MapView from '../components/MapView';
import LocationSearch from '../components/LocationSearch';
import './Ride.css';

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

export default function Ride() {
  const { user, refreshUser } = useAuth();
  const location = useLocation();
  const navigate  = useNavigate();

  const [ride,        setRide]        = useState(location.state?.ride || null);
  const [loadingRide, setLoadingRide] = useState(!location.state?.ride);
  const [elapsed,     setElapsed]     = useState(0);
  const [stations,    setStations]    = useState([]);
  const [dropStation, setDropStation] = useState(null);
  const [estimate,    setEstimate]    = useState(null);
  const [loadingEst,  setLoadingEst]  = useState(false);
  const [ending,      setEnding]      = useState(false);
  const [error,       setError]       = useState('');
  const [summary,     setSummary]     = useState(null);

  // Manual location override — user can type instead of using GPS
  const [manualLocation, setManualLocation] = useState(null);
  const [showLocSearch,  setShowLocSearch]  = useState(false);

  // Real GPS (used if no manual override)
  const { location: gpsLoc, error: geoError } = useGeolocation({ enabled: true });

  // Effective location: manual wins over GPS
  const userLoc = manualLocation || gpsLoc;

  // ── Timer: useRef stores the interval ID so we can clear it anywhere ──────
  const timerRef = useRef(null);

  // Start timer when ride is available, stop it when summary arrives
  useEffect(() => {
    // Always clear any existing interval first
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Only run timer during an active ride
    if (!ride || summary) return;

    const startMs = new Date(ride.startedAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - startMs) / 1000));
    tick(); // immediate first tick
    timerRef.current = setInterval(tick, 1000);

    // Cleanup on unmount or when deps change
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [ride, summary]); // <-- summary in deps: timer stops the moment ride ends

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (!ride) {
      api.getActiveRide()
        .then(r => { setRide(r); setLoadingRide(false); })
        .catch(() => setLoadingRide(false));
    }
    api.getStations().then(setStations).catch(() => {});
  }, [user, navigate]); // eslint-disable-line

  // Fare estimate whenever drop station changes
  useEffect(() => {
    if (!ride || !dropStation) return;
    setLoadingEst(true);
    api.estimate(ride.pickupStationId, dropStation.id)
      .then(setEstimate)
      .catch(() => setEstimate(null))
      .finally(() => setLoadingEst(false));
  }, [ride, dropStation]);

  const handleEndRide = async () => {
    if (!dropStation) { setError('Select a drop-off station first.'); return; }
    setEnding(true); setError('');
    try {
      const data = await api.endRide(ride.id, dropStation.id);
      await refreshUser();
      setSummary(data); // this triggers timer to stop via useEffect deps
    } catch (err) {
      setError(err.message);
    } finally {
      setEnding(false);
    }
  };

  const handleManualLocation = ({ lat, lng, displayName }) => {
    setManualLocation({ lat, lng, accuracy: null, displayName });
    setShowLocSearch(false);
  };

  if (!user) return null;

  if (loadingRide) return (
    <div className="page-loader" style={{ paddingTop: '60px' }}>
      <div className="spinner" />
    </div>
  );

  // ── Ride summary (after completion) ──────────────────────────────────────────
  if (summary) {
    const r = summary.ride;
    const pickupSt = stations.find(s => s.id === r.pickupStationId)
      || { lat: r.pickupLat, lng: r.pickupLng, name: r.pickupStationName };
    const dropSt = stations.find(s => s.id === r.dropStationId)
      || { lat: r.dropLat,   lng: r.dropLng,   name: r.dropStationName };

    return (
      <main className="ride-page">
        <div className="container">
          <div className="summary-layout">
            <div className="summary-card card">
              <div className="summary-check">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5">
                  <polyline points="20,6 9,17 4,12"/>
                </svg>
              </div>
              <h1 className="h2 mt-24">Ride Complete</h1>
              <p className="text-muted mt-8">Bike {r.bikeNumber} returned. Thanks for riding with Zuno.</p>

              <div className="summary-route mt-32">
                <div className="sr-point">
                  <div className="sr-dot pickup" />
                  <div>
                    <div className="text-xs text-muted">PICKED UP FROM</div>
                    <div className="text-white" style={{ fontWeight: 600 }}>{r.pickupStationName}</div>
                  </div>
                </div>
                <div className="sr-line" />
                <div className="sr-point">
                  <div className="sr-dot drop" />
                  <div>
                    <div className="text-xs text-muted">DROPPED AT</div>
                    <div className="text-white" style={{ fontWeight: 600 }}>{r.dropStationName}</div>
                  </div>
                </div>
              </div>

              <div className="summary-stats mt-32">
                <div className="ss-item">
                  <div className="ss-val">{r.distanceKm} km</div>
                  <div className="ss-label">Distance</div>
                </div>
                <div className="ss-item">
                  <div className="ss-val">{formatDuration(elapsed > 0 ? elapsed : r.durationMinutes * 60)}</div>
                  <div className="ss-label">Duration</div>
                </div>
                <div className="ss-item accent">
                  <div className="ss-val">Rs.{r.fare}</div>
                  <div className="ss-label">Fare charged</div>
                </div>
              </div>

              <div className="summary-breakdown card mt-24">
                <div className="sb-row"><span>Unlock fee</span><span>Rs.{r.fareBreakdown.unlockFee}</span></div>
                <div className="sb-row"><span>Distance ({r.distanceKm} km)</span><span>Rs.{r.fareBreakdown.distanceCharge}</span></div>
                <div className="sb-divider" />
                <div className="sb-row total"><span>Total charged</span><span>Rs.{r.fareBreakdown.total}</span></div>
                <div className="sb-row"><span>Wallet remaining</span><span>Rs.{summary.walletBalance}</span></div>
              </div>

              <div className="flex gap-12 mt-32" style={{ flexWrap: 'wrap' }}>
                <Link to="/stations" className="btn btn-primary">Ride Again</Link>
                <Link to="/history"  className="btn btn-secondary">View History</Link>
              </div>
            </div>

            {/* Route map */}
            <div>
              <div className="label mb-12">Ride route</div>
              <MapView
                stations={[]}
                pickupStation={pickupSt}
                dropStation={dropSt}
                showRoute={true}
                center={{ lat: (pickupSt.lat + dropSt.lat) / 2, lng: (pickupSt.lng + dropSt.lng) / 2 }}
                height="380px"
              />
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ── No active ride ────────────────────────────────────────────────────────────
  if (!ride) {
    return (
      <main className="ride-page">
        <div className="container">
          <div className="no-ride card">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--border2)" strokeWidth="1.2">
              <circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/>
              <path d="M15 6h-5l-2 6h9l-2-6z"/><path d="M5.5 17.5L9 10l3 4"/>
            </svg>
            <h2 className="h3 mt-24" style={{ fontSize: '20px' }}>No active ride</h2>
            <p className="text-muted mt-8">Find a station to start a ride.</p>
            <Link to="/stations" className="btn btn-primary mt-24">Find a Bike</Link>
          </div>
        </div>
      </main>
    );
  }

  // ── Active ride ───────────────────────────────────────────────────────────────
  const pickupSt = stations.find(s => s.id === ride.pickupStationId)
    || { lat: ride.pickupLat, lng: ride.pickupLng, name: ride.pickupStationName };
  const sameCityStations = stations.filter(s => s.city === ride.pickupCity && s.id !== ride.pickupStationId);

  return (
    <main className="ride-page">
      <div className="container">

        {/* Live header */}
        <div className="ride-live-header">
          <div className="rlh-left">
            <div className="live-badge">
              <span className="live-dot" />
              Ride in progress
            </div>
            <h1 className="h2 mt-12">Bike {ride.bikeNumber}</h1>
            <p className="text-muted mt-4">{ride.pickupStationName} · {ride.pickupCity}</p>
          </div>
          <div className="rlh-timer">
            <div className="timer-value">{formatDuration(elapsed)}</div>
            <div className="timer-label">Elapsed time</div>
          </div>
        </div>

        <div className="active-ride-layout">

          {/* Left: map + drop selector */}
          <div className="active-ride-left">

            {/* Location bar */}
            <div className="location-bar">
              <div className="lb-status">
                {manualLocation ? (
                  <>
                    <span className="lb-dot manual" />
                    <span className="text-xs" style={{ color: 'var(--blue)' }}>
                      Manual: {manualLocation.displayName?.split(',')[0] || `${manualLocation.lat.toFixed(4)}, ${manualLocation.lng.toFixed(4)}`}
                    </span>
                    <button
                      className="lb-reset"
                      onClick={() => setManualLocation(null)}
                      title="Use GPS instead"
                    >
                      Use GPS
                    </button>
                  </>
                ) : gpsLoc ? (
                  <>
                    <span className="lb-dot gps" />
                    <span className="text-xs text-accent">
                      GPS active {gpsLoc.accuracy ? `· ±${Math.round(gpsLoc.accuracy)}m` : ''}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="lb-dot none" />
                    <span className="text-xs text-muted">
                      {geoError ? 'GPS denied' : 'Getting GPS...'}
                    </span>
                  </>
                )}
              </div>
              <button
                className="lb-manual-btn"
                onClick={() => setShowLocSearch(v => !v)}
              >
                {showLocSearch ? 'Cancel' : 'Set location manually'}
              </button>
            </div>

            {/* Manual location search */}
            {showLocSearch && (
              <div className="loc-search-wrap">
                <LocationSearch
                  onResult={handleManualLocation}
                  placeholder="Type your location, area or city..."
                />
                <p className="text-xs text-muted mt-8">
                  This sets the map view and sorts nearby stations by distance from your typed location.
                </p>
              </div>
            )}

            {/* Map */}
            <div className="ride-map-header flex-between mb-12 mt-16">
              <div className="label">Live map</div>
              <span className="text-xs text-muted">Tap a station to select drop-off</span>
            </div>
            <MapView
              stations={sameCityStations}
              selectedId={dropStation?.id}
              onStationClick={setDropStation}
              userLocation={userLoc}
              pickupStation={pickupSt}
              dropStation={dropStation}
              showRoute={!!dropStation}
              center={userLoc
                ? { lat: userLoc.lat, lng: userLoc.lng }
                : { lat: ride.pickupLat, lng: ride.pickupLng }}
              zoom={13}
              height="380px"
              activeRide={true}
            />

            {/* Drop station list */}
            <h3 className="h3 mt-24 mb-12" style={{ fontSize: '15px' }}>Select drop-off station</h3>
            <div className="drop-grid">
              {sameCityStations.map(s => (
                <button
                  key={s.id}
                  className={`drop-station-btn ${dropStation?.id === s.id ? 'active' : ''}`}
                  onClick={() => setDropStation(s)}
                >
                  <div className="dsb-name">{s.name}</div>
                  <div className={`dsb-bikes ${s.bikeCount > 0 ? 'ok' : 'none'}`}>
                    {s.bikeCount} return spots
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right: fare + end button */}
          <div className="ride-sidebar">
            <div className="fare-estimate card">
              <div className="fe-title">Fare Estimate</div>
              {!dropStation ? (
                <p className="text-sm text-muted mt-8">
                  Select a drop-off station on the map or from the list below to see your fare.
                </p>
              ) : loadingEst ? (
                <div className="flex-center" style={{ padding: '20px 0' }}>
                  <div className="spinner" />
                </div>
              ) : estimate ? (
                <>
                  <div className="fe-route">
                    <div className="fe-point">
                      <span className="fe-dot pickup" />
                      <span className="text-sm">{ride.pickupStationName}</span>
                    </div>
                    <div className="fe-line-v" />
                    <div className="fe-point">
                      <span className="fe-dot drop" />
                      <span className="text-sm">{dropStation.name}</span>
                    </div>
                  </div>
                  <div className="fe-stats">
                    <div className="fe-stat">
                      <span className="fe-stat-v">{estimate.distanceKm} km</span>
                      <span className="fe-stat-l">Distance</span>
                    </div>
                    <div className="fe-stat">
                      <span className="fe-stat-v">~{estimate.durationMinutes}m</span>
                      <span className="fe-stat-l">Est. time</span>
                    </div>
                  </div>
                  <div className="fe-breakdown">
                    <div className="fe-brow">
                      <span>Unlock fee</span>
                      <span>Rs.{estimate.breakdown.unlockFee}</span>
                    </div>
                    <div className="fe-brow">
                      <span>{estimate.distanceKm} km charge</span>
                      <span>Rs.{estimate.breakdown.distanceCharge}</span>
                    </div>
                    <div className="fe-btotal">
                      <span>Estimated total</span>
                      <span>Rs.{estimate.fare}</span>
                    </div>
                  </div>
                  <div className="fe-wallet text-sm">
                    Wallet: <strong style={{ color: user.walletBalance >= estimate.fare ? 'var(--accent)' : 'var(--red)' }}>
                      Rs.{user.walletBalance}
                    </strong>
                    {user.walletBalance < estimate.fare && (
                      <span style={{ color: 'var(--red)', marginLeft: '6px' }}>— low balance</span>
                    )}
                  </div>
                </>
              ) : null}
            </div>

            {error && <div className="notice notice-error mt-16">{error}</div>}

            <button
              className="btn btn-danger btn-full mt-16"
              onClick={handleEndRide}
              disabled={ending || !dropStation}
            >
              {ending ? 'Ending ride...' : 'End Ride and Pay'}
            </button>

            {user.walletBalance < 15 && (
              <Link to="/account" className="btn btn-blue btn-full mt-8" style={{ textAlign: 'center' }}>
                Top Up Wallet
              </Link>
            )}

            <div className="ride-pickup-info card mt-16">
              <div className="label mb-8">Ride info</div>
              <div className="rpi-row"><span>Bike</span><span>{ride.bikeNumber}</span></div>
              <div className="rpi-row">
                <span>Started</span>
                <span>{new Date(ride.startedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="rpi-row"><span>Elapsed</span><span>{formatDuration(elapsed)}</span></div>
              <div className="rpi-row"><span>Pickup</span><span>{ride.pickupStationName}</span></div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
