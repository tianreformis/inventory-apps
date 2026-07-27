'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ItemForm({ item }: { item?: { id: number; name: string; category: string; satuan: string; kode: string | null } }) {
  const router = useRouter();
  const [name, setName] = useState(item?.name ?? '');
  const [category, setCategory] = useState(item?.category ?? '');
  const [satuan, setSatuan] = useState(item?.satuan ?? 'unit');
  const [kode, setKode] = useState(item?.kode ?? '');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const url = item ? `/api/items/${item.id}` : '/api/items';
    const method = item ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, category, satuan, kode: kode || null }),
    });
    if (res.ok) {
      router.push('/items');
      router.refresh();
    } else {
      alert('Gagal menyimpan');
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">{item ? 'Edit Barang' : 'Barang Baru'}</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nama Barang</label>
          <input value={name} onChange={e => setName(e.target.value)} required className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Kategori</label>
          <input value={category} onChange={e => setCategory(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Satuan</label>
          <input value={satuan} onChange={e => setSatuan(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Kode/SKU</label>
          <input value={kode} onChange={e => setKode(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Menyimpan...' : 'Simpan'}
          </button>
          <button type="button" onClick={() => router.back()} className="bg-gray-100 px-6 py-2 rounded-lg text-sm hover:bg-gray-200">
            Batal
          </button>
        </div>
      </form>
    </div>
  );
}
