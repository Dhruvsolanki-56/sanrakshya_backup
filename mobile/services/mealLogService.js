import { apiClient } from './apiClient';

export const mealLogService = {
  postMeals: (childId, payload) => apiClient.post(`/food-logs/child/${childId}/meals`, payload),
  getLatestMeals: (childId) => apiClient.get(`/food-logs/child/${childId}/meals/latest`),
};
