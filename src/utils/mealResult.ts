import type { MealAnalysisResult } from "@/src/types/meals";

function toNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function normalizeMealResult(input: unknown): MealAnalysisResult {
  if (!input || typeof input !== "object") {
    return {
      food_name: "식단 분석 결과",
      food_items: [],
      overall_score: 0,
      feedback_summary: "분석 결과를 불러오지 못했어요.",
      estimated_calories: 0,
      sodium_level: "-",
      vitamin_info: { level: "-" },
      mineral_info: { level: "-" },
      nutrition_ratio: {
        carbohydrate_pct: 0,
        protein_pct: 0,
        fat_pct: 0,
      },
      detailed_analysis: {
        strength: "",
        improvement: "",
      },
      recommendations: [],
      next_meal_suggestion: {
        concept: "",
        menu_example: [],
        reason: "",
      },
    };
  }

  const raw = input as Record<string, unknown>;

  return {
    food_name:
      typeof raw.food_name === "string" ? raw.food_name : "식단 분석 결과",
    food_items: toStringArray(raw.food_items),
    overall_score: toNumber(raw.overall_score, 0),
    feedback_summary:
      typeof raw.feedback_summary === "string"
        ? raw.feedback_summary
        : "식단 분석 결과를 정리했어요.",
    estimated_calories: toNumber(raw.estimated_calories, 0),
    sodium_level:
      typeof raw.sodium_level === "string" ? raw.sodium_level : "-",
    vitamin_info:
      raw.vitamin_info && typeof raw.vitamin_info === "object"
        ? {
            level:
              typeof (raw.vitamin_info as Record<string, unknown>).level ===
              "string"
                ? ((raw.vitamin_info as Record<string, unknown>).level as string)
                : "-",
            description:
              typeof (raw.vitamin_info as Record<string, unknown>).description ===
              "string"
                ? ((raw.vitamin_info as Record<string, unknown>)
                    .description as string)
                : undefined,
          }
        : { level: "-" },
    mineral_info:
      raw.mineral_info && typeof raw.mineral_info === "object"
        ? {
            level:
              typeof (raw.mineral_info as Record<string, unknown>).level ===
              "string"
                ? ((raw.mineral_info as Record<string, unknown>).level as string)
                : "-",
            description:
              typeof (raw.mineral_info as Record<string, unknown>).description ===
              "string"
                ? ((raw.mineral_info as Record<string, unknown>)
                    .description as string)
                : undefined,
          }
        : { level: "-" },
    nutrition_ratio:
      raw.nutrition_ratio && typeof raw.nutrition_ratio === "object"
        ? {
            carbohydrate_pct: toNumber(
              (raw.nutrition_ratio as Record<string, unknown>).carbohydrate_pct,
              0
            ),
            protein_pct: toNumber(
              (raw.nutrition_ratio as Record<string, unknown>).protein_pct,
              0
            ),
            fat_pct: toNumber(
              (raw.nutrition_ratio as Record<string, unknown>).fat_pct,
              0
            ),
          }
        : {
            carbohydrate_pct: 0,
            protein_pct: 0,
            fat_pct: 0,
          },
    detailed_analysis:
      raw.detailed_analysis && typeof raw.detailed_analysis === "object"
        ? {
            strength:
              typeof (raw.detailed_analysis as Record<string, unknown>)
                .strength === "string"
                ? ((raw.detailed_analysis as Record<string, unknown>)
                    .strength as string)
                : "",
            improvement:
              typeof (raw.detailed_analysis as Record<string, unknown>)
                .improvement === "string"
                ? ((raw.detailed_analysis as Record<string, unknown>)
                    .improvement as string)
                : "",
          }
        : {
            strength: "",
            improvement: "",
          },
    recommendations: Array.isArray(raw.recommendations)
      ? raw.recommendations.map((item) => {
          const rec =
            item && typeof item === "object"
              ? (item as Record<string, unknown>)
              : {};
          return {
            nutrient:
              typeof rec.nutrient === "string" ? rec.nutrient : undefined,
            foods: toStringArray(rec.foods),
            reason: typeof rec.reason === "string" ? rec.reason : undefined,
          };
        })
      : [],
    next_meal_suggestion:
      raw.next_meal_suggestion && typeof raw.next_meal_suggestion === "object"
        ? {
            concept:
              typeof (raw.next_meal_suggestion as Record<string, unknown>)
                .concept === "string"
                ? ((raw.next_meal_suggestion as Record<string, unknown>)
                    .concept as string)
                : "",
            menu_example: toStringArray(
              (raw.next_meal_suggestion as Record<string, unknown>).menu_example
            ),
            reason:
              typeof (raw.next_meal_suggestion as Record<string, unknown>)
                .reason === "string"
                ? ((raw.next_meal_suggestion as Record<string, unknown>)
                    .reason as string)
                : "",
          }
        : {
            concept: "",
            menu_example: [],
            reason: "",
          },
  };
}