import type { Donation, FoodRequest, NutritionEstimate } from "@/lib/types";

export type NutritionTotals = {
  calories: number;
  protein: number;
  carbohydrate: number;
  fat: number;
  fiber: number;
  count: number;
};

function averageRange(numbers: number[]) {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, item) => sum + item, 0) / numbers.length;
}

export function parseNutritionNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return 0;
  const numbers = value.match(/\d+(?:[.,]\d+)?/g)?.map((item) => Number(item.replace(",", "."))).filter(Number.isFinite) || [];
  return averageRange(numbers);
}

export function scaleNutrition(nutrition: NutritionEstimate | null | undefined, portions: number): NutritionTotals {
  return {
    calories: parseNutritionNumber(nutrition?.calories_estimate) * portions,
    protein: parseNutritionNumber(nutrition?.protein) * portions,
    carbohydrate: parseNutritionNumber(nutrition?.carbohydrate) * portions,
    fat: parseNutritionNumber(nutrition?.fat) * portions,
    fiber: parseNutritionNumber(nutrition?.fiber) * portions,
    count: nutrition ? 1 : 0
  };
}

export function addNutritionTotals(items: NutritionTotals[]): NutritionTotals {
  return items.reduce<NutritionTotals>((total, item) => ({
    calories: total.calories + item.calories,
    protein: total.protein + item.protein,
    carbohydrate: total.carbohydrate + item.carbohydrate,
    fat: total.fat + item.fat,
    fiber: total.fiber + item.fiber,
    count: total.count + item.count
  }), { calories: 0, protein: 0, carbohydrate: 0, fat: 0, fiber: 0, count: 0 });
}

export function buildReceivedNutritionSummary(requests: FoodRequest[], donations: Donation[]) {
  const completedRequests = requests.filter((request) => request.status === "completed");
  const details = completedRequests.map((request) => {
    const donation = donations.find((item) => item.id === request.donation_id);
    return {
      request,
      donation,
      totals: scaleNutrition(donation?.nutrition, request.portions)
    };
  });
  return {
    details,
    totals: addNutritionTotals(details.map((item) => item.totals))
  };
}

export function formatNutritionValue(value: number, unit: string) {
  if (!Number.isFinite(value) || value <= 0) return "-";
  const rounded = value >= 100 ? Math.round(value) : Number(value.toFixed(1));
  return `${rounded} ${unit}`;
}

export function compactNutritionLabel(nutrition: NutritionEstimate | null | undefined) {
  if (!nutrition) return "Belum ada hasil AI";
  const caloriesValue = nutrition.calories_estimate ?? nutrition.calories;
  const calories = caloriesValue !== undefined && caloriesValue !== null && caloriesValue !== "" ? `${String(caloriesValue)} kkal/porsi` : "Kalori belum tersedia";
  const protein = nutrition.protein !== undefined && nutrition.protein !== null && nutrition.protein !== "" ? `Protein ${nutrition.protein} g` : "Protein -";
  return `${calories} · ${protein}`;
}
