import { apiFetch } from './apiClient';
import type { ApiResponse, User } from '../types';

export interface LoginResponseData {
  token: string;
  user: User;
}

export const authService = {
  login(email: string, password: string) {
    return apiFetch<ApiResponse<LoginResponseData>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  getMe() {
    return apiFetch<ApiResponse<User>>('/auth/me');
  }
};
