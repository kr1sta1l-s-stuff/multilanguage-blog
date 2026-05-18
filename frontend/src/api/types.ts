export interface User {
  id: string;
  username: string;
  rights: number;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface PublicationImage {
  id: string;
  image_url: string;
}

export interface Publication {
  id: string;
  title: string;
  content: string;
  images: PublicationImage[];
  comments_count: number;
  likes_count: number;
  is_liked: boolean;
  created_at: string;
  published_at: string | null;
}

export interface Comment {
  id: string;
  content: string;
  author: User;
  created_at: string;
  updated_at: string;
  thread_id: string | null;
  replied_at: string | null;
  is_deleted: boolean;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}
