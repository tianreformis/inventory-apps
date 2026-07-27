import { getDb, saveDb } from './db';
import type { StockEvent, ItemState, LocationStock, ChangeRecord, ComparisonResult } from './types';

interface RawEvent {
  id: number;
  item_id: number;
  item_unit_id: number | null;
  event_type: string;
  from_location_id: number | null;
  to_location_id: number | null;
  from_condition: string | null;
  to_condition: string | null;
  quantity: number;
  event_date: string;
  recorded_by: string | null;
  notes: string | null;
  created_at: string;
}

interface RawItem {
  id: number;
  name: string;
  category: string;
  satuan: string;
  kode: string | null;
}

interface RawLocation {
  id: number;
  name: string;
  description: string | null;
}

export async function recordEvent(event: {
  item_id: number;
  item_unit_id?: number | null;
  event_type: string;
  from_location_id?: number | null;
  to_location_id?: number | null;
  from_condition?: string | null;
  to_condition?: string | null;
  quantity?: number;
  event_date: string;
  recorded_by?: string | null;
  notes?: string | null;
}): Promise<number> {
  const db = await getDb();
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  db.run(
    `INSERT INTO stock_events (item_id, item_unit_id, event_type, from_location_id, to_location_id, from_condition, to_condition, quantity, event_date, recorded_by, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      event.item_id,
      event.item_unit_id ?? null,
      event.event_type,
      event.from_location_id ?? null,
      event.to_location_id ?? null,
      event.from_condition ?? null,
      event.to_condition ?? null,
      event.quantity ?? 1,
      event.event_date,
      event.recorded_by ?? null,
      event.notes ?? null,
      now,
    ]
  );
  saveDb();
  const id = (db.exec("SELECT last_insert_rowid() as id")[0]?.values[0][0] as number) ?? 0;
  return id;
}

export interface StateEntry {
  item_id: number;
  location_id: number | null;
  condition: string;
  quantity: number;
}

export async function getCurrentState(asOfDate?: string): Promise<StateEntry[]> {
  const db = await getDb();
  const dateFilter = asOfDate
    ? `WHERE event_date <= '${asOfDate.replace(/'/g, "''")}'`
    : '';

  const rows = db.exec(`
    SELECT item_id, from_location_id, to_location_id, from_condition, to_condition,
           event_type, quantity
    FROM stock_events
    ${dateFilter}
    ORDER BY event_date ASC, id ASC
  `);

  const state = new Map<string, number>();

  for (const row of rows[0]?.values ?? []) {
    const item_id = row[0] as number;
    const from_loc = row[1] as number | null;
    const to_loc = row[2] as number | null;
    const from_cond = row[3] as string | null;
    const to_cond = row[4] as string | null;
    const event_type = row[5] as string;
    const qty = row[6] as number;

    if (event_type === 'initial') {
      if (to_loc && to_cond) {
        const key = `${item_id}:${to_loc}:${to_cond}`;
        state.set(key, (state.get(key) || 0) + qty);
      }
    } else if (event_type === 'transfer') {
      if (from_loc && from_cond) {
        const keyFrom = `${item_id}:${from_loc}:${from_cond}`;
        state.set(keyFrom, (state.get(keyFrom) || 0) - qty);
      }
      if (to_loc && to_cond) {
        const keyTo = `${item_id}:${to_loc}:${to_cond}`;
        state.set(keyTo, (state.get(keyTo) || 0) + qty);
      }
    } else if (event_type === 'condition_change') {
      if (from_loc && from_cond) {
        const keyFrom = `${item_id}:${from_loc}:${from_cond}`;
        state.set(keyFrom, (state.get(keyFrom) || 0) - qty);
      }
      if (to_loc && to_cond) {
        const keyTo = `${item_id}:${to_loc}:${to_cond}`;
        state.set(keyTo, (state.get(keyTo) || 0) + qty);
      }
    } else if (event_type === 'writeoff' || event_type === 'lost') {
      if (from_loc && from_cond) {
        const keyFrom = `${item_id}:${from_loc}:${from_cond}`;
        state.set(keyFrom, (state.get(keyFrom) || 0) - qty);
      }
      if (to_loc && to_cond) {
        const keyTo = `${item_id}:${to_loc}:${to_cond}`;
        state.set(keyTo, (state.get(keyTo) || 0) + qty);
      }
    } else if (event_type === 'found') {
      if (to_loc && to_cond) {
        const keyTo = `${item_id}:${to_loc}:${to_cond}`;
        state.set(keyTo, (state.get(keyTo) || 0) + qty);
      }
    }
  }

  const result: StateEntry[] = [];
  for (const [key, qty] of state.entries()) {
    if (qty > 0) {
      const [item_id, location_id, condition] = key.split(':');
      result.push({
        item_id: parseInt(item_id, 10),
        location_id: location_id === 'null' ? null : parseInt(location_id, 10),
        condition,
        quantity: qty,
      });
    }
  }
  return result;
}

export async function buildItemStates(state: StateEntry[]): Promise<ItemState[]> {
  const db = await getDb();

  const itemIds = [...new Set(state.map(s => s.item_id))];
  const locationIds = [...new Set(state.filter(s => s.location_id !== null).map(s => s.location_id as number))];

  if (itemIds.length === 0) return [];

  const items = db.exec(`SELECT id, name, category, satuan, kode FROM items WHERE id IN (${itemIds.join(',')})`);
  const itemsMap = new Map<number, RawItem>();
  for (const row of items[0]?.values ?? []) {
    itemsMap.set(row[0] as number, { id: row[0] as number, name: row[1] as string, category: row[2] as string, satuan: row[3] as string, kode: row[4] as string | null });
  }

  const locationsMap = new Map<number, RawLocation>();
  if (locationIds.length > 0) {
    const locs = db.exec(`SELECT id, name, description FROM locations WHERE id IN (${locationIds.join(',')})`);
    for (const row of locs[0]?.values ?? []) {
      locationsMap.set(row[0] as number, { id: row[0] as number, name: row[1] as string, description: row[2] as string | null });
    }
  }

  const itemGroups = new Map<number, StateEntry[]>();
  for (const s of state) {
    if (!itemGroups.has(s.item_id)) itemGroups.set(s.item_id, []);
    itemGroups.get(s.item_id)!.push(s);
  }

  const result: ItemState[] = [];
  for (const [itemId, entries] of itemGroups) {
    const item = itemsMap.get(itemId);
    if (!item) continue;

    const locGroups = new Map<number | null, StateEntry[]>();
    for (const e of entries) {
      const lid = e.location_id;
      if (!locGroups.has(lid)) locGroups.set(lid, []);
      locGroups.get(lid)!.push(e);
    }

    const locations: LocationStock[] = [];
    const totalByCondition: Record<string, number> = {};
    let grandTotal = 0;

    for (const [locId, locEntries] of locGroups) {
      const byCondition: Record<string, number> = {};
      let locTotal = 0;
      for (const le of locEntries) {
        byCondition[le.condition] = (byCondition[le.condition] || 0) + le.quantity;
        locTotal += le.quantity;
      }
      grandTotal += locTotal;
      for (const [cond, qty] of Object.entries(byCondition)) {
        totalByCondition[cond] = (totalByCondition[cond] || 0) + qty;
      }
      locations.push({
        location_id: locId ?? 0,
        location_name: locId ? (locationsMap.get(locId)?.name ?? 'Tanpa Lokasi') : 'Tanpa Lokasi',
        by_condition: byCondition,
        total: locTotal,
      });
    }

    result.push({
      item_id: itemId,
      item_name: item.name,
      item_category: item.category,
      locations,
      total_by_condition: totalByCondition,
      grand_total: grandTotal,
    });
  }

  return result;
}

export async function getItemTimeline(itemId: number): Promise<(StockEvent & { location_from?: string; location_to?: string })[]> {
  const db = await getDb();

  const events = db.exec(
    `SELECT se.* FROM stock_events se WHERE se.item_id = ? ORDER BY se.event_date ASC, se.id ASC`,
    [itemId]
  );

  if (!events[0]) return [];

  const locIds = new Set<number>();
  const rows = events[0].values as any[][];
  for (const row of rows) {
    if (row[4]) locIds.add(row[4] as number);
    if (row[5]) locIds.add(row[5] as number);
  }

  const locMap = new Map<number, string>();
  if (locIds.size > 0) {
    const locs = db.exec(`SELECT id, name FROM locations WHERE id IN (${[...locIds].join(',')})`);
    for (const row of locs[0]?.values ?? []) {
      locMap.set(row[0] as number, row[1] as string);
    }
  }

  return rows.map((row: any[]) => ({
    id: row[0] as number,
    item_id: row[1] as number,
    item_unit_id: row[2] as number | null,
    event_type: row[3] as StockEvent['event_type'],
    from_location_id: row[4] as number | null,
    to_location_id: row[5] as number | null,
    from_condition: row[6] as string | null,
    to_condition: row[7] as string | null,
    quantity: row[8] as number,
    event_date: row[9] as string,
    recorded_by: row[10] as string | null,
    notes: row[11] as string | null,
    created_at: row[12] as string,
    location_from: row[4] ? locMap.get(row[4] as number) : undefined,
    location_to: row[5] ? locMap.get(row[5] as number) : undefined,
  }));
}

export async function getStateComparison(pastDate: string): Promise<ComparisonResult> {
  const pastState = await getCurrentState(pastDate);
  const currentState = await getCurrentState();

  const pastItems = await buildItemStates(pastState);
  const currentItems = await buildItemStates(currentState);

  const db = await getDb();
  const changesRaw = db.exec(
    `SELECT se.*, i.name as item_name,
            fl.name as from_loc_name, tl.name as to_loc_name
     FROM stock_events se
     JOIN items i ON i.id = se.item_id
     LEFT JOIN locations fl ON fl.id = se.from_location_id
     LEFT JOIN locations tl ON tl.id = se.to_location_id
     WHERE se.event_date > ?
     ORDER BY se.event_date ASC, se.id ASC`,
    [pastDate]
  );

  const changes: ChangeRecord[] = [];
  for (const row of changesRaw[0]?.values ?? []) {
    changes.push({
      item_id: row[1] as number,
      item_name: row[14] as string,
      type: row[3] as ChangeRecord['type'],
      from_location: row[16] as string | undefined,
      to_location: row[17] as string | undefined,
      from_condition: row[6] as string | undefined,
      to_condition: row[7] as string | undefined,
      quantity: row[8] as number,
      date: row[9] as string,
      notes: row[11] as string | null,
    });
  }

  return {
    past_date: pastDate,
    past_state: pastItems,
    current_state: currentItems,
    changes,
  };
}

export async function getTransferableLocations(itemId: number, locationId: number, condition: string, asOfDate?: string): Promise<number> {
  const state = await getCurrentState(asOfDate);
  const entry = state.find(s => s.item_id === itemId && s.location_id === locationId && s.condition === condition);
  return entry?.quantity ?? 0;
}
