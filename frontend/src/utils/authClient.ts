import type { Locale } from '../i18n/locale';
import { t, apiError, fieldErrors } from '../i18n/locale';
import axios from 'axios';
import { getEnv } from './Env';
import { mutate } from '../apiClient';
import { apiDate } from './apiDate';

export type User = {
  id: number;
  email: string;
  accountName: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  // Public identity: displayName falls back to accountName on the server.
  displayName: string;
  description: string | null;
  avatarUrl: string | null;
  preferredLanguage?: Locale | null;
};

type ApiUser = Omit<User, 'createdAt'> & { createdAt: string | number[] };

export function normalizeUser(user: ApiUser): User {
  return { ...user, createdAt: apiDate(user.createdAt) };
}

export type LoginInput = { email: string; password: string };
export type RegisterInput = LoginInput & {
  accountName: string;
  firstName: string;
  lastName: string;
  preferredLanguage?: Locale | null;
};

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly fields: Record<string, string> = {},
    public readonly status?: number
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

function responseError(error: unknown, fallback: string): AuthError {
  const response = (
    error as {
      response?: { status?: number; data?: { code?: string; error?: string; errors?: Record<string, string> } };
    }
  )?.response;
  const message =
    response?.status === 401
      ? t('account.incorrectEmailOrPassword')
      : response?.status === 409
        ? t('account.anAccountWithThatEmailOrUsernameAlreadyExists')
        : apiError(response?.data?.code, response?.status, fallback);
  return new AuthError(message, fieldErrors(response?.data?.errors), response?.status);
}

export const authClient = {
  async currentUser(): Promise<User | null> {
    try {
      const response = await axios.get<ApiUser>(`${getEnv().API_BASE_URL}/users/me`, { withCredentials: true });
      return normalizeUser(response.data);
    } catch (error) {
      const failure = responseError(error, t('account.couldNotCheckYourSessionTryAgain'));
      if (failure.status === 401) return null;
      throw failure;
    }
  },
  async login(input: LoginInput): Promise<User> {
    try {
      return normalizeUser(await mutate<ApiUser>('/auth/login', input));
    } catch (error) {
      throw responseError(error, t('account.couldNotSignInCheckYourDetailsAndTryAgain'));
    }
  },
  async register(input: RegisterInput): Promise<User> {
    try {
      return normalizeUser(await mutate<ApiUser>('/auth/register', input));
    } catch (error) {
      throw responseError(error, t('account.checkTheFormFieldsAndTryAgain'));
    }
  },
  async logout(): Promise<void> {
    try {
      await mutate<void>('/auth/logout', {});
    } catch (error) {
      throw responseError(error, t('account.couldNotSignOutTryAgain'));
    }
  },
};
