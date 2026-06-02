import client from './client';
import type { TokenResponse, User } from './types';

export async function login(username: string, password: string): Promise<TokenResponse> {
  const { data } = await client.post<TokenResponse>('/auth/login', { username, password });
  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('refresh_token', data.refresh_token);
  return data;
}

export async function register(username: string, password: string): Promise<User> {
  const { data } = await client.post<User>('/auth/register', { username, password });
  return data;
}

export async function logout(): Promise<void> {
  const refreshToken = localStorage.getItem('refresh_token');
  if (refreshToken) {
    try {
      await client.post('/auth/logout', { refresh_token: refreshToken });
    } catch {
      // ignore logout errors
    }
  }
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}
