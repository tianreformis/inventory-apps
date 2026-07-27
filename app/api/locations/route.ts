import { getDb, saveDb } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET() {
  const db = await getDb();
  const locs = db.exec("SELECT id, name, description FROM locations ORDER BY name");
  const result = (locs[0]?.values ?? []).map((row: any[]) => ({
    id: row[0], name: row[1], description: row[2],
  }));
  return Response.json(result);
}

export async function POST(request: NextRequest) {
  const { name, description } = await request.json();
  const db = await getDb();
  try {
    db.run("INSERT INTO locations (name, description) VALUES (?, ?)", [name, description ?? null]);
    saveDb();
    return Response.json({ success: true });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 400 });
  }
}
