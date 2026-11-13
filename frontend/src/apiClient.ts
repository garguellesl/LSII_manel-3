import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';
import { getEnv } from './utils/Env';

export async function mutate<T>(
  path: string,
  body: unknown,
  method: 'post' | 'patch' | 'delete' = 'post',
  options: Pick<AxiosRequestConfig, 'onUploadProgress' | 'signal'> = {}
): Promise<T> {
  const base = getEnv().API_BASE_URL;
  const csrf = await axios.get<{ token: string; headerName: string }>(`${base}/auth/csrf`, { withCredentials: true });
  const config = {
    ...options,
    withCredentials: true,
    headers: { [csrf.data.headerName]: csrf.data.token },
  };
  const response =
    method === 'delete'
      ? await axios.delete<T>(`${base}${path}`, config)
      : await (method === 'patch' ? axios.patch<T> : axios.post<T>)(`${base}${path}`, body, config);
  return response.data;
}
