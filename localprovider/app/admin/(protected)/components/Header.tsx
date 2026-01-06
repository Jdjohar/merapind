'use client';

import { Menu, Bell, Search } from 'lucide-react';

interface HeaderProps {
  onMenuToggle: () => void;
  title: string;
}

export default function Header({ onMenuToggle, title }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur border-b border-slate-200 px-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-lg hover:bg-slate-100 lg:hidden"
        >
          <Menu className="w-6 h-6 text-slate-600" />
        </button>
        <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center bg-slate-100 rounded-full px-3 py-1.5">
          <Search className="w-4 h-4 text-slate-400 mr-2" />
          <input
            className="bg-transparent text-sm outline-none w-48"
            placeholder="Search..."
          />
        </div>

        <button className="relative p-2 rounded-lg hover:bg-slate-100">
          <Bell className="w-6 h-6 text-slate-600" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <img
          src="https://picsum.photos/seed/admin/40/40"
          className="w-10 h-10 rounded-full border"
          alt="Admin"
        />
      </div>
    </header>
  );
}
