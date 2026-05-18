import client from './client';
import type { Page, RelatedTag, Tag } from './types';

export async function searchTags(search: string, size: number = 20): Promise<Tag[]> {
  const { data } = await client.get<Page<Tag>>('/tags/', {
    params: { search, size, page: 1 },
  });
  return data.items;
}

export async function getRelatedTags(tags: string[], limit: number = 20): Promise<RelatedTag[]> {
  if (tags.length === 0) return [];
  const params = new URLSearchParams();
  tags.forEach((t) => params.append('tags', t));
  params.set('limit', String(limit));
  const { data } = await client.get<RelatedTag[]>('/tags/related', { params });
  return data;
}
