import axios from 'axios';
import { getEnv } from './Env';

export type User = {
  id: number;
  email: string;
  accountName: string;
  firstName: string;
  lastName: string;
  createdAt: string;
};

export type LoginInput = { email: string; password: string };
export type RegisterInput = LoginInput & { accountName: string; firstName: string; lastName: string };

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
    error as { response?: { status?: number; data?: { error?: string; errors?: Record<string, string> } } }
  )?.response;
  const message =
    response?.status === 401
      ? 'Email o contraseña incorrectos.'
      : response?.status === 409
        ? 'Ya existe una cuenta con ese email o nombre de usuario.'
        : response?.data?.error || fallback;
  return new AuthError(message, response?.data?.errors, response?.status);
}

async function mutate<T>(path: string, body: unknown): Promise<T> {
  const base = getEnv().API_BASE_URL;
  const csrf = await axios.get<{ token: string; headerName: string }>(`${base}/auth/csrf`, { withCredentials: true });
  const response = await axios.post<T>(`${base}${path}`, body, {
    withCredentials: true,
    headers: { [csrf.data.headerName]: csrf.data.token },
  });
  return response.data;
}

export const authClient = {
  async currentUser(): Promise<User | null> {
    try {
      const response = await axios.get<User>(`${getEnv().API_BASE_URL}/users/me`, { withCredentials: true });
      return response.data;
    } catch (error) {
      const failure = responseError(error, 'No se ha podido comprobar tu sesión. Inténtalo de nuevo.');
      if (failure.status === 401) return null;
      throw failure;
    }
  },
  async login(input: LoginInput): Promise<User> {
    try {
      return await mutate<User>('/auth/login', input);
    } catch (error) {
      throw responseError(error, 'No se ha podido iniciar sesión. Comprueba los datos e inténtalo de nuevo.');
    }
  },
  async register(input: RegisterInput): Promise<User> {
    try {
      return await mutate<User>('/auth/register', input);
    } catch (error) {
      throw responseError(error, 'Revisa los campos del formulario e inténtalo de nuevo.');
    }
  },
  async logout(): Promise<void> {
    try {
      await mutate<void>('/auth/logout', {});
    } catch (error) {
      throw responseError(error, 'No se ha podido cerrar sesión. Inténtalo de nuevo.');
    }
  },
};
