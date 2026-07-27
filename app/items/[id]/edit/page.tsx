import { getDb } from "@/lib/db";
import { notFound } from "next/navigation";
import ItemForm from "../../ItemForm";

export default async function EditItemPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const db = await getDb();
  const rows = db.exec("SELECT id, name, category, satuan, kode FROM items WHERE id = ?", [parseInt(id)]);
  const row = rows[0]?.values[0] as any[];
  if (!row) notFound();

  return <ItemForm item={{ id: row[0], name: row[1], category: row[2], satuan: row[3], kode: row[4] }} />;
}
