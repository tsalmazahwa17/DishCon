import { NextResponse } from "next/server";

export const runtime = "nodejs";

type AssessmentBody = {
  food_name?: string;
  description?: string;
  portions?: number;
  production_time?: string;
  pickup_deadline?: string;
  storage?: string;
  storage_method?: string;
  halal?: boolean;
  halal_status?: string;
};

function pickNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const match = value.match(/\d+(?:[.,]\d+)?/);
    return match ? Number(match[0].replace(",", ".")) : 0;
  }
  return 0;
}

function normalizeRisk(value: unknown) {
  const raw = String(value || "unknown").toLowerCase();
  if (raw.includes("rendah") || raw.includes("low")) return "low";
  if (raw.includes("sedang") || raw.includes("medium")) return "medium";
  if (raw.includes("tinggi") || raw.includes("high")) return "high";
  return raw || "unknown";
}

export async function POST(req: Request) {
  try {
    const body: AssessmentBody = await req.json();

    if (!body.food_name?.trim()) {
      return NextResponse.json({ error: "Nama makanan wajib diisi." }, { status: 400 });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({ error: "OPENROUTER_API_KEY belum diisi di .env.local" }, { status: 500 });
    }

    const storageMethod = body.storage_method || body.storage || "-";
    const halalStatus = body.halal_status || (body.halal ? "halal" : "tidak diklaim halal");

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "DishCon AI"
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "meta-llama/llama-3.1-8b-instruct:free",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `Kamu adalah AI Food Safety, Nutrition, dan Food Expiry Expert untuk aplikasi DishCon.
Balas hanya JSON valid tanpa markdown.

Format JSON wajib:
{
  "nutrition": {
    "calories": 0,
    "protein": 0,
    "carbs": 0,
    "fat": 0,
    "ingredients_detected": [],
    "seasonings_detected": [],
    "allergens": [],
    "nutrition_note": ""
  },
  "expiry": {
    "risk_level": "low|medium|high",
    "safe_hours": 0,
    "recommended_consume_before": "",
    "storage_recommendation": "",
    "food_safety_warnings": [],
    "expiry_reason": ""
  }
}

Aturan:
- Semua field wajib diisi.
- calories, protein, carbs, dan fat adalah estimasi per porsi dalam angka.
- ingredients_detected berisi bahan utama yang terdeteksi.
- seasonings_detected berisi bumbu utama yang mungkin digunakan.
- allergens berisi potensi alergen; gunakan [] jika tidak ada.
- expiry mempertimbangkan jenis makanan, waktu produksi, batas ambil, dan penyimpanan.
- Jangan gunakan teks di luar JSON.`
          },
          {
            role: "user",
            content: `Nama makanan: ${body.food_name}
Deskripsi: ${body.description || "-"}
Jumlah porsi: ${body.portions || "-"}
Waktu produksi: ${body.production_time || "-"}
Batas ambil: ${body.pickup_deadline || "-"}
Cara penyimpanan: ${storageMethod}
Status halal: ${halalStatus}

Analisis makanan tersebut.`
          }
        ]
      }),
      signal: AbortSignal.timeout(60_000)
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: "Gagal menghubungi OpenRouter", detail: data }, { status: response.status });
    }

    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: "AI tidak mengembalikan response" }, { status: 500 });
    }

    let parsed: any;
    try {
      parsed = JSON.parse(String(content).replace(/```json/g, "").replace(/```/g, "").trim());
    } catch {
      return NextResponse.json({ error: "Response AI bukan JSON valid", raw: content }, { status: 500 });
    }

    const nutrition = parsed?.nutrition || {};
    const expiry = parsed?.expiry || {};
    const normalizedExpiry = {
      risk_level: normalizeRisk(expiry.risk_level),
      safe_hours: pickNumber(expiry.safe_hours),
      recommended_consume_before: String(expiry.recommended_consume_before || "-"),
      storage_recommendation: String(expiry.storage_recommendation || "-"),
      food_safety_warnings: Array.isArray(expiry.food_safety_warnings) ? expiry.food_safety_warnings.map(String) : [],
      expiry_reason: String(expiry.expiry_reason || "-")
    };

    const normalizedNutrition = {
      calories_estimate: pickNumber(nutrition.calories),
      calories: pickNumber(nutrition.calories),
      protein: pickNumber(nutrition.protein),
      carbohydrate: pickNumber(nutrition.carbs),
      carbs: pickNumber(nutrition.carbs),
      fat: pickNumber(nutrition.fat),
      ingredients_detected: Array.isArray(nutrition.ingredients_detected) ? nutrition.ingredients_detected.map(String) : [],
      seasonings_detected: Array.isArray(nutrition.seasonings_detected) ? nutrition.seasonings_detected.map(String) : [],
      allergens: Array.isArray(nutrition.allergens) ? nutrition.allergens.map(String) : [],
      nutrition_note: String(nutrition.nutrition_note || "Estimasi AI berdasarkan deskripsi makanan."),
      provider: data.model,
      confidence: 0.9,
      assessed_at: new Date().toISOString()
    };

    return NextResponse.json({
      provider: data.model,
      assessed_at: new Date().toISOString(),
      nutrition: normalizedNutrition,
      allergens: normalizedNutrition.allergens,
      expiry: normalizedExpiry,
      expiry_risk: normalizedExpiry.risk_level,
      recommendation: normalizedExpiry.storage_recommendation,
      confidence: 0.9
    });
  } catch (error) {
    return NextResponse.json({
      error: "Terjadi kesalahan pada AI assessment",
      detail: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
