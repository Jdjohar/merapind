'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '@/app/lib/admin-fetch';

type User = {
  _id: string;
  name: string;
  email: string;
  role: 'USER' | 'PROVIDER';
  isActive: boolean;
  createdAt: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadUsers() {
    const data = await adminFetch('/api/admin/users');
    setUsers(data);
  }

  useEffect(() => {
    loadUsers()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function toggleStatus(id: string) {
    await adminFetch(`/api/admin/users/${id}/toggle`, {
      method: 'PATCH',
    });
    loadUsers();
  }

  async function resetPassword(id: string) {
    const newPassword = prompt('Enter new password');
    if (!newPassword) return;

    await adminFetch(`/api/admin/users/${id}/reset-password`, {
      method: 'PATCH',
      body: JSON.stringify({ newPassword }),
    });

    alert('Password reset successfully');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex flex-col sm:flex-row  justify-between gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <h1 className="text-xl font-bold  text-slate-800">User Management</h1>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                  User
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Role
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr
                  key={user._id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  {/* User */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={`https://picsum.photos/seed/${user._id}/40/40`}
                        className="w-10 h-10 rounded-full border"
                        alt=""
                      />
                      <div>
                        <div className="text-sm font-bold text-slate-900">
                          {user.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-6 py-4">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${
                        user.role === 'PROVIDER'
                          ? 'bg-indigo-50 text-indigo-600'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          user.isActive ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      />
                      <span className="text-xs font-medium text-slate-700">
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right space-x-3">
                    <button
                      onClick={() => toggleStatus(user._id)}
                      className="text-xs font-bold text-indigo-600 hover:underline"
                    >
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
 <span className="mx-2 text-slate-300">|</span>
                    <button
                      onClick={() => resetPassword(user._id)}
                      className="text-xs font-bold text-orange-600 hover:underline"
                    >
                      Reset Password
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
