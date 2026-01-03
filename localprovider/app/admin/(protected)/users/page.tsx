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
    method: 'PATCH'
  });
  loadUsers();
}

  async function changeRole(id: string, role: User['role']) {
    await adminFetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ role })
    });
    loadUsers();
  }

  async function resetPassword(id: string) {
    const newPassword = prompt('Enter new password');
    if (!newPassword) return;

   await adminFetch(`/api/admin/users/${id}/reset-password`, {
  method: 'PATCH',
  body: { newPassword }
});
    alert('Password reset successfully');
  }

  if (loading) return <div>Loading users...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Users</h1>

      <table className="w-full bg-white rounded shadow">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="p-3">Name</th>
            <th className="p-3">Email</th>
            <th className="p-3">Role</th>
            <th className="p-3">Status</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>

        <tbody>
          {users.map(user => (
            <tr key={user._id} className="border-t">
              <td className="p-3">{user.name}</td>
              <td className="p-3">{user.email}</td>

              <td className="p-3">
                   <td className="p-3">{user.role}</td>
                
              </td>

              <td className="p-3">
                <span
                  className={
                    user.isActive
                      ? 'text-green-600'
                      : 'text-red-600'
                  }
                >
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>

              <td className="p-3 space-x-2">
                <button
                  onClick={() => toggleStatus(user._id)}
                  className="text-sm text-blue-600"
                >
                  {user.isActive ? 'Deactivate' : 'Activate'}
                </button>

                <button
                  onClick={() => resetPassword(user._id)}
                  className="text-sm text-orange-600"
                >
                  Reset Password
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
