import { getDb, saveDb } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET() {
  const db = await getDb();
  const rows = db.exec(`
    SELECT ml.*, i.name as item_name
    FROM maintenance_logs ml
    JOIN items i ON i.id = ml.item_id
    ORDER BY ml.entry_date DESC
  `);
  const result = (rows[0]?.values ?? []).map((r: any[]) => ({
    id: r[0], item_id: r[1], item_unit_id: r[2], entry_date: r[3],
    completion_date: r[4], damage_description: r[5], repair_action: r[6],
    technician: r[7], cost: r[8], status: r[9], notes: r[10], created_at: r[11],
    item_name: r[12],
  }));
  return Response.json(result);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const db = await getDb();
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  db.run(
    `INSERT INTO maintenance_logs (item_id, item_unit_id, entry_date, damage_description, repair_action, technician, cost, status, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [body.item_id, body.item_unit_id ?? null, body.entry_date, body.damage_description,
     body.repair_action ?? null, body.technician ?? null, body.cost ?? null,
     body.status ?? 'menunggu', body.notes ?? null, now]
  );
  saveDb();
  return Response.json({ success: true });
}
