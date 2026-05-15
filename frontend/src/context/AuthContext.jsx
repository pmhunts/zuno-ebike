import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('zuno_token');
    if (token) {
      api.me().then(setUser).catch(() => localStorage.removeItem('zuno_token')).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    localStorage.setItem('zuno_token', data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password, phone) => {
    const data = await api.register({ name, email, password, phone });
    localStorage.setItem('zuno_token', data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => { localStorage.removeItem('zuno_token'); setUser(null); };

  const refreshUser = async () => {
    const u = await api.me();
    setUser(u);
    return u;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
