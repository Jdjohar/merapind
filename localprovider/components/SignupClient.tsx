// components/SignupClient.tsx
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

export default function SignupClient() {
  async function handle(values: Record<string, string>) {
    const payload = {
      name: values.name.trim(),
      email: values.email.trim().toLowerCase(),
      password: values.password
    };
    const res = await postJson('/api/auth/signup', payload);
    if (res.token) {
      try { localStorage.setItem('token', res.token); } catch {}
    }
    window.location.href = '/';
  }

  const fields = [
    { name: 'name', label: 'Full name', type: 'text', required: true, autocomplete: 'name' },
    { name: 'email', label: 'Email', type: 'email', required: true, autocomplete: 'email' },
    { name: 'password', label: 'Password', type: 'password', required: true, autocomplete: 'new-password' },
    { name: 'confirmPassword', label: 'Confirm password', type: 'password', required: true, autocomplete: 'new-password' }
  ];

  return <AuthFormClient fields={fields} submitLabel="Create account" onSubmit={handle} />;
}
