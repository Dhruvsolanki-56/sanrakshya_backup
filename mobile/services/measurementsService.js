import { apiClient } from './apiClient';

export const measurementsService = {
  postChildMeasurements: (child_id, payload) =>
    apiClient.post(`/measurements/child/${child_id}/measurements`, payload),
};
