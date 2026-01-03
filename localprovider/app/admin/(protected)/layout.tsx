'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { requireAdminClient, adminLogout } from '@/app/lib/auth';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    requireAdminClient();
  }, []);

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-black text-white p-4 flex flex-col">
        <nav className="space-y-2 flex flex-col flex-1">
          <Link href="/admin/dashboard">Dashboard</Link>
          <Link href="/admin/users">Users</Link>
          <Link href="/admin/providers">Providers</Link>
          <Link href="/admin/category">Categories</Link>
          <Link href="/admin/reviews">Reviews</Link>
          <Link href="/admin/audit-logs">Audit Logs</Link>
        </nav>

        <button
          onClick={adminLogout}
          className="mt-4 text-left text-red-400 hover:text-red-300"
        >
          Logout
        </button>
      </aside>

      <main className="flex-1 p-6 bg-gray-100">{children}</main>
    </div>
  );
}
