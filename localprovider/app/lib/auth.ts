'use client';

export function requireAdminClient() {
  const token = localStorage.getItem('admin_token');

  if (!token) {
    window.location.href = '/admin/login';
  }
}

export function adminLogout() {
  localStorage.removeItem('admin_token');
  window.location.href = '/admin/login';
}
