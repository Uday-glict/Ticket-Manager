import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { AppShell } from './components/layout/AppShell';
import { ROUTES } from './constants/routes';

import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import OnboardingPage from './pages/onboarding/OnboardingPage';
import AdminDashboard from './pages/dashboard/AdminDashboard';

import UserListPage from './pages/users/UserListPage';
import RoleListPage from './pages/roles/RoleListPage';
import RoleFormPage from './pages/roles/RoleFormPage';
import ProjectListPage from './pages/projects/ProjectListPage';
import CreateProjectPage from './pages/projects/CreateProjectPage';
import ProjectDetailsPage from './pages/projects/ProjectDetailsPage';
import TaskListPage from './pages/tasks/TaskListPage';
import CreateTaskPage from './pages/tasks/CreateTaskPage';
import TaskDetailPage from './pages/tasks/TaskDetailPage';
import KanbanBoardPage from './pages/board/KanbanBoardPage';
import ProfilePage from './pages/settings/ProfilePage';
import AuditLogPage from './pages/settings/AuditLogPage';
import TeamListPage from './pages/teams/TeamListPage';
import SprintListPage from './pages/sprints/SprintListPage';
import TicketListPage from './pages/tickets/TicketListPage';
import CalendarPage from './pages/calendar/CalendarPage';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path={ROUTES.LOGIN} element={<LoginPage />} />
            <Route path={ROUTES.SIGNUP} element={<SignupPage />} />
            <Route path={ROUTES.ONBOARDING} element={<OnboardingPage />} />
            <Route element={<AppShell />}>
              <Route path={ROUTES.DASHBOARD} element={<AdminDashboard />} />
              <Route path={ROUTES.USERS} element={<UserListPage />} />
              <Route path={ROUTES.ROLES} element={<RoleListPage />} />
              <Route path={ROUTES.ROLE_CREATE} element={<RoleFormPage />} />
              <Route path={ROUTES.ROLE_EDIT} element={<RoleFormPage />} />
              <Route path={ROUTES.PROJECTS} element={<ProjectListPage />} />
              <Route path={ROUTES.PROJECT_CREATE} element={<CreateProjectPage />} />
              <Route path="/projects/:id/edit" element={<CreateProjectPage />} />
              <Route path={ROUTES.PROJECT_DETAILS} element={<ProjectDetailsPage />} />
              <Route path={ROUTES.TASKS} element={<TaskListPage />} />
              <Route path={ROUTES.TASK_CREATE} element={<CreateTaskPage />} />
              <Route path={ROUTES.TASK_DETAIL} element={<TaskDetailPage />} />
              <Route path="/tickets" element={<TicketListPage />} />
              <Route path="/projects/:projectId/tickets" element={<TicketListPage />} />
              <Route path={ROUTES.BOARD} element={<KanbanBoardPage />} />
              <Route path="/teams" element={<TeamListPage />} />
              <Route path="/projects/:projectId/teams" element={<TeamListPage />} />
              <Route path="/sprints" element={<SprintListPage />} />
              <Route path="/projects/:projectId/sprints" element={<SprintListPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/projects/:projectId/calendar" element={<CalendarPage />} />
              <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
              <Route path={ROUTES.AUDIT_LOG} element={<AuditLogPage />} />
            </Route>
            <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
