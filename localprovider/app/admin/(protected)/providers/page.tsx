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
    const data = await adminFetch('/api/admin/providers');
    setProviders(data);
  }

  useEffect(() => {
    loadProviders()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function toggleVerify(id: string) {
    await adminFetch(`/api/admin/providers/${id}/verify`, {
      method: 'PATCH',
    });
    loadProviders();
  }

  async function toggleStatus(id: string) {
    await adminFetch(`/api/admin/providers/${id}/status`, {
      method: 'PATCH',
    });
    loadProviders();
  }

  async function deleteProvider(id: string) {
    if (!confirm('Are you sure you want to delete this provider?')) return;

    await adminFetch(`/api/admin/providers/${id}`, {
      method: 'DELETE',
    });
    loadProviders();
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row  justify-between gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <h1 className="text-xl font-bold text-slate-800">
          Provider Management
        </h1>

      
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Provider
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Category
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Rate
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Verification
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
              {providers.map((p) => (
                <tr
                  key={p._id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  {/* Provider */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={`https://picsum.photos/seed/provider-${p._id}/40/40`}
                        className="w-10 h-10 rounded-full border"
                        alt=""
                      />
                      <div>
                        <div className="text-sm font-bold text-slate-900">
                          {p.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          ID: {p._id.slice(-6)}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium text-slate-700">
                      {p.category}
                    </span>
                  </td>

                  {/* Rate */}
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-slate-800">
                      ₹{p.hourlyRate}/hr
                    </span>
                  </td>

                  {/* Verification */}
                  <td className="px-6 py-4">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${
                        p.isVerified
                          ? 'bg-green-50 text-green-600'
                          : 'bg-yellow-50 text-yellow-600'
                      }`}
                    >
                      {p.isVerified ? 'Verified' : 'Pending'}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          p.isActive ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      />
                      <span className="text-xs font-medium text-slate-700">
                        {p.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right space-x-3">
                    <button
                      onClick={() => toggleVerify(p._id)}
                      className="text-xs font-bold text-indigo-600 hover:underline"
                    >
                      {p.isVerified ? 'Unverify' : 'Verify'}
                    </button>
                        <span className="mx-2 text-slate-300">|</span>
                    <button
                      onClick={() => toggleStatus(p._id)}
                      className="text-xs font-bold text-orange-600 hover:underline"
                    >
                      {p.isActive ? 'Suspend' : 'Activate'}
                    </button>
                        <span className="mx-2 text-slate-300">|</span>
                    <button
                      onClick={() => deleteProvider(p._id)}
                      className="text-xs font-bold text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {providers.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-center text-slate-400 text-sm"
                  >
                    No providers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
