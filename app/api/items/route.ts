import { getDb, saveDb } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET() {
  const db = await getDb();
  const items = db.exec("SELECT id, name, category, satuan, kode FROM items ORDER BY name");
  const result = (items[0]?.values ?? []).map((row: any[]) => ({
    id: row[0], name: row[1], category: row[2], satuan: row[3], kode: row[4],
  }));
  return Response.json(result);
}

export async function POST(request: NextRequest) {
  const { name, category, satuan, kode } = await request.json();
  const db = await getDb();
  db.run("INSERT INTO items (name, category, satuan, kode) VALUES (?, ?, ?, ?)", [name, category ?? '', satuan ?? 'unit', kode ?? null]);
  saveDb();
  return Response.json({ success: true });
}
