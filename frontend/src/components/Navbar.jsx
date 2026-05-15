import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const doLogout = () => { logout(); navigate('/'); };

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-logo">
          <span className="logo-z">Z</span>UNO
        </Link>

        <ul className={`nav-links ${open ? 'open' : ''}`}>
          <li><NavLink to="/stations" onClick={() => setOpen(false)}>Find a Bike</NavLink></li>
          <li><NavLink to="/pricing"  onClick={() => setOpen(false)}>Pricing</NavLink></li>
          {user && <li><NavLink to="/ride"   onClick={() => setOpen(false)}>My Ride</NavLink></li>}
          {user && <li><NavLink to="/history" onClick={() => setOpen(false)}>History</NavLink></li>}
        </ul>

        <div className="nav-right">
          {user ? (
            <>
              <Link to="/account" className="wallet-pill">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                Rs.{user.walletBalance}
              </Link>
              <div className="user-menu">
                <div className="user-avatar">{user.name?.[0]?.toUpperCase()}</div>
                <div className="dropdown">
                  <div className="dropdown-name">{user.name}</div>
                  <div className="dropdown-email">{user.email}</div>
                  <div className="dropdown-divider" />
                  <Link to="/account">Account & Wallet</Link>
                  <Link to="/history">Ride History</Link>
                  <div className="dropdown-divider" />
                  <button onClick={doLogout}>Sign Out</button>
                </div>
              </div>
            </>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">Get Started</Link>
          )}
          <button className="hamburger" onClick={() => setOpen(!open)}>
            <span /><span /><span />
          </button>
        </div>
      </div>
    </nav>
  );
}
