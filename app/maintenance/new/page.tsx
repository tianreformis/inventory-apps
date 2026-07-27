'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewMaintenancePage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [itemId, setItemId] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [damageDescription, setDamageDescription] = useState('');
  const [technician, setTechnician] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/items').then(r => r.json()).then(setItems);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/maintenance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        item_id: parseInt(itemId),
        entry_date: entryDate,
        damage_description: damageDescription,
        technician: technician || null,
        notes: notes || null,
        status: 'menunggu',
      }),
    });
    if (res.ok) {
      router.push('/maintenance');
      router.refresh();
    } else {
      alert('Gagal menyimpan');
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Perbaikan Baru</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Barang</label>
          <select value={itemId} onChange={e => setItemId(e.target.value)} required className="w-full border rounded-lg px-3 py-2 text-sm">
            <option value="">Pilih barang...</option>
            {items.map((i: any) => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Tanggal Masuk</label>
          <input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} required className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Deskripsi Kerusakan</label>
          <textarea value={damageDescription} onChange={e => setDamageDescription(e.target.value)} required className="w-full border rounded-lg px-3 py-2 text-sm" rows={3} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Teknisi</label>
          <input value={technician} onChange={e => setTechnician(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Catatan</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} />
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Menyimpan...' : 'Simpan'}
          </button>
          <button type="button" onClick={() => router.back()} className="bg-gray-100 px-6 py-2 rounded-lg text-sm hover:bg-gray-200">Batal</button>
        </div>
      </form>
    </div>
  );
}
