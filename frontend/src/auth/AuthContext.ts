import { createContext, useContext } from 'react';
import type { LoginInput, RegisterInput, User } from '../utils/authClient';

export type AuthState = {
  status: 'loading' | 'anonymous' | 'authenticated' | 'error';
  user: User | null;
  error: string | null;
};

export type AuthValue = AuthState & {
  refresh: () => Promise<void>;
  signIn: (input: LoginInput) => Promise<void>;
  signUp: (input: RegisterInput) => Promise<void>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthValue | null>(null);

export function useAuth(): AuthValue {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuth requires AuthProvider');
  return auth;
}
