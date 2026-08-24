import apiClient from '../api/apiClient';

export const projectService = {
  list: (params?: { search?: string; status?: string; page?: number; limit?: number }) => apiClient.get('/projects', { params }),
  get: (id: string) => apiClient.get(`/projects/${id}`),
  create: (data: Record<string, unknown>) => apiClient.post('/projects', data),
  update: (id: string, data: Record<string, unknown>) => apiClient.put(`/projects/${id}`, data),
  delete: (id: string) => apiClient.delete(`/projects/${id}`),
  getMembers: (id: string) => apiClient.get(`/projects/${id}/members`),
  addMember: (id: string, data: { user_id: string; role_id: string }) => apiClient.post(`/projects/${id}/members`, data),
  removeMember: (id: string, userId: string) => apiClient.delete(`/projects/${id}/members/${userId}`),
  getStatuses: (id: string) => apiClient.get(`/projects/${id}/statuses`),
  createStatus: (id: string, data: { name: string; color?: string }) => apiClient.post(`/projects/${id}/statuses`, data),
  updateStatus: (id: string, statusId: string, data: Record<string, unknown>) => apiClient.put(`/projects/${id}/statuses/${statusId}`, data),
  deleteStatus: (id: string, statusId: string) => apiClient.delete(`/projects/${id}/statuses/${statusId}`),
};
