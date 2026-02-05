import { apiClient } from './apiClient';

export const foodService = {
  getByChild: (childId) => apiClient.get(`/foods/child/${childId}`),
};
