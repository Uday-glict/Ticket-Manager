import { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { MultiSelect } from '../../components/common/MultiSelect';
import { Button } from '../../components/common/Button';
import { mockProjects, mockRoles } from '../../utils/mockData';
import type { User } from '../../types';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSave: (data: Partial<User> & { projectRoles?: Record<string, string> }) => void;
}

export default function UserFormModal({ isOpen, onClose, user, onSave }: UserFormModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [projectRoles, setProjectRoles] = useState<Record<string, string>>({});

  const isEdit = !!user;

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setStatus(user.status);
      const userProjects = mockProjects
        .filter(p => p.members.some(m => m.userId === user.id))
        .map(p => p.id);
      setSelectedProjects(userProjects);
      const roles: Record<string, string> = {};
      mockProjects.forEach(p => {
        const member = p.members.find(m => m.userId === user.id);
        if (member) {
          roles[p.id] = member.roleId;
        }
      });
      setProjectRoles(roles);
    } else {
      setName('');
      setEmail('');
      setPassword('');
      setStatus('active');
      setSelectedProjects([]);
      setProjectRoles({});
    }
  }, [user, isOpen]);

  const handleProjectToggle = (projectIds: string[]) => {
    setSelectedProjects(projectIds);
    const newRoles = { ...projectRoles };
    Object.keys(newRoles).forEach(k => {
      if (!projectIds.includes(k)) delete newRoles[k];
    });
    projectIds.forEach(id => {
      if (!newRoles[id]) newRoles[id] = mockRoles[0]?.id ?? '';
    });
    setProjectRoles(newRoles);
  };

  const handleRoleChange = (projectId: string, roleId: string) => {
    setProjectRoles(prev => ({ ...prev, [projectId]: roleId }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      email,
      status,
      projectRoles,
    });
  };

  const projectOptions = mockProjects
    .filter(p => p.status === 'active')
    .map(p => ({ value: p.id, label: p.name }));

  const roleOptions = mockRoles.map(r => ({ value: r.id, label: r.name }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit User' : 'Add User'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
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
              { value: 'inactive', label: 'Inactive' />
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
                  const project = mockProjects.find(p => p.id === projId);
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
