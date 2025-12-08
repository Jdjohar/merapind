// app/profile/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { User as UserIcon, Mail, Shield, Loader2, LogOut } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

type Role = 'USER' | 'PROVIDER' | string;

type ProviderSummary = {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviewCount: number;
  hourlyRate?: number;
  imageUrl?: string;
  location?: string;
  isVerified?: boolean;
};

type MeResponse = {
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
    createdAt?: string;
    phone?: string;
    address?: string;
  };
  provider?: ProviderSummary | null;
};

// Shared token helper
function getTokenFromStorage(): string | null {
  try {
    if (typeof window === 'undefined') return null;
    return (
      localStorage.getItem('token') ||
      sessionStorage.getItem('token') ||
      null
    );
  } catch {
    return null;
  }
}

export default function ProfilePage() {
  const [user, setUser] = useState<MeResponse['user'] | null>(null);
  const [provider, setProvider] = useState<ProviderSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getTokenFromStorage();
    console.log('ProfilePage: token=', token);

    if (!token) {
      setLoading(false);
      setError('You are not logged in.');
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          console.error('Failed to load profile', res.status, text);
          setError('Failed to load profile. Please login again.');
          setLoading(false);
          return;
        }

        const data: MeResponse = await res.json();
        setUser(data.user);
        setProvider(data.provider ?? null);
      } catch (err) {
        console.error('Profile error', err);
        setError('Server error while loading profile.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
      } catch {
        // ignore storage errors
      }
      window.location.href = '/login';
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading profile...</span>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50">
        <div className="bg-white shadow-md rounded-2xl p-8 max-w-md w-full text-center">
          <p className="text-red-500 font-semibold mb-4">
            {error || 'Profile not found'}
          </p>
          <button
            onClick={() => (window.location.href = '/login')}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const created =
    user.createdAt ? new Date(user.createdAt).toLocaleDateString() : null;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                {user.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {user.name}
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                  <Shield className="w-4 h-4" />
                  <span>
                    {user.role === 'PROVIDER' ? 'Service Provider' : 'User'}
                  </span>
                  {created && <span>• Joined {created}</span>}
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 mt-4">
            <div className="bg-gray-50 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <UserIcon className="w-4 h-4 text-gray-500" />
                <span className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                  Name
                </span>
              </div>
              <p className="text-gray-900 font-medium">{user.name}</p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                  Email
                </span>
              </div>
              <p className="text-gray-900 font-medium break-all">
                {user.email}
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-gray-500" />
                <span className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                  Role
                </span>
              </div>
              <p className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                {user.role}
              </p>
            </div>

            {user.role === 'PROVIDER' && (
              <div className="bg-gray-50 rounded-2xl p-4">
                <span className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                  Provider Profile
                </span>

                {provider ? (
                  <div className="mt-2 space-y-1 text-sm text-gray-700">
                    <p>
                      <span className="font-semibold">Name:</span>{' '}
                      {provider.name}
                    </p>
                    <p>
                      <span className="font-semibold">Category:</span>{' '}
                      {provider.category}
                    </p>
                    {provider.location && (
                      <p>
                        <span className="font-semibold">Location:</span>{' '}
                        {provider.location}
                      </p>
                    )}
                    <p>
                      <span className="font-semibold">Rating:</span>{' '}
                      {provider.rating?.toFixed(1) || 'N/A'} (
                      {provider.reviewCount} reviews)
                    </p>
                    {provider.hourlyRate != null && (
                      <p>
                        <span className="font-semibold">Hourly Rate:</span>{' '}
                        ₹{provider.hourlyRate}
                      </p>
                    )}
                    {provider.isVerified && (
                      <p className="text-xs text-green-600 font-semibold mt-1">
                        Verified Provider
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 mt-2">
                    You don&apos;t have a provider profile yet.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={() => (window.location.href = '/')}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
            >
              Back to Home
            </button>
            {user.role === 'PROVIDER' && (
              <button
                onClick={() => (window.location.href = '/provider/chats')}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
              >
                Go to Provider Chats
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
