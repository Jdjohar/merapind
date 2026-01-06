'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { requireAdminClient, adminLogout } from '@/app/lib/auth';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import '../admin.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    requireAdminClient();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentPath={pathname}
        onNavigate={(path) => router.push(path)}
        onLogout={adminLogout}
      />

      <div className="flex-1 flex flex-col lg:ml-72">
        <Header
          title="Admin Dashboard"
          onMenuToggle={() => setSidebarOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
