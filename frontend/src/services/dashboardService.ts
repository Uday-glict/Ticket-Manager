import apiClient from '../api/apiClient';

export const dashboardService = {
  getSummary: () => apiClient.get('/dashboard/summary'),
  getProjects: () => apiClient.get('/dashboard/projects'),
};
