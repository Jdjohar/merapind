// components/LoginClient.tsx
'use client';
import React from 'react';
import AuthFormClient from './AuthFormClient';

async function postJson(url: string, payload: any) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include'
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(json?.error || json?.message || `HTTP ${res.status}`);
    throw err;
  }
  return json;
}

export default function LoginClient() {
  async function handle(values: Record<string, string>) {
    const payload = { email: values.email.trim().toLowerCase(), password: values.password };
    const res = await postJson('/api/auth/login', payload);
    // DEV: we save token to localStorage for convenience (not for production).
    if (res.token) {
      try { localStorage.setItem('token', res.token); } catch {}
    }
    // after successful login redirect to root
    window.location.href = '/';
  }

  const fields = [
    { name: 'email', label: 'Email', type: 'email', required: true, autocomplete: 'email' },
    { name: 'password', label: 'Password', type: 'password', required: true, autocomplete: 'current-password' },
  ];

  return <AuthFormClient fields={fields} submitLabel="Sign in" onSubmit={handle} />;
}
