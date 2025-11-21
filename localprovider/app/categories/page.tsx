// app/categories/page.tsx
'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import SEO from '../../components/SEO';

type Category = {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
  color?: string;
};

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export default function CategoriesPage() {
  const [cats, setCats] = useState<Category[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/api/categories`, { credentials: 'include' });
        if (!res.ok) throw new Error(`Failed to load categories: ${res.status}`);
        const json = await res.json();
        const arr = Array.isArray(json) ? json : (json?.categories || []);
        if (mounted) setCats(arr);
      } catch (e: any) {
        console.error(e);
        if (mounted) setErr(e?.message || 'Failed to load');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <SEO title="Categories - ServiConnect" description="Browse service categories" />
      <h1 className="text-3xl font-bold mb-6">Categories</h1>

      {loading ? (
        <div>Loading categories…</div>
      ) : err ? (
        <div className="text-rose-600">{err}</div>
      ) : !cats || cats.length === 0 ? (
        <div>No categories found.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {cats.map((c) => (
            <Link
              key={(c as any)._id || (c as any).id || c.slug}
              href={`/providers?category=${encodeURIComponent(c.slug)}`}
              className="block p-6 bg-white rounded-2xl shadow-sm border hover:shadow-lg transition"
            >
              <div className={`w-14 h-14 mb-4 rounded-2xl flex items-center justify-center ${c.color || 'bg-slate-200'}`}>
                <span className="text-lg font-bold">{c.name[0]}</span>
              </div>
              <div className="font-semibold text-gray-900">{c.name}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
