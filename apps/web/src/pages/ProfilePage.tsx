import type { FormEvent } from 'react';
import { useState } from 'react';
import axios from 'axios';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { User } from '../types';

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) {
      return message.join(', ');
    }
    if (typeof message === 'string') {
      return message;
    }
  }
  return 'Không cập nhật được hồ sơ.';
}

function getPasswordErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) {
      return message.join(', ');
    }
    if (typeof message === 'string') {
      return message;
    }
  }
  return 'Không đổi được mật khẩu.';
}

export function ProfilePage() {
  const { user, setUser } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? '');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  if (!user) {
    return null;
  }

  async function onSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const { data } = await api.put<User>('/users/me', {
        displayName,
        avatarUrl: avatarUrl.trim() || null,
      });
      setUser(data);
      setMessage('Đã cập nhật hồ sơ.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function onChangePassword(event: FormEvent): Promise<void> {
    event.preventDefault();
    setPasswordError('');
    setPasswordMessage('');
    if (newPassword !== confirmPassword) {
      setPasswordError('Xác nhận mật khẩu mới không khớp.');
      return;
    }
    setChangingPassword(true);
    try {
      await api.put('/users/me/password', {
        currentPassword,
        newPassword,
      });
      setPasswordMessage('Đã đổi mật khẩu thành công.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(getPasswordErrorMessage(err));
    } finally {
      setChangingPassword(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Hồ sơ</h1>
        <p className="text-slate-500 mt-1">{user.email}</p>
      </div>
      <form
        onSubmit={onSubmit}
        className="rounded-xl border border-slate-200 bg-white p-6 space-y-4"
      >
        <label className="block space-y-1">
          <span className="text-sm font-medium">Tên hiển thị</span>
          <input
            required
            minLength={2}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Avatar URL</span>
          <input
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Avatar preview"
            className="h-16 w-16 rounded-full object-cover border border-slate-200"
          />
        ) : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message ? <p className="text-sm text-teal-700">{message}</p> : null}
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-teal-600 px-4 py-2 text-white font-medium hover:bg-teal-700 disabled:opacity-60"
        >
          {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </form>

      <form
        onSubmit={onChangePassword}
        className="rounded-xl border border-slate-200 bg-white p-6 space-y-4"
      >
        <h2 className="text-lg font-semibold">Đổi mật khẩu</h2>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Mật khẩu hiện tại</span>
          <input
            required
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Mật khẩu mới</span>
          <input
            required
            type="password"
            minLength={6}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Xác nhận mật khẩu mới</span>
          <input
            required
            type="password"
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        {passwordError ? (
          <p className="text-sm text-red-600">{passwordError}</p>
        ) : null}
        {passwordMessage ? (
          <p className="text-sm text-teal-700">{passwordMessage}</p>
        ) : null}
        <button
          type="submit"
          disabled={changingPassword}
          className="rounded-lg bg-teal-600 px-4 py-2 text-white font-medium hover:bg-teal-700 disabled:opacity-60"
        >
          {changingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}
        </button>
      </form>
    </div>
  );
}
