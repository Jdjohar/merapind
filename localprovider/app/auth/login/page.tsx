'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, Chrome, ArrowLeft } from 'lucide-react';
import SEO from '../../../components/SEO';
import { useRouter } from 'next/navigation';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

function getTokenFromStorage() {
  try {
    return localStorage.getItem('token') || sessionStorage.getItem('token') || null;
  } catch {
    return null;
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Email and password are required');
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim().toLowerCase(), password })
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = json?.error || json?.message || `HTTP ${res.status}`;
        throw new Error(msg);
      }

      // expected: { user, token, provider? }
      try {
        // after successful login response (json contains token & user & provider)
        if (remember) {
          localStorage.setItem('token', json.token);
          localStorage.setItem('user', JSON.stringify(json.user));
          if (json.provider) localStorage.setItem('provider', JSON.stringify(json.provider));
        } else {
          sessionStorage.setItem('token', json.token);
          sessionStorage.setItem('user', JSON.stringify(json.user));
          if (json.provider) sessionStorage.setItem('provider', JSON.stringify(json.provider));
          // keep provider in localStorage too for navbar quick read
          if (json.provider) try { localStorage.setItem('provider', JSON.stringify(json.provider)); } catch { }
        }
        window.dispatchEvent(new Event('auth-change'));

      } catch { }

      // notify other components
      window.dispatchEvent(new Event('auth-change'));

      // redirect depending on presence of provider profile
      if (json?.provider) {
        router.push('/provider/dashboard');
      } else if (json?.user?.role === 'PROVIDER') {
        router.push('/provider/create');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-start justify-center bg-gray-50 py-12 px-4">
      <SEO title="Login" description="Log in to Mera Pind" />
      <div className="w-full max-w-lg">
        <div className="bg-white/90 p-8 rounded-2xl shadow-lg border border-gray-100">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/" className="inline-flex items-center text-sm text-gray-600 hover:text-blue-600">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
            </Link>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-white font-semibold text-lg">S</span>
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900">Welcome back</h2>
              <p className="mt-1 text-sm text-gray-600">Sign in to access your account</p>
            </div>
          </div>

          {error && <div className="mb-4 text-sm text-rose-700 bg-rose-50 p-3 rounded">{error}</div>}

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-3 py-3 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-3 py-3 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-600">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded text-blue-600 border-gray-300"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <Link href="#" className="text-blue-600 font-medium hover:underline">Forgot password?</Link>
            </div>

            <div>
              <button
                type="submit"
                disabled={busy}
                className="w-full inline-flex items-center justify-center py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition shadow-sm disabled:opacity-60"
              >
                {busy ? 'Signing in…' : 'Sign in'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <div className="text-sm text-gray-500">Or continue with</div>
            <button
              type="button"
              className="mt-4 inline-flex items-center gap-3 px-4 py-2 border border-gray-200 rounded-lg bg-white text-sm font-medium hover:bg-gray-50 shadow-sm"
            >
              <Chrome className="w-5 h-5 text-red-500" />
              Google
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="text-blue-600 font-medium">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
