import { apiFetch } from './apiClient';
import type { ApiResponse, DashboardAnalyticsData, DashboardStatsData } from '../types';

export const dashboardService = {
  getStats() {
    return apiFetch<ApiResponse<DashboardStatsData>>('/dashboard/stats');
  },

  getAnalytics() {
    return apiFetch<ApiResponse<DashboardAnalyticsData>>('/dashboard/analytics');
  }
};
