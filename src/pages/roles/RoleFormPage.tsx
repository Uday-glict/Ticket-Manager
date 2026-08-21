import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Checkbox } from '../../components/common/Checkbox';
import { mockRoles } from '../../utils/mockData';
import { PERMISSIONS } from '../../constants/permissions';

type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

interface PermissionGroup {
  label: string;
  permissions: { id: PermissionKey; label: string }[];
}

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    label: 'Project Management',
    permissions: [
      { id: PERMISSIONS.VIEW_PROJECT, label: 'View' },
      { id: PERMISSIONS.CREATE_PROJECT, label: 'Create' },
      { id: PERMISSIONS.UPDATE_PROJECT, label: 'Update' },
      { id: PERMISSIONS.DELETE_PROJECT, label: 'Delete' },
    ],
  },
  {
    label: 'Task Management',
    permissions: [
      { id: PERMISSIONS.VIEW_TASK, label: 'View' },
      { id: PERMISSIONS.CREATE_TASK, label: 'Create' },
      { id: PERMISSIONS.ASSIGN_TASK, label: 'Assign' },
      { id: PERMISSIONS.REASSIGN_TASK, label: 'Reassign' },
      { id: PERMISSIONS.UPDATE_TASK, label: 'Update' },
      { id: PERMISSIONS.DELETE_TASK, label: 'Delete' },
    ],
  },
  {
    label: 'Board',
    permissions: [
      { id: PERMISSIONS.VIEW_BOARD, label: 'View' },
      { id: PERMISSIONS.MOVE_TASK, label: 'Move Task' },
    ],
  },
  {
    label: 'Comments',
    permissions: [
      { id: PERMISSIONS.ADD_COMMENT, label: 'Add' },
      { id: PERMISSIONS.REPLY_COMMENT, label: 'Reply' },
    ],
  },
  {
    label: 'User Management',
    permissions: [
      { id: PERMISSIONS.MANAGE_USERS, label: 'Manage Users' },
    ],
  },
  {
    label: 'Role Management',
    permissions: [
      { id: PERMISSIONS.MANAGE_ROLES, label: 'Manage Roles' },
    ],
  },
  {
    label: 'Settings',
    permissions: [
      { id: PERMISSIONS.VIEW_AUDIT_LOG, label: 'View Audit Log' },
      { id: PERMISSIONS.MANAGE_SETTINGS, label: 'Manage Settings' },
    ],
  },
];

export default function RoleFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  const existingRole = isEditing ? mockRoles.find(r => r.id === id) : undefined;

  const [name, setName] = useState(existingRole?.name ?? '');
  const [description, setDescription] = useState(existingRole?.description ?? '');
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set(existingRole?.permissions ?? [])
  );

  const groupStates = useMemo(() => {
    return PERMISSION_GROUPS.map(group => {
      const allSelected = group.permissions.every(p => selectedPermissions.has(p.id));
      const someSelected = group.permissions.some(p => selectedPermissions.has(p.id));
      return { allSelected, someSelected };
    });
  }, [selectedPermissions]);

  const togglePermission = (id: string) => {
    setSelectedPermissions(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleGroup = (groupIndex: number) => {
    const group = PERMISSION_GROUPS[groupIndex];
    const allSelected = group.permissions.every(p => selectedPermissions.has(p.id));
    setSelectedPermissions(prev => {
      const next = new Set(prev);
      group.permissions.forEach(p => {
        if (allSelected) {
          next.delete(p.id);
        } else {
          next.add(p.id);
        }
      });
      return next;
    });
  };

  const handleSave = () => {
    if (!name.trim()) return;

    const roleData = {
      id: isEditing ? id! : `role-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || undefined,
      permissions: Array.from(selectedPermissions),
      isSystem: existingRole?.isSystem ?? false,
      createdAt: existingRole?.createdAt ?? new Date().toISOString(),
    };

    if (isEditing) {
      const idx = mockRoles.findIndex(r => r.id === id);
      if (idx !== -1) mockRoles[idx] = roleData;
    } else {
      mockRoles.push(roleData);
    }

    navigate('/roles');
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/roles')}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600 dark:text-slate-400" />
        </button>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {isEditing ? 'Edit Role' : 'Create Role'}
        </h1>
      </div>

      <div className="space-y-4">
        <Input
          label="Role Name"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Team Lead"
          required
        />
        <Input
          label="Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Brief description of this role"
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Permissions</h2>

        <div className="space-y-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          {PERMISSION_GROUPS.map((group, gi) => (
            <div key={group.label} className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={groupStates[gi].allSelected}
                    ref={el => {
                      if (el) el.indeterminate = groupStates[gi].someSelected && !groupStates[gi].allSelected;
                    }}
                    onChange={() => toggleGroup(gi)}
                    className="peer sr-only"
                  />
                  <div className="w-5 h-5 rounded border-2 border-slate-300 dark:border-slate-600 transition-colors duration-200 cursor-pointer peer-checked:bg-primary-500 peer-checked:border-primary-500 peer-focus:ring-2 peer-focus:ring-primary-500">
                    {(groupStates[gi].allSelected || groupStates[gi].someSelected) && (
                      <svg className="h-3.5 w-3.5 text-white absolute top-0.5 left-0.5" viewBox="0 0 14 14" fill="none">
                        {groupStates[gi].allSelected ? (
                          <path d="M3 7l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        ) : (
                          <rect x="3" y="6" width="8" height="2" rx="1" fill="currentColor" />
                        )}
                      </svg>
                    )}
                  </div>
                </div>
                <label
                  onClick={() => toggleGroup(gi)}
                  className="text-sm font-semibold text-slate-900 dark:text-slate-100 cursor-pointer select-none"
                >
                  {group.label}
                </label>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pl-8">
                {group.permissions.map(p => (
                  <Checkbox
                    key={p.id}
                    label={p.label}
                    checked={selectedPermissions.has(p.id)}
                    onChange={() => togglePermission(p.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={!name.trim()}>
          <Save className="h-4 w-4" />
          {isEditing ? 'Save Changes' : 'Create Role'}
        </Button>
      </div>
    </div>
  );
}
