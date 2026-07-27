import { getDb } from "@/lib/db";
import Link from "next/link";

export default async function MaintenancePage() {
  const db = await getDb();
  const rows = db.exec(`
    SELECT ml.id, ml.entry_date, ml.completion_date, ml.damage_description,
           ml.status, ml.cost, ml.technician, i.name as item_name
    FROM maintenance_logs ml
    JOIN items i ON i.id = ml.item_id
    ORDER BY ml.entry_date DESC
  `);
  const logs = rows[0]?.values ?? [];

  function statusBadge(status: string) {
    const colors: Record<string, string> = {
      menunggu: 'bg-yellow-100 text-yellow-800',
      proses: 'bg-blue-100 text-blue-800',
      selesai: 'bg-green-100 text-green-800',
      tidak_bisa_diperbaiki: 'bg-red-100 text-red-800',
    };
    return colors[status] ?? 'bg-gray-100';
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Log Perbaikan</h1>
        <Link href="/maintenance/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
          + Perbaikan Baru
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full bg-white rounded-xl shadow text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left p-3">Barang</th>
              <th className="text-left p-3">Kerusakan</th>
              <th className="text-left p-3">Tanggal Masuk</th>
              <th className="text-left p-3">Tanggal Selesai</th>
              <th className="text-left p-3">Teknisi</th>
              <th className="text-left p-3">Status</th>
              <th className="text-right p-3">Biaya</th>
              <th className="text-center p-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((row: any[]) => (
              <tr key={row[0]} className="border-b hover:bg-gray-50">
                <td className="p-3 font-medium">{row[7]}</td>
                <td className="p-3 text-gray-600">{row[3]}</td>
                <td className="p-3">{row[1]}</td>
                <td className="p-3">{row[2] ?? '-'}</td>
                <td className="p-3">{row[6] ?? '-'}</td>
                <td className="p-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${statusBadge(row[4])}`}>
                    {row[4]}
                  </span>
                </td>
                <td className="text-right p-3">{row[5] ? `Rp${Number(row[5]).toLocaleString('id-ID')}` : '-'}</td>
                <td className="p-3 text-center">
                  <Link href={`/maintenance/${row[0]}/edit`} className="text-blue-600 hover:underline text-sm">Edit</Link>
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan={8} className="p-6 text-center text-gray-400">Belum ada data perbaikan.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
