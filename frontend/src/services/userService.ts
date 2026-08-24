import apiClient from '../api/apiClient';

export const userService = {
  list: (params?: { search?: string; status?: string; page?: number; limit?: number }) => apiClient.get('/users', { params }),
  get: (id: string) => apiClient.get(`/users/${id}`),
  create: (data: Record<string, unknown> | FormData) => apiClient.post('/users', data),
  update: (id: string, data: Record<string, unknown>) => apiClient.put(`/users/${id}`, data),
  toggleStatus: (id: string, status: string) => apiClient.patch(`/users/${id}/status`, { status }),
  delete: (id: string) => apiClient.delete(`/users/${id}`),
  uploadAvatar: (id: string, file: File) => {
    const fd = new FormData();
    fd.append('avatar', file);
    return apiClient.patch(`/users/${id}/avatar`, fd);
  },
  removeAvatar: (id: string) => apiClient.delete(`/users/${id}/avatar`),
};
