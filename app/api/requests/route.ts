import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET() {
  if (!supabase) return NextResponse.json({ source: "local-demo", data: [] });
  const { data, error } = await supabase.from("food_requests").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ source: "supabase", data: data || [] });
}

export async function POST(request: Request) {
  const payload = await request.json();
  if (!payload?.id || !payload?.recipient_id || !payload?.food_name || !payload?.portions) {
    return NextResponse.json({ error: "id, recipient_id, food_name, dan portions wajib diisi" }, { status: 400 });
  }
  if (!supabase) return NextResponse.json({ source: "local-demo", data: { ...payload, status: "pending" } }, { status: 201 });
  const { data, error } = await supabase.from("food_requests").insert(payload).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ source: "supabase", data }, { status: 201 });
}
