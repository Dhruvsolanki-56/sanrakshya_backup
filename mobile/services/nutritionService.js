import { apiClient } from './apiClient';

export const nutritionService = {
  getWeeklySummary: (child_id) => apiClient.get(`/nutrition/child/${child_id}/weekly-summary`),
};
