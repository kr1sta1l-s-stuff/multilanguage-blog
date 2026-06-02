import client from './client';
import type { Comment, Page } from './types';

export async function getComments(publicationId: string, page: number = 1, size: number = 20): Promise<Page<Comment>> {
  const { data } = await client.get<Page<Comment>>(`/publications/${publicationId}/comments`, {
    params: { page, size },
  });
  return data;
}

export async function createComment(
  publicationId: string,
  content: string,
  repliedAt?: string | null,
): Promise<Comment> {
  const formData = new FormData();
  formData.append('content', content);
  if (repliedAt) formData.append('replied_at', repliedAt);
  const { data } = await client.post<Comment>(`/publications/${publicationId}/comments`, formData);
  return data;
}

export async function getCommentThread(commentId: string): Promise<Comment[]> {
  const { data } = await client.get<Comment[]>(`/comments/${commentId}/thread`);
  return data;
}

export async function updateComment(commentId: string, content: string): Promise<Comment> {
  const formData = new FormData();
  formData.append('content', content);
  const { data } = await client.patch<Comment>(`/comments/${commentId}`, formData);
  return data;
}

export async function deleteComment(commentId: string): Promise<void> {
  await client.delete(`/comments/${commentId}`);
}
