'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, Chrome, User as UserIcon, Briefcase, ArrowLeft } from 'lucide-react';
import SEO from '../../components/SEO';
import { usePathname } from 'next/navigation';

export default function AuthPage() {
  const pathname = usePathname();
  const isLogin = pathname === '/login';
  const [userType, setUserType] = useState<'user' | 'provider'>('user');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <SEO title={isLogin ? 'Login' : 'Sign Up'} description={isLogin ? 'Log in to Mera Pind' : 'Join Mera Pind as a user or service provider.'} />

      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 -z-20" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-200 rounded-full blur-3xl opacity-50 -z-10" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-200 rounded-full blur-3xl opacity-50 -z-10" />

      <div className="max-w-md w-full space-y-8 bg-white/80 backdrop-blur-xl p-8 md:p-10 rounded-3xl shadow-2xl border border-white/50">
        <div>
          <Link href="/" className="inline-flex items-center text-sm text-gray-500 hover:text-blue-600 transition-colors mb-6">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Home
          </Link>
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-200">
             <span className="text-white font-bold text-2xl">S</span>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isLogin ? 'Sign in to access your account' : 'Join our community of professionals and clients'}
          </p>
        </div>

        {!isLogin && (
          <div className="flex p-1.5 bg-gray-100/80 rounded-2xl">
            <button
              onClick={() => setUserType('user')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${userType === 'user' ? 'bg-white text-blue-600 shadow-md scale-100' : 'text-gray-500 hover:text-gray-700 scale-95 hover:scale-100'}`}
            >
              <UserIcon className="w-4 h-4" /> User
            </button>
            <button
              onClick={() => setUserType('provider')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${userType === 'provider' ? 'bg-white text-blue-600 shadow-md scale-100' : 'text-gray-500 hover:text-gray-700 scale-95 hover:scale-100'}`}
            >
              <Briefcase className="w-4 h-4" /> Service Provider
            </button>
          </div>
        )}

        <form className="mt-8 space-y-6">
          <div className="space-y-4">
            {!isLogin && userType === 'provider' && (
              <div className="group">
                 <label htmlFor="business-name" className="block text-xs font-medium text-gray-700 ml-1 mb-1">Business Name</label>
                 <input id="business-name" name="business-name" type="text" required className="appearance-none rounded-xl relative block w-full px-4 py-3.5 border border-gray-200 bg-gray-50 focus:bg-white placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" placeholder="e.g. Joe's Plumbing" />
              </div>
            )}
            <div>
              <label htmlFor="email-address" className="block text-xs font-medium text-gray-700 ml-1 mb-1">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input id="email-address" name="email" type="email" autoComplete="email" required className="appearance-none rounded-xl relative block w-full pl-11 px-4 py-3.5 border border-gray-200 bg-gray-50 focus:bg-white placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" placeholder="you@example.com" />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-gray-700 ml-1 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input id="password" name="password" type="password" autoComplete="current-password" required className="appearance-none rounded-xl relative block w-full pl-11 px-4 py-3.5 border border-gray-200 bg-gray-50 focus:bg-white placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" placeholder="••••••••" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer" />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600 cursor-pointer select-none">Remember me</label>
            </div>
            {isLogin && (
              <div className="text-sm">
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500 hover:underline">Forgot password?</a>
              </div>
            )}
          </div>

          <div>
            <button type="submit" className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0">
              {isLogin ? 'Sign in' : 'Create Account'}
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
            <button className="w-full inline-flex justify-center items-center py-3.5 px-4 border border-gray-200 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all transform hover:-translate-y-0.5">
              <Chrome className="w-5 h-5 text-red-500 mr-3" />
              <span>Google</span>
            </button>
          </div>
        </div>
        
        <div className="text-center mt-6">
           <p className="text-sm text-gray-600">
             {isLogin ? "Don't have an account? " : "Already have an account? "}
             <Link href={isLogin ? "/signup" : "/login"} className="font-bold text-blue-600 hover:text-blue-500 transition-colors">
               {isLogin ? "Sign up" : "Log in"}
             </Link>
           </p>
        </div>
      </div>
    </div>
  );
}
