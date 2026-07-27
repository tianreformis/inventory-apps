import { getCurrentState, buildItemStates } from "@/lib/events";
import { getDb } from "@/lib/db";
import { CONDITIONS } from "@/lib/types";

export default async function DashboardPage() {
  const state = await getCurrentState();
  const items = await buildItemStates(state);
  const db = await getDb();

  const totalItems = items.length;
  const totalUnits = items.reduce((sum, i) => sum + i.grand_total, 0);
  const totalLocations = (db.exec("SELECT COUNT(*) as c FROM locations")[0]?.values[0][0] as number) ?? 0;
  const pendingMaintenance = (db.exec("SELECT COUNT(*) as c FROM maintenance_logs WHERE status IN ('menunggu','proses')")[0]?.values[0][0] as number) ?? 0;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard Inventaris</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow p-5">
          <div className="text-sm text-gray-500">Jenis Barang</div>
          <div className="text-3xl font-bold mt-1">{totalItems}</div>
        </div>
        <div className="bg-white rounded-xl shadow p-5">
          <div className="text-sm text-gray-500">Total Unit</div>
          <div className="text-3xl font-bold mt-1">{totalUnits}</div>
        </div>
        <div className="bg-white rounded-xl shadow p-5">
          <div className="text-sm text-gray-500">Lokasi</div>
          <div className="text-3xl font-bold mt-1">{totalLocations}</div>
        </div>
        <div className="bg-white rounded-xl shadow p-5">
          <div className="text-sm text-gray-500">Perbaikan Tertunda</div>
          <div className="text-3xl font-bold mt-1 text-orange-600">{pendingMaintenance}</div>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-3">Stok Saat Ini per Barang</h2>
      <div className="overflow-x-auto">
        <table className="w-full bg-white rounded-xl shadow text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left p-3">Barang</th>
              <th className="text-left p-3">Kategori</th>
              {CONDITIONS.map(c => <th key={c} className="text-right p-3">{c}</th>)}
              <th className="text-right p-3 font-bold">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.item_id} className="border-b hover:bg-gray-50">
                <td className="p-3 font-medium">{item.item_name}</td>
                <td className="p-3 text-gray-600">{item.item_category}</td>
                {CONDITIONS.map(c => (
                  <td key={c} className="text-right p-3">{item.total_by_condition[c] || 0}</td>
                ))}
                <td className="text-right p-3 font-bold">{item.grand_total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
