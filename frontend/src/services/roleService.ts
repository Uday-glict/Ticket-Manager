import apiClient from '../api/apiClient';

export const roleService = {
  list: () => apiClient.get('/roles'),
  create: (data: { name: string; description?: string; permissions?: string[] }) => apiClient.post('/roles', data),
  update: (id: string, data: Record<string, unknown>) => apiClient.put(`/roles/${id}`, data),
  delete: (id: string) => apiClient.delete(`/roles/${id}`),
};

export const permissionService = {
  list: () => apiClient.get('/permissions'),
};
