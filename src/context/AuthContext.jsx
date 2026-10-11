import { createContext, useContext, useEffect, useState } from 'react';
import { getSession, onAuthChange, signOut } from '../services/authService';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getSession().then((s) => { if (active) { setSession(s); setLoading(false); } });
    const off = onAuthChange((s) => setSession(s));
    return () => { active = false; off(); };
  }, []);

  const user = session?.user ?? null;
  const displayName = user?.user_metadata?.full_name || '';
  return <AuthContext.Provider value={{ session, user, displayName, loading, logout: signOut }}>{children}</AuthContext.Provider>;
}
