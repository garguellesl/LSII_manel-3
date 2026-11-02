import axios from 'axios';
import { getEnv } from './utils/Env';

export async function mutate<T>(path: string, body: unknown, method: 'post' | 'patch' = 'post'): Promise<T> {
  const base = getEnv().API_BASE_URL;
  const csrf = await axios.get<{ token: string; headerName: string }>(`${base}/auth/csrf`, { withCredentials: true });
  const send = method === 'patch' ? axios.patch<T> : axios.post<T>;
  const response = await send(`${base}${path}`, body, {
    withCredentials: true,
    headers: { [csrf.data.headerName]: csrf.data.token },
  });
  return response.data;
}
