import { getDb, saveDb } from "@/lib/db";
import { recordEvent, getCurrentState } from "@/lib/events";
import { NextRequest } from "next/server";

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json();
  const db = await getDb();

  const oldRows = db.exec("SELECT status, item_id FROM maintenance_logs WHERE id = ?", [parseInt(id)]);
  const oldStatus = oldRows[0]?.values[0]?.[0] as string;
  const maintItemId = oldRows[0]?.values[0]?.[1] as number;

  db.run(
    `UPDATE maintenance_logs SET item_id=?, item_unit_id=?, entry_date=?, completion_date=?,
     damage_description=?, repair_action=?, technician=?, cost=?, status=?, notes=?
     WHERE id=?`,
    [body.item_id, body.item_unit_id ?? null, body.entry_date, body.completion_date ?? null,
     body.damage_description, body.repair_action ?? null, body.technician ?? null,
     body.cost ?? null, body.status, body.notes ?? null, parseInt(id)]
  );
  saveDb();

  if (body.status === 'selesai' && oldStatus !== 'selesai') {
    const state = await getCurrentState();
    const itemState = state.filter(s => s.item_id === (body.item_id || maintItemId));
    const badState = itemState.find(s => s.condition !== 'Baik');
    const goodState = itemState.find(s => s.condition === 'Baik');
    const locationId = badState?.location_id ?? goodState?.location_id ?? null;
    const fromCond = badState?.condition ?? 'Rusak Ringan';

    if (locationId) {
      await recordEvent({
        item_id: body.item_id || maintItemId,
        item_unit_id: body.item_unit_id ?? null,
        event_type: 'condition_change',
        from_location_id: locationId,
        to_location_id: locationId,
        from_condition: fromCond,
        to_condition: 'Baik',
        quantity: 1,
        event_date: body.completion_date || new Date().toISOString().slice(0, 10),
        recorded_by: body.technician,
        notes: `Perbaikan #${id} selesai: ${body.damage_description}`,
      });
    }
  }

  return Response.json({ success: true });
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const db = await getDb();
  db.run("DELETE FROM maintenance_logs WHERE id=?", [parseInt(id)]);
  saveDb();
  return Response.json({ success: true });
}
