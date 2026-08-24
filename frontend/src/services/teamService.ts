import apiClient from '../api/apiClient';
export const teamService = {
  list: (projectId: string) => apiClient.get('/projects/' + projectId + '/teams'),
  get: (id: string) => apiClient.get('/teams/' + id),
  create: (projectId: string, data: Record<string, unknown>) => apiClient.post('/projects/' + projectId + '/teams', data),
  update: (id: string, data: Record<string, unknown>) => apiClient.patch('/teams/' + id, data),
  delete: (id: string) => apiClient.delete('/teams/' + id),
  listMembers: (teamId: string) => apiClient.get('/teams/' + teamId + '/members'),
};
