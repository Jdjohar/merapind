// app/profile/edit/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  ArrowLeft,
  Save,
  User as UserIcon,
  Phone,
  MapPin,
  BadgeCheck,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

type Role = 'USER' | 'PROVIDER' | string;

type MeUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt?: string;
  phone?: string;
  address?: string;
  lat?: number;
  lng?: number;
};

type MeProviderSummary = {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviewCount: number;
  hourlyRate?: number;
  imageUrl?: string;
  phone?: string;
  location?: string;
  isVerified?: boolean;
};

type MeResponse = {
  user: MeUser;
  provider?: MeProviderSummary | null;
};

type ProviderFull = {
  _id: string;
  userId: string;
  name: string;
  category: string;
  description?: string;
  hourlyRate?: number;
  imageUrl?: string;
  phone?: string;
  location?: string;
  availability?: string;
  tags?: string[];
  isVerified?: boolean;
};

function getTokenFromStorage(): string | null {
  try {
    if (typeof window === 'undefined') return null;
    return (
      localStorage.getItem('token') ||
      sessionStorage.getItem('token') ||
      null
    );
  } catch {
    return null;
  }
}

export default function EditProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<MeUser | null>(null);
  const [provider, setProvider] = useState<ProviderFull | null>(null);

  // user fields
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userAddress, setUserAddress] = useState('');

  // provider fields
  const [provName, setProvName] = useState('');
  const [provPhone, setProvPhone] = useState('');
  const [provCategory, setProvCategory] = useState('');
  const [provDescription, setProvDescription] = useState('');
  const [provHourlyRate, setProvHourlyRate] = useState('');
  const [provLocation, setProvLocation] = useState('');
  const [provAvailability, setProvAvailability] = useState('');
  const [provImageFile, setProvImageFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(true);
  const [userSaving, setUserSaving] = useState(false);
  const [providerSaving, setProviderSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userSuccess, setUserSuccess] = useState<string | null>(null);
  const [providerSuccess, setProviderSuccess] = useState<string | null>(null);

  useEffect(() => {
    const token = getTokenFromStorage();
    if (!token) {
      setLoading(false);
      setError('You are not logged in.');
      return;
    }

    let mounted = true;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        // 1. Load /me
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          console.error('/me error', res.status, txt);
          if (!mounted) return;
          setError('Failed to load profile. Please login again.');
          setLoading(false);
          return;
        }

        const data: MeResponse = await res.json();
        if (!mounted) return;

        setUser(data.user);
        setUserName(data.user.name || '');
        setUserPhone(data.user.phone || '');
        setUserAddress(data.user.address || '');

        // 2. If provider, load full provider document
        const provSummary = data.provider;
        if (provSummary && data.user.role === 'PROVIDER') {
          const pRes = await fetch(`${API_BASE}/api/providers/me`, {
            method: 'GET',
            credentials: 'include',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (pRes.ok) {
            const pJson: ProviderFull = await pRes.json();
            if (!mounted) return;
            setProvider(pJson);

            setProvName(pJson.name || '');
            setProvPhone(pJson.phone || '');
            setProvCategory(pJson.category || '');
            setProvDescription(pJson.description || '');
            setProvHourlyRate(
              pJson.hourlyRate != null ? String(pJson.hourlyRate) : ''
            );
            setProvLocation(pJson.location || '');
            setProvAvailability(pJson.availability || '');
          } else {
            console.warn('Failed to load provider/me');
            if (!mounted) return;
            setProvider(null);
          }
        }
      } catch (err) {
        console.error('edit profile load error', err);
        if (!mounted) return;
        setError('Server error while loading profile.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const handleUserSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const token = getTokenFromStorage();
    if (!token) {
      setError('You are not logged in.');
      return;
    }

    setUserSaving(true);
    setUserSuccess(null);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: userName,
          phone: userPhone,
          address: userAddress,
        }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        console.error('updateMe error', res.status, txt);
        setError('Failed to update user profile.');
        return;
      }

      const data: MeResponse = await res.json();
      setUser(data.user);
      setUserSuccess('Profile updated successfully.');
    } catch (err) {
      console.error('updateMe error', err);
      setError('Server error while updating user profile.');
    } finally {
      setUserSaving(false);
    }
  };

  const handleProviderSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.role !== 'PROVIDER') return;

    const token = getTokenFromStorage();
    if (!token) {
      setError('You are not logged in.');
      return;
    }

    setProviderSaving(true);
    setProviderSuccess(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('name', provName);
      formData.append('phone', provPhone);
      formData.append('category', provCategory);
      formData.append('description', provDescription);
      if (provHourlyRate) formData.append('hourlyRate', provHourlyRate);
      formData.append('location', provLocation);
      formData.append('availability', provAvailability);

      if (provImageFile) {
        formData.append('image', provImageFile);
      }

      // If provider exists -> update, otherwise -> create
      const isUpdate = !!provider && !!provider._id;
      const url = isUpdate
        ? `${API_BASE}/api/providers/${provider._id}`
        : `${API_BASE}/api/providers`;
      const method = isUpdate ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        console.error('save provider error', res.status, txt);
        setError(
          isUpdate
            ? 'Failed to update provider profile.'
            : 'Failed to create provider profile.'
        );
        return;
      }

      const updated: ProviderFull = await res.json();
      setProvider(updated);

      setProvName(updated.name || '');
      setProvPhone(updated.phone || '');
      setProvCategory(updated.category || '');
      setProvDescription(updated.description || '');
      setProvHourlyRate(
        updated.hourlyRate != null ? String(updated.hourlyRate) : ''
      );
      setProvLocation(updated.location || '');
      setProvAvailability(updated.availability || '');

      setProviderSuccess(
        isUpdate
          ? 'Provider profile updated successfully.'
          : 'Provider profile created successfully.'
      );
    } catch (err) {
      console.error('save provider error', err);
      setError('Server error while saving provider profile.');
    } finally {
      setProviderSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading profile...</span>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50">
        <div className="bg-white shadow-md rounded-2xl p-8 max-w-md w-full text-center">
          <p className="text-red-500 font-semibold mb-4">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isProvider = user.role === 'PROVIDER';

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 text-xs sm:text-sm text-red-600">{error}</div>
        )}

        <div className="space-y-8">
          {/* USER FORM ONLY when role = USER */}
          {!isProvider && (
            <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                    Edit Profile
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Update your basic account information.
                  </p>
                </div>
              </div>

              {userSuccess && (
                <div className="mb-4 text-xs sm:text-sm text-green-600">
                  {userSuccess}
                </div>
              )}

              <form onSubmit={handleUserSave} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Name
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-400">
                      <UserIcon className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Your name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Phone
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-400">
                      <Phone className="w-4 h-4" />
                    </span>
                    <input
                      type="tel"
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Phone number"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Address
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-400">
                      <MapPin className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={userAddress}
                      onChange={(e) => setUserAddress(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Your address"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={userSaving}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
                  >
                    {userSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* PROVIDER FORM ONLY when role = PROVIDER (create or update) */}
          {isProvider && (
            <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white">
                  <BadgeCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                    {provider ? 'Edit Provider Profile' : 'Create Provider Profile'}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500">
                    {provider
                      ? 'Update details shown on your public provider page.'
                      : 'Set up your provider profile so customers can find and contact you.'}
                  </p>
                </div>
              </div>

              {providerSuccess && (
                <div className="mb-4 text-xs sm:text-sm text-green-600">
                  {providerSuccess}
                </div>
              )}

              <form onSubmit={handleProviderSave} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Provider Name
                    </label>
                    <input
                      type="text"
                      value={provName}
                      onChange={(e) => setProvName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Business / professional name"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Provider Phone
                    </label>
                    <input
                      type="tel"
                      value={provPhone}
                      onChange={(e) => setProvPhone(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Contact phone for customers"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      value={provCategory}
                      onChange={(e) => setProvCategory(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="e.g. Plumber, Electrician"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Hourly Rate (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={provHourlyRate}
                      onChange={(e) => setProvHourlyRate(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="e.g. 500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={provLocation}
                    onChange={(e) => setProvLocation(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Area / city you serve"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Availability
                  </label>
                  <input
                    type="text"
                    value={provAvailability}
                    onChange={(e) => setProvAvailability(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="e.g. Available Mon–Sat, 9am–6pm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    value={provDescription}
                    onChange={(e) => setProvDescription(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Describe your experience, services, and what makes you trustworthy."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Profile Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setProvImageFile(
                        e.target.files && e.target.files[0]
                          ? e.target.files[0]
                          : null
                      )
                    }
                    className="block w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                  />
                  {provider?.imageUrl && (
                    <div className="mt-2">
                      <span className="text-xs text-gray-500">
                        Current image:
                      </span>
                      <div className="mt-1">
                        <img
                          src={provider.imageUrl}
                          alt="Provider"
                          className="w-20 h-20 rounded-xl object-cover border border-gray-200"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={providerSaving}
                    style={{ backgroundColor: '#000000ff' }}
                    className="bg-blue inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {providerSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {provider
                          ? 'Save Provider Profile'
                          : 'Create Provider Profile'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
