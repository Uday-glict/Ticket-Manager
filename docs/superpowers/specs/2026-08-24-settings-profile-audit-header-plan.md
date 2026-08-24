# Settings, Profile, Audit Logs & Header – Production Implementation Plan

**Date:** 2026-08-24  
**Backend Base URL:** `http://localhost:8000/api/v1` (via `apiClient` → direct, `vite.config.ts` proxy → 8000 as fallback)  
**Stack:** React 18 + TS + Tailwind + React Router + Axios + Context (Auth/Toast/Theme)

## 1. Assessment – What Exists vs What’s Broken

| Module | File | Exists? | Issue |
|---|---|---|---|
| **ProfilePage** | `pages/settings/ProfilePage.tsx` | Yes – UI ok | Mock `setTimeout 400ms`, no API calls, `handleSaveProfile` / `handleChangePassword` never hit backend. `name/email` local state not synced to AuthContext. Password validation `length <6` vs backend `8-128`. |
| **AuditLogPage** | `pages/settings/AuditLogPage.tsx` | Yes – UI ok | **Already dynamic** via `auditService.list` + `userService.list` + `mapAuditLog/mapUser`. Needs pagination via backend `pagination`, not client-side slice, and error handling. |
| **Settings module** | `ROUTES.SETTINGS = /settings` | **No component** | Route defined but no page. `/settings` falls through to dashboard. Needs landing page with cards linking to Profile + Audit. |
| **Header** | `components/layout/Header.tsx` | Yes – UI ok | Props `userName` never passed, `Avatar` shows “User”, `Dropdown` Profile does `onClick:()=>{}` (no navigation), Logout calls optional prop not `useAuth().logout` + navigate. SearchBox is static (`value=""`). `AppShell` renders `<Header />` without user. |
| **AppShell** | `components/layout/AppShell.tsx` | Yes | Renders `<ToastContainer toasts={[]} />` duplicate – `main.tsx` already wraps `ToastProvider` which renders container. Causes two containers, one empty. |
| **Dynamic binding** | All services | Partial | `apiClient` now absolute `http://localhost:8000/api/v1`, services exist, mappers handle envelope, but Profile still hardcoded, Header not bound. |

**Current flow intact:** `BrowserRouter` → `AuthProvider` → `AppShell` (Sidebar + Header + Breadcrumb + Outlet) → dashboard/projects/tasks etc. Must not break.

## 2. Implementation Principles

- **Reuse, don’t recreate:** Keep all existing UI, only wire logic.
- **Single source of truth:** Backend messages via `getErrorMessage` + `useToast`; never `toast.success("hardcoded")`.
- **Absolute baseURL:** `http://localhost:8000/api/v1` – do not revert to `/api/v1` or `:3000`.
- **No new folder architecture:** Use existing `pages/settings`, `components/layout`, `services`, `utils/mappers`.

## 3. Task Breakdown (Priority Order)

### P0 – Header (post-login persistence)
**Files:** `components/layout/Header.tsx`, `components/layout/AppShell.tsx`
1. **Header.tsx:** Replace props with `useAuth()` + `useNavigate()`
   - `const {user, logout} = useAuth()`; `userName = user?.name ?? "User"`
   - `Dropdown` items: Profile → `navigate(ROUTES.PROFILE)`, Logout → `logout(); navigate(ROUTES.LOGIN)`
   - Avatar shows `user.avatar` + `user.name`
   - Optional: wire `SearchBox` to navigate `/tasks?search=` or keep placeholder (no disruption).
2. **AppShell.tsx:** Remove duplicate `<ToastContainer>` import + JSX (line 6, 21). Keep only `<Header />` (now self-sufficient) + `<Outlet />`. Verify `collapsed` state persists.
3. **Acceptance:** After login, Header shows real name/email, survives route changes, logout clears tokens + redirects.

### P0 – Profile (dynamic)
**Files:** `pages/settings/ProfilePage.tsx`, `services/userService.ts`, `context/AuthContext.tsx`
1. Sync `name/email` from `useAuth().user` via `useEffect` when `user` changes.
2. `handleSaveProfile`: Validate → `await userService.update(user.id, {name, email})` → unwrap `res.data.data || res.data` → update AuthContext via `setUser` (expose `setUser` or refetch `authService.getMe`) → `showSuccess(res.data.message || "Profile updated")` → `getErrorMessage` on catch.
3. `handleChangePassword`: Validate 8–128 chars (match `schemas/auth.py` Field), call `userService.update` or dedicated `authService.changePassword` if backend exposes `PUT /users/{id}/password`; fallback to `showError` if not implemented – never mock timeout.
4. Add `loading` disabled states, field error mapping for `422` details.
5. Keep Tailwind UI, no redesign.

### P1 – Settings Landing
**Files:** Create `pages/settings/SettingsPage.tsx` (if not exists), `App.tsx`
1. New screen: Two cards – “Profile” → `ROUTES.PROFILE`, “Audit Logs” → `ROUTES.AUDIT_LOG` + maybe “Appearance” (theme). Use existing `Card`-like divs (`bg-white border rounded-xl p-6`).
2. `App.tsx`: Add `ROUTES.SETTINGS` route → `SettingsPage` inside `AppShell`. Add `/settings` redirect handling if already exists.
3. Link `Sidebar` Settings item → `/settings` (verify `constants/routes.ts` already has it).

### P1 – Audit Logs (dynamic polish)
**Files:** `pages/settings/AuditLogPage.tsx`
1. Already dynamic – upgrade to **server-side pagination**: pass `page, limit, search, entity_type` to `auditService.list({page, limit, entity_type: filters.module})`, consume `res.data.pagination`.
2. Keep client filters as fallback, but prefer backend filtering for 20+ logs.
3. Add loading skeleton (`Skeleton`) and error `ErrorState` with retry.
4. Ensure `formatDate` uses `created_at` mapped via `mapAuditLog`.

### P2 – Dynamic Binding Hardening (all screens)
**Approach:** `apiClient` (`http://localhost:8000/api/v1`) + `useState/useEffect` + `mapX` + `useToast` + `getErrorMessage` already established. No Redux needed.
1. Audit: grep all `setTimeout` mocks in settings → remove.
2. Ensure every `catch` uses `getErrorMessage(err)` → `showError`.
3. Verify `vite.config.ts` target stays `8000`.

### P2 – Linking & Integration
1. Ensure `App.tsx` routes order: `/settings` before `/settings/profile` (prefix match).
2. `Sidebar.tsx`: Settings section links to `ROUTES.SETTINGS`, `ROUTES.PROFILE`, `ROUTES.AUDIT_LOG`.
3. No navigation breaks – test `/dashboard` → Profile → back → Board → Header still shows user.

## 4. Technologies / Approach for Dynamic Binding

- **API Layer:** `frontend/src/api/apiClient.ts` (axios, `baseURL: http://localhost:8000/api/v1`, interceptors for `Authorization: Bearer`, 401 refresh queue).
- **Services:** `userService`, `auditService`, `authService` – thin wrappers over `apiClient`.
- **Mapping:** `utils/mappers.ts` → `mapUser`, `mapAuditLog` handle `snake_case → camelCase` + envelope `res.data.data || res.data`.
- **State:** Local `useState` + `useEffect` for fetch; `AuthContext` for global user; `ToastContext` for feedback.
- **No new state lib:** Keep Context, avoid Redux/Zustand per existing architecture.
- **Error handling:** Central `getErrorMessage` + `getErrorDetails` for `422` field errors.

## 5. Maintaining Current Flow

- No route deletions – only **additive** (`/settings`).
- No UI redesign – Tailwind classes preserved.
- No folder moves – use `pages/settings`, `components/layout`.
- Every new API call falls back to `showError` without breaking navigation.

## 6. Timeline / Prioritization

| Day | Tasks | Owner |
|---|---|---|
| **Day 1 (2h)** | Header fix + AppShell cleanup + Profile dynamic wiring | Frontend |
| **Day 1 (1h)** | Settings landing page + routing | Frontend |
| **Day 2 (1h)** | Audit Logs server pagination + loading states | Frontend |
| **Day 2 (30m)** | `npm run build` + manual flow test (login → header → profile save → audit) | QA |

**Total:** ~4.5h

## 7. Acceptance Criteria

- [ ] Header shows `user.name` after login, persists across `/projects`, `/tasks`, `/settings`, logout works.
- [ ] `AppShell` has no duplicate `ToastContainer`.
- [ ] Profile Save / Change Password hit `http://localhost:8000/api/v1` and show backend `message` via toast.
- [ ] `/settings` renders with links to Profile & Audit.
- [ ] Audit Logs load dynamically with pagination, not hardcoded.
- [ ] `vite.config` target stays `8000`, `apiClient` baseURL stays `8000`.

## 8. Risks & Mitigations

- Backend missing `changePassword` endpoint → Mitigate: use `userService.update` and document fallback.
- Unwrapping envelope inconsistency (`data.data` vs `data`) → Mitigate: always `res.data.data || res.data`.
