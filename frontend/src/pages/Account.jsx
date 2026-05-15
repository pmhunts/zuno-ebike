import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import './Account.css';

const TOP_UP_AMOUNTS = [50, 100, 200, 500, 1000];

export default function Account() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  if (!user) { navigate('/login'); return null; }

  const handleTopup = async (e) => {
    e.preventDefault();
    setLoading(true); setMsg(null);
    try {
      const data = await api.topup(Number(amount));
      await refreshUser();
      setMsg({ type: 'success', text: data.message });
      setAmount('');
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const doLogout = () => { logout(); navigate('/'); };

  return (
    <main className="account-page">
      <div className="container">
        <div className="account-header">
          <div className="acct-avatar">{user.name?.[0]?.toUpperCase()}</div>
          <div>
            <h1 className="h2">{user.name}</h1>
            <p className="text-muted mt-4">{user.email}</p>
            {user.phone && <p className="text-muted text-sm">{user.phone}</p>}
          </div>
        </div>

        <div className="account-grid">
          {/* Wallet card */}
          <div className="wallet-card card">
            <div className="wc-top">
              <div>
                <div className="label mb-8">Wallet Balance</div>
                <div className="wc-balance">Rs.{user.walletBalance}</div>
                <p className="text-xs text-muted mt-8">Deducted automatically at ride end</p>
              </div>
              <div className="wc-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              </div>
            </div>

            <div className="divider" style={{ margin: '24px 0' }} />

            <div className="label mb-16">Add Funds</div>
            <div className="topup-chips">
              {TOP_UP_AMOUNTS.map(a => (
                <button
                  key={a}
                  className={`topup-chip ${Number(amount) === a ? 'active' : ''}`}
                  onClick={() => setAmount(String(a))}
                >
                  +Rs.{a}
                </button>
              ))}
            </div>

            <form onSubmit={handleTopup} className="topup-form">
              <div className="field">
                <label>Or enter amount (Rs.50 – Rs.5000)</label>
                <input
                  type="number" className="input"
                  placeholder="Enter amount"
                  value={amount} onChange={e => setAmount(e.target.value)}
                  min="50" max="5000" required
                />
              </div>
              {msg && <div className={`notice notice-${msg.type}`}>{msg.text}</div>}
              <button type="submit" className="btn btn-primary btn-full" disabled={loading || !amount}>
                {loading ? 'Processing...' : `Add Rs.${amount || '—'} to Wallet`}
              </button>
            </form>

            <p className="text-xs text-muted mt-16" style={{ lineHeight: '1.7' }}>
              This is a demo platform. No real money is transacted. Wallet balances are for simulation only.
            </p>
          </div>

          {/* Info card */}
          <div>
            <div className="info-card card">
              <div className="label mb-16">Account Details</div>
              <div className="info-rows">
                <div className="info-row"><span>Full name</span><span>{user.name}</span></div>
                <div className="info-row"><span>Email</span><span>{user.email}</span></div>
                <div className="info-row"><span>Phone</span><span>{user.phone || '—'}</span></div>
                <div className="info-row"><span>Member since</span><span>{new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span></div>
              </div>
            </div>

            <div className="info-card card mt-16">
              <div className="label mb-16">Pricing Reference</div>
              <div className="info-rows">
                <div className="info-row"><span>Unlock fee</span><span>Rs.10 per ride</span></div>
                <div className="info-row"><span>First 5km</span><span>Rs.3 / km</span></div>
                <div className="info-row"><span>Beyond 5km</span><span>Rs.2 / km</span></div>
                <div className="info-row"><span>Minimum fare</span><span>Rs.15</span></div>
              </div>
            </div>

            <button onClick={doLogout} className="btn btn-secondary btn-full mt-16">
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
