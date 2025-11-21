// lib/authClient.js
/**
 * Lightweight auth client helper for frontend forms.
 * Adjust endpoints to match your server routes (Express).
 *
 * NOTE: This returns the raw JSON from server and throws an Error on non-OK status.
 * In production you should use secure httpOnly cookies and not store JWTs in localStorage.
 */

export async function postJson(url, payload) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include' // include cookies if server sets them
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.error || json?.message || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return json;
}

/**
 * Sign up - expects backend route POST /api/auth/signup
 * Example server response: { ok: true, user: { ... }, token: '...' }
 */
export function signup(payload) {
  return postJson('/api/auth/signup', payload);
}

/**
 * Login - expects backend route POST /api/auth/login
 * Example server response: { ok: true, user: { ... }, token: '...' }
 */
export function login(payload) {
  return postJson('/api/auth/login', payload);
}
