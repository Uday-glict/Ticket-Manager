import apiClient from '../api/apiClient';
export const sprintService = {
  list: (projectId: string) => apiClient.get('/projects/' + projectId + '/sprints'),
  get: (id: string) => apiClient.get('/sprints/' + id),
  create: (projectId: string, data: Record<string, unknown>) => apiClient.post('/projects/' + projectId + '/sprints', data),
  update: (id: string, data: Record<string, unknown>) => apiClient.patch('/sprints/' + id, data),
  delete: (id: string) => apiClient.delete('/sprints/' + id),
  start: (id: string) => apiClient.post('/sprints/' + id + '/start'),
  complete: (id: string) => apiClient.post('/sprints/' + id + '/complete'),
};
