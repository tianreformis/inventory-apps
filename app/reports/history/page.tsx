import { getStateComparison } from "@/lib/events";
import { CONDITIONS } from "@/lib/types";
import Link from "next/link";
import { HiArrowLeft } from "react-icons/hi2";
import PrintButton from "./PrintButton";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default async function HistoryReportPage(props: {
  searchParams: Promise<{ date?: string; item_id?: string; location_id?: string }>
}) {
  const sp = await props.searchParams;
  const { getDb } = await import('@/lib/db');
  const db = await getDb();

  const allItems = (db.exec("SELECT id, name FROM items ORDER BY name")[0]?.values ?? []).map((r: any[]) => ({ id: r[0], name: r[1] }));
  const allLocations = (db.exec("SELECT id, name FROM locations ORDER BY name")[0]?.values ?? []).map((r: any[]) => ({ id: r[0], name: r[1] }));

  const pastDate = sp.date || '';
  let comparison = null;
  let error = '';

  if (pastDate) {
    try {
      comparison = await getStateComparison(pastDate);
    } catch (e: any) {
      error = e.message;
    }
  }

  const filterItemId = sp.item_id ? parseInt(sp.item_id) : null;
  const filterLocationId = sp.location_id ? parseInt(sp.location_id) : null;

  const filteredPast = filterItemId
    ? comparison?.past_state.filter(s => s.item_id === filterItemId) ?? []
    : comparison?.past_state ?? [];
  const filteredCurrent = filterItemId
    ? comparison?.current_state.filter(s => s.item_id === filterItemId) ?? []
    : comparison?.current_state ?? [];

  const filteredChanges = filterItemId
    ? comparison?.changes.filter(c => c.item_id === filterItemId) ?? []
    : comparison?.changes ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Laporan Historis</h1>
        <div className="no-print">
            <PrintButton />
        </div>
      </div>

      <form className="bg-white rounded-xl shadow p-5 mb-6 no-print">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-1">Tanggal (Masa Lalu)</label>
            <input type="date" name="date" defaultValue={pastDate} required className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Filter Barang</label>
            <select name="item_id" defaultValue={filterItemId ?? ''} className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="">Semua Barang</option>
              {allItems.map((i: any) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Filter Lokasi</label>
            <select name="location_id" defaultValue={filterLocationId ?? ''} className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="">Semua Lokasi</option>
              {allLocations.map((l: any) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
          <div>
            <button type="submit" className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
              Lihat Laporan
            </button>
          </div>
        </div>
      </form>

      {error && <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6">{error}</div>}

      {comparison && (
        <>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 text-sm text-yellow-800 no-print">
            Membandingkan data pada <strong>{pastDate}</strong> dengan kondisi <strong>saat ini</strong>.
            {filterItemId && <> Difilter untuk barang tertentu.</>}
          </div>

          {comparison.changes.length > 0 && (
            <div className="bg-white rounded-xl shadow p-5 mb-6">
              <h2 className="font-semibold mb-3">Ringkasan Perubahan ({filteredChanges.length} kejadian)</h2>
              <div className="space-y-2">
                {filteredChanges.map((change, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-sm border-l-2 pl-3 py-1"
                    style={{ borderColor: change.type === 'transfer' ? '#3b82f6' : change.type === 'condition_change' ? '#eab308' : '#ef4444' }}>
                    <div className="min-w-0 flex-1">
                      <span className="font-medium">{change.item_name}</span>
                      {change.type === 'transfer' && `: ${change.quantity} unit pindah dari ${change.from_location} → ${change.to_location}`}
                      {change.type === 'condition_change' && `: ${change.quantity} unit berubah kondisi ${change.from_condition} → ${change.to_condition}`}
                      {change.type === 'writeoff' && `: ${change.quantity} unit Diputihkan dari ${change.from_location}`}
                      {change.type === 'lost' && `: ${change.quantity} unit Hilang dari ${change.from_location}`}
                      {change.type === 'found' && `: ${change.quantity} unit Ditemukan di ${change.to_location}`}
                      <span className="text-gray-400 ml-2">({change.date})</span>
                      {change.notes && <p className="text-gray-400 text-xs mt-0.5">{change.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow p-5">
              <h2 className="font-semibold mb-3 text-orange-700">Kondisi pada {pastDate}</h2>
              {filteredPast.length === 0 ? (
                <p className="text-sm text-gray-400">Tidak ada data.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-1.5">Barang</th>
                        <th className="text-left p-1.5">Lokasi</th>
                        {CONDITIONS.map(c => <th key={c} className="text-right p-1.5">{c}</th>)}
                        <th className="text-right p-1.5 font-bold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPast.flatMap(item =>
                        (filterLocationId
                          ? item.locations.filter(l => l.location_id === filterLocationId)
                          : item.locations
                        ).map(loc => (
                          <tr key={`${item.item_id}-${loc.location_id}`} className="border-b">
                            <td className="p-1.5 font-medium">{item.item_name}</td>
                            <td className="p-1.5 text-gray-600">{loc.location_name}</td>
                            {CONDITIONS.map(c => (
                              <td key={c} className={classNames('text-right p-1.5', c === 'Diputihkan' ? 'text-red-500' : '')}>
                                {loc.by_condition[c] || 0}
                              </td>
                            ))}
                            <td className="text-right p-1.5 font-bold">{loc.total}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow p-5">
              <h2 className="font-semibold mb-3 text-green-700">Kondisi Saat Ini</h2>
              {filteredCurrent.length === 0 ? (
                <p className="text-sm text-gray-400">Tidak ada data.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-1.5">Barang</th>
                        <th className="text-left p-1.5">Lokasi</th>
                        {CONDITIONS.map(c => <th key={c} className="text-right p-1.5">{c}</th>)}
                        <th className="text-right p-1.5 font-bold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCurrent.flatMap(item =>
                        (filterLocationId
                          ? item.locations.filter(l => l.location_id === filterLocationId)
                          : item.locations
                        ).map(loc => {
                          const pastItem = comparison.past_state.find(s => s.item_id === item.item_id);
                          const pastLoc = pastItem?.locations.find(l => l.location_id === loc.location_id);
                          return (
                            <tr key={`${item.item_id}-${loc.location_id}`} className="border-b">
                              <td className="p-1.5 font-medium">{item.item_name}</td>
                              <td className="p-1.5 text-gray-600">{loc.location_name}</td>
                              {CONDITIONS.map(c => {
                                const pastQty = pastLoc?.by_condition[c] || 0;
                                const currQty = loc.by_condition[c] || 0;
                                const changed = pastQty !== currQty;
                                return (
                                  <td key={c} className={classNames(
                                    'text-right p-1.5',
                                    changed ? 'bg-yellow-50 font-semibold' : '',
                                  )}>
                                    {currQty}
                                  </td>
                                );
                              })}
                              <td className="text-right p-1.5 font-bold">{loc.total}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="text-center text-xs text-gray-400 mt-8 no-print">
            <Link href="/" className="inline-flex items-center gap-1 text-blue-600 hover:underline"><HiArrowLeft /> Kembali ke Dashboard</Link>
          </div>
        </>
      )}

      {!pastDate && (
        <div className="text-center py-16 text-gray-400">
          Pilih tanggal di atas untuk melihat perbandingan kondisi inventaris.
        </div>
      )}
    </div>
  );
}
