export type MealAnalysisMode = "free" | "premium";

export type MealNutritionRatio = {
  carbohydrate_pct?: number;
  protein_pct?: number;
  fat_pct?: number;
};

export type MealDailyRecommendedRatio = {
  calories_pct?: number;
  carbohydrate_pct?: number;
  protein_pct?: number;
  fat_pct?: number;
  sodium_pct?: number;
};

export type MealLevelInfo = {
  level?: string;
  description?: string;
};

export type MealDetailedAnalysis = {
  strength?: string;
  improvement?: string;
};

export type MealRecommendation = {
  nutrient?: string;
  foods?: string[];
  reason?: string;
};

export type MealNextMealSuggestion = {
  concept?: string;
  menu_example?: string[];
  reason?: string;
};

export type MealAnalysisResult = {
  food_name?: string;
  food_items?: string[];
  overall_score?: number;
  feedback_summary?: string;
  estimated_calories?: number;
  sodium_level?: string;
  daily_recommended_ratio?: MealDailyRecommendedRatio;
  daily_intake_ratio?: MealDailyRecommendedRatio;
  recommended_ratio?: MealDailyRecommendedRatio;
  vitamin_info?: MealLevelInfo;
  mineral_info?: MealLevelInfo;
  nutrition_ratio?: MealNutritionRatio;
  detailed_analysis?: MealDetailedAnalysis;
  recommendations?: MealRecommendation[];
  next_meal_suggestion?: MealNextMealSuggestion;
};

export type RequestMealAnalysisResponse = {
  task_id?: string;
  status?: string;
  message?: string;
};

export type MealAnalysisStatusResponse = {
  task_id?: string;
  status?: string;
  message?: string;
  error?: string | null;
  result?: MealAnalysisResult | string | null;
  data?: {
    result?: MealAnalysisResult | string | null;
    usage?: Record<string, unknown>;
  };
};

export type PendingMealAnalysis = {
  taskId: string;
  mode: MealAnalysisMode;
  image: string;
};

export type StoredDietResult = {
  mode: MealAnalysisMode;
  image: string;
  result: MealAnalysisResult;
};
