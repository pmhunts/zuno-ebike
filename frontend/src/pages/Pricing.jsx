import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import './Pricing.css';

const EXAMPLES = [
  { label: 'Short hop', km: 2, desc: 'Corner shop to metro station' },
  { label: 'Daily commute', km: 6, desc: 'Home to office' },
  { label: 'Cross-city', km: 12, desc: 'One end of the city to the other' },
  { label: 'Long ride', km: 20, desc: 'Extended leisure or errand run' },
];

function calcFare(km, pricing) {
  if (!pricing) return 0;
  const { unlockFee, ratePerKmBase, ratePerKmBeyond, baseKmThreshold, minFare } = pricing;
  let fare = unlockFee;
  if (km <= baseKmThreshold) fare += km * ratePerKmBase;
  else {
    fare += baseKmThreshold * ratePerKmBase;
    fare += (km - baseKmThreshold) * ratePerKmBeyond;
  }
  return Math.max(Math.round(fare), minFare);
}

export default function Pricing() {
  const [pricing, setPricing] = useState(null);
  const [customKm, setCustomKm] = useState('');

  useEffect(() => { api.getPricing().then(setPricing).catch(() => {}); }, []);

  const customFare = customKm && pricing ? calcFare(parseFloat(customKm), pricing) : null;

  return (
    <main className="pricing-page">
      {/* Header */}
      <section className="pricing-hero">
        <div className="container">
          <div className="label mb-16">Transparent pricing</div>
          <h1 className="h1">Simple. Fair. Distance-based.</h1>
          <p className="pricing-sub">
            You pay a small unlock fee to start your ride, then a per-kilometre rate based on how far you travel.
            No subscriptions. No surprise charges.
          </p>
        </div>
      </section>

      {/* Rate cards */}
      <section className="section">
        <div className="container">
          <div className="rate-cards">
            <div className="rate-card card primary-rate">
              <div className="label mb-12">Unlock fee</div>
              <div className="rate-val">Rs.{pricing?.unlockFee ?? 10}</div>
              <p className="text-sm text-muted mt-12">
                Charged once per ride, the moment you unlock a bike at any station. This activates your ride session.
              </p>
            </div>
            <div className="rate-card card">
              <div className="label mb-12">First {pricing?.baseKmThreshold ?? 5}km</div>
              <div className="rate-val">Rs.{pricing?.ratePerKmBase ?? 3}<span className="rate-unit">/km</span></div>
              <p className="text-sm text-muted mt-12">
                The standard rate applies for the first {pricing?.baseKmThreshold ?? 5}km of every ride. Most short commutes fall within this range.
              </p>
            </div>
            <div className="rate-card card">
              <div className="label mb-12">Beyond {pricing?.baseKmThreshold ?? 5}km</div>
              <div className="rate-val">Rs.{pricing?.ratePerKmBeyond ?? 2}<span className="rate-unit">/km</span></div>
              <p className="text-sm text-muted mt-12">
                Longer rides get a reduced rate. Every kilometre beyond the first {pricing?.baseKmThreshold ?? 5} is charged at this lower rate.
              </p>
            </div>
            <div className="rate-card card">
              <div className="label mb-12">Minimum fare</div>
              <div className="rate-val">Rs.{pricing?.minFare ?? 15}</div>
              <p className="text-sm text-muted mt-12">
                The minimum amount charged per ride, regardless of how short the distance. Applies even for very short trips.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How distance is measured */}
      <section className="section how-distance-section">
        <div className="container">
          <div className="hd-inner">
            <div>
              <div className="label mb-12">How distance is calculated</div>
              <h2 className="h2 mb-24">Station to station, straight line</h2>
              <p className="text-muted" style={{ lineHeight: '1.8' }}>
                The distance for your ride is calculated using the Haversine formula — the straight-line (geodesic) distance between the GPS coordinates of your pickup station and your drop-off station.
              </p>
              <p className="text-muted mt-16" style={{ lineHeight: '1.8' }}>
                This means your fare is always predictable. You can estimate exactly what a ride will cost before you even unlock a bike, because you know which two stations you are travelling between.
              </p>
              <div className="hd-note">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                The distance measured is between stations, not your actual riding path.
              </div>
            </div>
            <div className="hd-diagram card">
              <div className="hd-station pickup">
                <div className="hd-dot pickup" />
                <div>
                  <div className="text-white" style={{ fontWeight: 600, fontSize: '14px' }}>Pickup station</div>
                  <div className="text-xs text-muted">GPS: 12.9752, 77.6069</div>
                </div>
              </div>
              <div className="hd-line">
                <div className="hd-line-inner" />
                <div className="hd-km-badge">Distance → Fare</div>
              </div>
              <div className="hd-station drop">
                <div className="hd-dot drop" />
                <div>
                  <div className="text-white" style={{ fontWeight: 600, fontSize: '14px' }}>Drop-off station</div>
                  <div className="text-xs text-muted">GPS: 12.9352, 77.6245</div>
                </div>
              </div>
              <div className="hd-formula">
                d = 2R × arcsin(√(sin²(Δlat/2) + cos(lat₁)cos(lat₂)sin²(Δlon/2)))
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fare calculator */}
      <section className="section calc-section">
        <div className="container">
          <div className="calc-card card">
            <div className="label mb-12">Fare calculator</div>
            <h2 className="h2 mb-8">Estimate your ride cost</h2>
            <p className="text-muted mb-32">Enter a distance to see the fare breakdown instantly.</p>

            <div className="calc-layout">
              <div>
                <div className="example-rides">
                  <div className="label mb-12">Example rides</div>
                  {EXAMPLES.map(ex => (
                    <button
                      key={ex.km}
                      className={`example-row ${customKm === String(ex.km) ? 'active' : ''}`}
                      onClick={() => setCustomKm(String(ex.km))}
                    >
                      <div>
                        <div className="example-label">{ex.label}</div>
                        <div className="example-desc text-xs text-muted">{ex.desc}</div>
                      </div>
                      <div className="example-km">{ex.km} km</div>
                    </button>
                  ))}
                </div>

                <div className="field mt-24">
                  <label>Or enter custom distance (km)</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="e.g. 7.5"
                    value={customKm}
                    onChange={e => setCustomKm(e.target.value)}
                    min="0.1" step="0.1"
                  />
                </div>
              </div>

              <div className="calc-result">
                {customKm && pricing && customFare !== null ? (
                  <>
                    <div className="cr-distance">{parseFloat(customKm).toFixed(1)} km</div>
                    <div className="cr-fare">Rs.{customFare}</div>

                    <div className="cr-breakdown">
                      <div className="cr-row">
                        <span>Unlock fee</span>
                        <span>Rs.{pricing.unlockFee}</span>
                      </div>
                      {parseFloat(customKm) <= pricing.baseKmThreshold ? (
                        <div className="cr-row">
                          <span>{parseFloat(customKm).toFixed(1)}km × Rs.{pricing.ratePerKmBase}</span>
                          <span>Rs.{Math.round(parseFloat(customKm) * pricing.ratePerKmBase)}</span>
                        </div>
                      ) : (
                        <>
                          <div className="cr-row">
                            <span>{pricing.baseKmThreshold}km × Rs.{pricing.ratePerKmBase}</span>
                            <span>Rs.{pricing.baseKmThreshold * pricing.ratePerKmBase}</span>
                          </div>
                          <div className="cr-row">
                            <span>{(parseFloat(customKm) - pricing.baseKmThreshold).toFixed(1)}km × Rs.{pricing.ratePerKmBeyond}</span>
                            <span>Rs.{Math.round((parseFloat(customKm) - pricing.baseKmThreshold) * pricing.ratePerKmBeyond)}</span>
                          </div>
                        </>
                      )}
                      <div className="cr-total">
                        <span>Total</span>
                        <span>Rs.{customFare}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="cr-empty">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--border2)" strokeWidth="1.2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                    <p className="text-muted text-sm mt-16">Enter a distance to see your fare</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Wallet CTA */}
      <section className="section">
        <div className="container text-center">
          <h2 className="h2">Ready to ride?</h2>
          <p className="text-muted mt-16">Create an account and get Rs.100 free wallet credit to start.</p>
          <div className="flex-center gap-12 mt-32" style={{ flexWrap: 'wrap' }}>
            <Link to="/login" className="btn btn-primary btn-lg">Get Started Free</Link>
            <Link to="/stations" className="btn btn-secondary btn-lg">View Stations</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
