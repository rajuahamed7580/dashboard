import { apiFetch, buildQueryString } from './apiClient';
import type { ApiResponse, User } from '../types';

export interface UsersQueryParams {
  search?: string;
  role?: string;
  isBlock?: string | boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  role?: 'admin' | 'user';
  password?: string;
  isBlock?: boolean;
}

export const userService = {
  getUsers(params: UsersQueryParams = {}) {
    const query = buildQueryString(params as Record<string, string | number | boolean | undefined>);
    return apiFetch<ApiResponse<User[]>>(`/users${query}`);
  },

  getUserById(id: string) {
    return apiFetch<ApiResponse<User>>(`/users/${id}`);
  },

  updateUser(id: string, payload: UpdateUserPayload) {
    return apiFetch<ApiResponse<User>>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  },

  blockUser(id: string) {
    return apiFetch<ApiResponse<User>>(`/users/${id}/block`, {
      method: 'PATCH'
    });
  },

  unblockUser(id: string) {
    return apiFetch<ApiResponse<User>>(`/users/${id}/unblock`, {
      method: 'PATCH'
    });
  },

  deleteUser(id: string) {
    return apiFetch<ApiResponse<User>>(`/users/${id}`, {
      method: 'DELETE'
    });
  }
};
