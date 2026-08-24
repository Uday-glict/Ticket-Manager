import apiClient from '../api/apiClient';

export const ticketService = {
  listTickets: (params?: { project_id?: string; team_id?: string; sprint_id?: string; status_id?: string; priority?: string; assigned_to?: string; page?: number; limit?: number }) => apiClient.get('/tasks', { params }),
  getTicket: (id: string) => apiClient.get('/tasks/' + id),
  createTicket: (data: Record<string, unknown>) => apiClient.post('/tasks', data),
  updateTicket: (id: string, data: Record<string, unknown>) => apiClient.patch('/tasks/' + id, data),
  deleteTicket: (id: string) => apiClient.delete('/tasks/' + id),
  updateAssignees: (id: string, assignee_ids: string[]) => apiClient.post('/tasks/' + id + '/assignees', { assignee_ids }),
  addAssignee: (id: string, userId: string) => apiClient.post('/tasks/' + id + '/assignees', { assignee_ids: [userId] }),
  removeAssignee: (id: string, userId: string) => apiClient.delete('/tasks/' + id + '/assignees/' + userId),
};
