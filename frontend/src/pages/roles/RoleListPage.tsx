import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Lock } from 'lucide-react';
import { Table, type Column } from '../../components/common/Table';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { EmptyState } from '../../components/common/EmptyState';
import { roleService } from '../../services/roleService';
import type { Role } from '../../types';
import { mapRole } from '../../utils/mappers';

export default function RoleListPage() {
  const navigate = useNavigate();
  const [roles, setRoles] = useState<Role[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);

  useEffect(() => {
    roleService.list().then(res => setRoles((res.data.data || res.data || []).map(mapRole))).catch(() => {});
  }, []);

  const handleDelete = async () => {
    if (deleteTarget) {
      try {
        await roleService.delete(deleteTarget.id);
        setRoles(prev => prev.filter(r => r.id !== deleteTarget.id));
      } catch {}
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Roles</h1>
        <Button onClick={() => navigate('/roles/create')}>
          <Plus className="h-4 w-4" />
          Create Role
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
        {roles.length === 0 ? (
          <EmptyState title="No roles found" description="Create your first role to get started." />
        ) : (
          <Table columns={columns} data={roles} emptyMessage="No roles found" />
        )}
      </div>

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


