import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import './History.css';

export default function History() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    api.getRides().then(setRides).finally(() => setLoading(false));
  }, [user, navigate]);

  const totalKm = rides.filter(r => r.status === 'completed').reduce((s, r) => s + (r.distanceKm || 0), 0);
  const totalSpent = rides.filter(r => r.status === 'completed').reduce((s, r) => s + (r.fare || 0), 0);

  if (loading) return <div className="page-loader" style={{ paddingTop: '60px' }}><div className="spinner" /></div>;

  return (
    <main className="history-page">
      <div className="container">
        <div className="history-header">
          <div>
            <h1 className="h2">Ride History</h1>
            <p className="text-muted mt-8">All your past Zuno rides.</p>
          </div>
          <Link to="/stations" className="btn btn-primary btn-sm">Start New Ride</Link>
        </div>

        {/* Summary row */}
        {rides.length > 0 && (
          <div className="history-summary card">
            <div className="hs-stat">
              <div className="hs-val">{rides.length}</div>
              <div className="hs-lbl">Total rides</div>
            </div>
            <div className="hs-stat">
              <div className="hs-val">{totalKm.toFixed(1)} km</div>
              <div className="hs-lbl">Total distance</div>
            </div>
            <div className="hs-stat">
              <div className="hs-val">Rs.{totalSpent}</div>
              <div className="hs-lbl">Total spent</div>
            </div>
            <div className="hs-stat">
              <div className="hs-val">{rides.length > 0 ? (totalKm / rides.length).toFixed(1) : 0} km</div>
              <div className="hs-lbl">Avg distance</div>
            </div>
          </div>
        )}

        {rides.length === 0 ? (
          <div className="no-history card">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--border2)" strokeWidth="1.2">
              <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
            </svg>
            <h3 className="mt-24" style={{ color: 'var(--white)', fontSize: '18px' }}>No rides yet</h3>
            <p className="text-muted mt-8 text-sm">Your ride history will appear here.</p>
            <Link to="/stations" className="btn btn-primary mt-24">Find a Bike</Link>
          </div>
        ) : (
          <div className="history-layout">
            <div className="rides-list">
              {rides.map(r => (
                <div
                  key={r.id}
                  className={`ride-row card ${selected?.id === r.id ? 'selected' : ''}`}
                  onClick={() => setSelected(selected?.id === r.id ? null : r)}
                >
                  <div className="rr-left">
                    <div className="rr-status">
                      <span className={`badge ${r.status === 'completed' ? 'badge-green' : r.status === 'active' ? 'badge-orange' : 'badge-red'}`}>
                        {r.status}
                      </span>
                    </div>
                    <div className="rr-route">
                      <span className="rr-from">{r.pickupStationName}</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2"><polyline points="9,18 15,12 9,6"/></svg>
                      <span className="rr-to">{r.dropStationName || '—'}</span>
                    </div>
                    <div className="rr-date text-xs text-muted">{formatDate(r.startedAt)}</div>
                  </div>
                  <div className="rr-right">
                    {r.distanceKm != null && <div className="rr-dist">{r.distanceKm} km</div>}
                    {r.fare != null && <div className="rr-fare">Rs.{r.fare}</div>}
                    {r.status === 'active' && (
                      <Link to="/ride" className="btn btn-primary btn-sm" onClick={e => e.stopPropagation()}>Continue</Link>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {selected && selected.status === 'completed' && (
              <div className="ride-detail card">
                <div className="flex-between mb-20">
                  <h3 style={{ fontSize: '15px', color: 'var(--white)', fontWeight: 700 }}>Ride Details</h3>
                  <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>Close</button>
                </div>
                <div className="rd-section">
                  <div className="rd-row"><span>Bike</span><span>{selected.bikeNumber}</span></div>
                  <div className="rd-row"><span>Started</span><span>{formatDate(selected.startedAt)}</span></div>
                  <div className="rd-row"><span>Ended</span><span>{formatDate(selected.endedAt)}</span></div>
                  <div className="rd-row"><span>Duration</span><span>{selected.durationMinutes} min</span></div>
                  <div className="rd-row"><span>Distance</span><span>{selected.distanceKm} km</span></div>
                </div>
                <div className="divider" style={{ margin: '16px 0' }} />
                <div className="rd-section">
                  <div className="rd-row"><span>Pickup</span><span>{selected.pickupStationName}</span></div>
                  <div className="rd-row"><span>Drop-off</span><span>{selected.dropStationName}</span></div>
                  <div className="rd-row"><span>City</span><span>{selected.pickupCity}</span></div>
                </div>
                <div className="divider" style={{ margin: '16px 0' }} />
                <div className="rd-section">
                  <div className="rd-row"><span>Unlock fee</span><span>Rs.{selected.fareBreakdown?.unlockFee}</span></div>
                  <div className="rd-row"><span>Distance charge</span><span>Rs.{selected.fareBreakdown?.distanceCharge}</span></div>
                  <div className="rd-row rd-total"><span>Total fare</span><span>Rs.{selected.fare}</span></div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
