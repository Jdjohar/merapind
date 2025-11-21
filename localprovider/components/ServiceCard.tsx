// components/ServiceCard.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Star, MapPin, CheckCircle, MessageCircle } from 'lucide-react';
import type { ServiceProvider } from '../types';

interface ServiceCardProps {
  provider: ServiceProvider & { distanceKm?: number };
}

const ServiceCard: React.FC<ServiceCardProps> = ({ provider }) => {
  // Robust id resolution: prefer Mongo `_id`, then `id`, then other possible fields
  const id =
    (provider as any)._id?.toString?.() ||
    (provider as any).id ||
    (provider as any).providerId ||
    (provider as any).userId ||
    null;

  // Destination: provider detail page (ensure you have app/providers/[id]/page.tsx)
  const href = id ? `/provider/${id}` : '/providers';

  const imgSrc = provider.imageUrl || provider.image || '/placeholder.png';
  const title = provider.name || provider.businessName || 'Unnamed provider';
  const category = provider.category || provider.service || 'General';

  return (
    <div className="group flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1">
      <div className="relative h-48 overflow-hidden bg-gray-50">
        {/* Safe image rendering */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt={title}
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.png'; }}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-gray-800 shadow-sm">
          Rs. {provider.hourlyRate ?? '—'}/hr
        </div>
      </div>

      <div className="flex-1 p-5 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">
              {category}
            </p>
            <h3 className="text-lg font-bold text-gray-900 leading-tight flex items-center gap-1">
              {title}
              {provider.isVerified && <CheckCircle className="w-4 h-4 text-blue-500" />}
            </h3>
          </div>
          <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-md">
            <Star className="w-4 h-4 text-yellow-400" />
            <span className="ml-1 text-sm font-bold text-gray-900">{provider.rating ?? '—'}</span>
            <span className="ml-1 text-xs text-gray-500">({provider.reviewCount ?? 0})</span>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{provider.description}</p>

        <div className="flex items-center text-xs text-gray-500 mb-4">
          <MapPin className="w-3 h-3 mr-1" />
          <span>{provider.location ?? 'Location not set'}</span>
          {provider.distanceKm !== undefined &&
            provider.distanceKm !== Number.POSITIVE_INFINITY && (
              <span className="ml-2 text-xs text-gray-400">• {provider.distanceKm} km</span>
            )}
        </div>

        <div className="mt-auto pt-4 border-t border-gray-100 flex gap-2">
          <Link
            href={href}
            className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-900 text-center py-2.5 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2"
          >
            View Profile
          </Link>

          {/* If you want chat to include provider id, change href below to `/chat?providerId=${id}` */}
          <Link
            href="/chat"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-xl flex items-center justify-center transition-colors"
            aria-label="Chat"
          >
            <MessageCircle className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;
