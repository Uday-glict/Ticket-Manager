import { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { MultiSelect } from '../../components/common/MultiSelect';
import { Button } from '../../components/common/Button';
import { Avatar } from '../../components/common/Avatar';
import { projectService } from '../../services/projectService';
import { roleService } from '../../services/roleService';
import type { User, Project, Role } from '../../types';
import { mapProject, mapRole } from '../../utils/mappers';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSave: (data: Partial<User> & { projectRoles?: Record<string, string>; avatarFile?: File | null; password?: string }) => void;
}

export default function UserFormModal({ isOpen, onClose, user, onSave }: UserFormModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [projectRoles, setProjectRoles] = useState<Record<string, string>>({});
  const [projects, setProjects] = useState<Project[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const isEdit = !!user;

  useEffect(() => {
    if (isOpen) {
      Promise.all([
        projectService.list(),
        roleService.list(),
      ]).then(([projectsRes, rolesRes]) => {
        setProjects((projectsRes.data.data || projectsRes.data || []).map(mapProject));
        setRoles((rolesRes.data.data || rolesRes.data || []).map(mapRole));
      }).catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setStatus(user.status);
      setAvatarPreview(user.avatar || null);
      setAvatarFile(null);
      const userProjects = projects
        .filter(p => p.members.some(m => m.userId === user.id))
        .map(p => p.id);
      setSelectedProjects(userProjects);
      const roleMap: Record<string, string> = {};
      projects.forEach(p => {
        const member = p.members.find(m => m.userId === user.id);
        if (member) {
          roleMap[p.id] = member.roleId;
        }
      });
      setProjectRoles(roleMap);
    } else {
      setName('');
      setEmail('');
      setPassword('');
      setStatus('active');
      setSelectedProjects([]);
      setProjectRoles({});
      setAvatarFile(null);
      setAvatarPreview(null);
    }
  }, [user, isOpen, projects]);

  const handleProjectToggle = (projectIds: string[]) => {
    setSelectedProjects(projectIds);
    const newRoles = { ...projectRoles };
    Object.keys(newRoles).forEach(k => {
      if (!projectIds.includes(k)) delete newRoles[k];
    });
    projectIds.forEach(id => {
      if (!newRoles[id]) newRoles[id] = roles[0]?.id ?? '';
    });
    setProjectRoles(newRoles);
  };

  const handleRoleChange = (projectId: string, roleId: string) => {
    setProjectRoles(prev => ({ ...prev, [projectId]: roleId }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setAvatarFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarPreview(url);
    } else {
      setAvatarPreview(user?.avatar || null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      email,
      password: !isEdit ? password : undefined,
      status,
      projectRoles,
      avatarFile,
    });
  };

  const projectOptions = projects
    .filter(p => p.status === 'active')
    .map(p => ({ value: p.id, label: p.name }));

  const roleOptions = roles.map(r => ({ value: r.id, label: r.name }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit User' : 'Add User'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar src={avatarPreview || user?.avatar} name={name || 'New User'} size="lg" className="h-16 w-16 text-lg" />
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Avatar</label>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer" />
            <p className="text-xs text-slate-400 mt-1">JPG, PNG, WEBP up to 5MB</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            placeholder="Enter full name"
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="Enter email address"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {!isEdit && (
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="Enter password"
            />
          )}
          <Select
            label="Status"
            value={status}
            onChange={e => setStatus(e.target.value as 'active' | 'inactive')}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Project Assignment
          </h3>
          <MultiSelect
            options={projectOptions}
            value={selectedProjects}
            onChange={handleProjectToggle}
            placeholder="Select projects..."
          />

          {selectedProjects.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Role per Project
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedProjects.map(projId => {
                  const project = projects.find(p => p.id === projId);
                  return (
                    <Select
                      key={projId}
                      label={project?.name ?? projId}
                      value={projectRoles[projId] ?? ''}
                      onChange={e => handleRoleChange(projId, e.target.value)}
                      options={roleOptions}
                      placeholder="Select role"
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {isEdit ? 'Save Changes' : 'Add User'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

