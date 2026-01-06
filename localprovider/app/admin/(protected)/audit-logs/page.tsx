'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '@/app/lib/admin-fetch';

type AuditLog = {
  _id: string;
  adminId?: {
    name?: string;
  };
  action: string;
  entityType: string;
  ipAddress: string;
  createdAt: string;
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  async function loadLogs(p = 1) {
    setLoading(true);
    const res = await adminFetch(`/api/admin/audit-logs?page=${p}`);
    setLogs(res.data);
    setPages(res.meta.pages);
    setPage(res.meta.page);
    setLoading(false);
  }

  useEffect(() => {
    loadLogs();
  }, []);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <h1 className="text-xl font-bold text-slate-800">
          Security Audit Logs
        </h1>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Admin
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Action
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Entity
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                  IP Address
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">
                  Date
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr
                  key={log._id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  {/* Admin */}
                  <td className="px-6 py-4 text-sm font-medium text-slate-800">
                    {log.adminId?.name || 'System'}
                  </td>

                  {/* Action */}
                  <td className="px-6 py-4">
                    <span className="text-[11px] font-bold uppercase tracking-widest px-2 py-1 rounded-md bg-indigo-50 text-indigo-600">
                      {log.action}
                    </span>
                  </td>

                  {/* Entity */}
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {log.entityType}
                  </td>

                  {/* IP */}
                  <td className="px-6 py-4 text-xs font-mono text-slate-500">
                    {log.ipAddress}
                  </td>

                  {/* Date */}
                  <td className="px-6 py-4 text-right text-xs text-slate-500">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}

              {logs.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-slate-400 text-sm"
                  >
                    No audit logs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-end gap-2">
          {Array.from({ length: pages }).map((_, i) => {
            const p = i + 1;
            return (
              <button
                key={p}
                onClick={() => loadLogs(p)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${
                  page === p
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
