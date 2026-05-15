import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../api';
import './Home.css';

const STEPS = [
  {
    n: '01',
    title: 'Find a station',
    body: 'Open the app, pick your city, and locate a Zuno station near you. Each station shows live bike availability.'
  },
  {
    n: '02',
    title: 'Unlock a bike',
    body: 'Select your pickup station and tap Unlock. A bike number is assigned to you instantly. No physical key needed.'
  },
  {
    n: '03',
    title: 'Ride to your destination',
    body: 'Ride at your own pace. The electric motor assists up to 25 km/h. No fuel, no emissions, no effort.'
  },
  {
    n: '04',
    title: 'Drop off and pay',
    body: 'Return the bike to any Zuno station. Distance is calculated and fare is deducted from your wallet automatically.'
  },
];

const FAQS = [
  { q: 'How is the fare calculated?', a: 'Rs.10 unlock fee + Rs.3/km for the first 5km, then Rs.2/km beyond that. The fare is calculated using the actual distance between your pickup and drop-off stations.' },
  { q: 'Do I have to return to the same station?', a: 'No. You can pick up from any station and return to any other Zuno station in the same city. The distance between the two stations determines your fare.' },
  { q: 'What if the battery runs out mid-ride?', a: 'All Zuno bikes start with a full charge. In the unlikely event of a battery issue, contact our support line and we will assist you immediately.' },
  { q: 'How do I add money to my wallet?', a: 'Go to Account and tap Add Funds. You can top up in increments of Rs.50 to Rs.5000.' },
  { q: 'Is there a minimum ride charge?', a: 'Yes, the minimum fare per ride is Rs.15, regardless of distance.' },
  { q: 'Can I pause my ride?', a: 'Rides cannot be paused. You are charged from unlock to drop-off. If you need a break, drop off at the nearest station and start a new ride when ready.' },
];

export default function Home() {
  const [cities, setCities] = useState([]);
  const [pricing, setPricing] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    api.getCities().then(setCities).catch(() => {});
    api.getPricing().then(setPricing).catch(() => {});
  }, []);

  return (
    <main className="home">

      {/* ── Hero ──────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="container hero-content">
          <div className="hero-pill">
            <span className="hero-dot" />
            Live in {cities.length > 0 ? cities.join(', ') : '4 cities'}
          </div>
          <h1 className="display hero-heading">
            Ride any<br />
            distance.<br />
            <span className="accent">Pay for it.</span>
          </h1>
          <p className="hero-sub">
            Pick up an electric bike from any Zuno station. Ride to your destination.
            Drop it off. You are charged only for the distance you travel.
          </p>
          <div className="hero-ctas">
            <Link to="/stations" className="btn btn-primary btn-lg">Find a Bike Near You</Link>
            <Link to="/pricing"  className="btn btn-secondary btn-lg">See Pricing</Link>
          </div>
        </div>

        <div className="hero-stats">
          <div className="hero-stat"><span className="hs-val">{stations_count(cities)}</span><span className="hs-label">Stations</span></div>
          <div className="hero-stat"><span className="hs-val">{cities.length || 4}</span><span className="hs-label">Cities</span></div>
          <div className="hero-stat"><span className="hs-val">Rs.3</span><span className="hs-label">Per km</span></div>
          <div className="hero-stat"><span className="hs-val">25km/h</span><span className="hs-label">Assisted speed</span></div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────── */}
      <section className="section how-section">
        <div className="container">
          <div className="label mb-16">How it works</div>
          <h2 className="h2 mb-24">Four steps to your destination</h2>
          <div className="steps-grid">
            {STEPS.map((s, i) => (
              <div key={s.n} className="step-card card">
                <div className="step-number">{s.n}</div>
                <h3 className="step-title">{s.title}</h3>
                <p className="text-sm text-muted">{s.body}</p>
                {i < STEPS.length - 1 && <div className="step-arrow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5"><polyline points="9,18 15,12 9,6"/></svg>
                </div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing preview ───────────────────────────── */}
      <section className="section pricing-preview">
        <div className="container">
          <div className="pp-inner card">
            <div className="pp-left">
              <div className="label mb-16">Simple pricing</div>
              <h2 className="h2">Pay only for what you ride</h2>
              <p className="text-muted mt-16" style={{ lineHeight: '1.8' }}>
                No subscriptions. No hidden fees. Just a small unlock fee and a per-kilometre rate based on how far you go.
              </p>
              <Link to="/pricing" className="btn btn-primary mt-32">Full Pricing Details</Link>
            </div>
            <div className="pp-right">
              <div className="pp-row">
                <span>Unlock fee</span>
                <span className="pp-val">Rs.{pricing?.unlockFee ?? 10}</span>
              </div>
              <div className="pp-divider" />
              <div className="pp-row">
                <span>First {pricing?.baseKmThreshold ?? 5}km</span>
                <span className="pp-val">Rs.{pricing?.ratePerKmBase ?? 3}<small>/km</small></span>
              </div>
              <div className="pp-divider" />
              <div className="pp-row">
                <span>Beyond {pricing?.baseKmThreshold ?? 5}km</span>
                <span className="pp-val">Rs.{pricing?.ratePerKmBeyond ?? 2}<small>/km</small></span>
              </div>
              <div className="pp-divider" />
              <div className="pp-row">
                <span>Minimum fare</span>
                <span className="pp-val">Rs.{pricing?.minFare ?? 15}</span>
              </div>
              <div className="pp-example">
                Example: 8km ride = Rs.{pricing ? (pricing.unlockFee + pricing.baseKmThreshold * pricing.ratePerKmBase + (8 - pricing.baseKmThreshold) * pricing.ratePerKmBeyond) : 31}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Cities ────────────────────────────────────── */}
      {cities.length > 0 && (
        <section className="section cities-section">
          <div className="container">
            <div className="label mb-16">Available in</div>
            <h2 className="h2 mb-24">Find Zuno in your city</h2>
            <div className="cities-grid">
              {cities.map(city => (
                <Link key={city} to={`/stations?city=${encodeURIComponent(city)}`} className="city-card card">
                  <div className="city-name">{city}</div>
                  <div className="city-arrow">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9,18 15,12 9,6"/></svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Why Zuno ──────────────────────────────────── */}
      <section className="section why-section">
        <div className="container">
          <div className="label mb-16">Why Zuno</div>
          <h2 className="h2 mb-24">Built for the daily commute</h2>
          <div className="why-grid">
            {[
              { title: 'No fuel, no parking', body: 'Skip petrol queues and parking charges. Electric bikes have near-zero running costs and park anywhere.' },
              { title: 'Beat the traffic', body: 'Electric bikes cut through congestion that stops cars. Consistent arrival times, every time.' },
              { title: 'Honest pricing', body: 'You pay exactly for the kilometres you ride. No surge pricing, no subscription traps, no surprises.' },
              { title: 'Full-charge guarantee', body: 'Every bike at every station starts fully charged. We refuel the fleet overnight so you never get stranded.' },
              { title: 'Drop anywhere in the city', body: 'Pick up near your home. Drop off near your office. No need to return to the same station.' },
              { title: 'Real-time availability', body: 'Check live bike counts at every station before you leave. No wasted trips.' },
            ].map(w => (
              <div key={w.title} className="why-card card">
                <div className="why-dot" />
                <div className="why-title">{w.title}</div>
                <p className="text-sm text-muted">{w.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────── */}
      <section className="section faq-section">
        <div className="container">
          <div className="label mb-16">FAQ</div>
          <h2 className="h2 mb-24">Common questions</h2>
          <div className="faq-list">
            {FAQS.map((f, i) => (
              <div key={i} className={`faq-item ${openFaq === i ? 'open' : ''}`}>
                <button className="faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span>{f.q}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="faq-icon"><polyline points="6,9 12,15 18,9"/></svg>
                </button>
                {openFaq === i && <div className="faq-a">{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────── */}
      <section className="section cta-section">
        <div className="container">
          <div className="cta-card card">
            <div className="label mb-16">Get started</div>
            <h2 className="h2">Start your first ride today</h2>
            <p className="text-muted mt-16">Sign up and get Rs.100 free credit. No payment required to create an account.</p>
            <div className="flex gap-12 mt-32" style={{ flexWrap: 'wrap' }}>
              <Link to="/login" className="btn btn-primary btn-lg">Create Free Account</Link>
              <Link to="/stations" className="btn btn-secondary btn-lg">Browse Stations</Link>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}

function stations_count(cities) {
  // 17 total stations across 4 cities
  return cities.length > 0 ? 17 : 17;
}
