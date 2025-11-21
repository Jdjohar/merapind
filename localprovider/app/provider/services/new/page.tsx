'use client';
import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

function getTokenFromStorage() {
  try {
    return localStorage.getItem('token') || sessionStorage.getItem('token') || null;
  } catch {
    return null;
  }
}

export default function CreateServicePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [location, setLocation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!title.trim() || !slug.trim()) {
      setError('Title and slug are required');
      return;
    }

    const token = getTokenFromStorage();
    if (!token) {
      router.push('/auth/login');
      return;
    }

    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('title', title.trim());
      fd.append('slug', slug.trim());
      if (category) fd.append('category', category);
      fd.append('price', String(Number(price) || 0));
      fd.append('durationMinutes', String(Number(durationMinutes) || 60));
      fd.append('description', description.trim());
      if (tags) fd.append('tags', JSON.stringify(tags.split(',').map(t => t.trim()).filter(Boolean)));
      if (location) fd.append('location', location.trim());

      const fileInput = fileRef.current;
      if (fileInput && fileInput.files && fileInput.files[0]) {
        fd.append('image', fileInput.files[0]); // multer upload single('image')
      }

      // Try legacy endpoint then fallback
      const endpoints = [
        `${BASE_URL}/api/services/services`,
        `${BASE_URL}/api/services/provider`
      ];

      let created = null;
      for (const url of endpoints) {
        try {
          const res = await fetch(url, {
            method: 'POST',
            credentials: 'include',
            headers: {
              Authorization: `Bearer ${token}`
            },
            body: fd // multipart/form-data, browser sets content-type
          });

          if (res.status === 401) {
            // not authenticated
            localStorage.removeItem('token'); localStorage.removeItem('user'); localStorage.removeItem('provider');
            sessionStorage.removeItem('token'); sessionStorage.removeItem('user'); sessionStorage.removeItem('provider');
            window.dispatchEvent(new Event('auth-change'));
            router.push('/auth/login');
            return;
          }

          if (res.ok) {
            created = await res.json().catch(() => null);
            break;
          } else {
            // try next endpoint
            const j = await res.json().catch(() => ({}));
            console.warn('create service failed on', url, res.status, j);
          }
        } catch (err) {
          // continue to next endpoint
          console.warn('network error posting to', url, err);
        }
      }

      if (!created) throw new Error('Failed to create service (no endpoint succeeded)');

      // success -> go to services list
      router.push('/provider/services');
    } catch (err: any) {
      setError(err?.message || 'Failed to create service');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Add New Service</h1>
        <Link href="/provider/services" className="text-sm text-blue-600">Back to services</Link>
      </div>

      {error && <div className="mb-4 text-rose-700 bg-rose-50 p-3 rounded">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border rounded px-3 py-2" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Slug (unique)</label>
          <input value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full border rounded px-3 py-2" />
        </div>

        {/* <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <input value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Price (₹)</label>
            <input value={price} onChange={(e) => setPrice(e.target.value)} className="w-full border rounded px-3 py-2" />
          </div>
        </div> */}

        {/* <div>
          <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
          <input value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} className="w-40 border rounded px-3 py-2" />
        </div> */}

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border rounded px-3 py-2" rows={5} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Image (optional)</label>
          <input ref={fileRef} type="file" accept="image/*" className="w-full" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
          <input value={tags} onChange={(e) => setTags(e.target.value)} className="w-full border rounded px-3 py-2" />
        </div>

        {/* <div>
          <label className="block text-sm font-medium mb-1">Location (optional)</label>
          <input value={location} onChange={(e) => setLocation(e.target.value)} className="w-full border rounded px-3 py-2" />
        </div> */}

        <div>
          <button disabled={busy} type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
            {busy ? 'Creating…' : 'Create Service'}
          </button>
        </div>
      </form>
    </div>
  );
}
