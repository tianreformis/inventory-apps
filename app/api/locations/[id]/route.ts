import { getDb, saveDb } from "@/lib/db";
import { NextRequest } from "next/server";

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const { name, description } = await request.json();
  const db = await getDb();
  try {
    db.run("UPDATE locations SET name=?, description=? WHERE id=?", [name, description ?? null, parseInt(id)]);
    saveDb();
    return Response.json({ success: true });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const db = await getDb();
  db.run("DELETE FROM locations WHERE id=?", [parseInt(id)]);
  saveDb();
  return Response.json({ success: true });
}
