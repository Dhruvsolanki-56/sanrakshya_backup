import { apiClient } from './apiClient';

export const milestonesService = {
  getByChild: (childId) => apiClient.get(`/milestones/child/${childId}/milestones`),
  create: (childId, payload) => apiClient.post(`/milestones/child/${childId}/milestones`, payload),
};
