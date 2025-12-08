// app/providers/[id]/page.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Star,
  MapPin,
  Phone,
  MessageCircle,
  ArrowLeft,
  Calendar,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
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
  // phone is not in your schema but you were already using it via "as any"
  phone?: string;
};

type Service = {
  _id?: string;
  id?: string;
  title: string;
  slug?: string;
  category?: string;
  description?: string;
  price?: number;
  durationMinutes?: number;
  imageUrl?: string;
  images?: string[];
  location?: string;
};

export default function ProviderDetailPageClient() {
  const params = useParams();
  const id = params?.id as string | undefined;

  const [provider, setProvider] = useState<Provider | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const servicesSliderRef = useRef<HTMLDivElement | null>(null);

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
        // 1. Provider
        const pRes = await fetch(`${BASE_URL}/api/providers/${id}`, {
          credentials: 'include',
        });
        if (!pRes.ok) {
          const txt = await pRes.text().catch(() => '');
          throw new Error(`Failed to load provider: ${pRes.status} ${txt}`);
        }
        const pJson = await pRes.json();
        const providerObj: Provider = pJson || {};
        if (!mounted) return;
        setProvider(providerObj);

        // 2. Reviews
        try {
          const rRes = await fetch(`${BASE_URL}/api/reviews/${id}`, {
            credentials: 'include',
          });
          if (rRes.ok) {
            const rJson = await rRes.json();
            if (Array.isArray(rJson)) setReviews(rJson);
            else if (rJson?.reviews) setReviews(rJson.reviews);
          } else {
            setReviews([]);
          }
        } catch {
          setReviews([]);
        }

        // 3. Services for this provider (public)
        try {
          const sRes = await fetch(
            `${BASE_URL}/api/services/public?providerId=${id}`,
            { credentials: 'include' }
          );
          if (sRes.ok) {
            const sJson = await sRes.json();
            const list: Service[] = Array.isArray(sJson?.services)
              ? sJson.services
              : Array.isArray(sJson)
              ? sJson
              : [];
            if (mounted) setServices(list);
          } else {
            if (mounted) setServices([]);
          }
        } catch {
          if (mounted) setServices([]);
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

  const scrollServices = (direction: 'left' | 'right') => {
    const el = servicesSliderRef.current;
    if (!el) return;
    const amount = 320; // px to scroll per click
    el.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  const buildChatHrefForService = (service: Service) => {
    const providerId = provider?._id || provider?.id || id;
    if (!providerId) return '#';
    const params = new URLSearchParams();
    params.set('providerId', String(providerId));
    if (service._id || service.id) {
      params.set('serviceId', String(service._id || service.id));
    }
    if (service.title) {
      params.set('serviceTitle', service.title);
    }
    return `/chat?${params.toString()}`;
  };

  const buildWhatsAppHrefForService = (service: Service) => {
    const phone =
      (provider as any)?.phone ||
      provider?.phone ||
      ''; // if you ever add phone to Provider model
    if (!phone) return '#';

    const providerName = provider?.name || 'provider';
    const serviceTitle = service.title || 'service';
    const text = encodeURIComponent(
      `Hi, I found your "${serviceTitle}" on Mera Pind and would like to know more.`
    );
    // basic wa.me pattern
    return `https://wa.me/${phone}?text=${text}`;
  };

  const WhatsAppIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16.01 6.003c-4.958 0-8.98 4.02-8.98 8.977 0 1.582.414 3.13 1.204 4.5l-1.28 4.67 4.78-1.255a8.93 8.93 0 0 0 4.276 1.09h.004c4.955 0 8.977-4.02 8.977-8.978 0-2.4-.936-4.657-2.636-6.355a8.93 8.93 0 0 0-6.347-2.649Zm0 1.8c1.93 0 3.742.752 5.107 2.118a7.16 7.16 0 0 1 2.102 5.06c0 3.95-3.215 7.165-7.163 7.165a7.13 7.13 0 0 1-3.617-.982l-.259-.148-2.836.746.758-2.76-.168-.283a7.13 7.13 0 0 1-1.08-3.78c0-3.946 3.213-7.16 7.156-7.16Zm-3.41 3.53c-.18 0-.467.067-.714.334-.247.267-.937.916-.937 2.233 0 1.316.96 2.587 1.094 2.764.135.177 1.84 2.936 4.51 3.996 2.223.88 2.675.79 3.156.74.48-.05 1.555-.635 1.775-1.25.22-.616.22-1.143.155-1.25-.064-.107-.247-.172-.52-.302-.272-.13-1.61-.793-1.86-.884-.247-.09-.427-.135-.607.135-.18.267-.697.883-.854 1.063-.158.18-.314.2-.587.07-.272-.13-1.15-.425-2.19-1.353-.81-.72-1.36-1.61-1.52-1.88-.158-.267-.017-.41.12-.54.123-.12.272-.31.408-.465.135-.155.18-.267.272-.445.09-.178.045-.334-.022-.465-.067-.13-.595-1.47-.842-2.02-.22-.51-.446-.53-.627-.536Z"
        fill="currentColor"
      />
    </svg>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        Loading provider…
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg border">
          <h2 className="text-xl font-bold text-rose-600">Error</h2>
          <p className="mt-2 text-sm text-gray-700">{error}</p>
          <div className="mt-4">
            <Link href="/providers" className="text-blue-600">
              Back to providers
            </Link>
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
          <Link
            href="/providers"
            className="text-blue-600 mt-4 inline-block"
          >
            Back to providers
          </Link>
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
        description={`${provider.name} — ${
          provider.category || ''
        }. ${provider.description?.slice(0, 160) || ''}`}
      />

      <div className="bg-white sticky top-16 z-40 border-b border-gray-200 px-4 py-3 flex items-center gap-4 md:hidden">
        <Link href="/" className="text-gray-600">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="font-bold text-lg truncate">{title}</h1>
      </div>

      <main className="max-w-5xl mx-auto md:py-8 md:px-4">
        <div className="bg-white md:rounded-3xl shadow-sm overflow-hidden">
          <div className="relative h-48 md:h-64 bg-gray-900">
            <img
              src={img}
              alt="Cover"
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          </div>

          <div className="px-4 pb-8 md:px-10 relative">
            <div className="flex flex-col md:flex-row items-start md:items-end -mt-12 md:-mt-16 mb-6 gap-4 md:gap-6">
              <img
                src={img}
                alt={title}
                className="w-24 h-24 md:w-32 md:h-32 rounded-2xl border-4 border-white shadow-lg object-cover bg-white"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/placeholder.png';
                }}
              />

              <div className="flex-1 text-white md:text-gray-900 md:mb-2">
                <div className="flex items-center gap-2">
                  <span className="bg-blue-600 text-white px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wide">
                    {provider.category}
                  </span>
                  {provider.isVerified && (
                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-md flex items-center gap-1 text-xs font-bold">
                      <ShieldCheck className="w-3 h-3" /> Verified Pro
                    </span>
                  )}
                </div>

                <h1 className="text-2xl md:text-4xl font-bold mt-2 mb-1">
                  {title}
                </h1>

                <div className="flex items-center gap-4 text-sm md:text-base text-gray-600 font-medium">
                  <span className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />{' '}
                    {provider.location || '—'}
                  </span>
                  <span className="flex items-center text-yellow-400 md:text-yellow-500 font-bold">
                    <Star className="w-4 h-4 mr-1" />{' '}
                    {provider.rating ?? '—'}
                    <span className="text-gray-400 md:text-gray-500 font-normal ml-1">
                      ({provider.reviewCount ?? 0} reviews)
                    </span>
                  </span>
                </div>
              </div>

              <div className="hidden md:flex gap-3 mb-2">
                <a
                  href={`tel:${(provider as any).phone ?? provider.phone ?? ''}`}
                  className="bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition flex items-center gap-2 shadow-sm"
                >
                  <Phone className="w-5 h-5" /> Call Now
                </a>

                <Link
                  href={`/chat?providerId=${provider._id || provider.id || id}`}
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition flex items-center gap-2 shadow-lg shadow-blue-200"
                >
                  <MessageCircle className="w-5 h-5" /> Message
                </Link>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mt-10">
              <div className="md:col-span-2 space-y-10">
                <section>
                  <h2 className="text-xl font-bold text-gray-900 mb-3">
                    About this Pro
                  </h2>
                  <p className="text-gray-600 leading-relaxed text-lg">
                    {provider.description || 'No description available.'}
                  </p>
                </section>

                {/* SERVICES SLIDER */}
                {services.length > 0 && (
                  <section>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-xl font-bold text-gray-900">
                        Services by {provider.name}
                      </h2>
                      <div className="hidden md:flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => scrollServices('left')}
                          className="p-1.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => scrollServices('right')}
                          className="p-1.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="relative">
                      <div
                        ref={servicesSliderRef}
                        className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
                      >
                        {services.map((service) => {
                          const sImg =
                            service.imageUrl ||
                            service.images?.[0] ||
                            '/placeholder.png';

                          return (
                            <div
                              key={service._id || service.id}
                              className="min-w-[260px] max-w-xs bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col"
                            >
                              <div className="h-32 w-full overflow-hidden rounded-t-2xl">
                                <img
                                  src={sImg}
                                  alt={service.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src =
                                      '/placeholder.png';
                                  }}
                                />
                              </div>
                              <div className="p-4 flex flex-col gap-2 flex-1">
                                <h3 className="font-semibold text-gray-900 line-clamp-2">
                                  {service.title}
                                </h3>
                                {service.description && (
                                  <p className="text-xs text-gray-500 line-clamp-2">
                                    {service.description}
                                  </p>
                                )}
                                <div className="mt-1 flex items-center justify-between text-sm text-gray-700">
                                  <span className="font-semibold">
                                    ₹{service.price ?? 0}
                                  </span>
                                  {service.durationMinutes && (
                                    <span className="text-xs text-gray-500">
                                      {service.durationMinutes} min
                                    </span>
                                  )}
                                </div>

                                <div className="mt-3 flex gap-2">
                                  <Link
                                    href={buildChatHrefForService(service)}
                                    className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white py-2 hover:bg-blue-700"
                                  >
                                    <MessageCircle className="w-4 h-4" />
                                    Chat
                                  </Link>

                                  <a
                                    href={buildWhatsAppHrefForService(service)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg py-2 ${
                                      (provider as any)?.phone ||
                                      provider.phone
                                        ? 'bg-green-500 text-white hover:bg-green-600'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    }`}
                                  >
                                    <WhatsAppIcon className="w-4 h-4" />
                                    WhatsApp
                                  </a>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </section>
                )}

                {/* <section>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Services & Skills
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {provider.tags && provider.tags.length > 0 ? (
                      provider.tags.map((tag) => (
                        <span
                          key={tag}
                          className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded-full text-sm font-medium border border-gray-200"
                        >
                          {tag}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-500">No tags listed.</p>
                    )}
                  </div>
                </section> */}

                <section>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">
                    Customer Reviews
                  </h2>
                  <div className="space-y-6">
                    {reviews.length > 0 ? (
                      reviews.map((review) => (
                        <div
                          key={review._id || `${review.userId}-${review.date}`}
                          className="bg-gray-50 p-6 rounded-2xl"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                {review.userName?.[0] || 'U'}
                              </div>
                              <span className="font-bold text-gray-900">
                                {review.userName || 'User'}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500 font-medium">
                              {new Date(
                                review.date || Date.now()
                              ).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="flex text-yellow-400 mb-3">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < (review.rating || 0)
                                    ? 'text-yellow-400'
                                    : 'text-gray-200'
                                }`}
                              />
                            ))}
                          </div>

                          <p className="text-gray-600">{review.comment}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 italic">No reviews yet.</p>
                    )}
                  </div>
                </section>
              </div>

              <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm sticky top-24">
                  <h3 className="text-gray-900 font-bold mb-6 text-lg">
                    Service Details
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <span className="text-sm text-gray-600">
                          Availability
                        </span>
                      </div>
                      <span className="font-bold text-green-600 text-sm">
                        {provider.availability || 'Check availability'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                          <span className="text-sm font-bold">₹</span>
                        </div>
                        <span className="text-sm text-gray-600">Rate</span>
                      </div>
                      <span className="font-bold text-gray-900">
                        ₹{provider.hourlyRate ?? '—'}/hr
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                      Mera Pind Guarantee
                    </h4>
                    <div className="flex gap-3 items-start">
                      <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Your happiness is our priority. If you're not satisfied
                        with the service, we'll work to make it right.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* MOBILE BOTTOM BAR */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 md:hidden flex gap-3 z-50 safe-area-pb shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <a
          href={`tel:${(provider as any).phone ?? provider.phone ?? ''}`}
          className="flex-1 bg-white border-2 border-gray-200 text-gray-900 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 active:bg-gray-50"
        >
          <Phone className="w-5 h-5" /> Call
        </a>
        <Link
          href={`/chat?providerId=${provider._id || provider.id || id}`}
          className="flex-1 bg-blue-600 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-200 active:bg-blue-700"
        >
          <MessageCircle className="w-5 h-5" /> Chat
        </Link>
      </div>
    </div>
  );
}
