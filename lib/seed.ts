import { getDb, saveDb } from './db';
import fs from 'fs';
import path from 'path';

async function seedFromXlsx(): Promise<boolean> {
  try {
    const XLSX = await import('xlsx');
    const xlsxPath = path.join(process.cwd(), 'data.xlsx');
    if (!fs.existsSync(xlsxPath)) return false;

    const buf = fs.readFileSync(xlsxPath);
    const wb = XLSX.read(buf, { type: 'buffer' });
    const sheet = wb.Sheets['Inventaris Lab Komputer'];
    if (!sheet) return false;

    const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    const dataStart = rows.findIndex((r: unknown[]) => r[0] === 'No');
    if (dataStart === -1) return false;

    const db = await getDb();

    const locRows = db.exec("SELECT COUNT(*) as c FROM locations WHERE name = 'Lab Komputer'");
    const locExists = (locRows[0]?.values[0][0] as number) > 0;
    if (!locExists) {
      db.run("INSERT INTO locations (name, description) VALUES ('Lab Komputer', 'Laboratorium komputer utama')");
      saveDb();
    }

    const locResult = db.exec("SELECT id FROM locations WHERE name = 'Lab Komputer'");
    const labId = locResult[0]?.values[0][0] as number;

    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const defaultDate = '2025-07-01';

    for (let i = dataStart + 2; i < rows.length; i++) {
      const row = rows[i] as unknown[];
      const name = String(row[1] ?? '').trim();
      const totalRaw = row[2];
      const baikRaw = row[3];
      const rusakRaw = row[4];
      const notes = String(row[5] ?? '').trim();
      const anggaran = String(row[6] ?? '').trim();

      if (!name || name === 'Nama Barang') continue;

      const total = parseInt(String(totalRaw), 10) || 0;
      const baik = parseInt(String(baikRaw), 10) || 0;
      const rusak = parseInt(String(rusakRaw), 10) || 0;

      const existing = db.exec("SELECT id FROM items WHERE name = ?", [name]);
      let itemId: number;
      if ((existing[0]?.values?.length ?? 0) > 0) {
        itemId = existing[0]!.values[0][0] as number;
      } else {
        let category = 'Lainnya';
        if (/komputer|server|monitor|cpu/i.test(name)) category = 'Elektronik';
        else if (/meja|kursi|lemari/i.test(name)) category = 'Furnitur';
        else if (/ac|kipas|air conditioner/i.test(name)) category = 'Elektronik';
        else if (/printer|switch|router|access point|ups/i.test(name)) category = 'Jaringan';
        else if (/mouse|keyboard|headphone|speaker/i.test(name)) category = 'Aksesoris';

        db.run("INSERT INTO items (name, category, satuan) VALUES (?, ?, 'unit')", [name, category]);
        saveDb();
        const newItem = db.exec("SELECT id FROM items WHERE name = ?", [name]);
        itemId = newItem[0]?.values[0][0] as number;
      }

      const fullNotes = [notes, anggaran ? `Anggaran: ${anggaran}` : ''].filter(Boolean).join(' | ') || null;

      if (baik > 0) {
        db.run(
          `INSERT INTO stock_events (item_id, event_type, to_location_id, to_condition, quantity, event_date, notes, created_at)
           VALUES (?, 'initial', ?, 'Baik', ?, ?, ?, ?)`,
          [itemId, labId, baik, defaultDate, fullNotes, now]
        );
        saveDb();
      }
      if (rusak > 0) {
        db.run(
          `INSERT INTO stock_events (item_id, event_type, to_location_id, to_condition, quantity, event_date, notes, created_at)
           VALUES (?, 'initial', ?, 'Rusak Ringan', ?, ?, ?, ?)`,
          [itemId, labId, rusak, defaultDate, fullNotes, now]
        );
        saveDb();
      }
    }

    return true;
  } catch (e) {
    console.error('XLSX seed error:', e);
    return false;
  }
}

async function seedFallback(): Promise<void> {
  const db = await getDb();

  const existing = db.exec("SELECT COUNT(*) as c FROM items");
  if ((existing[0]?.values[0][0] as number) > 0) return;

  db.run(`INSERT INTO items (name, category, satuan) VALUES 
    ('Komputer', 'Elektronik', 'unit'),
    ('Headset', 'Aksesoris', 'unit'),
    ('Printer', 'Elektronik', 'unit'),
    ('Proyektor', 'Elektronik', 'unit'),
    ('Kursi', 'Furnitur', 'unit'),
    ('Meja', 'Furnitur', 'unit')
  `);

  db.run(`INSERT INTO locations (name, description) VALUES 
    ('Lab Komputer', 'Laboratorium komputer utama'),
    ('Ruang Guru 1', 'Ruang guru pertama'),
    ('Ruang Guru 2', 'Ruang guru kedua'),
    ('Perpustakaan', 'Perpustakaan sekolah'),
    ('Gudang', 'Gudang penyimpanan')
  `);

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

  db.run(`INSERT INTO stock_events (item_id, event_type, to_location_id, to_condition, quantity, event_date, notes, created_at) VALUES
    (1, 'initial', 1, 'Baik', 23, '2025-01-15', 'Stok awal komputer Lab Komputer', '2025-01-15 08:00:00'),
    (1, 'initial', 1, 'Rusak Ringan', 2, '2025-01-15', 'Stok awal komputer Lab Komputer', '2025-01-15 08:00:00'),
    (2, 'initial', 1, 'Baik', 23, '2025-01-15', 'Stok awal headset Lab Komputer', '2025-01-15 08:00:00'),
    (2, 'initial', 2, 'Baik', 5, '2025-01-15', 'Stok awal headset Ruang Guru 1', '2025-01-15 08:00:00'),
    (2, 'initial', 3, 'Baik', 5, '2025-01-15', 'Stok awal headset Ruang Guru 2', '2025-01-15 08:00:00'),
    (3, 'initial', 2, 'Baik', 1, '2025-01-15', 'Printer Ruang Guru 1', '2025-01-15 08:00:00'),
    (3, 'initial', 3, 'Baik', 1, '2025-01-15', 'Printer Ruang Guru 2', '2025-01-15 08:00:00'),
    (3, 'initial', 4, 'Baik', 1, '2025-01-15', 'Printer Perpustakaan', '2025-01-15 08:00:00'),
    (4, 'initial', 1, 'Baik', 2, '2025-01-15', 'Proyektor Lab Komputer', '2025-01-15 08:00:00'),
    (4, 'initial', 4, 'Baik', 1, '2025-01-15', 'Proyektor Perpustakaan', '2025-01-15 08:00:00'),
    (5, 'initial', 1, 'Baik', 25, '2025-01-15', 'Kursi Lab Komputer', '2025-01-15 08:00:00'),
    (5, 'initial', 2, 'Baik', 10, '2025-01-15', 'Kursi Ruang Guru 1', '2025-01-15 08:00:00'),
    (5, 'initial', 3, 'Baik', 10, '2025-01-15', 'Kursi Ruang Guru 2', '2025-01-15 08:00:00'),
    (6, 'initial', 1, 'Baik', 25, '2025-01-15', 'Meja Lab Komputer', '2025-01-15 08:00:00'),
    (6, 'initial', 2, 'Baik', 5, '2025-01-15', 'Meja Ruang Guru 1', '2025-01-15 08:00:00'),
    (6, 'initial', 3, 'Baik', 5, '2025-01-15', 'Meja Ruang Guru 2', '2025-01-15 08:00:00')
  `);

  saveDb();

  const printerRows = db.exec("SELECT id FROM items WHERE name = 'Printer'");
  const printerId = printerRows[0]?.values[0][0] as number;

  db.run(`INSERT INTO maintenance_logs (item_id, entry_date, damage_description, repair_action, technician, cost, status, notes) VALUES
    (?, '2025-06-01', 'Printer tidak mau menyala', 'Ganti power supply', 'Teknisi A', 250000, 'selesai', 'Power supply putus'),
    (?, '2025-07-15', 'Print hasil bergaris-garis', 'Bersihkan print head', 'Teknisi A', 50000, 'selesai', 'Tinta kering')
  `, [printerId, printerId]);
  saveDb();
}

export async function seedDatabase(): Promise<void> {
  const db = await getDb();
  const existing = db.exec("SELECT COUNT(*) as c FROM items");
  if ((existing[0]?.values[0][0] as number) > 0) return;

  const seeded = await seedFromXlsx();
  if (!seeded) {
    await seedFallback();
  }
}
