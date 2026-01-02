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

export default function ProviderDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState<any | null>(null);
  const [services, setServices] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        // try reading provider from localStorage first (fast)
        let localProvider = null;
        try {
          const raw = localStorage.getItem('provider') || sessionStorage.getItem('provider');
          if (raw) localProvider = JSON.parse(raw);
        } catch {}

        if (localProvider) {
          setProvider(localProvider);
        } else {
          // fetch /api/providers/me to confirm provider existence
          const pRes = await fetch(`${BASE_URL}/api/providers/me`, {
            credentials: 'include',
            headers: { Authorization: `Bearer ${getTokenFromStorage() || ''}` }
          });

          if (pRes.status === 401) {
            setError('You must be logged in to access the provider panel.');
            setLoading(false);
            return;
          }

          if (pRes.status === 404) {
            setProvider(null);
            setLoading(false);
            return;
          }

          if (!pRes.ok) {
            const j = await pRes.json().catch(() => ({}));
            throw new Error(j?.error || `Failed to load provider profile (${pRes.status})`);
          }

          const pJson = await pRes.json();
          setProvider(pJson);
          try { localStorage.setItem('provider', JSON.stringify(pJson)); } catch {}
        }

        // load provider's services from DB
        const sRes = await fetch(`${BASE_URL}/api/services/provider`, {
          credentials: 'include',
          headers: { Authorization: `Bearer ${getTokenFromStorage() || ''}` }
        });

        if (sRes.ok) {
          const sJson = await sRes.json();
          // support either { services: [...] } or an array
          if (Array.isArray(sJson)) setServices(sJson);
          else if (sJson?.services && Array.isArray(sJson.services)) setServices(sJson.services);
          else setServices([]);
        } else {
          setServices([]);
        }
      } catch (err: any) {
        console.error(err);
        setError(err?.message || 'Failed to load provider dashboard');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div>Loading provider dashboard…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-rose-50 text-rose-700 p-4 rounded">{error}</div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Complete your Provider profile</h2>
          <p className="text-sm text-gray-700 mb-4">
            You don't have a provider profile yet. Create one to start adding services and appear in search results.
          </p>
          <div className="flex gap-3">
            <Link href="/provider/create" className="px-4 py-2 bg-blue-600 text-white rounded">Create profile</Link>
            <Link href="/" className="px-4 py-2 border rounded">Back to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  async function handleDeleteService(serviceId: string) {
    if (!confirm('Delete this service?')) return;
    try {
      const del = await fetch(`${BASE_URL}/api/services/provider/${serviceId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { Authorization: `Bearer ${getTokenFromStorage() || ''}` }
      });
      if (!del.ok) throw new Error('Delete failed');
      setServices((curr) => curr.filter((s) => s._id !== serviceId));
    } catch (err) {
      alert('Failed to delete service');
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{provider.name || 'Your Provider Profile'}</h1>
          <p className="text-sm text-gray-600">{provider.category} • {provider.location || 'Location not set'}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/provider/services/new" className="px-3 py-2 bg-blue-600 text-white rounded">Add Service</Link>
          <Link href={`/provider/services`} className="px-3 py-2 border rounded">Manage Services</Link>
          {/* <Link href="/provider/bookings" className="px-3 py-2 border rounded">Bookings</Link> */}
          <Link href={`/provider/edit`} className="px-3 py-2 border rounded">Edit Profile</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="col-span-2 bg-white border rounded p-4 shadow-sm">
          <h3 className="font-semibold mb-2">Overview</h3>
          <div className="text-sm text-gray-700 mb-3">{provider.description || 'No description provided.'}</div>

          <div className="flex flex-wrap gap-3 mt-3">
            <div className="text-sm">
              <div className="text-xs text-gray-500">Hourly rate</div>
              <div className="font-medium">₹ {provider.hourlyRate ?? '—'}</div>
            </div>

            <div className="text-sm">
              <div className="text-xs text-gray-500">Rating</div>
              <div className="font-medium">{provider.rating ? provider.rating.toFixed(1) : '—'}</div>
            </div>

            <div className="text-sm">
              <div className="text-xs text-gray-500">Reviews</div>
              <div className="font-medium">{provider.reviewCount ?? 0}</div>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded p-4 shadow-sm">
          <h3 className="font-semibold mb-2">Quick actions</h3>
          <ul className="space-y-2">
            <li><Link href="/provider/services" className="text-sm text-blue-600">Manage services ({services.length})</Link></li>
            {/* <li><Link href="/provider/bookings" className="text-sm text-blue-600">View bookings</Link></li> */}
            <li><Link href={`/provider/${provider._id}`} className="text-sm text-blue-600">View public profile</Link></li>
            <li><Link href={`/provider/edit`} className="text-sm text-blue-600">Edit profile</Link></li>
          </ul>
        </div>
      </div>

      <div className="bg-white border rounded p-4 shadow-sm">
        <h3 className="font-semibold mb-3">Your services</h3>

        {services.length === 0 ? (
          <div className="text-gray-600">
            You don't have any services yet. <Link href="/provider/services/new" className="text-blue-600">Add a service</Link>.
          </div>
        ) : (
          <ul className="space-y-3">
            {services.map(s => (
              <li key={s._id} className="p-3 border rounded flex items-center justify-between">
                <div>
                  <div className="font-medium">{s.title}</div>
                  <div className="text-sm text-gray-600">{s.description ? s.description.slice(0, 120) : 'No description'}</div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/provider/services/${s._id}`} className="px-3 py-1 border rounded text-sm">Edit</Link>
                  <button onClick={() => handleDeleteService(s._id)} className="px-3 py-1 border rounded text-sm">Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
