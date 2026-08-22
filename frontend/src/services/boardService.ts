import apiClient from '../api/apiClient';

export const boardService = {
  getBoard: (projectId: string) => apiClient.get('/board/' + projectId),
};
