'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

function getTokenFromStorage() {
  try {
    return localStorage.getItem('token') || sessionStorage.getItem('token') || null;
  } catch {
    return null;
  }
}

// Try two possible endpoints (older and newer) and return first successful result
async function fetchProviderServices() {
  const token = getTokenFromStorage();
  const opts = {
    credentials: 'include' as RequestCredentials,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined
  };

  // try legacy first
  const urls = [
    `${BASE_URL}/api/services/services`,
    `${BASE_URL}/api/services/provider`
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, opts);
      if (res.status === 401) throw new Error('unauthenticated');
      if (res.ok) {
        const json = await res.json().catch(() => ({}));
        // adapt to either { services } or array
        if (Array.isArray(json)) return json;
        if (json?.services && Array.isArray(json.services)) return json.services;
        // some controllers return top-level array
        return Array.isArray(json) ? json : [];
      }
    } catch (err) {
      // try next url
    }
  }
  // if none worked, throw
  throw new Error('Failed to load services');
}

export default function ProviderServicesList() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyDelete, setBusyDelete] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    fetchProviderServices()
      .then((s) => {
        if (!mounted) return;
        setServices(s || []);
      })
      .catch((err: any) => {
        console.error(err);
        setError(err?.message || 'Failed to load services (auth?)');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, []);

  async function handleDelete(id: string) {
    if (!confirm('Delete this service?')) return;
    setBusyDelete(id);
    try {
      const token = getTokenFromStorage();
      const opts = {
        method: 'DELETE',
        credentials: 'include' as RequestCredentials,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      };

      // try both endpoints
      const endpoints = [
        `${BASE_URL}/api/services/services/${id}`,
        `${BASE_URL}/api/services/provider/${id}`
      ];

      let ok = false;
      for (const url of endpoints) {
        try {
          const res = await fetch(url, opts);
          if (res.status === 401) {
            alert('Not authenticated — please log in again.');
            window.location.href = '/auth/login';
            return;
          }
          if (res.ok) { ok = true; break; }
        } catch {}
      }

      if (!ok) throw new Error('Delete failed');

      setServices(curr => curr.filter(s => s._id !== id));
    } catch (err: any) {
      alert(err?.message || 'Failed to delete service');
    } finally {
      setBusyDelete(null);
    }
  }

  if (loading) return <div className="max-w-4xl mx-auto p-6">Loading services…</div>;
  if (error) return <div className="max-w-4xl mx-auto p-6 text-rose-600">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Services</h1>
        <div className="flex gap-2">
          <Link href="/provider/services/new" className="px-3 py-2 bg-blue-600 text-white rounded">Add Service</Link>
          <Link href="/provider/dashboard" className="px-3 py-2 border rounded">Dashboard</Link>
        </div>
      </div>

      {services.length === 0 ? (
        <div className="bg-yellow-50 p-4 rounded">No services yet. Click <Link href="/provider/services/new" className="text-blue-600">Add Service</Link> to create one.</div>
      ) : (
        <ul className="space-y-4">
          {services.map(s => (
            <li key={s._id} className="p-4 border rounded flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                {s.imageUrl ? (
                  <img src={s.imageUrl} alt={s.title} width={80} height={80} className="object-cover rounded" />
                ) : (
                  <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center text-sm text-gray-500">No image</div>
                )}
                <div>
                  <div className="font-medium">{s.title}</div>
                  <div className="text-sm text-gray-600">{s.description?.slice(0, 140) || 'No description'}</div>
                  <div className="text-xs text-gray-500 mt-2">Price: ₹ {s.price ?? '—'} • Duration: {s.durationMinutes ?? 60} min</div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <Link href={`/provider/services/${s._id}`} className="px-3 py-1 border rounded text-sm">Edit</Link>
                <button
                  onClick={() => handleDelete(s._id)}
                  disabled={busyDelete === s._id}
                  className="px-3 py-1 border rounded text-sm text-rose-600"
                >
                  {busyDelete === s._id ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
