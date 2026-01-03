'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '@/app/lib/admin-fetch';

type DashboardStats = {
  users: number;
  providers: number;
  services: number;
  reviews: number;
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch('/api/admin/dashboard/overview')
      .then(setData)
      .catch(() => {
        // token invalid / expired
        localStorage.removeItem('admin_token');
        window.location.href = '/admin/login';
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!data) {
    return <div className="p-6">Failed to load dashboard</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4">
        <Stat label="Users" value={data.users} />
        <Stat label="Providers" value={data.providers} />
        <Stat label="Services" value={data.services} />
        <Stat label="Reviews" value={data.reviews} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white p-4 rounded shadow">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
}
