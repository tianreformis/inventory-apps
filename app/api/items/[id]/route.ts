import { getDb, saveDb } from "@/lib/db";
import { NextRequest } from "next/server";

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const { name, category, satuan, kode } = await request.json();
  const db = await getDb();
  db.run("UPDATE items SET name=?, category=?, satuan=?, kode=? WHERE id=?", [name, category ?? '', satuan ?? 'unit', kode ?? null, parseInt(id)]);
  saveDb();
  return Response.json({ success: true });
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const db = await getDb();
  db.run("DELETE FROM items WHERE id=?", [parseInt(id)]);
  saveDb();
  return Response.json({ success: true });
}
