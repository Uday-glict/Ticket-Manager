import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Lock } from 'lucide-react';
import { Table, type Column } from '../../components/common/Table';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { EmptyState } from '../../components/common/EmptyState';
import { SearchBox } from '../../components/common/SearchBox';
import { DataToolbar } from '../../components/common/DataToolbar';
import { ViewToggle, type ViewMode } from '../../components/common/ViewToggle';
import { roleService } from '../../services/roleService';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../api/apiClient';
import type { Role } from '../../types';
import { mapRole } from '../../utils/mappers';

export default function RoleListPage() {
  const navigate = useNavigate();
  const { success: showSuccess, error: showError } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  useEffect(() => {
    roleService.list().then(res => setRoles((res.data.data || res.data || []).map(mapRole))).catch(e => showError(getErrorMessage(e)));
  }, []);

  const handleDelete = async () => {
    if (deleteTarget) {
      try {
        const res = await roleService.delete(deleteTarget.id);
        setRoles(prev => prev.filter(r => r.id !== deleteTarget.id));
        showSuccess((res.data as any)?.message || 'Role deleted successfully');
      } catch (err: any) {
        showError(getErrorMessage(err));
      }
      setDeleteTarget(null);
    }
  };

  const columns: Column<Role>[] = [
    {
      key: 'name',
      header: 'Name',
      render: r => (
        <div className="flex items-center gap-2">
          {r.isSystem && <Lock className="h-4 w-4 text-slate-400" />}
          <span className="font-medium text-slate-900 dark:text-slate-100">{r.name}</span>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: r => (
        <span className="text-slate-600 dark:text-slate-400">{r.description || '—'}</span>
      ),
    },
    {
      key: 'permissionCount',
      header: 'Permissions',
      render: r => (
        <span className="text-slate-600 dark:text-slate-400">{r.permissions.length}</span>
      ),
    },
    {
      key: 'isSystem',
      header: 'Type',
      render: r => (
        <Badge variant={r.isSystem ? 'info' : 'default'}>
          {r.isSystem ? 'System' : 'Custom'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-24',
      render: r => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate(`/roles/${r.id}/edit`)}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            title="Edit"
          >
            <Edit className="h-4 w-4 text-slate-500" />
          </button>
          {!r.isSystem && (
            <button
              onClick={() => setDeleteTarget(r)}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              title="Delete"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const filtered = roles.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return r.name.toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Roles</h1>

      <DataToolbar
        search={<SearchBox value={search} onChange={setSearch} placeholder="Search roles..." />}
        actions={
          <Button onClick={() => navigate('/roles/create')}>
            <Plus className="h-4 w-4" />
            Create Role
          </Button>
        }
      />

      <div className="flex justify-end">
        <ViewToggle value={viewMode} onChange={setViewMode} />
      </div>

      {viewMode === 'table' ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
          {filtered.length === 0 ? (
            <EmptyState title="No roles found" description="Create your first role to get started." />
          ) : (
            <Table columns={columns} data={filtered} emptyMessage="No roles found" />
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400">No roles found</div>
          ) : (
            filtered.map(r => (
              <div key={r.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <span className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    {r.isSystem && <Lock className="h-4 w-4 text-slate-400" />}
                    {r.name}
                  </span>
                  <Badge variant={r.isSystem ? 'info' : 'default'}>{r.isSystem ? 'System' : 'Custom'}</Badge>
                </div>
                <p className="text-sm text-slate-500 line-clamp-2">{r.description || 'No description'}</p>
                <p className="text-xs text-slate-500">{r.permissions.length} permissions</p>
              </div>
            ))
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Role"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  );
}


