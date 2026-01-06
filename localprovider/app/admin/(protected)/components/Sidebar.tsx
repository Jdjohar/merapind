'use client';

import { LayoutDashboard, Users, Store, Tags, FileText, LogOut } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

const menu = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Users', path: '/admin/users', icon: Users },
  { label: 'Providers', path: '/admin/providers', icon: Store },
  { label: 'Categories', path: '/admin/category', icon: Tags },
  { label: 'Audit Logs', path: '/admin/audit-logs', icon: FileText },
];

export default function Sidebar({
  isOpen,
  onClose,
  currentPath,
  onNavigate,
  onLogout,
}: SidebarProps) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 w-72 bg-white border-r z-50 transform transition-transform
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Admin Panel</h2>
          <p className="text-xs text-slate-400 uppercase">Control Center</p>
        </div>

        <nav className="p-4 space-y-2">
          {menu.map((item) => {
            const active = currentPath === item.path;
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                onClick={() => {
                  onNavigate(item.path);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition
                ${active
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t mt-auto">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-500 hover:bg-red-50"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
