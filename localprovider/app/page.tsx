'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, ArrowRight, Sparkles, MapPin, Shield, Clock } from 'lucide-react';
import ServiceCard from '../components/ServiceCard';
import SEO from '../components/SEO';
import { CATEGORIES } from '../constants';
import type { ServiceProvider } from '../types';
import { getUserLocation, distanceKm } from '../utils/geo';

type ServiceWithDistance = ServiceProvider & { distanceKm?: number };

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');

  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [providers, setProviders] = useState<ServiceWithDistance[] | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  // show only providers within NEARBY_KM when true
  const [showOnlyNearby, setShowOnlyNearby] = useState(true);
  const NEARBY_KM = 5;

  // Fetch providers from server
  const fetchProviders = useCallback(
    async (lat?: number, lng?: number) => {
      try {
        // build query params if we have coords (server may support geo filtering)
        const params = new URLSearchParams();
        if (typeof lat === 'number' && typeof lng === 'number') {
          params.set('lat', String(lat));
          params.set('lng', String(lng));
        }
        const url = `${BASE_URL}/api/providers${params.toString() ? `?${params.toString()}` : ''}`;
        const res = await fetch(url, { credentials: 'include' });
        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          throw new Error(`Failed to load providers: ${res.status} ${res.statusText} ${txt}`);
        }
        const list = await res.json();
        if (!Array.isArray(list)) {
          // some controllers return object or { providers: [...] }
          const arr = (list && (list.providers || list.data)) ? (list.providers || list.data) : [];
          if (!Array.isArray(arr)) throw new Error('Invalid providers response');
          return arr as ServiceProvider[];
        }
        return list as ServiceProvider[];
      } catch (err) {
        console.error('fetchProviders error', err);
        throw err;
      }
    },
    []
  );

  // initial load: detect location & fetch providers
  useEffect(() => {
    let mounted = true;

    (async () => {
      setLocating(true);
      try {
        const coords = await getUserLocation();
        if (!mounted) return;

        setUserCoords(coords);
        setLocationError(null);

        // fetch providers with coords (server may use these to sort/filter)
        const list = await fetchProviders(coords.lat, coords.lng);
        if (!mounted) return;

        const enriched = list.map((p: ServiceProvider) => {
          const hasCoords = typeof (p as any).lat === 'number' && typeof (p as any).lng === 'number';
          if (!hasCoords) return { ...(p as ServiceProvider), distanceKm: undefined };
          const dist = distanceKm(coords, { lat: (p as any).lat as number, lng: (p as any).lng as number });
          return { ...(p as ServiceProvider), distanceKm: Math.round(dist * 10) / 10 };
        });

        // sort by distance if available, otherwise by rating and reviewCount
        enriched.sort((a, b) => {
          const ad = a.distanceKm ?? Number.POSITIVE_INFINITY;
          const bd = b.distanceKm ?? Number.POSITIVE_INFINITY;
          if (ad !== bd) return ad - bd;
          // fallback sort: rating desc then reviewCount desc
          const ra = (a as any).rating ?? 0;
          const rb = (b as any).rating ?? 0;
          if (ra !== rb) return rb - ra;
          const ca = (a as any).reviewCount ?? 0;
          const cb = (b as any).reviewCount ?? 0;
          return cb - ca;
        });

        setProviders(enriched);
      } catch (err: any) {
        console.warn('Location or providers fetch failed:', err?.message || err);
        setLocationError('Unable to detect location or load providers. Showing available providers.');
        try {
          // fallback: fetch providers without coords
          const list = await fetchProviders();
          if (!mounted) return;
          const fallback = list.map((p: ServiceProvider) => ({ ...(p as ServiceProvider), distanceKm: undefined }));
          setProviders(fallback);
        } catch (err2) {
          console.error('fallback fetchProviders failed', err2);
          setProviders([]);
        }
      } finally {
        if (mounted) setLocating(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [fetchProviders]);

  const handleRetryLocation = useCallback(async () => {
    setLocating(true);
    setLocationError(null);
    try {
      const coords = await getUserLocation();
      setUserCoords(coords);

      const list = await fetchProviders(coords.lat, coords.lng);
      const enriched = list.map((p: ServiceProvider) => {
        const hasCoords = typeof (p as any).lat === 'number' && typeof (p as any).lng === 'number';
        if (!hasCoords) return { ...(p as ServiceProvider), distanceKm: undefined };
        const dist = distanceKm(coords, { lat: (p as any).lat as number, lng: (p as any).lng as number });
        return { ...(p as ServiceProvider), distanceKm: Math.round(dist * 10) / 10 };
      });

      enriched.sort((a, b) => {
        const ad = a.distanceKm ?? Number.POSITIVE_INFINITY;
        const bd = b.distanceKm ?? Number.POSITIVE_INFINITY;
        if (ad !== bd) return ad - bd;
        const ra = (a as any).rating ?? 0;
        const rb = (b as any).rating ?? 0;
        if (ra !== rb) return rb - ra;
        const ca = (a as any).reviewCount ?? 0;
        const cb = (b as any).reviewCount ?? 0;
        return cb - ca;
      });

      setProviders(enriched);
      setLocationError(null);
    } catch (err) {
      console.warn('retry location failed', err);
      setLocationError('Unable to detect location. Showing all providers.');
      // try loading without coords
      try {
        const list = await fetchProviders();
        setProviders(list.map((p: ServiceProvider) => ({ ...(p as ServiceProvider), distanceKm: undefined })));
      } catch {
        setProviders([]);
      }
    } finally {
      setLocating(false);
    }
  }, [fetchProviders]);

  // base list (location-sorted if available)
  const baseProviders: ServiceWithDistance[] = providers ?? [];

  // search filter
  const search = searchQuery.trim().toLowerCase();
  const filteredBySearch = search
    ? baseProviders.filter((p) => {
        const name = (p.name || '').toLowerCase();
        const category = (p.category || '').toLowerCase();
        const loc = (p.location || '').toLowerCase();
        return name.includes(search) || category.includes(search) || loc.includes(search);
      })
    : baseProviders;

  // nearby filter
  const displayedProviders = showOnlyNearby
    ? filteredBySearch.filter((p) => typeof p.distanceKm === 'number' && p.distanceKm <= NEARBY_KM)
    : filteredBySearch;

  return (
    <div className="bg-white">
      <SEO
        title="Home - Find Local Pros"
        description="Connect with trusted local plumbers, electricians, cleaners and more near you."
      />

      {/* Hero Section */}
      <section className="relative bg-slate-900 pt-24 pb-32 overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(#4b5563 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-full px-4 py-1.5 mb-8 shadow-lg animate-fade-in">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className="text-gray-200 text-xs font-semibold uppercase tracking-wider">
              Local Home Services
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-8 leading-tight">
            Home services, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400">
              made simple.
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-300 mb-12 leading-relaxed">
            Find trusted plumbers, electricians, cleaners and more in your area. Use the toggle to
            view only providers within {NEARBY_KM} km.
          </p>

          {/* Simple Search Bar */}
          <div className="max-w-3xl mx-auto relative z-20">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-emerald-500 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500" />
              <div className="relative bg-white rounded-2xl shadow-2xl flex items-center p-2 transform transition-transform duration-200 group-hover:-translate-y-1">
                <div className="pl-4 text-gray-400">
                  <Search className="w-6 h-6" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by service, name, or area"
                  className="w-full p-4 text-gray-800 text-lg outline-none placeholder-gray-400 bg-transparent"
                />
              </div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 flex flex-wrap justify-center gap-6 text-gray-400 text-sm font-medium">
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4" /> Verified Pros
            </span>
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4" /> Instant Chat
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Nearby Experts
            </span>
          </div>
        </div>
      </section>

      {/* Location Status Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-200">
          <div className="text-sm text-gray-700">
            {locating
              ? 'Detecting your location…'
              : userCoords
              ? `Showing providers near you (${userCoords.lat.toFixed(3)}, ${userCoords.lng.toFixed(3)})`
              : locationError ?? 'Location unavailable'}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRetryLocation}
              className="text-sm bg-blue-600 text-white px-3 py-1 rounded-md"
            >
              {locating ? 'Retrying...' : 'Retry'}
            </button>

            <button
              onClick={() => {
                const next = !showOnlyNearby;
                setShowOnlyNearby(next);
                if (!next) {
                  // user wants to show all -> don't clear providers, just show all
                  setUserCoords(null);
                  setLocationError(null);
                } else {
                  handleRetryLocation();
                }
              }}
              className="text-sm px-3 py-1 rounded-md border"
            >
              {showOnlyNearby ? `Only within ${NEARBY_KM} km` : 'Show All'}
            </button>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Explore Services</h2>
              <p className="text-gray-500 mt-2">Common categories for home maintenance</p>
            </div>
            <Link
              href="/explore"
              className="text-blue-600 font-semibold hover:text-blue-700 flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {CATEGORIES.map((cat) => (
              <div
                key={cat.id}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-blue-100/50 hover:border-blue-100 transition-all duration-300 cursor-pointer text-center group transform hover:-translate-y-1"
              >
                <div
                  className={`w-14 h-14 mx-auto ${cat.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  <span className="text-xl font-bold">{cat.name[0]}</span>
                </div>
                <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                  {cat.name}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Providers Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-gray-900">Top Rated Professionals</h2>
            <p className="text-gray-500 mt-2">
              {showOnlyNearby
                ? `Showing providers within ${NEARBY_KM} km`
                : 'Showing all providers'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {providers === null ? (
              <div className="col-span-full py-16 text-center">Loading providers…</div>
            ) : displayedProviders.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-3xl border border-dashed border-gray-300 col-span-full">
                {showOnlyNearby ? (
                  <>
                    <p className="text-gray-500 text-lg mb-4">
                      No providers found within {NEARBY_KM} km of your location.
                    </p>
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => {
                          setShowOnlyNearby(false);
                        }}
                        className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-50"
                      >
                        Show All Providers
                      </button>
                      <button
                        onClick={handleRetryLocation}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700"
                      >
                        Retry Location
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-gray-500 text-lg mb-4">No providers match your search.</p>
                )}
              </div>
            ) : (
              displayedProviders.map((provider) => (
                <div key={(provider as any)._id || (provider as any).id}>
                  <ServiceCard provider={provider} />
                  {provider.distanceKm !== undefined &&
                    provider.distanceKm !== Number.POSITIVE_INFINITY && (
                      <div className="text-xs text-gray-500 mt-1">{provider.distanceKm} km away</div>
                    )}
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-blue-600 font-bold tracking-wider uppercase text-sm mb-2 block">
            Simple Process
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-16">
            How Mera Pind Works
          </h2>
          <div className="grid md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-8 left-[20%] right-[20%] h-0.5 bg-gray-100 -z-10" />
            <div className="flex flex-col items-center group">
              <div className="w-20 h-20 bg-white border-2 border-blue-100 text-blue-600 rounded-3xl flex items-center justify-center mb-8 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">1. Search</h3>
              <p className="text-gray-500 leading-relaxed max-w-xs">
                Search by service type, provider name, or your area.
              </p>
            </div>
            <div className="flex flex-col items-center group">
              <div className="w-20 h-20 bg-white border-2 border-purple-100 text-purple-600 rounded-3xl flex items-center justify-center mb-8 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">2. Compare</h3>
              <p className="text-gray-500 leading-relaxed max-w-xs">
                Check ratings, reviews, and distance from your location.
              </p>
            </div>
            <div className="flex flex-col items-center group">
              <div className="w-20 h-20 bg-white border-2 border-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mb-8 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Clock className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">3. Connect</h3>
              <p className="text-gray-500 leading-relaxed max-w-xs">
                Chat or call the pro directly and get your job done quickly.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
