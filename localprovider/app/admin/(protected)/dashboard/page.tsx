'use client';

import { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Users, Store, Layers, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { adminFetch } from '@/app/lib/admin-fetch';

type DashboardStats = {
  users: number;
  providers: number;
  services: number;
  reviews: number;
};

type AuditLog = {
  _id: string;
  action: string;
  entityType: string;
  adminId?: { name?: string };
  createdAt: string;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const router = useRouter();

useEffect(() => {
  Promise.all([
    adminFetch('/api/admin/dashboard/overview'),
    adminFetch('/api/admin/audit-logs?page=1'),
  ])
    .then(([statsRes, logsRes]) => {
      setStats(statsRes);
      setLogs((logsRes.data || []).slice(0, 5)); // GUARANTEED LIMIT
    })
    .catch(() => {
      localStorage.removeItem('admin_token');
      router.push('/admin/login');
    });
}, [router]);

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  /* Honest chart: real totals comparison */
  const chartData = [
    { name: 'Users', count: stats.users },
    { name: 'Providers', count: stats.providers },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Users" value={stats.users} icon={<Users />} />
        <StatCard label="Providers" value={stats.providers} icon={<Store />} />
        <StatCard label="Services" value={stats.services} icon={<Layers />} />
        <StatCard label="Reviews" value={stats.reviews} icon={<Star />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User / Provider Comparison */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-bold text-slate-800 text-lg mb-6">
            Users vs Providers
          </h3>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="countGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#6366f1"
                  strokeWidth={3}
                  fill="url(#countGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-800 text-lg mb-6">
            Recent Admin Activity
          </h3>

          <div className="space-y-5 flex-1">
            {logs.map((log) => (
              <div key={log._id} className="flex gap-3">
                <div className="w-2 h-2 mt-2 rounded-full bg-indigo-500" />
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {log.action}
                  </p>
                  <p className="text-xs text-slate-500">
                    {log.entityType} • {log.adminId?.name || 'System'}
                  </p>
                  <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">
                    {new Date(log.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}

            {logs.length === 0 && (
              <p className="text-sm text-slate-400">
                No recent activity
              </p>
            )}
          </div>

          <button
            onClick={() => router.push('/admin/audit-logs')}
            className="w-full mt-4 py-2.5 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 uppercase tracking-wider"
          >
            View All Logs
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Stat Card ---------- */
function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white p-6 rounded-xl border shadow-sm flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </div>
      <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
        {icon}
      </div>
    </div>
  );
}
