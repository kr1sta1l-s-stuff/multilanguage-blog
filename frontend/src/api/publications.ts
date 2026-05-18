import client from './client';
import type { Page, Publication } from './types';

export async function getPublications(
  page: number = 1,
  size: number = 20,
  tags: string[] = [],
  search?: string,
): Promise<Page<Publication>> {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('size', String(size));
  tags.forEach((tag) => params.append('tags', tag));
  if (search && search.trim()) params.set('q', search.trim());
  const { data } = await client.get<Page<Publication>>('/publications/', { params });
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
  tags: string[] = [],
): Promise<Publication> {
  const formData = new FormData();
  formData.append('title', title);
  formData.append('content', content);
  formData.append('publish_immediately', String(publishImmediately));
  images.forEach((file) => formData.append('images', file));
  tags.forEach((tag) => formData.append('tags', tag));
  const { data } = await client.post<Publication>('/publications/', formData);
  return data;
}

export async function updatePublication(
  id: string,
  payload: {
    title?: string;
    content?: string;
    tags?: string[] | null;
    publish?: boolean;
  },
): Promise<Publication> {
  const { data } = await client.patch<Publication>(`/publications/${id}`, payload);
  return data;
}

export async function deletePublication(id: string): Promise<void> {
  await client.delete(`/publications/${id}`);
}

export async function getDrafts(page: number = 1, size: number = 20): Promise<Page<Publication>> {
  const { data } = await client.get<Page<Publication>>('/publications/drafts', {
    params: { page, size },
  });
  return data;
}
