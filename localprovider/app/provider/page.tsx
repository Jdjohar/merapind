// app/providers/page.tsx
'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ServiceCard from '../../components/ServiceCard';
import SEO from '../../components/SEO';
import { Search } from 'lucide-react';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

type Provider = {
  _id?: string;
  id?: string;
  name?: string;
  category?: string;
  location?: string;
  lat?: number;
  lng?: number;
  imageUrl?: string;
  rating?: number;
  reviewCount?: number;
  description?: string;
};

export default function ProvidersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const qParam = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || '';
  const pageParam = Number(searchParams.get('page') || '1');

  const [query, setQuery] = useState(qParam);
  const [providers, setProviders] = useState<Provider[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(pageParam || 1);
  const [limit] = useState(12);
  const [total, setTotal] = useState<number | null>(null);

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (categoryParam) params.set('category', categoryParam);
    if (page) params.set('page', String(page));
    if (limit) params.set('limit', String(limit));
    return `${BASE_URL}/api/providers?${params.toString()}`;
  }, [query, categoryParam, page, limit]);

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = buildUrl();
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`Failed to load providers: ${res.status} ${txt}`);
      }
      const json = await res.json();
      // backend may return array or { providers, meta }
      if (Array.isArray(json)) {
        setProviders(json);
        setTotal(null);
      } else if (json?.providers) {
        setProviders(json.providers);
        setTotal(json.meta?.total ?? null);
      } else {
        setProviders(Array.isArray(json.data) ? json.data : []);
      }
    } catch (err: any) {
      console.error('fetchProviders', err);
      setError(err?.message || 'Failed to load providers');
      setProviders([]);
    } finally {
      setLoading(false);
    }
  }, [buildUrl]);

  useEffect(() => {
    setQuery(qParam);
    setPage(pageParam || 1);
    fetchProviders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qParam, categoryParam, pageParam]);

  function onSearchSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (categoryParam) params.set('category', categoryParam);
    // reset to page 1
    router.push(`/providers?${params.toString()}`);
  }

  function goToPage(nextPage: number) {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (categoryParam) params.set('category', categoryParam);
    params.set('page', String(nextPage));
    router.push(`/providers?${params.toString()}`);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <SEO title="Providers - ServiConnect" description="Browse providers near you" />

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Providers</h1>

        <form onSubmit={(e) => onSearchSubmit(e)} className="flex items-center gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by service, name or area"
            className="px-4 py-2 border rounded-lg w-72"
          />
          <button
            type="submit"
            className="px-3 py-2 bg-blue-600 text-white rounded-lg inline-flex items-center gap-2"
          >
            <Search className="w-4 h-4" /> Search
          </button>
        </form>
      </div>

      {loading ? (
        <div className="py-20 text-center">Loading providers…</div>
      ) : error ? (
        <div className="py-20 text-center text-rose-600">{error}</div>
      ) : (providers || []).length === 0 ? (
        <div className="py-20 text-center">No providers found.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {providers!.map((p) => (
              <div key={(p as any)._id || (p as any).id}>
                <ServiceCard provider={p as any} />
              </div>
            ))}
          </div>

          {/* pagination (simple) */}
          {total !== null && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                onClick={() => goToPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="px-3 py-2 border rounded"
              >
                Prev
              </button>
              <span className="px-3 py-2">Page {page}</span>
              <button
                onClick={() => goToPage(page + 1)}
                className="px-3 py-2 border rounded"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
