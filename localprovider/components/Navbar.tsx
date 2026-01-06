// components/Navbar.tsx
'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

function getTokenFromStorage() {
  try {
    return localStorage.getItem('token') || sessionStorage.getItem('token') || null;
  } catch {
    return null;
  }
}

export default function Navbar() {
  const [user, setUser] = useState<{ id?: string; name?: string; role?: string } | null>(null);
  const [provider, setProvider] = useState<any | null>(null);
  const [loadingProviderCheck, setLoadingProviderCheck] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let mounted = true;

    async function readAuthAndCheckProvider() {
      try {
        const rawUser = localStorage.getItem('user') || sessionStorage.getItem('user');
        const rawProvider = localStorage.getItem('provider') || sessionStorage.getItem('provider');

        const parsedUser = rawUser ? JSON.parse(rawUser) : null;
        const parsedProvider = rawProvider ? JSON.parse(rawProvider) : null;

        if (!mounted) return;

        setUser(parsedUser);
        if (parsedProvider) {
          setProvider(parsedProvider);
          return;
        }

        if (parsedUser && parsedUser.role === 'PROVIDER') {
          setLoadingProviderCheck(true);
          try {
            const token = getTokenFromStorage();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/api/providers/me`, {
              credentials: 'include',
              headers: token ? { Authorization: `Bearer ${token}` } : undefined
            });

            if (res.ok) {
              const p = await res.json().catch(() => null);
              if (p && mounted) {
                setProvider(p);
                try { localStorage.setItem('provider', JSON.stringify(p)); } catch {}
                try { sessionStorage.setItem('provider', JSON.stringify(p)); } catch {}
              } else if (mounted) {
                setProvider(null);
              }
            } else {
              if (mounted) setProvider(null);
            }
          } catch (err) {
            if (mounted) setProvider(null);
          } finally {
            if (mounted) setLoadingProviderCheck(false);
          }
        } else {
          setProvider(null);
        }
      } catch (err) {
        setUser(null);
        setProvider(null);
      }
    }

    readAuthAndCheckProvider();

    const onAuthChange = () => readAuthAndCheckProvider();
    const onStorage = (e: StorageEvent) => {
      if (['user', 'provider', 'token'].includes(e.key || '')) {
        readAuthAndCheckProvider();
      }
    };

    window.addEventListener('auth-change', onAuthChange);
    window.addEventListener('storage', onStorage);

    return () => {
      mounted = false;
      window.removeEventListener('auth-change', onAuthChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  async function handleLogout() {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      }).catch(() => {});
    } catch {}
    try { localStorage.removeItem('token'); } catch {}
    try { localStorage.removeItem('user'); } catch {}
    try { localStorage.removeItem('provider'); } catch {}
    try { sessionStorage.removeItem('token'); } catch {}
    try { sessionStorage.removeItem('user'); } catch {}
    try { sessionStorage.removeItem('provider'); } catch {}

    window.dispatchEvent(new Event('auth-change'));
    router.push('/');
  }

  const linkClass = (href: string) =>
    `text-sm px-2 py-1 rounded ${pathname === href ? 'text-blue-600 font-semibold' : 'text-gray-600 hover:text-gray-800'}`;

  return (
    <nav className="w-full bg-white/90 border-b border-gray-200" id='navbar'>
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-lg font-bold text-blue-600">Mera Pind</Link>

          {/* Correct links */}
          <Link href="/provider" className={linkClass('/providers')}>Providers</Link>
          <Link href="/categories" className={linkClass('/categories')}>Categories</Link>
        </div>

        <div>
          {!user ? (
            <div className="flex items-center gap-3">
              <Link href="/auth/login" className="px-3 py-2 text-sm rounded-md border border-blue-600 text-blue-600 hover:bg-blue-50">Sign in</Link>
              <Link href="/auth/signup" className="px-3 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700">Sign up</Link>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">Hi, <strong>{user.name || 'User'}</strong></span>

              <div className="relative">
                <details className="relative">
                  <summary className="cursor-pointer px-3 py-2 rounded-md border bg-white text-sm">Account ▾</summary>
                  <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-md z-50">
                    <Link href="/profile" className="block px-3 py-2 text-sm hover:bg-gray-50">Profile</Link>

                    {user.role === 'PROVIDER' && !loadingProviderCheck && !provider && (
                      <Link href="/provider/create" className="block px-3 py-2 text-sm hover:bg-gray-50">Complete profile</Link>
                    )}

                    {user.role === 'PROVIDER' && provider && (
                      <Link href="/provider/dashboard" className="block px-3 py-2 text-sm hover:bg-gray-50">Provider Panel</Link>
                    )}

                    <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">Sign out</button>
                  </div>
                </details>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
