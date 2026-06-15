import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET() {
  if (!supabase) return NextResponse.json({ source: "local-demo", data: [] });
  const { data, error } = await supabase.from("donations").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ source: "supabase", data: data || [] });
}

export async function POST(request: Request) {
  const payload = await request.json();
  if (!payload?.food_name || !payload?.donor_id || !payload?.portions || !payload?.location || !payload?.pickup_deadline) {
    return NextResponse.json({ error: "food_name, donor_id, portions, location, dan pickup_deadline wajib diisi" }, { status: 400 });
  }
  if (!supabase) return NextResponse.json({ source: "local-demo", data: { ...payload, status: "pending_verification" } }, { status: 201 });
  const { data, error } = await supabase.from("donations").insert(payload).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ source: "supabase", data }, { status: 201 });
}
