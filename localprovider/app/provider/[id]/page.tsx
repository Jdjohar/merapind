// app/providers/[id]/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Star,
  MapPin,
  CheckCircle,
  Phone,
  MessageCircle,
  ArrowLeft,
  Calendar,
  ShieldCheck
} from 'lucide-react';
import SEO from '../../../components/SEO';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

type Review = {
  _id?: string;
  userId?: any;
  userName?: string;
  rating: number;
  comment?: string;
  date?: string;
};

type Provider = {
  _id?: string;
  id?: string;
  name?: string;
  category?: string;
  description?: string;
  imageUrl?: string;
  hourlyRate?: number;
  rating?: number;
  reviewCount?: number;
  location?: string;
  availability?: string;
  tags?: string[];
  isVerified?: boolean;
  reviews?: Review[];
};

export default function ProviderDetailPageClient() {
  const params = useParams();
  const id = params?.id as string | undefined;

  const [provider, setProvider] = useState<Provider | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('Missing provider id');
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);
    setError(null);

    async function load() {
      try {
        const pRes = await fetch(`${BASE_URL}/api/providers/${id}`, { credentials: 'include' });
        if (!pRes.ok) {
          const txt = await pRes.text().catch(() => '');
          throw new Error(`Failed to load provider: ${pRes.status} ${txt}`);
        }
        const pJson = await pRes.json();
        const providerObj = pJson || {};
        if (!mounted) return;
        setProvider(providerObj);

        // fetch reviews (if backend exposes GET /api/reviews/:providerId)
        try {
          const rRes = await fetch(`${BASE_URL}/api/reviews/${id}`, { credentials: 'include' });
          if (rRes.ok) {
            const rJson = await rRes.json();
            if (Array.isArray(rJson)) setReviews(rJson);
            else if (rJson?.reviews) setReviews(rJson.reviews);
          } else {
            // ignore reviews error
            setReviews([]);
          }
        } catch (err) {
          setReviews([]);
        }
      } catch (err: any) {
        console.error('provider fetch error', err);
        if (!mounted) return;
        setError(err?.message || 'Unable to load provider');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center p-8">Loading provider…</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg border">
          <h2 className="text-xl font-bold text-rose-600">Error</h2>
          <p className="mt-2 text-sm text-gray-700">{error}</p>
          <div className="mt-4">
            <Link href="/providers" className="text-blue-600">Back to providers</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-gray-500">Provider not found.</p>
          <Link href="/providers" className="text-blue-600 mt-4 inline-block">Back to providers</Link>
        </div>
      </div>
    );
  }

  const title = provider.name || 'Provider';
  const img = provider.imageUrl || '/placeholder.png';

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <SEO
        title={title}
        description={`${provider.name} — ${provider.category || ''}. ${provider.description?.slice(0, 160) || ''}`}
      />

      <div className="bg-white sticky top-16 z-40 border-b border-gray-200 px-4 py-3 flex items-center gap-4 md:hidden">
        <Link href="/" className="text-gray-600"><ArrowLeft className="w-6 h-6" /></Link>
        <h1 className="font-bold text-lg truncate">{title}</h1>
      </div>

      <main className="max-w-5xl mx-auto md:py-8 md:px-4">
        <div className="bg-white md:rounded-3xl shadow-sm overflow-hidden">
          <div className="relative h-48 md:h-64 bg-gray-900">
            {/* cover image (static fallback) */}
            <img src={img} alt="Cover" className="w-full h-full object-cover opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          </div>

          <div className="px-4 pb-8 md:px-10 relative">
            <div className="flex flex-col md:flex-row items-start md:items-end -mt-12 md:-mt-16 mb-6 gap-4 md:gap-6">
              <img
                src={img}
                alt={title}
                className="w-24 h-24 md:w-32 md:h-32 rounded-2xl border-4 border-white shadow-lg object-cover bg-white"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.png'; }}
              />

              <div className="flex-1 text-white md:text-gray-900 md:mb-2">
                <div className="flex items-center gap-2">
                  <span className="bg-blue-600 text-white px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wide">{provider.category}</span>
                  {provider.isVerified && (
                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-md flex items-center gap-1 text-xs font-bold">
                      <ShieldCheck className="w-3 h-3" /> Verified Pro
                    </span>
                  )}
                </div>

                <h1 className="text-2xl md:text-4xl font-bold mt-2 mb-1">{title}</h1>

                <div className="flex items-center gap-4 text-sm md:text-base text-gray-600 font-medium">
                  <span className="flex items-center"><MapPin className="w-4 h-4 mr-1" /> {provider.location || '—'}</span>
                  <span className="flex items-center text-yellow-400 md:text-yellow-500 font-bold">
                    <Star className="w-4 h-4 mr-1" /> {provider.rating ?? '—'}
                    <span className="text-gray-400 md:text-gray-500 font-normal ml-1">({provider.reviewCount ?? 0} reviews)</span>
                  </span>
                </div>
              </div>

              <div className="hidden md:flex gap-3 mb-2">
                <a href={`tel:${(provider as any).phone ?? ''}`} className="bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition flex items-center gap-2 shadow-sm">
                  <Phone className="w-5 h-5" /> Call Now
                </a>

                <Link href={`/chat?providerId=${provider._id || provider.id}`} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition flex items-center gap-2 shadow-lg shadow-blue-200">
                  <MessageCircle className="w-5 h-5" /> Message
                </Link>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mt-10">
              <div className="md:col-span-2 space-y-10">
                <section>
                  <h2 className="text-xl font-bold text-gray-900 mb-3">About this Pro</h2>
                  <p className="text-gray-600 leading-relaxed text-lg">
                    {provider.description || 'No description available.'}
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Services & Skills</h2>
                  <div className="flex flex-wrap gap-2">
                    {(provider.tags && provider.tags.length > 0) ? provider.tags.map(tag => (
                      <span key={tag} className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded-full text-sm font-medium border border-gray-200">{tag}</span>
                    )) : <p className="text-gray-500">No tags listed.</p>}
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Customer Reviews</h2>
                  <div className="space-y-6">
                    {reviews.length > 0 ? reviews.map((review) => (
                      <div key={review._id || `${review.userId}-${review.date}`} className="bg-gray-50 p-6 rounded-2xl">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                              {(review.userName?.[0] || 'U')}
                            </div>
                            <span className="font-bold text-gray-900">{review.userName || 'User'}</span>
                          </div>
                          <span className="text-xs text-gray-500 font-medium">{new Date(review.date || Date.now()).toLocaleDateString()}</span>
                        </div>

                        <div className="flex text-yellow-400 mb-3">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < (review.rating || 0) ? 'text-yellow-400' : 'text-gray-200'}`} />
                          ))}
                        </div>

                        <p className="text-gray-600">{review.comment}</p>
                      </div>
                    )) : (
                      <p className="text-gray-500 italic">No reviews yet.</p>
                    )}
                  </div>
                </section>
              </div>

              <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm sticky top-24">
                  <h3 className="text-gray-900 font-bold mb-6 text-lg">Service Details</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600"><Calendar className="w-4 h-4" /></div>
                        <span className="text-sm text-gray-600">Availability</span>
                      </div>
                      <span className="font-bold text-green-600 text-sm">{provider.availability || 'Check availability'}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600"><span className="text-sm font-bold">₹</span></div>
                        <span className="text-sm text-gray-600">Rate</span>
                      </div>
                      <span className="font-bold text-gray-900">₹{provider.hourlyRate ?? '—'}/hr</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Mera Pind Guarantee</h4>
                    <div className="flex gap-3 items-start">
                      <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Your happiness is our priority. If you're not satisfied with the service, we'll work to make it right.
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 md:hidden flex gap-3 z-50 safe-area-pb shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <a href={`tel:${(provider as any).phone ?? ''}`} className="flex-1 bg-white border-2 border-gray-200 text-gray-900 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 active:bg-gray-50">
          <Phone className="w-5 h-5" /> Call
        </a>
        <Link href={`/chat?providerId=${provider._id || provider.id}`} className="flex-1 bg-blue-600 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-200 active:bg-blue-700">
          <MessageCircle className="w-5 h-5" /> Chat
        </Link>
      </div>
    </div>
  );
}
