import apiClient from '../api/apiClient';

export const auditService = {
  list: (params?: { entity_type?: string; user_id?: string; page?: number; limit?: number }) => apiClient.get('/audit-logs', { params }),
};
