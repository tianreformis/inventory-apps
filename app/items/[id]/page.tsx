import { getDb } from "@/lib/db";
import { getItemTimeline, getCurrentState, buildItemStates } from "@/lib/events";
import { notFound } from "next/navigation";
import Link from "next/link";

function eventBadge(type: string) {
  const colors: Record<string, string> = {
    initial: 'bg-green-100 text-green-800',
    transfer: 'bg-blue-100 text-blue-800',
    condition_change: 'bg-yellow-100 text-yellow-800',
    writeoff: 'bg-red-100 text-red-800',
    lost: 'bg-gray-100 text-gray-800',
    found: 'bg-teal-100 text-teal-800',
  };
  return colors[type] ?? 'bg-gray-100';
}

function eventLabel(type: string) {
  const labels: Record<string, string> = {
    initial: 'Stok Awal',
    transfer: 'Transfer',
    condition_change: 'Perubahan Kondisi',
    writeoff: 'Diputihkan',
    lost: 'Hilang',
    found: 'Ditemukan',
  };
  return labels[type] ?? type;
}

export default async function ItemDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const itemId = parseInt(id);
  const db = await getDb();

  const itemRows = db.exec("SELECT id, name, category, satuan, kode FROM items WHERE id = ?", [itemId]);
  const itemRow = itemRows[0]?.values[0] as any[];
  if (!itemRow) notFound();

  const item = { id: itemRow[0] as number, name: itemRow[1] as string, category: itemRow[2] as string, satuan: itemRow[3] as string, kode: itemRow[4] as string | null };

  const state = await getCurrentState();
  const itemStates = await buildItemStates(state);
  const currentState = itemStates.find(s => s.item_id === itemId);

  const timeline = await getItemTimeline(itemId);

  const maintRows = db.exec(
    "SELECT id, entry_date, completion_date, damage_description, status, cost FROM maintenance_logs WHERE item_id = ? ORDER BY entry_date DESC",
    [itemId]
  );
  const maintenanceLogs = maintRows[0]?.values ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{item.name}</h1>
          <p className="text-gray-500 text-sm">{item.category} &middot; {item.kode ?? 'Tanpa SKU'}</p>
        </div>
        <Link href={`/items/${item.id}/edit`} className="bg-gray-100 px-4 py-2 rounded-lg text-sm hover:bg-gray-200">
          Edit
        </Link>
      </div>

      {currentState && (
        <div className="bg-white rounded-xl shadow p-5 mb-6">
          <h2 className="font-semibold mb-3">Stok Saat Ini</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Lokasi</th>
                  {Object.keys(currentState.total_by_condition).map(c => (
                    <th key={c} className="text-right p-2">{c}</th>
                  ))}
                  <th className="text-right p-2 font-bold">Total</th>
                </tr>
              </thead>
              <tbody>
                {currentState.locations.map(loc => (
                  <tr key={loc.location_id} className="border-b">
                    <td className="p-2">{loc.location_name}</td>
                    {Object.keys(currentState.total_by_condition).map(c => (
                      <td key={c} className="text-right p-2">{loc.by_condition[c] || 0}</td>
                    ))}
                    <td className="text-right p-2 font-bold">{loc.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow p-5 mb-6">
        <h2 className="font-semibold mb-3">Riwayat Timeline</h2>
        <div className="space-y-3">
          {timeline.map((ev) => (
            <div key={ev.id} className="flex items-start gap-4 border-l-2 border-gray-200 pl-4 py-1">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${eventBadge(ev.event_type)}`}>
                    {eventLabel(ev.event_type)}
                  </span>
                  <span className="text-xs text-gray-500">{ev.event_date}</span>
                </div>
                <div className="text-sm text-gray-700">
                  {ev.event_type === 'initial' && `${ev.quantity} unit → ${ev.location_to ?? '-'} (${ev.to_condition})`}
                  {ev.event_type === 'transfer' && `${ev.quantity} unit: ${ev.location_from} → ${ev.location_to}`}
                  {ev.event_type === 'condition_change' && `${ev.quantity} unit: ${ev.from_condition} → ${ev.to_condition}`}
                  {ev.event_type === 'writeoff' && `${ev.quantity} unit ${ev.from_condition} → Diputihkan`}
                  {ev.event_type === 'lost' && `${ev.quantity} unit Hilang dari ${ev.location_from}`}
                  {ev.event_type === 'found' && `${ev.quantity} unit Ditemukan di ${ev.location_to}`}
                </div>
                {ev.notes && <p className="text-xs text-gray-400 mt-0.5">{ev.notes}</p>}
              </div>
            </div>
          ))}
          {timeline.length === 0 && <p className="text-sm text-gray-400">Belum ada riwayat.</p>}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-5">
        <h2 className="font-semibold mb-3">Riwayat Perbaikan</h2>
        {maintenanceLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Tanggal Masuk</th>
                  <th className="text-left p-2">Kerusakan</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-right p-2">Biaya</th>
                </tr>
              </thead>
              <tbody>
                {maintenanceLogs.map((row: any[]) => (
                  <tr key={row[0]} className="border-b">
                    <td className="p-2">{row[1]}</td>
                    <td className="p-2">{row[3]}</td>
                    <td className="p-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        row[4] === 'selesai' ? 'bg-green-100 text-green-800' :
                        row[4] === 'proses' ? 'bg-blue-100 text-blue-800' :
                        row[4] === 'menunggu' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>{row[4]}</span>
                    </td>
                    <td className="text-right p-2">{row[5] ? `Rp${Number(row[5]).toLocaleString('id-ID')}` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-400">Belum ada perbaikan.</p>
        )}
      </div>
    </div>
  );
}
