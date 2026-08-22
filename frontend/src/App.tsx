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
import ProjectListPage from './pages/projects/ProjectListPage';
import TaskListPage from './pages/tasks/TaskListPage';
import KanbanBoardPage from './pages/board/KanbanBoardPage';
import ProfilePage from './pages/settings/ProfilePage';
import AuditLogPage from './pages/settings/AuditLogPage';

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
              <Route path={ROUTES.PROJECTS} element={<ProjectListPage />} />
              <Route path={ROUTES.TASKS} element={<TaskListPage />} />
              <Route path={ROUTES.BOARD} element={<KanbanBoardPage />} />
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
