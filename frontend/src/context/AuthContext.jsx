import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Seed officer from localStorage immediately so PrivateRoute never flashes
  const [officer, setOfficer] = useState(() => {
    try {
      const stored = localStorage.getItem('officer');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  // Only show a loading spinner when we have a token but NO cached officer
  // (e.g. hard refresh with stale localStorage)
  const [loading, setLoading] = useState(() => {
    const token = localStorage.getItem('token');
    const cached = localStorage.getItem('officer');
    return !!(token && !cached);   // true only when we must verify with server
  });

  // On mount: if we have a token but no cached officer, verify it
  useEffect(() => {
    if (!loading) return;
    authApi.me()
      .then(res => setOfficer(res.data.officer))
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('officer');
        setOfficer(null);
      })
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // login() sets state AND localStorage, then returns.
  // Callers should navigate via a useEffect watching `officer`, NOT directly
  // after calling login() — that avoids the React 18 batched-update race.
  const login = useCallback(async (email, password) => {
    const res = await authApi.login(email, password);
    const { token, officer: off } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('officer', JSON.stringify(off));
    setOfficer(off);        // state update — will commit on next render cycle
    return off;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('officer');
    setOfficer(null);
  }, []);

  return (
    <AuthContext.Provider value={{ officer, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
