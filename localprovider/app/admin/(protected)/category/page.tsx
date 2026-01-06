'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '@/app/lib/admin-fetch';

type Category = {
  _id: string;
  name: string;
  slug: string;
  color: keyof typeof COLOR_STYLES;
  order: number;
  providerCount?: number;
};

const COLOR_STYLES = {
  green: 'bg-green-50 text-green-600',
  blue: 'bg-blue-50 text-blue-600',
  red: 'bg-red-50 text-red-600',
  yellow: 'bg-yellow-50 text-yellow-600',
  purple: 'bg-purple-50 text-purple-600',
  amber: 'bg-amber-50 text-amber-600',
  cyan: 'bg-cyan-50 text-cyan-600',
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [color, setColor] = useState<Category['color']>('green');
  const [order, setOrder] = useState(0);
  const [loading, setLoading] = useState(true);

  const slugPreview = slugify(name);

  async function loadCategories() {
    const data = await adminFetch('/api/admin/categories/with-counts');
    setCategories(data);
  }

  useEffect(() => {
    loadCategories()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

async function createCategory(e: React.FormEvent) {
  e.preventDefault();
  if (!name) return alert('Category name is required');

  await adminFetch('/api/admin/categories', {
    method: 'POST',
    body: { name, color, order },
  });

  setName('');
  setColor('green');
  setOrder(0);
  loadCategories();
}


async function updateOrder(id: string, value: number) {
  await adminFetch(`/api/admin/categories/${id}/order`, {
    method: 'PATCH',
    body: { order: value },
  });

  setCategories((prev) =>
    prev.map((c) => (c._id === id ? { ...c, order: value } : c))
  );
}


  async function deleteCategory(id: string) {
    if (!confirm('Delete this category?')) return;

    await adminFetch(`/api/admin/categories/${id}`, {
      method: 'DELETE',
    });

    loadCategories();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <h1 className="text-xl font-bold text-slate-800">
          System Categories
        </h1>
      </div>

      {/* Create Category */}
      <form
        onSubmit={createCategory}
        className="bg-white p-4 rounded-xl border shadow-sm grid grid-cols-1 md:grid-cols-6 gap-4 items-end"
      >
        <div className="md:col-span-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full px-3 py-2 border rounded-lg text-sm"
            placeholder="Gardening"
          />
          {name && (
            <p className="text-xs text-slate-500 mt-1 font-mono">
              {slugPreview}
            </p>
          )}
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Color
          </label>
          <select
            value={color}
            onChange={(e) => setColor(e.target.value as Category['color'])}
            className="mt-1 w-full px-3 py-2 border rounded-lg text-sm capitalize"
          >
            {Object.keys(COLOR_STYLES).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Order
          </label>
          <input
            type="number"
            value={order}
            onChange={(e) => setOrder(Number(e.target.value))}
            className="mt-1 w-full px-3 py-2 border rounded-lg text-sm"
          />
        </div>

        <div className="flex justify-center">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${COLOR_STYLES[color]}`}
          >
            {name ? name[0].toUpperCase() : 'A'}
          </div>
        </div>

        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700">
          Add Category
        </button>
      </form>

      {/* Categories Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Category
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Providers
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Order
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {categories.map((c) => (
                <tr key={c._id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${COLOR_STYLES[c.color]}`}
                      >
                        {c.name[0]}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">
                          {c.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {c.slug}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-600">
                    {c.providerCount ?? 0}
                  </td>

                  <td className="px-6 py-4">
                    <input
                      type="number"
                      value={c.order || 0}
                      onChange={(e) =>
                        updateOrder(c._id, Number(e.target.value))
                      }
                      className="w-20 px-2 py-1 border rounded text-sm"
                    />
                  </td>

                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => deleteCategory(c._id)}
                      className="text-xs font-bold text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {categories.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-10 text-center text-slate-400 text-sm"
                  >
                    No categories found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
