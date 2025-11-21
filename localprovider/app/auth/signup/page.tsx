// app/auth/signup/page.tsx
'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock, Chrome, User as UserIcon, Briefcase, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import SEO from '../../../components/SEO';

export default function SignupPage() {
  const router = useRouter();
  const [userType, setUserType] = useState<'user' | 'provider'>('user');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    businessName: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState('');
  const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  // path to uploaded image (tooling will map /mnt/data/... -> URL)
  const logoSrc = '/mnt/data/54cf9bd9-2260-4dfa-a82c-a4f18e3bc522.png';

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (userType === 'provider' && !form.businessName.trim()) e.businessName = 'Business name is required for providers';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError('');
    const eMap = validate();
    setErrors(eMap);
    if (Object.keys(eMap).length) return;
    setBusy(true);

    try {
      const payload: Record<string, any> = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        // FIXED: userType is 'user' | 'provider' — backend expects 'USER' or 'PROVIDER'
        role: userType === 'provider' ? 'PROVIDER' : 'USER'
      };
      if (userType === 'provider') payload.businessName = form.businessName.trim();

      const res = await fetch(`${BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = json?.error || json?.message || `HTTP ${res.status}`;
        throw new Error(msg);
      }

      // expected: { ok: true, user, token }
      if (json?.token) {
        try { localStorage.setItem('token', json.token); } catch { }
      }
      if (json?.user) {
        try { localStorage.setItem('user', JSON.stringify(json.user)); } catch {}
        try { sessionStorage.setItem('user', JSON.stringify(json.user)); } catch {}
      }

      // redirect to dashboard or homepage
      if (json?.user?.role === 'PROVIDER') {
        router.push('/provider/create');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setServerError(err?.message || 'Server error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <SEO title="Sign Up" description="Join Mera Pind as a user or service provider." />

      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 -z-20" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-200 rounded-full blur-3xl opacity-50 -z-10" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-200 rounded-full blur-3xl opacity-50 -z-10" />

      <div className="max-w-md w-full space-y-8 bg-white/80 backdrop-blur-xl p-8 md:p-10 rounded-3xl shadow-2xl border border-white/50">
        <div>
          <Link href="/" className="inline-flex items-center text-sm text-gray-500 hover:text-blue-600 transition-colors mb-6">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Home
          </Link>

          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-200">
            {/* image/logo - using provided path */}
            <Image src={logoSrc} alt="Mera Pind logo" width={40} height={40} className="rounded-md object-cover" />
          </div>

          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Create your account</h2>
          <p className="mt-2 text-sm text-gray-600">Join our community of professionals and clients</p>
        </div>

        {/* User / Provider toggle */}
        <div className="flex p-1.5 bg-gray-100/80 rounded-2xl">
          <button
            onClick={() => setUserType('user')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${userType === 'user' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
            type="button"
          >
            <UserIcon className="w-4 h-4" /> User
          </button>
          <button
            onClick={() => setUserType('provider')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${userType === 'provider' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
            type="button"
          >
            <Briefcase className="w-4 h-4" /> Service Provider
          </button>
        </div>

        {serverError && (
          <div className="bg-rose-50 text-rose-700 px-3 py-2 rounded-md text-sm">
            {serverError}
          </div>
        )}

        <form className="mt-6 space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="space-y-4">
            {userType === 'provider' && (
              <div className="group">
                <label htmlFor="business-name" className="block text-xs font-medium text-gray-700 ml-1 mb-1">Business Name</label>
                <input
                  id="business-name"
                  name="businessName"
                  type="text"
                  value={form.businessName}
                  onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                  required
                  className={`appearance-none rounded-xl w-full px-4 py-3.5 border ${errors.businessName ? 'border-rose-400' : 'border-gray-200'} bg-gray-50 focus:bg-white placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm`}
                  placeholder="e.g. Joe's Plumbing"
                />
                {errors.businessName && <p className="text-rose-600 text-sm mt-1">{errors.businessName}</p>}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-xs font-medium text-gray-700 ml-1 mb-1">Full name</label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className={`appearance-none rounded-xl w-full px-4 py-3.5 border ${errors.name ? 'border-rose-400' : 'border-gray-200'} bg-gray-50 focus:bg-white placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm`}
                placeholder="Jane Doe"
              />
              {errors.name && <p className="text-rose-600 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-medium text-gray-700 ml-1 mb-1">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  className={`appearance-none rounded-xl w-full pl-11 px-4 py-3.5 border ${errors.email ? 'border-rose-400' : 'border-gray-200'} bg-gray-50 focus:bg-white placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm`}
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && <p className="text-rose-600 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-gray-700 ml-1 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  className={`appearance-none rounded-xl w-full pl-11 px-4 py-3.5 border ${errors.password ? 'border-rose-400' : 'border-gray-200'} bg-gray-50 focus:bg-white placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm`}
                  placeholder="At least 8 characters"
                />
              </div>
              {errors.password && <p className="text-rose-600 text-sm mt-1">{errors.password}</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-medium text-gray-700 ml-1 mb-1">Confirm password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                required
                className={`appearance-none rounded-xl w-full px-4 py-3.5 border ${errors.confirmPassword ? 'border-rose-400' : 'border-gray-200'} bg-gray-50 focus:bg-white placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm`}
                placeholder="Repeat password"
              />
              {errors.confirmPassword && <p className="text-rose-600 text-sm mt-1">{errors.confirmPassword}</p>}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
              <span className="ml-2 text-sm text-gray-600">Agree to terms</span>
            </label>
          </div>

          <div>
            <button
              type="submit"
              disabled={busy}
              className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg transition-all transform hover:-translate-y-0.5"
            >
              {busy ? 'Creating account…' : 'Create Account'}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white/50 backdrop-blur-sm text-gray-500 rounded-full">Or continue with</span>
            </div>
          </div>

          <div className="mt-6">
            <button className="w-full inline-flex justify-center items-center py-3.5 px-4 border border-gray-200 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all transform hover:-translate-y-0.5">
              <Chrome className="w-5 h-5 text-red-500 mr-3" />
              <span>Google</span>
            </button>
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-bold text-blue-600 hover:text-blue-500">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
