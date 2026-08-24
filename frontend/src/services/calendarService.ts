import apiClient from '../api/apiClient';

export const calendarService = {
  getEvents: (projectId: string, params?: { team_id?: string; sprint_id?: string; assignee_id?: string }) =>
    apiClient.get(`/projects/${projectId}/calendar`, { params }),
};
