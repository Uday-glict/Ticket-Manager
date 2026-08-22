import apiClient from '../api/apiClient';

export const authService = {
  login: (email: string, password: string) => apiClient.post('/auth/login', { email, password }),
  signup: (data: { email: string; password: string; name: string; workspace_name?: string }) => apiClient.post('/auth/signup', data),
  refresh: (refresh_token: string) => apiClient.post('/auth/refresh', { refresh_token }),
  logout: (refresh_token: string) => apiClient.post('/auth/logout', { refresh_token }),
  getMe: () => apiClient.get('/auth/me'),
};
