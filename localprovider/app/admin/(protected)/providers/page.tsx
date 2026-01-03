'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '@/app/lib/admin-fetch';

type Provider = {
  _id: string;
  name: string;
  category: string;
  hourlyRate: number;
  isVerified: boolean;
  isActive: boolean;
};

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadProviders() {
    setLoading(true);
    const data = await adminFetch('/api/admin/providers');
    setProviders(data);
    setLoading(false);
  }

  useEffect(() => {
    loadProviders();
  }, []);

  async function toggleVerify(id: string) {
    await adminFetch(`/api/admin/providers/${id}/verify`, {
      method: 'PATCH'
    });
    loadProviders();
  }

  async function toggleStatus(id: string) {
    await adminFetch(`/api/admin/providers/${id}/status`, {
      method: 'PATCH'
    });
    loadProviders();
  }

  async function deleteProvider(id: string) {
    if (!confirm('Are you sure you want to delete this provider?')) return;

    await adminFetch(`/api/admin/providers/${id}`, {
      method: 'DELETE'
    });
    loadProviders();
  }

  if (loading) return <p>Loading providers...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Providers</h1>

      <div className="overflow-x-auto">
        <table className="w-full border bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3">Category</th>
              <th className="p-3">Rate</th>
              <th className="p-3">Verified</th>
              <th className="p-3">Active</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {providers.map((p) => (
              <tr key={p._id} className="border-t">
                <td className="p-3">{p.name}</td>
                <td className="p-3 text-center">{p.category}</td>
                <td className="p-3 text-center">₹{p.hourlyRate}</td>

                <td className="p-3 text-center">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      p.isVerified
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {p.isVerified ? 'Verified' : 'Pending'}
                  </span>
                </td>

                <td className="p-3 text-center">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      p.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {p.isActive ? 'Active' : 'Suspended'}
                  </span>
                </td>

                <td className="p-3 space-x-2 text-center">
                  <button
                    onClick={() => toggleVerify(p._id)}
                    className="px-2 py-1 text-xs bg-blue-600 text-white rounded"
                  >
                    {p.isVerified ? 'Unverify' : 'Verify'}
                  </button>

                  <button
                    onClick={() => toggleStatus(p._id)}
                    className="px-2 py-1 text-xs bg-orange-600 text-white rounded"
                  >
                    {p.isActive ? 'Suspend' : 'Activate'}
                  </button>

                  <button
                    onClick={() => deleteProvider(p._id)}
                    className="px-2 py-1 text-xs bg-red-600 text-white rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {providers.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">
                  No providers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
