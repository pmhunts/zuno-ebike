import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Stations from './pages/Stations';
import Ride from './pages/Ride';
import History from './pages/History';
import Pricing from './pages/Pricing';
import Auth from './pages/Auth';
import Account from './pages/Account';
import './index.css';

function NotFound() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: '12px', paddingTop: '60px' }}>
      <div style={{ fontFamily: 'var(--heading)', fontSize: '80px', fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>404</div>
      <p style={{ color: 'var(--sub)', fontSize: '15px' }}>This page does not exist.</p>
      <a href="/" className="btn btn-secondary" style={{ marginTop: '8px' }}>Back to Home</a>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar />
          <Routes>
            <Route path="/"         element={<Home />} />
            <Route path="/stations" element={<Stations />} />
            <Route path="/ride"     element={<Ride />} />
            <Route path="/history"  element={<History />} />
            <Route path="/pricing"  element={<Pricing />} />
            <Route path="/login"    element={<Auth />} />
            <Route path="/account"  element={<Account />} />
            <Route path="*"         element={<NotFound />} />
          </Routes>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
