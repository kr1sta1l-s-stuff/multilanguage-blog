import client from './client';
import type { Page, Publication } from './types';

export type PublicationSort = 'date' | 'likes' | 'relevance';
export type PublicationOrder = 'asc' | 'desc';

export async function getPublications(
  page: number = 1,
  size: number = 20,
  tags: string[] = [],
  search?: string,
  sort?: PublicationSort,
  order?: PublicationOrder,
): Promise<Page<Publication>> {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('size', String(size));
  tags.forEach((tag) => params.append('tags', tag));
  if (search && search.trim()) params.set('q', search.trim());
  if (sort) params.set('sort', sort);
  if (order) params.set('order', order);
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

export type ImageUpdateItem =
  | { kind: 'existing'; id: string }
  | { kind: 'new'; file: File };

export async function updatePublication(
  id: string,
  payload: {
    title?: string;
    content?: string;
    tags?: string[] | null;
    publish?: boolean;
    images?: ImageUpdateItem[];
  },
): Promise<Publication> {
  const formData = new FormData();
  if (payload.title !== undefined) formData.append('title', payload.title);
  if (payload.content !== undefined) formData.append('content', payload.content);
  if (payload.publish !== undefined) formData.append('publish', String(payload.publish));
  if (payload.tags != null) payload.tags.forEach((tag) => formData.append('tags', tag));

  if (payload.images) {
    const order: string[] = [];
    let newIndex = 0;
    payload.images.forEach((item) => {
      if (item.kind === 'existing') {
        order.push(`existing:${item.id}`);
      } else {
        order.push(`new:${newIndex}`);
        formData.append('new_images', item.file);
        newIndex += 1;
      }
    });
    formData.append('image_order', JSON.stringify(order));
  }

  const { data } = await client.patch<Publication>(`/publications/${id}`, formData);
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
