import { apiClient } from './apiClient';

export const childrenService = {
  createChild: (payload) => apiClient.post('/children/create-child', payload),
  getChild: (child_id) => apiClient.get(`/children/get-child/${child_id}`),
  getProfileSummary: (child_id) => apiClient.get(`/children/${child_id}/profile-summary`),
  updateChild: (child_id, payload) => apiClient.put(`/children/update-child/${child_id}`, payload),
  deleteChild: (child_id) => apiClient.delete(`/children/delete-child/${child_id}`),
};
