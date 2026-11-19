import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import * as auth from '../services/auth.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(auth.getSessionUser);

  const signUp = useCallback(async (details) => setUser(await auth.signUp(details)), []);
  const logIn = useCallback(async (details) => setUser(await auth.logIn(details)), []);
  const logOut = useCallback(() => {
    auth.logOut();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, signUp, logIn, logOut }), [user, signUp, logIn, logOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
