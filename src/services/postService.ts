import { apiFetch, buildQueryString } from './apiClient';
import type { ApiResponse, Post, PostImage } from '../types';

export interface PostsQueryParams {
  search?: string;
  status?: string;
  category?: string;
  city?: string;
  state?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const postService = {
  getPosts(params: PostsQueryParams = {}) {
    const query = buildQueryString(params as Record<string, string | number | boolean | undefined>);
    return apiFetch<ApiResponse<Post[]>>(`/posts${query}`);
  },

  getPostById(id: string) {
    return apiFetch<ApiResponse<Post>>(`/posts/${id}`);
  },

  createPost(payload: Record<string, unknown>) {
    return apiFetch<ApiResponse<Post>>('/posts', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  updatePost(id: string, payload: Record<string, unknown>) {
    return apiFetch<ApiResponse<Post>>(`/posts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  },

  deletePost(id: string) {
    return apiFetch<ApiResponse<Post>>(`/posts/${id}`, {
      method: 'DELETE'
    });
  },

  publishPost(id: string) {
    return apiFetch<ApiResponse<Post>>(`/posts/${id}/publish`, {
      method: 'PATCH'
    });
  },

  archivePost(id: string) {
    return apiFetch<ApiResponse<Post>>(`/posts/${id}/archive`, {
      method: 'PATCH'
    });
  },

  uploadImages(files: FileList | File[]) {
    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append('images', file);
    });
    return apiFetch<ApiResponse<PostImage[]>>('/posts/upload', {
      method: 'POST',
      body: formData
    });
  }
};
