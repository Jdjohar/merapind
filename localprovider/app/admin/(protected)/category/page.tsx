'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '@/app/lib/admin-fetch';

type Category = {
  _id: string;
  name: string;
  slug: string;
  color: string;
  order: number;
  providerCount?: number;
};

const COLORS = [
  'green','blue','red','yellow','purple','amber','cyan',
];

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
  const [color, setColor] = useState('green');
  const [order, setOrder] = useState(0);
  const [loading, setLoading] = useState(true);

  const slugPreview = slugify(name);

  async function loadCategories() {
    setLoading(true);
    const data = await adminFetch('/api/admin/categories/with-counts');
    setCategories(data);
    setLoading(false);
  }

  useEffect(() => {
    loadCategories();
  }, []);

  async function createCategory(e: React.FormEvent) {
    e.preventDefault();

    if (!name) {
      alert('Category name is required');
      return;
    }

    await adminFetch('/api/admin/categories', {
      method: 'POST',
      body: {
        name,
        color,
        order
      }
    });

    setName('');
    setColor('green');
    setOrder(0);
    loadCategories();
  }

  async function updateOrder(id: string, value: number) {
    await adminFetch(`/api/admin/categories/${id}/order`, {
      method: 'PATCH',
      body: { order: value }
    });

    setCategories((prev) =>
      prev.map((c) =>
        c._id === id ? { ...c, order: value } : c
      )
    );
  }

  async function deleteCategory(id: string) {
    if (!confirm('Delete this category?')) return;

    await adminFetch(`/api/admin/categories/${id}`, {
      method: 'DELETE'
    });

    loadCategories();
  }

  if (loading) return <p>Loading categories…</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Categories</h1>

      {/* CREATE CATEGORY */}
      <form
        onSubmit={createCategory}
        className="bg-white p-4 rounded-xl shadow mb-8 grid grid-cols-6 gap-4 items-end"
      >
        <div className="col-span-2">
          <label className="text-sm font-medium">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border p-2 rounded"
            placeholder="Gardening"
          />
          {name && (
            <p className="text-xs text-gray-500 mt-1">
              Slug: <span className="font-mono">{slugPreview}</span>
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium">Color</label>
          <select
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-full border p-2 rounded capitalize"
          >
            {COLORS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Order</label>
          <input
            type="number"
            value={order}
            onChange={(e) => setOrder(Number(e.target.value))}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* PREVIEW */}
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center
          bg-${color}-100 text-${color}-600 font-bold`}
        >
          {name ? name[0].toUpperCase() : 'A'}
        </div>

        <button className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800">
          Add
        </button>
      </form>

      {/* CATEGORY GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {categories.map((c) => (
          <div
            key={c._id}
            className="p-6 bg-white rounded-2xl shadow-sm border hover:shadow-md transition"
          >
            <div
              className={`w-14 h-14 mb-4 rounded-2xl flex items-center justify-center
              bg-${c.color}-100 text-${c.color}-600 font-bold`}
            >
              {c.name[0]}
            </div>

            <div className="font-semibold text-gray-900">
              {c.name}
            </div>

            <div className="text-xs text-gray-500 mb-2">
              {c.slug}
            </div>

            <div className="text-sm text-gray-600 mb-3">
              {c.providerCount ?? 0} providers
            </div>

            <div className="flex items-center justify-between">
              <input
                type="number"
                value={c.order || 0}
                onChange={(e) =>
                  updateOrder(c._id, Number(e.target.value))
                }
                className="w-16 border rounded px-2 py-1 text-sm"
              />

              <button
                onClick={() => deleteCategory(c._id)}
                className="text-xs text-red-600 hover:underline"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
