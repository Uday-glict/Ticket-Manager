# TaskManager UI — Full Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-ready, responsive, dark-mode-capable Project & Task Management UI with 22 screens, reusable component library, and role-aware navigation using React + TypeScript + Tailwind CSS.

**Architecture:** Component-driven design system → Layout shell → Page composition. All data is mock/dynamic via local state. No backend. Dark mode via Tailwind `dark:` classes with a ThemeContext. Responsive breakpoints: 375px, 768px, 1024px, 1440px.

**Tech Stack:** React 18, TypeScript 5, Vite, Tailwind CSS 3, Lucide React (icons), react-router-dom v6, @dnd-kit/core + @dnd-kit/sortable (Kanban drag-and-drop), recharts (dashboard charts)

---

## File Structure

```
src/
├── App.tsx                          # Router + ThemeProvider wrapper
├── main.tsx                         # Entry point
├── index.css                        # Tailwind directives + CSS custom properties
│
├── types/
│   ├── index.ts                     # All TypeScript interfaces/types
│
├── context/
│   ├── ThemeContext.tsx              # Dark/light mode toggle + persistence
│   ├── AuthContext.tsx               # Current user, login/logout, permissions
│
├── constants/
│   ├── routes.ts                    # Route path constants
│   ├── permissions.ts               # Permission definitions
│
├── utils/
│   ├── cn.ts                        # clsx + tailwind-merge utility
│   ├── mockData.ts                  # All mock data for development
│
├── components/
│   ├── common/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── MultiSelect.tsx
│   │   ├── Checkbox.tsx
│   │   ├── Radio.tsx
│   │   ├── Switch.tsx
│   │   ├── Modal.tsx
│   │   ├── Drawer.tsx
│   │   ├── Table.tsx
│   │   ├── Pagination.tsx
│   │   ├── Dropdown.tsx
│   │   ├── Tabs.tsx
│   │   ├── Badge.tsx
│   │   ├── Avatar.tsx
│   │   ├── Tooltip.tsx
│   │   ├── DatePicker.tsx
│   │   ├── SearchBox.tsx
│   │   ├── FilterPanel.tsx
│   │   ├── ConfirmDialog.tsx
│   │   ├── Toast.tsx
│   │   ├── Loader.tsx
│   │   ├── EmptyState.tsx
│   │   ├── ErrorState.tsx
│   │   ├── Skeleton.tsx
│   │   ├── KanbanCard.tsx
│   │   └── KanbanColumn.tsx
│   │
│   ├── layout/
│   │   ├── AppShell.tsx             # Sidebar + Header + Main content area
│   │   ├── Sidebar.tsx              # Navigation sidebar (responsive)
│   │   ├── Header.tsx               # Top bar: search, notifications, profile
│   │   └── Breadcrumb.tsx
│
├── pages/
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   └── SignupPage.tsx
│   ├── onboarding/
│   │   └── OnboardingPage.tsx
│   ├── dashboard/
│   │   ├── AdminDashboard.tsx
│   │   └── DeveloperDashboard.tsx
│   ├── users/
│   │   ├── UserListPage.tsx
│   │   └── UserFormModal.tsx
│   ├── roles/
│   │   ├── RoleListPage.tsx
│   │   └── RoleFormPage.tsx
│   ├── projects/
│   │   ├── ProjectListPage.tsx
│   │   ├── CreateProjectPage.tsx
│   │   ├── ProjectDetailsPage.tsx
│   │   └── ProjectStatusConfig.tsx
│   ├── tasks/
│   │   ├── TaskListPage.tsx
│   │   ├── CreateTaskPage.tsx
│   │   └── TaskDetailPage.tsx
│   ├── board/
│   │   └── KanbanBoardPage.tsx
│   └── settings/
│       ├── ProfilePage.tsx
│       └── AuditLogPage.tsx
│
└── hooks/
    ├── useLocalStorage.ts
    └── useClickOutside.ts
```

---

## Global Constraints

- React 18 + TypeScript 5 + Vite
- Tailwind CSS 3 with `darkMode: 'class'`
- All icons from Lucide React (no emojis as icons)
- Inter font (Google Fonts) — weights 300, 400, 500, 600, 700
- All clickable elements must have `cursor-pointer`
- Transitions: 150–300ms via `transition-colors duration-200`
- Light mode text contrast ≥ 4.5:1 (use `slate-900` for body text)
- Responsive: 375px (mobile), 768px (tablet), 1024px (laptop), 1440px (desktop)
- No hardcoded status colors — statuses are project-configurable
- Components accept dynamic props, no component-per-action pattern
- `prefers-reduced-motion` respected via Tailwind `motion-safe:` prefix

---

## Phase 1: Project Setup & Design System

### Task 1: Initialize Vite + React + TypeScript Project

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`
- Create: `src/main.tsx`, `src/App.tsx`, `src/index.css`

- [ ] **Step 1: Scaffold Vite project**

```bash
cd F:/SAVTech/Study/Project/TaskManager
npm create vite@latest . -- --template react-ts
```

- [ ] **Step 2: Install dependencies**

```bash
npm install
npm install -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init -p
npm install lucide-react react-router-dom @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities recharts clsx tailwind-merge
```

- [ ] **Step 3: Configure Tailwind**

`tailwind.config.js`:
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#ECFEFF',
          100: '#CFFAFE',
          200: '#A5F3FC',
          300: '#67E8F9',
          400: '#22D3EE',
          500: '#0891B2',
          600: '#0E7490',
          700: '#155E75',
          800: '#164E63',
          900: '#083344',
          950: '#042F2E',
        },
        surface: {
          light: '#FFFFFF',
          dark: '#0F172A',
        },
        background: {
          light: '#F8FAFC',
          dark: '#020617',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-out',
        'slide-in': 'slideIn 200ms ease-out',
        'slide-up': 'slideUp 200ms ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideIn: { '0%': { transform: 'translateX(-10px)', opacity: '0' }, '100%': { transform: 'translateX(0)', opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(10px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 4: Set up base CSS**

`src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

@layer base {
  body {
    @apply font-sans antialiased bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100;
  }
}
```

- [ ] **Step 5: Create utility function**

`src/utils/cn.ts`:
```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 6: Verify dev server runs**

```bash
npm run dev
```
Expected: App loads at localhost:5173

---

### Task 2: TypeScript Types

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: Define all core types**

```ts
// User
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'active' | 'inactive';
  lastLogin?: string;
  createdAt: string;
}

// Role
export interface Permission {
  id: string;
  name: string;
  group: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[]; // permission ids
  isSystem: boolean;
  createdAt: string;
}

// Project
export interface ProjectStatus {
  id: string;
  name: string;
  color: string;
  order: number;
  enabled: boolean;
}

export interface ProjectMember {
  userId: string;
  roleId: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  managerId: string;
  members: ProjectMember[];
  statuses: ProjectStatus[];
  startDate: string;
  endDate?: string;
  status: 'active' | 'archived';
  createdAt: string;
}

// Task
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  title: string;
  description?: string;
  projectId: string;
  assignedTo?: string;
  createdBy: string;
  priority: Priority;
  statusId: string;
  startDate?: string;
  dueDate?: string;
  attachments?: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
}

// Comment
export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  parentId?: string;
  createdAt: string;
  updatedAt?: string;
}

// Activity
export interface Activity {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  entityName: string;
  previousValue?: string;
  newValue?: string;
  createdAt: string;
}

// Audit Log
export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  module: string;
  record: string;
  previousValue?: string;
  newValue?: string;
  createdAt: string;
}

// Toast
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}
```

---

### Task 3: Theme Context (Dark/Light Mode)

**Files:**
- Create: `src/context/ThemeContext.tsx`
- Create: `src/hooks/useLocalStorage.ts`

- [ ] **Step 1: Create useLocalStorage hook**

```ts
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(storedValue));
  }, [key, storedValue]);

  return [storedValue, setStoredValue] as const;
}
```

- [ ] **Step 2: Create ThemeContext**

```tsx
import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useLocalStorage<Theme>('theme', 'light');

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(t => (t === 'light' ? 'dark' : 'light'));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
```

---

### Task 4: Mock Data

**Files:**
- Create: `src/utils/mockData.ts`

- [ ] **Step 1: Create comprehensive mock data**

Include: 5 users, 3 roles (Admin, PM, Developer), 3 projects with dynamic statuses, 15 tasks across projects, 10 comments, 5 activity entries, 10 audit log entries. All IDs should be consistent (e.g., task.projectId matches a real project.id).

---

## Phase 2: Common Components

### Task 5: Button Component

**Files:**
- Create: `src/components/common/Button.tsx`

- [ ] **Step 1: Implement Button**

Support variants: `primary`, `secondary`, `outline`, `ghost`, `danger`
Support sizes: `sm`, `md`, `lg`
Support states: `loading`, `disabled`
Include `cursor-pointer`, transitions, focus ring for accessibility.

```tsx
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const variants = {
  primary: 'bg-primary-500 hover:bg-primary-600 text-white shadow-sm',
  secondary: 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100',
  outline: 'border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300',
  ghost: 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300',
  danger: 'bg-red-500 hover:bg-red-600 text-white shadow-sm',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, disabled, className, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
);
Button.displayName = 'Button';
```

---

### Task 6: Input, Select, Checkbox, Radio, Switch

**Files:**
- Create: `src/components/common/Input.tsx`
- Create: `src/components/common/Select.tsx`
- Create: `src/components/common/Checkbox.tsx`
- Create: `src/components/common/Radio.tsx`
- Create: `src/components/common/Switch.tsx`

- [ ] **Step 1: Implement Input** — text input with label, error state, icon support, dark mode
- [ ] **Step 2: Implement Select** — dropdown select with label, error, dark mode
- [ ] **Step 3: Implement Checkbox** — custom styled checkbox with label
- [ ] **Step 4: Implement Radio** — custom styled radio with label
- [ ] **Step 5: Implement Switch** — toggle switch with label

All form components must:
- Accept `label`, `error`, `required` props
- Use `cursor-pointer` on interactive elements
- Support `dark:` variants
- Have visible focus states
- Use semantic HTML (`<label>`, proper input types)

---

### Task 7: Modal & Drawer

**Files:**
- Create: `src/components/common/Modal.tsx`
- Create: `src/components/common/Drawer.tsx`

- [ ] **Step 1: Implement Modal** — overlay, close button, escape key, click outside, animated, accessible (role="dialog", aria-modal)
- [ ] **Step 2: Implement Drawer** — slide-in from right, overlay, close, animated

---

### Task 8: Table & Pagination

**Files:**
- Create: `src/components/common/Table.tsx`
- Create: `src/components/common/Pagination.tsx`

- [ ] **Step 1: Implement Table** — generic typed table with sortable headers, row hover, responsive (horizontal scroll on mobile)
- [ ] **Step 2: Implement Pagination** — page numbers, prev/next, items per page selector

---

### Task 9: Badge, Avatar, Tooltip, Dropdown

**Files:**
- Create: `src/components/common/Badge.tsx`
- Create: `src/components/common/Avatar.tsx`
- Create: `src/components/common/Tooltip.tsx`
- Create: `src/components/common/Dropdown.tsx`

- [ ] **Step 1: Implement Badge** — color variants (success, warning, danger, info, neutral)
- [ ] **Step 2: Implement Avatar** — image or initials fallback, sizes
- [ ] **Step 3: Implement Tooltip** — hover tooltip, accessible
- [ ] **Step 4: Implement Dropdown** — click dropdown with items, keyboard navigation

---

### Task 10: SearchBox, FilterPanel, Tabs

**Files:**
- Create: `src/components/common/SearchBox.tsx`
- Create: `src/components/common/FilterPanel.tsx`
- Create: `src/components/common/Tabs.tsx`

- [ ] **Step 1: Implement SearchBox** — input with search icon, clear button, debounce
- [ ] **Step 2: Implement FilterPanel** — collapsible filter area with multiple filter types
- [ ] **Step 3: Implement Tabs** — tab list with active indicator, keyboard navigation

---

### Task 11: Feedback Components (Toast, Loader, EmptyState, ErrorState, Skeleton, ConfirmDialog)

**Files:**
- Create: `src/components/common/Toast.tsx`
- Create: `src/components/common/Loader.tsx`
- Create: `src/components/common/EmptyState.tsx`
- Create: `src/components/common/ErrorState.tsx`
- Create: `src/components/common/Skeleton.tsx`
- Create: `src/components/common/ConfirmDialog.tsx`

- [ ] **Step 1: Implement Toast** — toast notification system with auto-dismiss, multiple types
- [ ] **Step 2: Implement Loader** — spinner + optional message
- [ ] **Step 3: Implement EmptyState** — illustration placeholder, message, CTA button
- [ ] **Step 4: Implement ErrorState** — error icon, message, retry button
- [ ] **Step 5: Implement Skeleton** — skeleton loading placeholders (text, avatar, card shapes)
- [ ] **Step 6: Implement ConfirmDialog** — confirmation modal for destructive actions

---

### Task 12: DatePicker & MultiSelect

**Files:**
- Create: `src/components/common/DatePicker.tsx`
- Create: `src/components/common/MultiSelect.tsx`

- [ ] **Step 1: Implement DatePicker** — simple date input with calendar dropdown, dark mode
- [ ] **Step 2: Implement MultiSelect** — multi-select dropdown with chips, search, clear

---

### Task 13: Kanban Components

**Files:**
- Create: `src/components/common/KanbanCard.tsx`
- Create: `src/components/common/KanbanColumn.tsx`

- [ ] **Step 1: Implement KanbanCard** — task card with title, assignee avatar, priority badge, due date, overdue indicator, drag handle
- [ ] **Step 2: Implement KanbanColumn** — column with header (status name + count), droppable area, scrollable body

---

## Phase 3: Layout Components

### Task 14: App Shell, Sidebar, Header

**Files:**
- Create: `src/components/layout/AppShell.tsx`
- Create: `src/components/layout/Sidebar.tsx`
- Create: `src/components/layout/Header.tsx`
- Create: `src/components/layout/Breadcrumb.tsx`

- [ ] **Step 1: Implement Sidebar** — collapsible navigation, role-based items, icons + labels, active state, responsive (drawer on mobile)
- [ ] **Step 2: Implement Header** — search bar, notification bell (with count badge), user avatar dropdown, theme toggle, responsive
- [ ] **Step 3: Implement Breadcrumb** — auto-generated from route
- [ ] **Step 4: Implement AppShell** — compose Sidebar + Header + main content area, responsive layout

---

### Task 15: Auth Context & Routing

**Files:**
- Create: `src/context/AuthContext.tsx`
- Create: `src/constants/routes.ts`
- Create: `src/App.tsx` (update)

- [ ] **Step 1: Create AuthContext** — current user, login, logout, role, permissions
- [ ] **Step 2: Define routes** — all route paths as constants
- [ ] **Step 3: Set up React Router** — protected routes, role-based redirects

---

## Phase 4: Authentication & Onboarding

### Task 16: Login Page

**Files:**
- Create: `src/pages/auth/LoginPage.tsx`

- [ ] **Step 1: Implement Login** — email/password form, validation, loading state, invalid credentials state, password visibility toggle, forgot password link, signup link, responsive (centered card on desktop, full-width on mobile)

---

### Task 17: Signup Page

**Files:**
- Create: `src/pages/auth/SignupPage.tsx`

- [ ] **Step 1: Implement Signup** — name, email, password, confirm password, "Have a company?" toggle with conditional company fields, validation, responsive

---

### Task 18: Onboarding Page

**Files:**
- Create: `src/pages/onboarding/OnboardingPage.tsx`

- [ ] **Step 1: Implement Onboarding** — welcome message, 3 step cards (Add Users, Create Roles, Create Project), skip option, role-aware (only show relevant steps)

---

## Phase 5: Dashboard

### Task 19: Admin/Manager Dashboard

**Files:**
- Create: `src/pages/dashboard/AdminDashboard.tsx`

- [ ] **Step 1: Implement KPI Cards** — Total Projects, Active Projects, Total Tasks, Completed, Overdue — icon + number + label, trend indicator
- [ ] **Step 2: Implement Project Progress** — horizontal progress bars with project name and percentage
- [ ] **Step 3: Implement Task Status chart** — recharts BarChart or PieChart showing task distribution by status
- [ ] **Step 4: Implement Team Workload** — table/list of team members with task counts (assigned, completed, pending, overdue)
- [ ] **Step 5: Implement Recent Activity** — timeline-style activity feed with user avatars, action descriptions, timestamps
- [ ] **Step 6: Compose all sections** in responsive grid layout

---

### Task 20: Developer Dashboard

**Files:**
- Create: `src/pages/dashboard/DeveloperDashboard.tsx`

- [ ] **Step 1: Implement My Tasks widget** — task list with status badges, priority, due dates
- [ ] **Step 2: Implement Tasks Due Today / Overdue widgets** — highlighted cards
- [ ] **Step 3: Implement My Projects** — project cards with progress
- [ ] **Step 4: Compose** in responsive grid

---

## Phase 6: User & Role Management

### Task 21: User List Page

**Files:**
- Create: `src/pages/users/UserListPage.tsx`
- Create: `src/pages/users/UserFormModal.tsx`

- [ ] **Step 1: Implement User List** — Table with columns: Name, Email, Projects, Roles, Status, Last Login, Actions (view, edit, toggle status, assign project, assign role). Search, filter, sort, pagination.
- [ ] **Step 2: Implement Add/Edit User Modal** — form fields, project-role assignment matrix, validation

---

### Task 22: Role Management

**Files:**
- Create: `src/pages/roles/RoleListPage.tsx`
- Create: `src/pages/roles/RoleFormPage.tsx`

- [ ] **Step 1: Implement Role List** — table with name, description, permission count, system/custom badge, actions
- [ ] **Step 2: Implement Role Form** — grouped permissions checkboxes, save/delete (custom only), system role protection

---

## Phase 7: Project Management

### Task 23: Project List & Create

**Files:**
- Create: `src/pages/projects/ProjectListPage.tsx`
- Create: `src/pages/projects/CreateProjectPage.tsx`

- [ ] **Step 1: Implement Project List** — table: Name, Manager, Members, Progress, Tasks, Dates, Status, Actions. Search, filter, sort.
- [ ] **Step 2: Implement Create Project** — multi-section form: Basic Info, Timeline, Members, Roles, Status Configuration (add/edit/delete/reorder statuses with color picker)

---

### Task 24: Project Details

**Files:**
- Create: `src/pages/projects/ProjectDetailsPage.tsx`
- Create: `src/pages/projects/ProjectStatusConfig.tsx`

- [ ] **Step 1: Implement Project Details** — tabs: Overview, Tasks, Board, Members, Activity
- [ ] **Step 2: Implement Overview tab** — description, manager, members, progress, dates, task summary
- [ ] **Step 3: Implement Members tab** — member list with project-specific roles
- [ ] **Step 4: Implement Activity tab** — project activity timeline
- [ ] **Step 5: Implement Status Config** — inline status editor with drag-reorder, color picker, enable/disable

---

## Phase 8: Task Management

### Task 25: Task List & Create

**Files:**
- Create: `src/pages/tasks/TaskListPage.tsx`
- Create: `src/pages/tasks/CreateTaskPage.tsx`

- [ ] **Step 1: Implement Task List** — table: Title, Project, Assigned To, Priority, Status, Due Date, Created By, Updated. Filters: project, user, status, priority, date range.
- [ ] **Step 2: Implement Create Task** — form: title, description, project selector, assigned user, priority, status (dynamic from project), start date, due date, attachments

---

### Task 26: Task Detail

**Files:**
- Create: `src/pages/tasks/TaskDetailPage.tsx`

- [ ] **Step 1: Implement Task Detail** — header (title + actions), description, metadata (project, assignee, priority, status, dates), comment section, activity timeline
- [ ] **Step 2: Implement Comments** — comment list with replies (nested), add comment form, edit/delete own comments
- [ ] **Step 3: Implement Reassignment** — reassign modal with user selector, reason field, activity log update
- [ ] **Step 4: Implement Status/Priority change** — inline dropdowns with activity tracking

---

## Phase 9: Kanban Board

### Task 27: Kanban Board

**Files:**
- Create: `src/pages/board/KanbanBoardPage.tsx`

- [ ] **Step 1: Implement Board Layout** — horizontal scrollable columns from project statuses, dynamic column count
- [ ] **Step 2: Implement Drag & Drop** — @dnd-kit integration, DndContext, SortableContext, onDragEnd updates task status
- [ ] **Step 3: Implement KanbanCard** — task title, assignee avatar, priority badge, due date, overdue indicator
- [ ] **Step 4: Implement Column Headers** — status name, task count, color indicator
- [ ] **Step 5: Implement Quick Actions** — click card opens task detail, drag to reorder within column

---

## Phase 10: Settings

### Task 28: Profile & Audit Log

**Files:**
- Create: `src/pages/settings/ProfilePage.tsx`
- Create: `src/pages/settings/AuditLogPage.tsx`

- [ ] **Step 1: Implement Profile** — avatar upload placeholder, name, email, change password form
- [ ] **Step 2: Implement Audit Log** — table: User, Action, Module, Record, Previous, New, Date. Filters: date range, user, module. Search.

---

## Phase 11: Integration & Polish

### Task 29: Wire Up All Pages in Router

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add all routes** — nested under AppShell, auth routes outside shell, protected by role
- [ ] **Step 2: Add default redirects** — after login → dashboard, after signup → onboarding

---

### Task 30: Responsive Polish & Dark Mode Audit

- [ ] **Step 1: Test all pages at 375px, 768px, 1024px, 1440px**
- [ ] **Step 2: Verify dark mode on all pages** — text contrast, borders, shadows
- [ ] **Step 3: Add `prefers-reduced-motion` support** — wrap animations in `motion-safe:` prefix
- [ ] **Step 4: Verify all clickable elements have `cursor-pointer`**
- [ ] **Step 5: Verify focus states visible for keyboard navigation**
- [ ] **Step 6: Verify no emojis used as icons — all Lucide**

---

### Task 31: Empty States & Error States

- [ ] **Step 1: Add empty states** to all list pages (users, projects, tasks, roles)
- [ ] **Step 2: Add loading skeletons** to all data-fetching pages
- [ ] **Step 3: Add error states with retry** to all data-fetching pages
- [ ] **Step 4: Add toast notifications** for all CRUD operations (create, update, delete success/error)

---

## Verification Checklist

After all tasks complete, verify:

- [ ] All 22 screens render correctly
- [ ] Dark mode toggle works on every page
- [ ] Responsive at 375px, 768px, 1024px, 1440px
- [ ] Kanban drag-and-drop works
- [ ] All modals open/close correctly
- [ ] Form validation shows errors
- [ ] Empty states show when no data
- [ ] Loading states show during transitions
- [ ] Role-based navigation hides/shows items
- [ ] Dynamic project statuses work in task forms and Kanban
- [ ] Comments can be added, replied to, edited, deleted
- [ ] Task reassignment works with activity logging
- [ ] Audit log displays with filters
- [ ] No console errors
- [ ] All interactive elements have cursor-pointer
- [ ] All transitions are 150-300ms
- [ ] Focus states visible for keyboard navigation
