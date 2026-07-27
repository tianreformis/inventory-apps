import { recordEvent } from "@/lib/events";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  try {
    const id = await recordEvent(body);
    return Response.json({ success: true, id });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 400 });
  }
}
