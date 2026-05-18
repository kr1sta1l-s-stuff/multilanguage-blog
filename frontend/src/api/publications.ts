import client from './client';
import type { Page, Publication } from './types';

export async function getPublications(page: number = 1, size: number = 20): Promise<Page<Publication>> {
  const { data } = await client.get<Page<Publication>>('/publications/', { params: { page, size } });
  return data;
}

export async function getPublication(id: string): Promise<Publication> {
  const { data } = await client.get<Publication>(`/publications/${id}`);
  return data;
}

export async function likePublication(id: string): Promise<void> {
  await client.post(`/publications/${id}/like`);
}

export async function unlikePublication(id: string): Promise<void> {
  await client.delete(`/publications/${id}/like`);
}

export async function createPublication(
  title: string,
  content: string,
  images: File[],
  publishImmediately: boolean = true,
): Promise<Publication> {
  const formData = new FormData();
  formData.append('title', title);
  formData.append('content', content);
  formData.append('publish_immediately', String(publishImmediately));
  images.forEach((file) => formData.append('images', file));
  const { data } = await client.post<Publication>('/publications/', formData);
  return data;
}
