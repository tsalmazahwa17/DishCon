/**
 * lib/services/aiService.ts
 *
 * Layanan AI terpusat untuk DishCon AI.
 * Menggunakan OpenRouter sebagai provider utama dengan fallback lokal.
 */

// ─── Tipe Umum ────────────────────────────────────────────────────────────────

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AiServiceOptions = {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  systemPrompt?: string;
};

export type AiServiceResult = {
  content: string;
  provider: "openrouter" | "fallback";
  model: string;
};

// ─── Konfigurasi Default ──────────────────────────────────────────────────────

const DEFAULT_MODEL =
  process.env.OPENROUTER_MODEL || "meta-llama/llama-3.1-8b-instruct:free";

const DEFAULT_SYSTEM_PROMPT =
  "Kamu adalah asisten DishCon AI yang membantu mengelola donasi dan distribusi makanan. " +
  "Jawab dengan ringkas, akurat, dan dalam Bahasa Indonesia.";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// ─── Helper: Panggil OpenRouter ───────────────────────────────────────────────

async function callOpenRouter(
  messages: ChatMessage[],
  options: AiServiceOptions = {}
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY tidak ditemukan di .env.local");

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": SITE_URL,
      "X-Title": "DishCon AI",
    },
    body: JSON.stringify({
      model: options.model ?? DEFAULT_MODEL,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1024,
      messages,
    }),
    signal: AbortSignal.timeout(options.timeoutMs ?? 20_000),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(`OpenRouter error ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Respons kosong dari OpenRouter");

  return content as string;
}

// ─── Fungsi Utama: Chat Umum ──────────────────────────────────────────────────

/**
 * Kirim pesan ke AI dan dapatkan balasan teks.
 * Gunakan ini untuk fitur chatbot umum di DishCon AI.
 *
 * @example
 * const result = await askAI("Makanan apa yang paling cepat kadaluarsa?");
 * console.log(result.content);
 */
export async function askAI(
  userMessage: string,
  options: AiServiceOptions = {}
): Promise<AiServiceResult> {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: options.systemPrompt ?? DEFAULT_SYSTEM_PROMPT,
    },
    {
      role: "user",
      content: userMessage,
    },
  ];

  try {
    const content = await callOpenRouter(messages, options);
    return {
      content,
      provider: "openrouter",
      model: options.model ?? DEFAULT_MODEL,
    };
  } catch (error) {
    console.error("[aiService] OpenRouter gagal, gunakan fallback:", error);
    return {
      content:
        "Maaf, layanan AI sedang tidak tersedia. Silakan coba lagi nanti.",
      provider: "fallback",
      model: "local-fallback",
    };
  }
}

// ─── Fungsi: Multi-turn Chat (Percakapan) ─────────────────────────────────────

/**
 * Kirim riwayat percakapan lengkap ke AI (untuk chatbot multi-giliran).
 * Cocok untuk fitur tanya-jawab interaktif di halaman chatbot DishCon AI.
 *
 * @example
 * const history: ChatMessage[] = [
 *   { role: "user", content: "Ada donasi nasi hari ini?" },
 *   { role: "assistant", content: "Ya, ada 3 donasi nasi tersedia." },
 *   { role: "user", content: "Di mana lokasinya?" },
 * ];
 * const result = await chatWithHistory(history);
 */
export async function chatWithHistory(
  history: ChatMessage[],
  options: AiServiceOptions = {}
): Promise<AiServiceResult> {
  const systemMessage: ChatMessage = {
    role: "system",
    content: options.systemPrompt ?? DEFAULT_SYSTEM_PROMPT,
  };

  const messages: ChatMessage[] = [systemMessage, ...history];

  try {
    const content = await callOpenRouter(messages, options);
    return {
      content,
      provider: "openrouter",
      model: options.model ?? DEFAULT_MODEL,
    };
  } catch (error) {
    console.error("[aiService] chatWithHistory gagal:", error);
    return {
      content:
        "Maaf, layanan AI sedang tidak tersedia. Silakan coba lagi nanti.",
      provider: "fallback",
      model: "local-fallback",
    };
  }
}

// ─── Fungsi: Generate JSON Terstruktur ───────────────────────────────────────

/**
 * Minta AI mengembalikan data JSON terstruktur.
 * Cocok untuk generate rekomendasi, ringkasan, atau data dinamis.
 *
 * @example
 * const data = await askAIForJSON<{ tags: string[] }>(
 *   'Berikan 5 tag kategori untuk makanan: "Nasi Goreng Ayam"',
 *   'Balas hanya JSON valid. Schema: { "tags": string[] }'
 * );
 */
export async function askAIForJSON<T = unknown>(
  userMessage: string,
  schemaPrompt: string,
  options: AiServiceOptions = {}
): Promise<T | null> {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        `Kamu adalah asisten DishCon AI. ${schemaPrompt} ` +
        "Balas HANYA JSON valid tanpa markdown, tanpa penjelasan tambahan.",
    },
    {
      role: "user",
      content: userMessage,
    },
  ];

  try {
    const raw = await callOpenRouter(messages, {
      ...options,
      temperature: options.temperature ?? 0.2,
    });

    // Bersihkan markdown code block jika ada
    const cleaned = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned) as T;
  } catch (error) {
    console.error("[aiService] askAIForJSON gagal:", error);
    return null;
  }
}

// ─── Fungsi Khusus DishCon: Rekomendasi Penerima ─────────────────────────────

/**
 * Rekomendasikan prioritas penerima donasi berdasarkan data makanan.
 * Menggunakan prompt yang sudah disesuaikan untuk konteks food rescue.
 */
export async function recommendRecipients(params: {
  foodName: string;
  portions: number;
  expiryHours: number;
  recipientTypes?: string[];
}): Promise<string> {
  const { foodName, portions, expiryHours, recipientTypes } = params;

  const message =
    `Makanan: ${foodName}\n` +
    `Porsi tersedia: ${portions}\n` +
    `Sisa waktu sebelum kadaluarsa: ${expiryHours} jam\n` +
    (recipientTypes?.length
      ? `Tipe penerima tersedia: ${recipientTypes.join(", ")}\n`
      : "") +
    "Siapa yang sebaiknya diprioritaskan menerima donasi ini dan mengapa?";

  const result = await askAI(message, {
    systemPrompt:
      "Kamu adalah koordinator distribusi makanan DishCon AI. " +
      "Berikan rekomendasi singkat dan praktis tentang prioritas penerima donasi makanan " +
      "berdasarkan urgensi, jenis makanan, dan kebutuhan penerima.",
    temperature: 0.4,
  });

  return result.content;
}