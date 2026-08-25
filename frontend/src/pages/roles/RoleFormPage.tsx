import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Checkbox } from '../../components/common/Checkbox';
import { roleService, permissionService } from '../../services/roleService';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../api/apiClient';

interface PermissionGroup {
  label: string;
  permissions: { id: string; label: string }[];
}

export default function RoleFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const { success: showSuccess, error: showError } = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [availablePerms, setAvailablePerms] = useState<{ id: string; label: string; group: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    permissionService.list().then(res => {
      const list = res.data.data || res.data || [];
      setAvailablePerms(list.map((p: any) => ({ id: p.name, label: p.name, group: p.group_name || 'General' })));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (isEditing && id) {
      roleService.list().then(res => {
        const list = res.data.data || res.data || [];
        const existingRole = list.find((r: any) => r.id === id);
        if (existingRole) {
          setName(existingRole.name);
          setDescription(existingRole.description ?? '');
          setSelectedPermissions(new Set(existingRole.permissions ?? []));
        }
      }).catch(e => showError(getErrorMessage(e)));
    }
  }, [id, isEditing]);

  const permissionGroups = useMemo(() => {
    const groups: Record<string, { id: string; label: string }[]> = {};
    for (const p of availablePerms) {
      if (!groups[p.group]) groups[p.group] = [];
      groups[p.group].push({ id: p.id, label: p.label });
    }
    return Object.entries(groups).map(([label, permissions]) => ({ label, permissions }));
  }, [availablePerms]);

  const groupStates = useMemo(() => {
    return permissionGroups.map(group => {
      const allSelected = group.permissions.every(p => selectedPermissions.has(p.id));
      const someSelected = group.permissions.some(p => selectedPermissions.has(p.id));
      return { allSelected, someSelected };
    });
  }, [permissionGroups, selectedPermissions]);

  const togglePermission = (id: string) => {
    setSelectedPermissions(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleGroup = (groupIndex: number) => {
    const group = permissionGroups[groupIndex];
    const allSelected = group.permissions.every(p => selectedPermissions.has(p.id));
    setSelectedPermissions(prev => {
      const next = new Set(prev);
      group.permissions.forEach(p => {
        if (allSelected) next.delete(p.id);
        else next.add(p.id);
      });
      return next;
    });
  };

  const handleSave = async () => {
    if (!name.trim()) { showError('Role name is required'); return; }
    setLoading(true);
    try {
      const roleData = {
        name: name.trim(),
        description: description.trim() || undefined,
        permissions: Array.from(selectedPermissions),
      };
      const res = isEditing && id
        ? await roleService.update(id, roleData)
        : await roleService.create(roleData);
      showSuccess((res.data as any)?.message || (isEditing ? 'Role updated successfully' : 'Role created successfully'));
      navigate('/roles');
    } catch (err: any) {
      showError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
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
          {availablePerms.length === 0 ? <p className="text-sm text-slate-400">Loading permissions...</p> : null}
          {permissionGroups.map((group, gi) => (
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
                  <div onClick={() => toggleGroup(gi)} className="w-5 h-5 rounded border-2 border-slate-300 dark:border-slate-600 transition-colors duration-200 cursor-pointer peer-checked:bg-primary-500 peer-checked:border-primary-500 peer-focus:ring-2 peer-focus:ring-primary-500">
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

