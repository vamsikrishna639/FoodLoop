// Holds "who is signed in" for the whole app.
//
// status:
//   'restoring'  the app just opened and is checking a saved token
//   'signedOut'
//   'signedIn'   (the account may still be pending; the route gates decide)
//
// Screens never navigate after login or logout. They change the state here,
// and the route gates in routes/Gate.jsx move the user to the right page.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api/auth';
import { setToken, setUnauthorizedHandler } from '../api/client';
import { KEYS, read, remove, write } from '../lib/storage';
import { forgetImpactNumbers } from '../components/ImpactNumber';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [status, setStatus] = useState('restoring');
  const [user, setUser] = useState(null);
  // Set when the session ended on its own, so the login page can say why.
  const [sessionExpired, setSessionExpired] = useState(false);
  // False until the welcome slides have been seen on this device.
  const [seenWelcome, setSeenWelcome] = useState(() => read(KEYS.seenWelcome) === 'true');

  const markWelcomeSeen = useCallback(() => {
    setSeenWelcome(true);
    write(KEYS.seenWelcome, 'true');
  }, []);

  const logout = useCallback((expired = false) => {
    setToken(null);
    remove(KEYS.token);
    forgetImpactNumbers(); // the next user's figures count up from 0
    setUser(null);
    setSessionExpired(expired);
    setStatus('signedOut');
  }, []);

  // Any 401 on a signed-in request ends the session.
  useEffect(() => {
    setUnauthorizedHandler(() => logout(true));
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  // On start-up: reuse a saved token if the server still accepts it.
  useEffect(() => {
    const saved = read(KEYS.token);
    if (!saved) {
      setStatus('signedOut');
      return;
    }
    setToken(saved);
    authApi
      .me()
      .then((data) => {
        setUser(data.user);
        setStatus('signedIn');
      })
      .catch((err) => {
        // 401 = the token is dead, so forget it. Any other failure (server
        // offline) also shows the login page but keeps the token for later.
        if (err.status === 401) remove(KEYS.token);
        setToken(null);
        setStatus('signedOut');
      });
  }, []);

  // Shared by login and register: keep the token, store the user.
  const start = useCallback(
    ({ token, user: account }) => {
      setToken(token);
      write(KEYS.token, token);
      if (!seenWelcome) markWelcomeSeen(); // anyone signed in has seen enough
      setUser(account);
      setSessionExpired(false);
      setStatus('signedIn');
    },
    [seenWelcome, markWelcomeSeen]
  );

  /** Throws ApiError with a readable message (and fieldErrors) on failure. */
  const login = useCallback(async (email, password) => start(await authApi.login(email, password)), [start]);

  const register = useCallback(async (fields) => start(await authApi.register(fields)), [start]);

  /** Re-reads the account. Used on the "waiting for approval" page. */
  const refreshUser = useCallback(async () => {
    const data = await authApi.me();
    setUser(data.user);
    return data.user;
  }, []);

  const value = useMemo(
    () => ({
      status,
      user,
      sessionExpired,
      seenWelcome,
      markWelcomeSeen,
      login,
      register,
      logout,
      refreshUser,
    }),
    [status, user, sessionExpired, seenWelcome, markWelcomeSeen, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
