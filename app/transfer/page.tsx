'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TransferPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [itemId, setItemId] = useState('');
  const [fromLocationId, setFromLocationId] = useState('');
  const [toLocationId, setToLocationId] = useState('');
  const [condition, setCondition] = useState('Baik');
  const [quantity, setQuantity] = useState('1');
  const [eventDate, setEventDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [recordedBy, setRecordedBy] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/items').then(r => r.json()),
      fetch('/api/locations').then(r => r.json()),
    ]).then(([itemsData, locsData]) => {
      setItems(itemsData);
      setLocations(locsData);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/stock-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        item_id: parseInt(itemId),
        event_type: 'transfer',
        from_location_id: parseInt(fromLocationId),
        to_location_id: parseInt(toLocationId),
        from_condition: condition,
        to_condition: condition,
        quantity: parseInt(quantity),
        event_date: eventDate,
        recorded_by: recordedBy || null,
        notes: notes || null,
      }),
    });
    if (res.ok) {
      router.push('/');
      router.refresh();
    } else {
      alert('Gagal mencatat transfer');
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Transfer Barang</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Barang</label>
          <select value={itemId} onChange={e => setItemId(e.target.value)} required className="w-full border rounded-lg px-3 py-2 text-sm">
            <option value="">Pilih barang...</option>
            {items.map((i: any) => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Lokasi Asal</label>
            <select value={fromLocationId} onChange={e => setFromLocationId(e.target.value)} required className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="">Pilih asal...</option>
              {locations.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Lokasi Tujuan</label>
            <select value={toLocationId} onChange={e => setToLocationId(e.target.value)} required className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="">Pilih tujuan...</option>
              {locations.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Kondisi</label>
            <select value={condition} onChange={e => setCondition(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
              <option>Baik</option>
              <option>Rusak Ringan</option>
              <option>Rusak Berat</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Jumlah</label>
            <input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} required className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Tanggal</label>
          <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} required className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Dicatat Oleh</label>
          <input value={recordedBy} onChange={e => setRecordedBy(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Catatan</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
          {loading ? 'Menyimpan...' : 'Catat Transfer'}
        </button>
      </form>
    </div>
  );
}
