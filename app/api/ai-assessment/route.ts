import { NextResponse } from "next/server";
import type { AiAssessment } from "@/lib/types";

export const runtime = "nodejs";

type AssessmentPayload = {
  food_name?: string;
  description?: string;
  production_time?: string;
  pickup_deadline?: string;
  storage?: string;
  portions?: number;
  halal?: boolean;
};

function hoursBetween(start?: string, end?: string) {
  if (!start || !end) return null;
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) return null;
  return Math.max(0, (endTime - startTime) / 3_600_000);
}

function localAssessment(payload: AssessmentPayload): AiAssessment {
  const text = `${payload.food_name ?? ""} ${payload.description ?? ""}`.toLowerCase();
  const storage = (payload.storage || "").toLowerCase();
  const availableHours = hoursBetween(payload.production_time, payload.pickup_deadline);

  const proteinFood = /(ayam|ikan|daging|telur|tahu|tempe|susu|keju)/.test(text);
  const carbohydrateFood = /(nasi|mie|roti|kentang|pasta|bubur|kue)/.test(text);
  const fattyFood = /(goreng|santan|keju|krim|mentega)/.test(text);
  const vegetables = /(sayur|salad|bayam|wortel|brokoli|buah)/.test(text);
  const highRisk = /(santan|susu|krim|seafood|ikan|daging|ayam|telur|mayones)/.test(text);
  const chilled = /(pendingin|kulkas|2-5|freezer)/.test(storage);
  const heated = /(penghangat|hangat)/.test(storage);

  const caloriesLow = vegetables && !fattyFood && !carbohydrateFood;
  const calories = caloriesLow ? "120-250 kkal/porsi" : fattyFood ? "500-750 kkal/porsi" : "300-550 kkal/porsi";
  const allergens: string[] = [];
  if (/(roti|mie|kue|tepung)/.test(text)) allergens.push("gluten");
  if (/(susu|keju|krim|mentega)/.test(text)) allergens.push("susu");
  if (/(telur|mayones)/.test(text)) allergens.push("telur");
  if (/(kacang|saus kacang)/.test(text)) allergens.push("kacang");
  if (/(udang|kepiting|kerang|seafood)/.test(text)) allergens.push("krustasea/seafood");

  let expiryRisk = "Risiko sedang - prioritaskan pengambilan dalam 8-12 jam";
  if (highRisk && !chilled && !heated) expiryRisk = "Risiko tinggi - prioritaskan pengambilan maksimal 4 jam";
  else if (highRisk && chilled) expiryRisk = "Risiko sedang - aman sementara bila rantai dingin terjaga";
  else if (!highRisk && chilled) expiryRisk = "Risiko rendah - tetap periksa aroma, tekstur, dan kemasan";
  if (availableHours !== null && availableHours > 12 && highRisk && !chilled) expiryRisk = "Risiko sangat tinggi - batas ambil perlu dipercepat";

  return {
    provider: "local-food-safety-rules",
    nutrition: {
      calories_estimate: calories,
      protein: proteinFood ? "sedang-tinggi" : "rendah-sedang",
      carbohydrate: carbohydrateFood ? "sedang-tinggi" : "rendah-sedang",
      fat: fattyFood ? "sedang-tinggi" : "rendah-sedang",
      fiber: vegetables ? "sedang-tinggi" : "rendah"
    },
    allergens,
    expiry_risk: expiryRisk,
    recommendation: chilled
      ? "Pertahankan rantai dingin, gunakan kemasan tertutup, dan verifikasi kondisi fisik saat serah terima."
      : heated
        ? "Jaga suhu panas secara konsisten dan hindari pemanasan berulang sebelum disalurkan."
        : "Gunakan kemasan tertutup, hindari paparan suhu ruang terlalu lama, dan prioritaskan penerima terdekat.",
    confidence: payload.description?.trim() ? 0.82 : 0.65,
    assessed_at: new Date().toISOString()
  };
}

function normalizeAssessment(raw: unknown, fallback: AiAssessment): AiAssessment {
  const value = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  const nutrition = value.nutrition && typeof value.nutrition === "object" ? value.nutrition as Record<string, unknown> : fallback.nutrition;
  const allergens = Array.isArray(value.allergens) ? value.allergens.map(String) : fallback.allergens;
  return {
    provider: String(value.provider || "openrouter"),
    nutrition,
    allergens,
    expiry_risk: String(value.expiry_risk || fallback.expiry_risk),
    recommendation: String(value.recommendation || fallback.recommendation),
    confidence: typeof value.confidence === "number" ? value.confidence : fallback.confidence,
    assessed_at: new Date().toISOString()
  };
}

export async function POST(request: Request) {
  const payload = (await request.json()) as AssessmentPayload;
  if (!payload.food_name?.trim()) {
    return NextResponse.json({ error: "Nama makanan wajib diisi untuk analisis AI." }, { status: 400 });
  }

  const fallback = localAssessment(payload);
  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json(fallback);
  }

  const prompt = [
    "Anda adalah asisten penilaian awal makanan donasi, bukan pengganti pemeriksaan petugas keamanan pangan.",
    "Analisis data berikut dan balas hanya JSON valid.",
    "Schema wajib: {provider:string,nutrition:{calories_estimate:string,protein:string,carbohydrate:string,fat:string,fiber:string},allergens:string[],expiry_risk:string,recommendation:string,confidence:number}.",
    `Data: ${JSON.stringify(payload)}`
  ].join("\n");

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "DishCon"
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "meta-llama/llama-3.1-8b-instruct:free",
        temperature: 0.2,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      }),
      signal: AbortSignal.timeout(20_000)
    });

    if (!response.ok) return NextResponse.json(fallback);
    const result = await response.json();
    const content = result?.choices?.[0]?.message?.content;
    if (!content) return NextResponse.json(fallback);
    return NextResponse.json(normalizeAssessment(JSON.parse(content), fallback));
  } catch {
    return NextResponse.json(fallback);
  }
}
