'use client';

import { HiPrinter } from "react-icons/hi2";

export default function PrintButton() {
  return (
    <button onClick={() => window.print()} className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg text-sm hover:bg-gray-200">
      <HiPrinter /> Cetak / PDF
    </button>
  );
}
