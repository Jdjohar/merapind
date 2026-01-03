'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '@/app/lib/admin-fetch';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  async function loadLogs(p = 1) {
    const res = await adminFetch(`/api/admin/audit-logs?page=${p}`);
    setLogs(res.data);
    setPages(res.meta.pages);
    setPage(res.meta.page);
  }

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Audit Logs</h1>

      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Admin</th>
              <th className="p-3">Action</th>
              <th className="p-3">Entity</th>
              <th className="p-3">IP</th>
              <th className="p-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log._id} className="border-t">
                <td className="p-3">
                  {log.adminId?.name || '—'}
                </td>
                <td className="p-3 font-mono">
                  {log.action}
                </td>
                <td className="p-3">
                  {log.entityType}
                </td>
                <td className="p-3 text-xs">
                  {log.ipAddress}
                </td>
                <td className="p-3 text-xs">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex gap-2 mt-4">
        {Array.from({ length: pages }).map((_, i) => (
          <button
            key={i}
            onClick={() => loadLogs(i + 1)}
            className={`px-3 py-1 border rounded ${
              page === i + 1 ? 'bg-black text-white' : ''
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
