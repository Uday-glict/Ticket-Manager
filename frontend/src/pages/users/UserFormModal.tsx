import { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';
import { Avatar } from '../../components/common/Avatar';
import { roleService } from '../../services/roleService';
import type { User, Role } from '../../types';
import { mapRole } from '../../utils/mappers';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSave: (data: Partial<User> & { roleId?: string; avatarFile?: File | null; password?: string }) => void;
}

export default function UserFormModal({ isOpen, onClose, user, onSave }: UserFormModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [roles, setRoles] = useState<Role[]>([]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const isEdit = !!user;

  useEffect(() => {
    if (isOpen) {
      roleService.list()
        .then(res => setRoles((res.data.data || res.data || []).map(mapRole)))
        .catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setStatus(user.status);
      setAvatarPreview(user.avatar || null);
      setAvatarFile(null);
    } else {
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setPasswordError('');
      setShowPassword(false);
      setShowConfirmPassword(false);
      setStatus('active');
      setSelectedRoleId('');
      setAvatarFile(null);
      setAvatarPreview(null);
    }
  }, [user, isOpen]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (avatarPreview && avatarPreview.startsWith('blob:')) URL.revokeObjectURL(avatarPreview);
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
    if (!isEdit && password !== confirmPassword) { setPasswordError('Passwords do not match'); return; }
    setPasswordError('');
    onSave({
      name,
      email,
      password: !isEdit ? password : undefined,
      status,
      roleId: selectedRoleId || undefined,
      avatarFile,
    });
  };

  const roleOptions = roles.map(r => ({ value: r.id, label: r.name }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit User' : 'Add User'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar src={avatarPreview || user?.avatar} name={name || 'New User'} size="lg" className="h-16 w-16 text-lg" />
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Avatar</label>
            <input type="file" accept="image/*" onChange={handleAvatarChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer" />
            <p className="text-xs text-slate-400 mt-1">All image formats supported (JPG, PNG, GIF, WEBP, BMP, SVG, TIFF, AVIF, HEIC, ICO) up to 5MB</p>
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
            <div className="w-full">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password<span className="text-red-500 ml-1">*</span></label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setPasswordError(''); }}
                  placeholder="Enter password"
                  className="w-full px-3 py-2 pr-10 rounded-lg border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-slate-300 dark:border-slate-600"
                  required
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500" tabIndex={-1} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordError && <p className="mt-1 text-sm text-red-500">{passwordError}</p>}
            </div>
          )}
          {!isEdit && (
            <div className="w-full">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Confirm Password<span className="text-red-500 ml-1">*</span></label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); setPasswordError(''); }}
                  placeholder="Confirm password"
                  className="w-full px-3 py-2 pr-10 rounded-lg border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-slate-300 dark:border-slate-600"
                  required
                />
                <button type="button" onClick={() => setShowConfirmPassword(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500" tabIndex={-1} aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}>
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
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
            Role Assignment
          </h3>
          <p className="text-xs text-slate-500">Select a role to grant the user the associated permissions. The user will see only modules allowed by this role after login.</p>
          <Select
            label="Role"
            value={selectedRoleId}
            onChange={e => setSelectedRoleId(e.target.value)}
            options={roleOptions}
            placeholder="Select a role for this user"
          />
          {roles.length === 0 && <p className="text-xs text-amber-600">No roles found. Create a role first in Role Management.</p>}
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

