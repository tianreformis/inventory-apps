'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { HiInformationCircle } from "react-icons/hi2";

export default function EditMaintenancePage() {
  const router = useRouter();
  const params = useParams();
  const [items, setItems] = useState<any[]>([]);
  const [itemId, setItemId] = useState('');
  const [entryDate, setEntryDate] = useState('');
  const [completionDate, setCompletionDate] = useState('');
  const [damageDescription, setDamageDescription] = useState('');
  const [repairAction, setRepairAction] = useState('');
  const [technician, setTechnician] = useState('');
  const [cost, setCost] = useState('');
  const [status, setStatus] = useState('menunggu');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/items').then(r => r.json()),
      fetch('/api/maintenance').then(r => r.json()),
    ]).then(([itemsData, maintData]) => {
      setItems(itemsData);
      const log = maintData.find((l: any) => l.id === parseInt(params.id as string));
      if (log) {
        setItemId(String(log.item_id));
        setEntryDate(log.entry_date);
        setCompletionDate(log.completion_date ?? '');
        setDamageDescription(log.damage_description);
        setRepairAction(log.repair_action ?? '');
        setTechnician(log.technician ?? '');
        setCost(log.cost ? String(log.cost) : '');
        setStatus(log.status);
        setNotes(log.notes ?? '');
      }
      setFetching(false);
    });
  }, [params.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const body: any = {
      item_id: parseInt(itemId),
      entry_date: entryDate,
      completion_date: completionDate || null,
      damage_description: damageDescription,
      repair_action: repairAction || null,
      technician: technician || null,
      cost: cost ? parseFloat(cost) : null,
      status,
      notes: notes || null,
    };
    const res = await fetch(`/api/maintenance/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      router.push('/maintenance');
      router.refresh();
    } else {
      alert('Gagal menyimpan');
      setLoading(false);
    }
  }

  if (fetching) return <p className="text-gray-500">Memuat...</p>;

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit Perbaikan</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Barang</label>
          <select value={itemId} onChange={e => setItemId(e.target.value)} required className="w-full border rounded-lg px-3 py-2 text-sm">
            {items.map((i: any) => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tanggal Masuk</label>
            <input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} required className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tanggal Selesai</label>
            <input type="date" value={completionDate} onChange={e => setCompletionDate(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Deskripsi Kerusakan</label>
          <textarea value={damageDescription} onChange={e => setDamageDescription(e.target.value)} required className="w-full border rounded-lg px-3 py-2 text-sm" rows={3} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Tindakan Perbaikan</label>
          <textarea value={repairAction} onChange={e => setRepairAction(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Teknisi</label>
            <input value={technician} onChange={e => setTechnician(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Biaya (Rp)</label>
            <input type="number" value={cost} onChange={e => setCost(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="menunggu">Menunggu</option>
              <option value="proses">Proses</option>
              <option value="selesai">Selesai</option>
              <option value="tidak_bisa_diperbaiki">Tidak Bisa Diperbaiki</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Catatan</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} />
        </div>
        <div className="text-xs text-gray-500 mb-2">
          {status === 'selesai' ? <span className="inline-flex items-center gap-1"><HiInformationCircle className="text-blue-500" /> Mengubah status ke Selesai akan otomatis mencatat perubahan kondisi barang menjadi Baik.</span> : ''}
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
