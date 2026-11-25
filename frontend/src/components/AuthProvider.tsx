import { t, setAccountLocale } from '../i18n/locale';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AuthContext } from '../auth/AuthContext';
import type { AuthState } from '../auth/AuthContext';
import { authClient } from '../utils/authClient';
import type { LoginInput, RegisterInput, User } from '../utils/authClient';

const anonymous: AuthState = { status: 'anonymous', user: null, error: null };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading', user: null, error: null });
  const version = useRef(0);
  const mutations = useRef(0);
  const invalidateRequests = useCallback(() => {
    ++version.current;
  }, []);

  const refresh = useCallback(async () => {
    if (mutations.current > 0) return;
    const request = ++version.current;
    setState({ status: 'loading', user: null, error: null });
    try {
      const user = await authClient.currentUser();
      if (request === version.current) {
        setAccountLocale(user);
        setState(user ? { status: 'authenticated', user, error: null } : anonymous);
      }
    } catch {
      if (request === version.current) {
        setState({ status: 'error', user: null, error: t('account.couldNotCheckYourSession') });
      }
    }
  }, []);

  useEffect(() => {
    void refresh();
    const onFocus = () => void refresh();
    window.addEventListener('focus', onFocus);
    return () => {
      invalidateRequests();
      window.removeEventListener('focus', onFocus);
    };
  }, [refresh, invalidateRequests]);

  const authenticate = useCallback(async (operation: () => Promise<User>) => {
    const request = ++version.current;
    ++mutations.current;
    setState(anonymous);
    try {
      const user = await operation();
      if (request === version.current) {
        setAccountLocale(user);
        setState({ status: 'authenticated', user, error: null });
      }
    } finally {
      --mutations.current;
    }
  }, []);

  const signIn = useCallback((input: LoginInput) => authenticate(() => authClient.login(input)), [authenticate]);
  const signUp = useCallback((input: RegisterInput) => authenticate(() => authClient.register(input)), [authenticate]);
  const signOut = useCallback(async () => {
    const request = ++version.current;
    ++mutations.current;
    setState({ status: 'loading', user: null, error: null });
    try {
      await authClient.logout();
      if (request === version.current) {
        setAccountLocale(null);
        setState(anonymous);
      }
    } catch (error) {
      if (request === version.current) {
        setState({ status: 'error', user: null, error: t('account.couldNotConfirmSignout') });
      }
      throw error;
    } finally {
      --mutations.current;
    }
  }, []);

  const updateUser = useCallback((user: User) => {
    // Invalidate in-flight session checks so an older response cannot restore the previous profile.
    ++version.current;
    setState((current) => (current.status === 'authenticated' ? { ...current, user } : current));
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, refresh, signIn, signUp, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
