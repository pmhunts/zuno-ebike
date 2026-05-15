import { Link } from 'react-router-dom';
import { useState } from 'react';
import { api } from '../api';
import './Footer.css';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');

  const handleSub = async (e) => {
    e.preventDefault();
    try {
      await api.newsletter(email);
      setMsg('Subscribed. Updates coming your way.');
      setEmail('');
    } catch (err) {
      setMsg(err.message);
    }
  };

  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <div className="footer-logo"><span style={{ color: 'var(--accent)' }}>Z</span>UNO</div>
          <p className="text-sm text-muted" style={{ lineHeight: '1.7', maxWidth: '220px' }}>
            Electric bike rentals. Pick up from any station. Pay only for the distance you ride.
          </p>
          <div className="footer-cities text-xs text-muted mt-16">
            Bangalore · Mumbai · Delhi · Pune
          </div>
        </div>

        <div className="footer-col">
          <div className="footer-col-title">Ride</div>
          <Link to="/stations">Find a Bike</Link>
          <Link to="/pricing">Pricing</Link>
          <Link to="/history">My Rides</Link>
          <Link to="/account">My Wallet</Link>
        </div>

        <div className="footer-col">
          <div className="footer-col-title">Company</div>
          <a href="#about">About</a>
          <a href="#careers">Careers</a>
          <a href="#press">Press</a>
          <a href="#investors">Investors</a>
        </div>

        <div className="footer-col">
          <div className="footer-col-title">Support</div>
          <a href="#help">Help Center</a>
          <a href="#safety">Safety</a>
          <a href="#insurance">Insurance</a>
          <a href="#report">Report an issue</a>
        </div>

        <div className="footer-newsletter">
          <div className="footer-col-title">Stay updated</div>
          <p className="text-sm text-muted" style={{ marginBottom: '14px' }}>New stations, features and updates.</p>
          <form onSubmit={handleSub} className="fn-form">
            <input type="email" className="input" placeholder="Your email" value={email} onChange={e => setEmail(e.target.value)} required />
            <button type="submit" className="btn btn-primary btn-sm">Go</button>
          </form>
          {msg && <p className="text-xs text-accent mt-8">{msg}</p>}
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container flex-between" style={{ flexWrap: 'wrap', gap: '8px' }}>
          <p className="text-xs text-muted">&copy; {new Date().getFullYear()} Zuno Mobility Pvt. Ltd. All rights reserved.</p>
          <div className="flex gap-16">
            <a href="#privacy" className="text-xs text-muted">Privacy</a>
            <a href="#terms" className="text-xs text-muted">Terms</a>
            <a href="#cookies" className="text-xs text-muted">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
