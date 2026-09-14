import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { api } from '../lib/api';
import type { Category, Paginated, StudySetSummary, User } from '../types';

const tabClass = ({ isActive }: { isActive: boolean }): string =>
  `px-3 py-2 rounded-md text-sm font-medium ${
    isActive ? 'bg-teal-700 text-white' : 'hover:bg-teal-50 text-slate-700'
  }`;

export function AdminLayout() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin</h1>
        <p className="text-slate-500 mt-1">Quản lý người dùng, bộ thẻ và danh mục.</p>
      </div>
      <nav className="flex flex-wrap gap-2">
        <NavLink to="/admin" end className={tabClass}>
          Tổng quan
        </NavLink>
        <NavLink to="/admin/users" className={tabClass}>
          Users
        </NavLink>
        <NavLink to="/admin/study-sets" className={tabClass}>
          Study Sets
        </NavLink>
        <NavLink to="/admin/categories" className={tabClass}>
          Categories
        </NavLink>
      </nav>
      <Outlet />
    </div>
  );
}

export function AdminHomePage() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Link
        to="/admin/users"
        className="rounded-xl border border-slate-200 bg-white p-5 hover:border-teal-300"
      >
        <h2 className="font-semibold">Users</h2>
        <p className="text-sm text-slate-500 mt-1">Block / unblock tài khoản</p>
      </Link>
      <Link
        to="/admin/study-sets"
        className="rounded-xl border border-slate-200 bg-white p-5 hover:border-teal-300"
      >
        <h2 className="font-semibold">Study Sets</h2>
        <p className="text-sm text-slate-500 mt-1">Xem và xóa bộ thẻ</p>
      </Link>
      <Link
        to="/admin/categories"
        className="rounded-xl border border-slate-200 bg-white p-5 hover:border-teal-300"
      >
        <h2 className="font-semibold">Categories</h2>
        <p className="text-sm text-slate-500 mt-1">CRUD danh mục</p>
      </Link>
    </div>
  );
}

interface AdminUserRow extends User {
  readonly isBlocked: boolean;
  readonly _count: { readonly studySets: number };
}

export function AdminUsersPage() {
  const [items, setItems] = useState<AdminUserRow[]>([]);
  const [q, setQ] = useState('');
  const [error, setError] = useState('');

  async function load(search = q): Promise<void> {
    try {
      const { data } = await api.get<Paginated<AdminUserRow>>('/admin/users', {
        params: search ? { q: search } : undefined,
      });
      setItems(data.items);
    } catch {
      setError('Không tải được danh sách user.');
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggleBlock(user: AdminUserRow): Promise<void> {
    await api.patch(`/admin/users/${user.id}/block`, {
      isBlocked: !user.isBlocked,
    });
    await load();
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          void load();
        }}
        className="flex gap-2"
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm email / tên..."
          className="rounded-lg border border-slate-300 px-3 py-2 flex-1"
        />
        <button
          type="submit"
          className="rounded-lg bg-teal-600 px-4 py-2 text-white"
        >
          Tìm
        </button>
      </form>
      {error ? <p className="text-red-600">{error}</p> : null}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Sets</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {items.map((user) => (
              <tr key={user.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <div className="font-medium">{user.displayName}</div>
                  <div className="text-slate-500">{user.email}</div>
                </td>
                <td className="px-4 py-3">{user.role}</td>
                <td className="px-4 py-3">{user._count.studySets}</td>
                <td className="px-4 py-3">
                  {user.isBlocked ? 'Blocked' : 'Active'}
                </td>
                <td className="px-4 py-3 text-right">
                  {user.role !== 'ADMIN' ? (
                    <button
                      type="button"
                      onClick={() => void toggleBlock(user)}
                      className="text-teal-700 font-medium"
                    >
                      {user.isBlocked ? 'Unblock' : 'Block'}
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface AdminStudySetRow extends StudySetSummary {
  readonly owner: {
    readonly id: string;
    readonly displayName: string;
    readonly email: string;
  };
}

export function AdminStudySetsPage() {
  const [items, setItems] = useState<AdminStudySetRow[]>([]);
  const [q, setQ] = useState('');

  async function load(search = q): Promise<void> {
    const { data } = await api.get<Paginated<AdminStudySetRow>>(
      '/admin/study-sets',
      { params: search ? { q: search } : undefined },
    );
    setItems(data.items);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onDelete(id: string): Promise<void> {
    if (!window.confirm('Xóa Study Set này?')) {
      return;
    }
    await api.delete(`/admin/study-sets/${id}`);
    await load();
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          void load();
        }}
        className="flex gap-2"
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm theo tiêu đề..."
          className="rounded-lg border border-slate-300 px-3 py-2 flex-1"
        />
        <button
          type="submit"
          className="rounded-lg bg-teal-600 px-4 py-2 text-white"
        >
          Tìm
        </button>
      </form>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Cards</th>
              <th className="px-4 py-3">Visibility</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {items.map((set) => (
              <tr key={set.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <Link
                    to={`/study-sets/${set.id}`}
                    className="font-medium text-teal-700"
                  >
                    {set.title}
                  </Link>
                </td>
                <td className="px-4 py-3">{set.owner.email}</td>
                <td className="px-4 py-3">{set._count.flashcards}</td>
                <td className="px-4 py-3">
                  {set.isPublic ? 'Public' : 'Private'}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => void onDelete(set.id)}
                    className="text-red-600 font-medium"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminCategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  async function load(): Promise<void> {
    const { data } = await api.get<Category[]>('/categories');
    setItems(data);
  }

  useEffect(() => {
    void load();
  }, []);

  async function onCreate(event: FormEvent): Promise<void> {
    event.preventDefault();
    await api.post('/categories', { name });
    setName('');
    await load();
  }

  async function onUpdate(id: string): Promise<void> {
    await api.put(`/categories/${id}`, { name: editName });
    setEditingId(null);
    await load();
  }

  async function onDelete(id: string): Promise<void> {
    if (!window.confirm('Xóa danh mục này?')) {
      return;
    }
    await api.delete(`/categories/${id}`);
    await load();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onCreate} className="flex gap-2">
        <input
          required
          minLength={2}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tên danh mục mới"
          className="rounded-lg border border-slate-300 px-3 py-2 flex-1"
        />
        <button
          type="submit"
          className="rounded-lg bg-teal-600 px-4 py-2 text-white"
        >
          Thêm
        </button>
      </form>
      <ul className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
        {items.map((category) => (
          <li
            key={category.id}
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
          >
            {editingId === category.id ? (
              <div className="flex flex-1 gap-2">
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 flex-1"
                />
                <button
                  type="button"
                  onClick={() => void onUpdate(category.id)}
                  className="text-teal-700 font-medium"
                >
                  Lưu
                </button>
              </div>
            ) : (
              <div>
                <p className="font-medium">{category.name}</p>
                <p className="text-xs text-slate-500">
                  {category.slug}
                  {category._count
                    ? ` · ${category._count.studySets} sets`
                    : ''}
                </p>
              </div>
            )}
            <div className="flex gap-3 text-sm">
              <button
                type="button"
                onClick={() => {
                  setEditingId(category.id);
                  setEditName(category.name);
                }}
                className="text-slate-600"
              >
                Sửa
              </button>
              <button
                type="button"
                onClick={() => void onDelete(category.id)}
                className="text-red-600"
              >
                Xóa
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
