import { apiFetch, buildQueryString } from './apiClient';
import type { ApiResponse, CustomUrlItem } from '../types';

export interface CustomUrlsQueryParams {
  search?: string;
  postId?: string;
  isActive?: string;
  page?: number;
  limit?: number;
}

export interface CustomUrlPayload {
  post: string;
  country: string;
  state: string;
  city: string;
  username: string;
  shortTitle?: string;
  isActive?: boolean;
}

export const customUrlService = {
  getCustomUrls(params: CustomUrlsQueryParams = {}) {
    const query = buildQueryString(params as Record<string, string | number | boolean | undefined>);
    return apiFetch<ApiResponse<CustomUrlItem[]>>(`/custom-urls${query}`);
  },

  createCustomUrl(payload: CustomUrlPayload) {
    return apiFetch<ApiResponse<CustomUrlItem>>('/custom-urls', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  updateCustomUrl(id: string, payload: Partial<CustomUrlPayload>) {
    return apiFetch<ApiResponse<CustomUrlItem>>(`/custom-urls/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  },

  deleteCustomUrl(id: string) {
    return apiFetch<ApiResponse<CustomUrlItem>>(`/custom-urls/${id}`, {
      method: 'DELETE'
    });
  }
};
