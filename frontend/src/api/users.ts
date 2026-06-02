import client from './client';
import type { User } from './types';

export async function getMe(): Promise<User> {
  const { data } = await client.get<User>('/users/me');
  return data;
}

export async function updateMyLanguage(language: string): Promise<User> {
  const { data } = await client.patch<User>('/users/me', { language });
  return data;
}
