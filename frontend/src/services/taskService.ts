import apiClient from '../api/apiClient';

export const taskService = {
  list: (params?: { project_id?: string; assigned_to?: string; priority?: string; status_id?: string; page?: number; limit?: number }) => apiClient.get('/tasks', { params }),
  get: (id: string) => apiClient.get('/tasks/' + id),
  create: (data: Record<string, unknown>) => apiClient.post('/tasks', data),
  update: (id: string, data: Record<string, unknown>) => apiClient.put('/tasks/' + id, data),
  assign: (id: string, data: { user_id: string; reason?: string }) => apiClient.post('/tasks/' + id + '/assign', data),
  reassign: (id: string, data: { user_id: string; reason?: string }) => apiClient.post('/tasks/' + id + '/reassign', data),
  getAssignments: (id: string) => apiClient.get('/tasks/' + id + '/assignments'),
};
