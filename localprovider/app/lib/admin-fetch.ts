type FetchOptions = {
  method?: string;
  body?: any;
};

export async function adminFetch(path: string, options: FetchOptions = {}) {
  if (typeof window === 'undefined') {
    throw new Error('adminFetch must run on client');
  }

  const token = localStorage.getItem('admin_token');

  const headers: HeadersInit = {
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  if (options.body) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${path}`,
    {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      cache: 'no-store'
    }
  );

  console.log('adminFetch', path, res.status);

  if (res.status === 401) {
    localStorage.removeItem('admin_token');
    window.location.href = '/admin/login';
    throw new Error('UNAUTHORIZED');
  }

  if (!res.ok) {
    throw new Error('Request failed');
  }

  return res.json();
}
