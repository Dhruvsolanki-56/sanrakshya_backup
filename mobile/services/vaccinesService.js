import { apiClient } from './apiClient';

export const vaccinesService = {
  getStatuses: (child_id) => apiClient.get(`/vaccines/child/${child_id}/statuses`),
  give: (child_id, payload) => apiClient.post(`/vaccines/child/${child_id}/given`, payload),
};
