import { useState, useMemo, useEffect } from 'react';
import { Plus, Edit, UserCheck, UserX, MoreVertical, Eye, Trash2 } from 'lucide-react';
import { Table, type Column } from '../../components/common/Table';
import { Pagination } from '../../components/common/Pagination';
import { SearchBox } from '../../components/common/SearchBox';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
import { Avatar } from '../../components/common/Avatar';
import { Button } from '../../components/common/Button';
import { Dropdown } from '../../components/common/Dropdown';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { DataToolbar } from '../../components/common/DataToolbar';
import { ViewToggle, type ViewMode } from '../../components/common/ViewToggle';
import { userService } from '../../services/userService';
import { projectService } from '../../services/projectService';
import { roleService } from '../../services/roleService';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../api/apiClient';
import type { User, Project, Role } from '../../types';
import { mapProject, mapUser, mapRole } from '../../utils/mappers';
import UserFormModal from './UserFormModal';

const PAGE_SIZE = 5;

export default function UserListPage() {
  const { success: showSuccess, error: showError } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  useEffect(() => {
    Promise.all([
      userService.list(),
      projectService.list(),
      roleService.list(),
    ]).then(([usersRes, projectsRes, rolesRes]) => {
      setUsers((usersRes.data.data || usersRes.data || []).map(mapUser));
      setProjects((projectsRes.data.data || projectsRes.data || []).map(mapProject));
      setRoles((rolesRes.data.data || rolesRes.data || []).map(mapRole));
    }).catch(() => {});
  }, []);

  const getUserProjects = (userId: string) =>
    projects.filter(p => p.members.some(m => m.userId === userId));

  const getUserRoles = (userId: string) => {
    const userRoles: string[] = [];
    projects.forEach(p => {
      p.members.forEach(m => {
        if (m.userId === userId) {
          const role = roles.find(r => r.id === m.roleId);
          if (role && !userRoles.includes(role.name)) userRoles.push(role.name);
        }
      });
    });
    return userRoles;
  };

  const enriched = useMemo(() => {
    return users.map(u => ({
      ...u,
      projectCount: getUserProjects(u.id).length,
      roles: getUserRoles(u.id),
    }));
  }, [users, projects, roles]);

  const filtered = useMemo(() => {
    let result = enriched;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      );
    }
    if (filterValues.status) {
      result = result.filter(u => u.status === filterValues.status);
    }
    result.sort((a, b) => {
      const aVal = a[sortKey as keyof typeof a] ?? '';
      const bVal = b[sortKey as keyof typeof b] ?? '';
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDirection === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [enriched, search, filterValues, sortKey, sortDirection]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const fetchUsers = () => {
    userService.list().then(res => {
      const data = res.data.data || res.data;
      setUsers((Array.isArray(data) ? data : []).map(mapUser));
    }).catch(() => {});
  };

  const handleToggleStatus = async (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;
    const newStatus = target.status === 'active' ? 'inactive' : 'active';
    try {
      await userService.toggleStatus(userId, newStatus);
      setUsers(prev =>
        prev.map(u =>
          u.id === userId ? { ...u, status: newStatus } : u
        )
      );
      showSuccess(`User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
    } catch (err: any) {
      showError(getErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await userService.delete(deleteTarget.id);
      setUsers(prev => prev.filter(u => u.id !== deleteTarget.id));
      showSuccess((res.data as any)?.message || 'User deleted successfully');
      setDeleteTarget(null);
    } catch (err: any) {
      showError(getErrorMessage(err));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSave = async (userData: Partial<User> & { roleId?: string; avatarFile?: File | null; password?: string }) => {
    try {
      if (editingUser) {
        const res = await userService.update(editingUser.id, { name: userData.name, email: userData.email, status: userData.status });
        const updated = res.data.data || res.data;
        let avatarUrl = editingUser.avatar;
        if (userData.avatarFile) {
          try {
            const avRes = await userService.uploadAvatar(editingUser.id, userData.avatarFile);
            avatarUrl = avRes.data.data?.avatar_url || avRes.data.avatar_url || avatarUrl;
            showSuccess(avRes.data.message || 'Avatar updated');
          } catch (e: any) {
            showError(getErrorMessage(e));
          }
        }
        setUsers(prev =>
          prev.map(u => (u.id === editingUser.id ? { ...u, name: updated.name || userData.name!, email: updated.email || userData.email!, status: updated.status || userData.status!, avatar: avatarUrl } : u))
        );
        showSuccess(res.data.message || 'User updated successfully');
        const roleId = (userData as any).roleId;
        if (roleId && projects.length > 0) {
          const targetProject = projects[0].id;
          try { await projectService.addMember(targetProject, { user_id: editingUser.id, role_id: roleId }); } catch {}
        }
      } else {
        const fd = new FormData();
        fd.append('name', (userData.name || '').trim());
        fd.append('email', (userData.email || '').trim());
        fd.append('password', (userData as any).password || '');
        if (userData.avatarFile) fd.append('avatar', userData.avatarFile);
        const res = await userService.create(fd);
        const created = res.data.data || res.data;
        const newUser: User = {
          id: created.id,
          name: created.name,
          email: created.email,
          status: created.status,
          createdAt: new Date().toISOString(),
          avatar: created.avatar,
        };
        setUsers(prev => [...prev, newUser]);
        showSuccess(res.data.message || 'User created successfully');
        const roleId = (userData as any).roleId;
        if (roleId && projects.length > 0) {
          const targetProject = projects[0].id;
          try { await projectService.addMember(targetProject, { user_id: newUser.id, role_id: roleId }); } catch {}
        }
      }
    } catch (err: any) {
      showError(getErrorMessage(err));
      return;
    }
    setModalOpen(false);
    setEditingUser(null);
  };

  const columns: Column<(typeof enriched)[number]>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: u => (
        <div className="flex items-center gap-3">
          <Avatar src={u.avatar} name={u.name} size="sm" />
          <span className="font-medium">{u.name}</span>
        </div>
      ),
    },
    { key: 'email', header: 'Email', sortable: true },
    {
      key: 'projectCount',
      header: 'Projects',
      render: u => <span className="text-slate-600 dark:text-slate-400">{u.projectCount}</span>,
    },
    {
      key: 'roles',
      header: 'Roles',
      render: u => (
        <div className="flex flex-wrap gap-1">
          {u.roles.length === 0 && <span className="text-slate-400 text-xs">None</span>}
          {u.roles.map(r => (
            <Badge key={r} variant="info">{r}</Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: u => (
        <Badge variant={u.status === 'active' ? 'success' : 'danger'}>
          {u.status === 'active' ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'lastLogin',
      header: 'Last Login',
      sortable: true,
      render: u =>
        u.lastLogin
          ? new Date(u.lastLogin).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : '—',
    },
    {
      key: 'actions',
      header: '',
      className: 'w-12',
      render: u => (
        <Dropdown
          trigger={
            <button className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors">
              <MoreVertical className="h-4 w-4 text-slate-500" />
            </button>
          }
          items={[
            {
              label: 'View',
              icon: <Eye className="h-4 w-4" />,
              onClick: () => setViewingUser(u),
            },
            {
              label: 'Edit',
              icon: <Edit className="h-4 w-4" />,
              onClick: () => {
                setEditingUser(u);
                setModalOpen(true);
              },
            },
            {
              label: u.status === 'active' ? 'Deactivate' : 'Activate',
              icon: u.status === 'active' ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />,
              onClick: () => handleToggleStatus(u.id),
            },
            {
              label: 'Delete',
              icon: <Trash2 className="h-4 w-4" />,
              danger: true,
              onClick: () => setDeleteTarget(u),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Users</h1>

      <DataToolbar
        search={
          <SearchBox
            value={search}
            onChange={v => {
              setSearch(v);
              setCurrentPage(1);
            }}
            placeholder="Search users..."
          />
        }
        filters={
          <Select
            options={[{ value: '', label: 'All Status' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]}
            value={filterValues.status || ''}
            onChange={e => { setFilterValues(prev => ({ ...prev, status: e.target.value })); setCurrentPage(1); }}
            placeholder="All Status"
            className="w-40"
          />
        }
        actions={
          <Button
            onClick={() => {
              setEditingUser(null);
              setModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Add User
          </Button>
        }
      />

      <div className="flex justify-end">
        <ViewToggle value={viewMode} onChange={setViewMode} />
      </div>

      {viewMode === 'table' ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
          <Table
            columns={columns}
            data={paginated}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={handleSort}
            emptyMessage="No users found"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginated.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400">No users found</div>
          ) : (
            paginated.map(u => (
              <div key={u.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar src={u.avatar} name={u.name} size="sm" />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{u.name}</p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </div>
                  </div>
                  <Badge variant={u.status === 'active' ? 'success' : 'danger'}>{u.status === 'active' ? 'Active' : 'Inactive'}</Badge>
                </div>
                <div className="flex flex-wrap gap-1">
                  {u.roles.length === 0 ? <span className="text-slate-400 text-xs">No roles</span> : u.roles.map(r => <Badge key={r} variant="info">{r}</Badge>)}
                </div>
                <p className="text-xs text-slate-500">{u.projectCount} projects</p>
              </div>
            ))
          )}
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      <UserFormModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingUser(null);
        }}
        user={editingUser}
        onSave={handleSave}
      />

      <Modal isOpen={!!viewingUser} onClose={() => setViewingUser(null)} title="User Details">
        {viewingUser && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar src={viewingUser.avatar} name={viewingUser.name} size="lg" className="h-16 w-16 text-lg" />
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{viewingUser.name}</h3>
                <p className="text-sm text-slate-500">{viewingUser.email}</p>
                <Badge variant={viewingUser.status === 'active' ? 'success' : 'danger'} className="mt-1">
                  {viewingUser.status === 'active' ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Projects</span>
                <p className="font-medium text-slate-900 dark:text-white">{getUserProjects(viewingUser.id).map(p => p.name).join(', ') || 'None'}</p>
              </div>
              <div>
                <span className="text-slate-500">Roles</span>
                <p className="font-medium text-slate-900 dark:text-white">{getUserRoles(viewingUser.id).join(', ') || 'None'}</p>
              </div>
              <div>
                <span className="text-slate-500">Created</span>
                <p className="font-medium text-slate-900 dark:text-white">{new Date(viewingUser.createdAt).toLocaleDateString()}</p>
              </div>
              {viewingUser.lastLogin && (
                <div>
                  <span className="text-slate-500">Last Login</span>
                  <p className="font-medium text-slate-900 dark:text-white">{new Date(viewingUser.lastLogin).toLocaleString()}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setViewingUser(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteLoading}
      />
    </div>
  );
}

