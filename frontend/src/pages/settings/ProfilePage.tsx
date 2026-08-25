import { useState, useEffect } from 'react';
import { User as UserIcon, Save, Eye, EyeOff } from 'lucide-react';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Avatar } from '../../components/common/Avatar';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { userService } from '../../services/userService';
import { getErrorMessage } from '../../api/apiClient';

export default function ProfilePage() {
  const { user } = useAuth();
  const { success: showSuccess, error: showError } = useToast();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');

  useEffect(() => {
    if (user) { setName(user.name); setEmail(user.email); }
  }, [user?.id]);

  if (!user) return null;

  const handleSaveProfile = async () => {
    if (!name.trim()) { showError('Name is required'); return; }
    setSaving(true);
    try {
      const res = await userService.update(user.id, { name: name.trim(), email: email.trim() });
      showSuccess((res.data as any)?.message || 'Profile updated successfully.');
    } catch (err: any) {
      showError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPwError('');
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwError('All password fields are required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setPwError('New password must be at least 8 characters.');
      return;
    }
    setPwSaving(true);
    try {
      const res = await userService.update(user.id, { password: newPassword } as any);
      showSuccess((res.data as any)?.message || 'Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const msg = getErrorMessage(err);
      setPwError(msg);
      showError(msg);
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Profile</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Profile Section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-5">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <UserIcon className="h-5 w-5" />
          Profile Information
        </h2>

        <div className="flex items-center gap-5">
          <Avatar src={user.avatar} name={user.name} size="lg" className="h-20 w-20 text-2xl" />
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">{user.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">ID: {user.id}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your full name"
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSaveProfile} loading={saving} className="cursor-pointer">
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Change Password Section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-5">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Change Password</h2>

        {pwError && (
          <div className="px-4 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
            {pwError}
          </div>
        )}

        <div className="space-y-4 max-w-sm">
          <div className="w-full">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Current Password</label>
            <div className="relative">
              <input type={showCurrentPw ? 'text' : 'password'} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Enter current password" className="w-full px-3 py-2 pr-10 rounded-lg border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 border-slate-300 dark:border-slate-600" />
              <button type="button" onClick={() => setShowCurrentPw(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500" tabIndex={-1}>{showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
            </div>
          </div>
          <div className="w-full">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">New Password</label>
            <div className="relative">
              <input type={showNewPw ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Enter new password" className="w-full px-3 py-2 pr-10 rounded-lg border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 border-slate-300 dark:border-slate-600" />
              <button type="button" onClick={() => setShowNewPw(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500" tabIndex={-1}>{showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
            </div>
          </div>
          <div className="w-full">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Confirm New Password</label>
            <div className="relative">
              <input type={showConfirmPw ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm new password" className="w-full px-3 py-2 pr-10 rounded-lg border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 border-slate-300 dark:border-slate-600" />
              <button type="button" onClick={() => setShowConfirmPw(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500" tabIndex={-1}>{showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleChangePassword} loading={pwSaving} variant="outline" className="cursor-pointer">
            Update Password
          </Button>
        </div>
      </div>
    </div>
  );
}

