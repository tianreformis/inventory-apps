import { getDb } from "@/lib/db";
import Link from "next/link";

export default async function ItemsPage() {
  const db = await getDb();
  const items = db.exec("SELECT id, name, category, satuan, kode FROM items ORDER BY name");
  const rows = items[0]?.values ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Master Barang</h1>
        <Link href="/items/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
          + Barang Baru
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full bg-white rounded-xl shadow text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left p-3">Nama</th>
              <th className="text-left p-3">Kategori</th>
              <th className="text-left p-3">Satuan</th>
              <th className="text-left p-3">Kode/SKU</th>
              <th className="text-center p-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row: any[]) => (
              <tr key={row[0]} className="border-b hover:bg-gray-50">
                <td className="p-3 font-medium">{row[1]}</td>
                <td className="p-3 text-gray-600">{row[2]}</td>
                <td className="p-3">{row[3]}</td>
                <td className="p-3 text-gray-500">{row[4] ?? '-'}</td>
                <td className="p-3 text-center">
                  <Link href={`/items/${row[0]}`} className="text-blue-600 hover:underline text-sm mr-3">Detail</Link>
                  <Link href={`/items/${row[0]}/edit`} className="text-gray-600 hover:underline text-sm">Edit</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
