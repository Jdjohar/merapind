// components/ServiceCard.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, MapPin, CheckCircle, MessageCircle } from 'lucide-react';
import type { ServiceProvider } from '../types';

interface ServiceCardProps {
  provider: ServiceProvider & { distanceKm?: number; _id?: string; phone?: string };
}

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

const ServiceCard: React.FC<ServiceCardProps> = ({ provider }) => {
  // ID resolution
  const rawId =
    (provider as any)._id ??
    (provider as any).id ??
    (provider as any).providerId ??
    null;

  const id = rawId != null ? String(rawId) : null;

  // Correct route: app/providers/[id]/page.tsx -> /providers/:id
  const profileHref = id ? `/provider/${id}` : '/providers';
  const chatHref = id ? `/chat?providerId=${encodeURIComponent(id)}` : '/chat';

  // Whatsapp deep link
  const phone = provider.phone ?? (provider as any).phone ?? null;
  const whatsappHref =
    phone && id
      ? `https://wa.me/${phone}?text=${encodeURIComponent(
          `Hi, I'm interested in your services (${provider.name || 'your listing'}) on Mera Pind.`
        )}`
      : null;

  const imgSrc =
    (provider as any).imageUrl ||
    (provider as any).image ||
    '/placeholder.png';

  const title =
    provider.name || (provider as any).businessName || 'Unnamed provider';
  const category =
    provider.category || (provider as any).service || 'General';
  const price = provider.hourlyRate ?? null;

  return (
    <div className="group flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1">
      <div className="relative h-48 overflow-hidden bg-gray-50">
        <Image
          src={imgSrc}
          alt={title}
          width={1200}
          height={600}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          unoptimized
        />
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-gray-800 shadow-sm">
          {price ? `Rs. ${price}/hr` : '—'}
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
              {provider.isVerified && (
                <CheckCircle className="w-4 h-4 text-blue-500" />
              )}
            </h3>
          </div>

          <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-md">
            <Star className="w-4 h-4 text-yellow-400" />
            <span className="ml-1 text-sm font-bold text-gray-900">
              {provider.rating ?? '—'}
            </span>
            <span className="ml-1 text-xs text-gray-500">
              ({provider.reviewCount ?? 0})
            </span>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {provider.description}
        </p>

        <div className="flex items-center text-xs text-gray-500 mb-4">
          <MapPin className="w-3 h-3 mr-1" />
          <span>{provider.location ?? 'Location not set'}</span>
          {provider.distanceKm !== undefined &&
            provider.distanceKm !== Number.POSITIVE_INFINITY && (
              <span className="ml-2 text-xs text-gray-400">
                • {provider.distanceKm} km
              </span>
            )}
        </div>

        <div className="mt-auto pt-4 border-t border-gray-100 flex gap-2">
          {/* View Profile */}
          <Link
            href={profileHref}
            className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-900 text-center py-2.5 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2"
            aria-label={`View profile of ${title}`}
          >
            View Profile
          </Link>

          {/* Chat */}
          <Link
            href={id ? chatHref : '#'}
            className={`flex items-center justify-center px-4 rounded-xl transition-colors ${
              id
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
            aria-label={id ? `Chat with ${title}` : 'Chat (no provider selected)'}
            tabIndex={id ? 0 : -1}
          >
            <MessageCircle className="w-5 h-5" />
          </Link>

          {/* WhatsApp */}
          <a
            href={whatsappHref ?? '#'}
            target={whatsappHref ? '_blank' : undefined}
            rel={whatsappHref ? 'noopener noreferrer' : undefined}
            className={`flex items-center justify-center px-4 rounded-xl transition-colors ${
              whatsappHref
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
            aria-label={
              whatsappHref
                ? `WhatsApp ${title}`
                : 'WhatsApp (phone not available)'
            }
            tabIndex={whatsappHref ? 0 : -1}
          >
            <WhatsAppIcon className="w-5 h-5" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ServiceCard);
