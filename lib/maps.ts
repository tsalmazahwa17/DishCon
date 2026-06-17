export function buildMapsSearchUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function buildMapsDirectionsUrl(origin: string | undefined, destination: string) {
  const params = new URLSearchParams({
    api: "1",
    destination,
    travelmode: "driving"
  });
  if (origin?.trim()) params.set("origin", origin.trim());
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function buildMapsEmbedUrl(query: string) {
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
}

function normalized(value?: string) {
  return (value || "")
    .toLowerCase()
    .replace(/jaksel/g, "jakarta selatan")
    .replace(/jakbar/g, "jakarta barat")
    .replace(/jaktim/g, "jakarta timur")
    .replace(/jakut/g, "jakarta utara")
    .replace(/jakpus/g, "jakarta pusat")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const REGION_ALIASES: Record<string, string[]> = {
  "jakarta selatan": ["jakarta selatan", "kebayoran", "cilandak", "jagakarsa", "pasar minggu", "pancoran", "tebet", "setiabudi", "mampang", "pesanggrahan"],
  "jakarta pusat": ["jakarta pusat", "gambir", "menteng", "senen", "tanah abang", "kemayoran", "sawah besar", "cempaka putih", "johar baru"],
  "jakarta barat": ["jakarta barat", "kebon jeruk", "palmerah", "cengkareng", "grogol", "kalideres", "taman sari", "tambora", "kembangan"],
  "jakarta timur": ["jakarta timur", "jatinegara", "duren sawit", "cakung", "matraman", "pulogadung", "pasar rebo", "kramat jati", "ciracas", "cipayung"],
  "jakarta utara": ["jakarta utara", "kelapa gading", "koja", "cilincing", "penjaringan", "pademangan", "tanjung priok"],
  "bekasi": ["bekasi", "kota bekasi", "kabupaten bekasi", "tambun", "cikarang", "cibitung", "jatiasih", "rawalumbu", "bantar gebang", "pondok gede", "medan satria", "mustika jaya"],
  "depok": ["depok", "beji", "cinere", "cimanggis", "sawangan", "pancoran mas", "cilodong", "tapos", "limo"],
  "bogor": ["bogor", "cibinong", "sentul", "ciomas", "dramaga", "cileungsi", "gunung putri", "parung"],
  "tangerang": ["tangerang", "tangerang selatan", "serpong", "bsd", "ciputat", "bintaro", "pamulang", "karawaci", "ciledug"],
  "bandung": ["bandung", "cimahi", "cileunyi", "soreang", "dayeuhkolot", "buahbatu", "dago", "setiabudi bandung"],
  "surabaya": ["surabaya", "sidoarjo", "gresik"],
  "yogyakarta": ["yogyakarta", "jogja", "sleman", "bantul"],
  "semarang": ["semarang", "ungaran"],
  "medan": ["medan", "deli serdang"],
  "makassar": ["makassar", "gowa"]
};

const BETWEEN_REGION_KM: Record<string, number> = {
  "bekasi|jakarta selatan": 35,
  "bekasi|jakarta pusat": 28,
  "bekasi|jakarta barat": 42,
  "bekasi|jakarta timur": 18,
  "bekasi|jakarta utara": 32,
  "bekasi|depok": 32,
  "bekasi|bogor": 58,
  "bekasi|tangerang": 62,
  "jakarta selatan|jakarta pusat": 10,
  "jakarta selatan|jakarta barat": 18,
  "jakarta selatan|jakarta timur": 16,
  "jakarta selatan|jakarta utara": 25,
  "jakarta selatan|depok": 18,
  "jakarta selatan|tangerang": 28,
  "jakarta timur|depok": 22,
  "jakarta barat|tangerang": 16,
  "depok|bogor": 35,
  "depok|tangerang": 35
};

function detectRegion(value: string) {
  for (const [region, aliases] of Object.entries(REGION_ALIASES)) {
    if (aliases.some((alias) => value.includes(alias))) return region;
  }
  return "";
}

function sharedSpecificWords(from: string, to: string) {
  const stopWords = new Set(["jalan", "jl", "rt", "rw", "no", "nomor", "kota", "kabupaten", "kecamatan", "kelurahan", "desa", "indonesia", "provinsi", "daerah", "khusus", "ibukota"]);
  const fromWords = new Set(from.split(" ").filter((word) => word.length > 3 && !stopWords.has(word)));
  return to.split(" ").filter((word) => fromWords.has(word)).length;
}

function hashDistanceSeed(input: string) {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function estimateDistanceKm(origin?: string, destination?: string) {
  const from = normalized(origin);
  const to = normalized(destination);
  if (!to) return 999;
  if (!from) return 999;
  if (from === to || from.includes(to) || to.includes(from)) return 0.7;

  const fromRegion = detectRegion(from);
  const toRegion = detectRegion(to);

  if (fromRegion && toRegion && fromRegion !== toRegion) {
    const directKey = `${fromRegion}|${toRegion}`;
    const reverseKey = `${toRegion}|${fromRegion}`;
    return BETWEEN_REGION_KM[directKey] ?? BETWEEN_REGION_KM[reverseKey] ?? 75;
  }

  const sharedWords = sharedSpecificWords(from, to);
  if (fromRegion && toRegion && fromRegion === toRegion) {
    if (sharedWords >= 2) return 1.5;
    if (sharedWords === 1) return 3.5;
    const seed = hashDistanceSeed(`${from}|${to}`);
    return Number((5 + (seed % 800) / 100).toFixed(1));
  }

  if (sharedWords >= 2) return 4.5;
  if (sharedWords === 1) return 9.5;

  return 120;
}

export function formatDistanceKm(distance: number) {
  if (!Number.isFinite(distance) || distance >= 999) return "alamat profil belum lengkap";
  return `${distance.toFixed(distance < 10 ? 1 : 0)} km`;
}
