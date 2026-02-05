import { apiClient } from './apiClient';

export const predictionsService = {
  getLatestReportForChild: (childId) =>
    apiClient.get(`/predictions/child/${childId}/latest-report`),

  getReportsForChild: (childId) =>
    apiClient.get(`/predictions/child/${childId}/reports`),

  getReportForChild: (childId, reportId) =>
    apiClient.get(`/predictions/child/${childId}/reports/${reportId}`),

  requestReportForChild: (childId) =>
    apiClient.post(`/predictions/child/${childId}`),

  getTrendForChild: (childId) =>
    apiClient.get(`/predictions/child/${childId}/trend`),
};
