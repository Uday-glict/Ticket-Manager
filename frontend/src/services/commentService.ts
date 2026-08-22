import apiClient from '../api/apiClient';

export const commentService = {
  getByTask: (taskId: string) => apiClient.get('/comments/task/' + taskId),
  create: (data: { task_id: string; content: string; parent_id?: string }) => apiClient.post('/comments', data),
  update: (id: string, data: { content: string }) => apiClient.put('/comments/' + id, data),
  delete: (id: string) => apiClient.delete('/comments/' + id),
};
