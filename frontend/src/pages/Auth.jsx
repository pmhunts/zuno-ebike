import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Auth() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get('redirect') || '/';

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        if (form.password.length < 6) { setError('Password must be at least 6 characters.'); setLoading(false); return; }
        await register(form.name, form.email, form.password, form.phone);
      }
      navigate(redirect);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m) => { setMode(m); setError(''); setForm({ name: '', email: '', password: '', phone: '' }); };

  return (
    <main className="auth-page">
      <div className="auth-left">
        <Link to="/" className="auth-logo"><span style={{ color: 'var(--accent)' }}>Z</span>UNO</Link>
        <div className="auth-left-content">
          <h2 className="h2">Ride by distance.<br />Pay what you use.</h2>
          <p className="text-muted mt-16" style={{ lineHeight: '1.8' }}>
            Pick up an electric bike from any Zuno station. Drop it at another.
            You are charged only for the kilometres between the two points.
          </p>
          <div className="auth-perks">
            <div className="auth-perk">
              <div className="ap-dot" />
              <span>Rs.100 free credit on signup</span>
            </div>
            <div className="auth-perk">
              <div className="ap-dot" />
              <span>17 stations across 4 cities</span>
            </div>
            <div className="auth-perk">
              <div className="ap-dot" />
              <span>From Rs.3 per kilometre</span>
            </div>
            <div className="auth-perk">
              <div className="ap-dot" />
              <span>No subscription required</span>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card card">
          {/* Mode tabs */}
          <div className="auth-tabs">
            <button className={`auth-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => switchMode('login')}>Sign In</button>
            <button className={`auth-tab ${mode === 'register' ? 'active' : ''}`} onClick={() => switchMode('register')}>Create Account</button>
          </div>

          <div className="auth-tab-line" />

          <h2 className="auth-title">
            {mode === 'login' ? 'Welcome back' : 'Get started'}
          </h2>
          <p className="text-muted text-sm mt-4 mb-28">
            {mode === 'login'
              ? 'Sign in to your Zuno account to continue riding.'
              : 'Create your account and get Rs.100 free wallet credit.'}
          </p>

          {/* Demo hint */}
          {mode === 'login' && (
            <div className="notice notice-info mb-20">
              Demo account: <strong>demo@zuno.in</strong> / <strong>demo123</strong>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {mode === 'register' && (
              <div className="field">
                <label>Full Name</label>
                <input className="input" placeholder="Your full name" value={form.name} onChange={e => set('name', e.target.value)} required />
              </div>
            )}
            <div className="field">
              <label>Email Address</label>
              <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={e => set('email', e.target.value)} required />
            </div>
            <div className="field">
              <label>Password</label>
              <input className="input" type="password" placeholder={mode === 'register' ? 'Min. 6 characters' : '••••••••'} value={form.password} onChange={e => set('password', e.target.value)} required />
            </div>
            {mode === 'register' && (
              <div className="field">
                <label>Phone Number <span className="text-muted">(optional)</span></label>
                <input className="input" type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={e => set('phone', e.target.value)} />
              </div>
            )}

            {error && <div className="notice notice-error">{error}</div>}

            <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: '4px' }}>
              {loading
                ? (mode === 'login' ? 'Signing in...' : 'Creating account...')
                : (mode === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <p className="auth-switch-text">
            {mode === 'login'
              ? <>New to Zuno? <button className="auth-link" onClick={() => switchMode('register')}>Create an account</button></>
              : <>Already have an account? <button className="auth-link" onClick={() => switchMode('login')}>Sign in</button></>
            }
          </p>
        </div>
      </div>
    </main>
  );
}
