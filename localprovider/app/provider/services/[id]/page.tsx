'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

function getToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

export default function EditServicePage() {
  const { id } = useParams();
  const router = useRouter();
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  const token = getToken();

  const opts = {
    credentials: 'include' as RequestCredentials,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined
  };

  const urls = [
    `${BASE_URL}/api/services/provider/${id}`,
    `${BASE_URL}/api/services/services/${id}`
  ];

  (async () => {
    for (const url of urls) {
      try {
        const res = await fetch(url, opts);
        if (res.ok) {
          const data = await res.json();
          setService(data);
          return;
        }
      } catch {}
    }
    setService(null);
  })().finally(() => setLoading(false));
}, [id]);


async function handleUpdate(e: any) {
  e.preventDefault();

  const token = getToken();

  const endpoints = [
    `${BASE_URL}/api/services/provider/${id}`,
    `${BASE_URL}/api/services/services/${id}`
  ];

  for (const url of endpoints) {
    const res = await fetch(url, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(service)
    });

    if (res.ok) {
      alert('Service updated');
      router.push('/provider/services');
      return;
    }
  }

  alert('Update failed');
}

  if (loading) return <p>Loading…</p>;
  if (!service) return <p>Service not found</p>;

  return (
  <div className="max-w-3xl mx-auto p-6">
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold">Edit Service</h1>
      <a
        href="/provider/services"
        className="text-sm text-blue-600"
      >
        Back to services
      </a>
    </div>

    <form onSubmit={handleUpdate} className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium mb-1">Title</label>
        <input
          className="w-full border rounded px-3 py-2"
          value={service.title || ''}
          onChange={e =>
            setService({ ...service, title: e.target.value })
          }
        />
      </div>

      {/* Slug */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Slug (unique)
        </label>
        <input
          className="w-full border rounded px-3 py-2"
          value={service.slug || ''}
          onChange={e =>
            setService({ ...service, slug: e.target.value })
          }
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Description
        </label>
        <textarea
          rows={5}
          className="w-full border rounded px-3 py-2"
          value={service.description || ''}
          onChange={e =>
            setService({ ...service, description: e.target.value })
          }
        />
      </div>

      {/* Price */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Price (₹)
        </label>
        <input
          type="number"
          className="w-40 border rounded px-3 py-2"
          value={service.price ?? ''}
          onChange={e =>
            setService({
              ...service,
              price: Number(e.target.value)
            })
          }
        />
      </div>

      {/* Image preview (optional) */}
      {service.imageUrl && (
        <div>
          <label className="block text-sm font-medium mb-1">
            Current Image
          </label>
          <img
            src={service.imageUrl}
            alt={service.title}
            className="w-40 h-40 object-cover rounded border"
          />
        </div>
      )}

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Tags (comma separated)
        </label>
        <input
          className="w-full border rounded px-3 py-2"
          value={(service.tags || []).join(', ')}
          onChange={e =>
            setService({
              ...service,
              tags: e.target.value
                .split(',')
                .map(t => t.trim())
                .filter(Boolean)
            })
          }
        />
      </div>

      {/* Submit */}
      <div>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Save Changes
        </button>
      </div>
    </form>
  </div>
);

}
