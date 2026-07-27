import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { BsBoxSeam } from "react-icons/bs";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Inventaris Sekolah",
  description: "Aplikasi Manajemen Inventaris Sekolah",
};

const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/items", label: "Barang" },
  { href: "/locations", label: "Lokasi" },
  { href: "/transfer", label: "Transfer" },
  { href: "/condition", label: "Kondisi" },
  { href: "/maintenance", label: "Perbaikan" },
  { href: "/reports/history", label: "Laporan Historis" },
];

export default async function RootLayout({ children }: { children: React.ReactNode }) {

  return (
    <html lang="id" className={inter.className}>
      <body>
        <nav className="bg-blue-800 text-white no-print">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex items-center justify-between h-14">
              <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
                <BsBoxSeam className="text-xl" />
                Inventaris
              </Link>
              <div className="flex gap-1">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </nav>
        <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
