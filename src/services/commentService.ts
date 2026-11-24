import { apiFetch, buildQueryString } from './apiClient';
import type { ApiResponse, CommentItem } from '../types';

export interface CommentsQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isApproved?: string | boolean;
  isGenerated?: string | boolean;
  postId?: string;
  search?: string;
}

export interface GenerateCommentsResponse {
  postId: string;
  postTitle?: string;
  generatedCount: number;
  comments: CommentItem[];
}

export const commentService = {
  getComments(params: CommentsQueryParams = {}) {
    const query = buildQueryString(params as Record<string, string | number | boolean | undefined>);
    return apiFetch<ApiResponse<CommentItem[]>>(`/comments${query}`);
  },

  getCommentsByPost(postId: string, params: CommentsQueryParams = {}) {
    const query = buildQueryString(params as Record<string, string | number | boolean | undefined>);
    return apiFetch<ApiResponse<CommentItem[]>>(`/comments/post/${postId}${query}`);
  },

  getCommentById(id: string) {
    return apiFetch<ApiResponse<CommentItem>>(`/comments/${id}`);
  },

  updateComment(id: string, payload: Record<string, unknown>) {
    return apiFetch<ApiResponse<CommentItem>>(`/comments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  },

  approveComment(id: string) {
    return apiFetch<ApiResponse<CommentItem>>(`/comments/${id}/approve`, {
      method: 'PATCH'
    });
  },

  rejectComment(id: string) {
    return apiFetch<ApiResponse<CommentItem>>(`/comments/${id}/reject`, {
      method: 'PATCH'
    });
  },

  deleteComment(id: string) {
    return apiFetch<ApiResponse<CommentItem>>(`/comments/${id}`, {
      method: 'DELETE'
    });
  },

  generateComments(postId: string, limit: number) {
    return apiFetch<ApiResponse<GenerateCommentsResponse>>('/comments/generate', {
      method: 'POST',
      body: JSON.stringify({ postId, limit })
    });
  }
};
