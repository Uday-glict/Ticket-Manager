import apiClient from '../api/apiClient';

export const userService = {
  list: (params?: { search?: string; status?: string; page?: number; limit?: number }) => apiClient.get('/users', { params }),
  get: (id: string) => apiClient.get(`/users/${id}`),
  update: (id: string, data: Record<string, unknown>) => apiClient.put(`/users/${id}`, data),
  toggleStatus: (id: string, status: string) => apiClient.patch(`/users/${id}/status`, { status }),
};
