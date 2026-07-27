export interface Item {
  id: number;
  name: string;
  category: string;
  satuan: string;
  kode: string | null;
}

export interface Location {
  id: number;
  name: string;
  description: string | null;
}

export interface ItemUnit {
  id: number;
  item_id: number;
  serial_number: string | null;
  label: string | null;
  current_location_id: number | null;
  current_condition: string;
}

export interface StockEvent {
  id: number;
  item_id: number;
  item_unit_id: number | null;
  event_type: 'initial' | 'transfer' | 'condition_change' | 'writeoff' | 'found' | 'lost';
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

export interface MaintenanceLog {
  id: number;
  item_id: number;
  item_unit_id: number | null;
  entry_date: string;
  completion_date: string | null;
  damage_description: string;
  repair_action: string | null;
  technician: string | null;
  cost: number | null;
  status: 'menunggu' | 'proses' | 'selesai' | 'tidak_bisa_diperbaiki';
  notes: string | null;
  created_at: string;
}

export type ItemCondition = 'Baik' | 'Rusak Ringan' | 'Rusak Berat' | 'Diputihkan' | 'Hilang';

export interface LocationStock {
  location_id: number;
  location_name: string;
  by_condition: Record<string, number>;
  total: number;
}

export interface ItemState {
  item_id: number;
  item_name: string;
  item_category: string;
  locations: LocationStock[];
  total_by_condition: Record<string, number>;
  grand_total: number;
}

export interface ComparisonResult {
  past_date: string;
  past_state: ItemState[];
  current_state: ItemState[];
  changes: ChangeRecord[];
}

export interface ChangeRecord {
  item_id: number;
  item_name: string;
  type: 'transfer' | 'condition_change' | 'writeoff' | 'lost' | 'found';
  from_location?: string;
  to_location?: string;
  from_condition?: string;
  to_condition?: string;
  quantity: number;
  date: string;
  notes: string | null;
}

export const CONDITIONS: ItemCondition[] = ['Baik', 'Rusak Ringan', 'Rusak Berat', 'Diputihkan', 'Hilang'];
export const EVENT_TYPES = ['initial', 'transfer', 'condition_change', 'writeoff', 'found', 'lost'] as const;
export const MAINTENANCE_STATUSES = ['menunggu', 'proses', 'selesai', 'tidak_bisa_diperbaiki'] as const;
