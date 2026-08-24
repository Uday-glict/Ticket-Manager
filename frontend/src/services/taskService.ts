import apiClient from '../api/apiClient';

export const taskService = {
  list: (params?: { project_id?: string; team_id?: string; sprint_id?: string; assigned_to?: string; priority?: string; status_id?: string; page?: number; limit?: number }) => apiClient.get('/tasks', { params }),
  get: (id: string) => apiClient.get('/tasks/' + id),
  create: (data: Record<string, unknown>) => apiClient.post('/tasks', data),
  update: (id: string, data: Record<string, unknown>) => apiClient.put('/tasks/' + id, data),
  patch: (id: string, data: Record<string, unknown>) => apiClient.patch('/tasks/' + id, data),
  delete: (id: string) => apiClient.delete('/tasks/' + id),
  assign: (id: string, data: { user_id: string; reason?: string }) => apiClient.post('/tasks/' + id + '/assign', data),
  reassign: (id: string, data: { user_id: string; reason?: string }) => apiClient.post('/tasks/' + id + '/reassign', data),
  getAssignments: (id: string) => apiClient.get('/tasks/' + id + '/assignments'),
  updateAssignees: (id: string, assignee_ids: string[]) => apiClient.post('/tasks/' + id + '/assignees', { assignee_ids }),
  addAssignee: (id: string, userId: string) => apiClient.post('/tasks/' + id + '/assignees', { assignee_ids: [userId] }),
  removeAssignee: (id: string, userId: string) => apiClient.delete('/tasks/' + id + '/assignees/' + userId),
};
