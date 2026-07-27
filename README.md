# Inventaris Sekolah

Aplikasi web manajemen inventaris barang sekolah berbasis **event sourcing**.  
Dibangun dengan Next.js 16 (App Router), SQLite, dan Tailwind CSS.

## Fitur

- **Manajemen Master Data** — CRUD barang dan lokasi/ruangan
- **Stok Awal** — Input stok awal barang di suatu lokasi dengan kondisi
- **Transfer Barang** — Pindahkan stok antar lokasi, riwayat otomatis tercatat
- **Perubahan Kondisi** — Ubah kondisi barang (Rusak Ringan / Rusak Berat / Diputihkan / Hilang)
- **Log Perbaikan** — Catat perbaikan barang; status "Selesai" otomatis mengembalikan kondisi ke Baik
- **Dashboard** — Ringkasan stok saat ini per barang per kondisi
- **Timeline per Barang** — Riwayat kronologis semua kejadian (masuk, pindah, rusak, perbaikan, dll)
- **Laporan Historis** — Bandingkan kondisi inventaris di tanggal tertentu vs sekarang, dengan sorotan perubahan

## Arsitektur

Data stok tidak disimpan sebagai angka final — **semua perubahan adalah event**.

```
flow:
  User Action → stock_events (tabel) → replay → current state
```

Fungsi inti di `lib/events.ts`:
- `recordEvent(event)` — insert baris kejadian
- `getCurrentState(asOfDate?)` — replay semua event sampai tanggal tertentu
- `getStateComparison(pastDate)` — side-by-side masa lalu vs sekarang + daftar perubahan

## Tech Stack

| Teknologi | Keterangan |
|-----------|------------|
| Next.js 16 | App Router, Server Components, Turbopack |
| sql.js | SQLite WASM (tanpa native compilation) |
| Tailwind CSS 4 | Utility-first styling |
| react-icons | Icons |
| xlsx | Seed dari file Excel |

## Persiapan

```bash
npm install
```

## Menjalankan

```bash
npm run dev        # Development server (Turbopack)
npm run build      # Production build
npm run start      # Production server
npx eslint .       # Linting (next lint dihapus di v16)
```

Database otomatis dibuat di `data/inventory.db` saat pertama kali diakses.

## Seed Data

Tempatkan file `data.xlsx` di root proyek dengan sheet **Inventaris Lab Komputer**:

| No | Nama Barang | Jumlah | Baik | Rusak | Keterangan Tambahan | Anggaran |
|----|-------------|--------|------|-------|---------------------|----------|

Tanpa file Excel, aplikasi menggunakan data demo bawaan.

## Struktur Proyek

```
├── app/
│   ├── api/            # REST API routes
│   ├── items/          # CRUD + detail/timeline
│   ├── locations/      # CRUD lokasi
│   ├── transfer/       # Form transfer
│   ├── condition/      # Form kondisi/write-off
│   ├── maintenance/    # Log perbaikan
│   ├── reports/history # Laporan point-in-time
│   ├── layout.tsx      # Layout + navigasi
│   └── page.tsx        # Dashboard
├── lib/
│   ├── db.ts           # Koneksi SQLite + migrasi
│   ├── events.ts       # Event engine (jantung sistem)
│   ├── seed.ts         # Seed data (Excel → DB)
│   └── types.ts        # Shared TypeScript types
├── data/               # Database file (gitignored)
└── data.xlsx           # Source data (optional)
```

## Catatan Next.js 16

- `params` dan `searchParams` adalah **Promise** — harus di-`await`
- Turbopack adalah bundler default
- `next lint` command dihapus, gunakan ESLint langsung
- `sql.js` dan `xlsx` tercantum di `serverExternalPackages` di `next.config.ts`

## Lisensi

Hanya untuk penggunaan internal sekolah.
