import { getDb } from "@/lib/db";
import Link from "next/link";

export default async function LocationsPage() {
  const db = await getDb();
  const locs = db.exec("SELECT id, name, description FROM locations ORDER BY name");
  const rows = locs[0]?.values ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Lokasi / Ruangan</h1>
        <Link href="/locations/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
          + Lokasi Baru
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rows.map((row: any[]) => (
          <div key={row[0]} className="bg-white rounded-xl shadow p-5">
            <h3 className="font-semibold text-lg">{row[1]}</h3>
            <p className="text-sm text-gray-500 mt-1">{row[2] ?? '-'}</p>
            <div className="mt-3">
              <Link href={`/locations/${row[0]}/edit`} className="text-sm text-blue-600 hover:underline">Edit</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
