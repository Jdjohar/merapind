'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

function getTokenFromStorage() {
  try {
    return localStorage.getItem('token') || sessionStorage.getItem('token') || null;
  } catch {
    return null;
  }
}

/**
 * Reverse geocode using OpenStreetMap Nominatim (no API key).
 * Keep this low-volume — Nominatim has usage policy / rate limits.
 */
async function reverseGeocode(lat: number, lon: number) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
      lat
    )}&lon=${encodeURIComponent(lon)}&accept-language=en`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mera Pind/1.0 (+your-email@example.com)' } // polite
    });
    if (!res.ok) return null;
    const json = await res.json();
    // prefer display_name or address.city / town / village
    const place = json?.display_name || (json?.address && (json.address.city || json.address.town || json.address.village || json.address.county));
    return place || null;
  } catch {
    return null;
  }
}

export default function CreateProviderPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [tags, setTags] = useState('');
  const [location, setLocation] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');

  const [categories, setCategories] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [detecting, setDetecting] = useState(false);
  const [geoSupported, setGeoSupported] = useState(true);

  useEffect(() => {
    // prefill name from localStorage user if available
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        const u = JSON.parse(raw);
        if (u?.name) setName(u.name);
      }
    } catch {}

    async function loadCats() {
      try {
        const res = await fetch(`${BASE_URL}/api/categories`);
        if (!res.ok) return;
        const json = await res.json();
        if (Array.isArray(json)) setCategories(json.map((c: any) => c.slug || c.name));
      } catch {}
    }
    loadCats();

    // start auto-detect geolocation once on mount (you can remove if you want manual only)
    if ('geolocation' in navigator) {
      setGeoSupported(true);
      autoDetectLocation();
    } else {
      setGeoSupported(false);
    }
    // only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function autoDetectLocation() {
    // don't ask multiple times
    if (!('geolocation' in navigator)) return;
    setDetecting(true);
    setError('');
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, (err) => reject(err), {
          enableHighAccuracy: true,
          timeout: 10000, // 10s
          maximumAge: 1000 * 60 * 5 // 5 minutes
        });
      });

      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      setLat(String(latitude));
      setLng(String(longitude));

      // attempt reverse-geocode to get a friendly location string
      const place = await reverseGeocode(latitude, longitude);
      if (place) {
        setLocation(place);
      }
    } catch (err: any) {
      // permission denied, timeout, or other error — do not spam user
      if (err && err.code === 1) {
        // PERMISSION_DENIED
        setError('Location permission denied. You can enter location manually.');
      } else if (err && err.code === 3) {
        setError('Location request timed out. You can enter location manually.');
      } else {
        // generic message
        // console.warn('geolocation error', err);
      }
    } finally {
      setDetecting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!name.trim()) { setError('Name required'); return; }
    if (!category.trim()) { setError('Category required'); return; }
    if (!hourlyRate || isNaN(Number(hourlyRate))) { setError('Valid hourly rate required'); return; }

    const token = getTokenFromStorage();
    if (!token) {
      router.push('/auth/login');
      return;
    }

    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('name', name.trim());
      fd.append('category', category.trim());
      fd.append('hourlyRate', String(Number(hourlyRate)));
      fd.append('description', description.trim());
      fd.append('tags', JSON.stringify(tags.split(',').map(t => t.trim()).filter(Boolean)));
      if (location) fd.append('location', location.trim());
      if (lat) fd.append('lat', String(lat));
      if (lng) fd.append('lng', String(lng));

      const fileInput = fileRef.current;
      if (fileInput && fileInput.files && fileInput.files[0]) {
        fd.append('image', fileInput.files[0]);
      } else if (imageUrl) {
        fd.append('imageUrl', imageUrl.trim());
      }

      const res = await fetch(`${BASE_URL}/api/providers`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: fd
      });

      if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        window.dispatchEvent(new Event('auth-change'));
        router.push('/auth/login');
        return;
      }

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || json?.message || `HTTP ${res.status}`);

      router.push('/provider/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Failed to create provider profile');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Create Provider Profile</h1>

      {error && <div className="mb-4 text-rose-700 bg-rose-50 p-3 rounded">{error}</div>}

      <div className="mb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={autoDetectLocation}
            className="px-3 py-2 bg-blue-600 text-white rounded"
            disabled={detecting}
          >
            {detecting ? 'Detecting location…' : 'Auto-detect my location'}
          </button>

          {!geoSupported && (
            <div className="text-sm text-gray-600">Geolocation not supported in this browser.</div>
          )}

          <div className="text-sm text-gray-500">We use your browser location to fill coordinates (you can edit them).</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Business / Provider name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded px-3 py-2" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border rounded px-3 py-2">
            <option value="">Select category</option>
            {categories.length === 0 && <option value="general">General</option>}
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Hourly rate</label>
          <input value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="e.g. 500" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border rounded px-3 py-2" rows={5} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Image file (preferred)</label>
          <input ref={fileRef} type="file" accept="image/*" className="w-full" />
          <div className="mt-2 text-sm text-gray-500">Or provide an external image URL below.</div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">External image URL (optional)</label>
          <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="https://..." />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
          <input value={tags} onChange={(e) => setTags(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="plumbing, emergency" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Location (city/area)</label>
          <input value={location} onChange={(e) => setLocation(e.target.value)} className="w-full border rounded px-3 py-2" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Latitude (optional)</label>
            <input value={lat} onChange={(e) => setLat(e.target.value)} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Longitude (optional)</label>
            <input value={lng} onChange={(e) => setLng(e.target.value)} className="w-full border rounded px-3 py-2" />
          </div>
        </div>

        <div>
          <button disabled={busy} type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
            {busy ? 'Saving…' : 'Create Provider Profile'}
          </button>
        </div>
      </form>

      <p className="mt-6 text-sm text-gray-600">
        We attempt to detect your location using your browser. If you prefer not to share it, you can enter your city/area manually.
      </p>
    </div>
  );
}
