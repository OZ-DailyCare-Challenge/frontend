"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Coins,
  HeartPulse,
  Leaf,
  Sparkles,
} from "lucide-react";
import type {
  MealAnalysisMode,
  MealAnalysisResult,
} from "@/src/types/meals";

type NormalizedMealResult = MealAnalysisResult & {
  feedback?: string;
  feedback_summary?: string;
  estimated_calories?: number | null;
  overall_score?: number | null;
  sodium_level?: string;
  vitamin_info?: {
    level?: string;
    description?: string;
    detail?: string;
  } | null;
  mineral_info?: {
    level?: string;
    description?: string;
    detail?: string;
  } | null;
};

type Props = {
  mode: MealAnalysisMode;
  image: string;
  result: NormalizedMealResult;
};

type MacroItem = {
  label: string;
  value: number;
};

type DailyMealRatioCardProps = {
  calories?: number | null;
  carbohydrate?: number | null;
  protein?: number | null;
  fat?: number | null;
  sodium?: number | null;
};

function levelColor(level: string) {
  if (
    level === "분석 정보 없음" ||
    level === "-" ||
    !level ||
    level === "없음"
  ) {
    return "bg-[#f4f5f4] text-[#6f7c75]";
  }

  if (level === "높음") return "bg-[#fff1f1] text-[#b54a4a]";
  if (level === "낮음") return "bg-[#eef6ff] text-[#315b8f]";
  return "bg-[#f4f8ef] text-[#6a8c1e]";
}

function displayText(
  value?: string | number | null,
  fallback = "분석 정보 없음"
) {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function displayPercent(value?: number | null) {
  return value == null ? "-" : `${value}%`;
}

function MacroDonutChart({ macros }: { macros: MacroItem[] }) {
  const normalizedMacros = macros.map((macro) => ({
    ...macro,
    value: Math.max(0, Math.min(100, macro.value)),
  }));
  const total = normalizedMacros.reduce((sum, macro) => sum + macro.value, 0);
  const isEmpty = total === 0;
  const safeTotal = total === 0 ? 1 : total;
  const radius = 64;
  const strokeWidth = 22;
  const circumference = 2 * Math.PI * radius;
  const colors = ["#7EDAA0", "#2E7D5B", "#C6E377"];

  let accumulatedOffset = 0;
  const chartSegments = normalizedMacros.map((macro, index) => {
    const dashLength = (macro.value / safeTotal) * circumference;
    const segment = {
      ...macro,
      color: colors[index % colors.length],
      dashLength,
      strokeDashoffset: -accumulatedOffset,
    };

    accumulatedOffset += dashLength;
    return segment;
  });

  return (
    <div className="flex flex-col items-center gap-6 md:flex-row md:items-center md:justify-between">
      <div className="relative flex h-[180px] w-[180px] items-center justify-center">
        <svg
          viewBox="0 0 180 180"
          className="-rotate-90 h-[180px] w-[180px]"
          aria-label="탄단지 비율 차트"
        >
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke="rgba(22,49,38,0.08)"
            strokeWidth={strokeWidth}
          />
          {chartSegments.map((segment) => (
            <circle
              key={segment.label}
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={`${segment.dashLength} ${
                circumference - segment.dashLength
              }`}
              strokeDashoffset={segment.strokeDashoffset}
            />
          ))}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p
            className={`text-xs ${
              isEmpty
                ? "text-[#163126]/50"
                : "font-semibold tracking-[0.18em] text-[#2E7D5B]"
            }`}
          >
            {isEmpty ? "데이터 없음" : "MACRO"}
          </p>
          <p className="mt-2 text-2xl font-bold text-[#163126]">탄단지</p>
        </div>
      </div>

      <div className="grid w-full gap-3">
        {normalizedMacros.map((macro, index) => (
          <div
            key={macro.label}
            className="flex items-center justify-between rounded-[18px] border border-[#163126]/6 bg-white px-4 py-3 shadow-[0_8px_20px_rgba(22,49,38,0.04)]"
          >
            <div className="flex items-center gap-3">
              <span
                className="h-3.5 w-3.5 rounded-full"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span className="text-sm font-medium text-[#163126]">
                {macro.label}
              </span>
            </div>
            <span className="text-sm font-semibold text-[#163126]/70">
              {total === 0 ? "-" : `${macro.value}%`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DailyMealRatioCard({
  calories,
  carbohydrate,
  protein,
  fat,
  sodium,
}: DailyMealRatioCardProps) {
  const items = [
    { label: "칼로리", value: calories, color: "#2E7D5B" },
    { label: "탄수화물", value: carbohydrate, color: "#7EDAA0" },
    { label: "단백질", value: protein, color: "#63A775" },
    { label: "지방", value: fat, color: "#B7E36D" },
    {
      label: "나트륨",
      value: sodium,
      color: sodium != null && sodium >= 50 ? "#E86D6D" : "#C98918",
    },
  ];

  return (
    <div className="rounded-[28px] border border-[#C98918]/15 bg-gradient-to-br from-[#FFFDF8] to-[#FFF8EC] p-5 shadow-[0_18px_40px_rgba(201,137,24,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_48px_rgba(201,137,24,0.12)] md:p-6">
      <div className="mb-5 flex items-center gap-2">
        <HeartPulse size={18} className="text-[#2E7D5B]" />
        <p className="text-sm font-semibold text-[#163126]">
          하루 권장량 대비 한 끼
        </p>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.label}>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-[#163126]">{item.label}</span>
              <span className="font-semibold text-[#163126]/70">
                {displayPercent(item.value)}
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white shadow-inner">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(0, Math.min(100, item.value ?? 0))}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DietResultScreen({ mode, image, result }: Props) {
  const router = useRouter();

  const summaryText =
    result.feedback_summary ??
    result.feedback ??
    "식단 분석 결과를 정리했어요.";

  const macros = [
    {
      label: "탄수화물",
      value: result.nutrition_ratio?.carbohydrate_pct ?? 0,
    },
    {
      label: "단백질",
      value: result.nutrition_ratio?.protein_pct ?? 0,
    },
    {
      label: "지방",
      value: result.nutrition_ratio?.fat_pct ?? 0,
    },
  ];

  const vitaminLevel = displayText(result.vitamin_info?.level);
  const mineralLevel = displayText(result.mineral_info?.level);
  const sodiumLevel = displayText(result.sodium_level);
  const hasEstimatedCalories = result.estimated_calories != null;
  const hasVitaminLevel =
    result.vitamin_info?.level != null && result.vitamin_info.level !== "";
  const hasMineralLevel =
    result.mineral_info?.level != null && result.mineral_info.level !== "";
  const hasSodiumLevel =
    result.sodium_level != null &&
    result.sodium_level !== "" &&
    result.sodium_level !== "-";
  const calorieText =
    result.estimated_calories != null
      ? `${result.estimated_calories} kcal`
      : "분석 정보 없음";
  const scoreText = result.overall_score != null ? result.overall_score : "-";
  const recommendedRatio =
    result.daily_recommended_ratio ??
    result.daily_intake_ratio ??
    result.recommended_ratio;
  const dailyMealRatio = {
    calories: recommendedRatio?.calories_pct ?? null,
    carbohydrate: recommendedRatio?.carbohydrate_pct ?? null,
    protein: recommendedRatio?.protein_pct ?? null,
    fat: recommendedRatio?.fat_pct ?? null,
    sodium: recommendedRatio?.sodium_pct ?? null,
  };

  return (
    <section className="mx-auto w-full max-w-7xl">
      <div className="rounded-[28px] border border-[#163126]/8 bg-white/82 p-5 shadow-[0_18px_50px_rgba(46,125,91,0.06)] backdrop-blur-xl md:p-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2E7D5B]">
              diet result
            </p>
            <h1 className="mt-3 text-2xl font-bold text-[#163126] md:text-4xl">
              오늘의 식단 분석 결과
            </h1>
            <p className="mt-3 text-sm leading-7 text-[#163126]/68 md:text-base">
              업로드한 식단 이미지를 바탕으로 영양과 식사 방향을 분석했어요.
            </p>
          </div>

          <div
            className={`inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
              mode === "premium"
                ? "bg-[#fff6e8] text-[#c67800]"
                : "bg-[#ecf9f1] text-[#2E7D5B]"
            }`}
          >
            {mode === "premium" ? <Coins size={16} /> : <Sparkles size={16} />}
            {mode === "premium" ? "프리미엄 분석" : "무료 분석"}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_1fr]">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-[28px] border border-[#163126]/8 bg-[#f9fcfa]"
          >
            <img
              src={image}
              alt={result.food_name ?? "식단 이미지"}
              className="h-[320px] w-full object-cover"
            />

            <div className="p-5 md:p-6">
              <div className="flex flex-wrap gap-2">
                {(result.food_items ?? []).length > 0 ? (
                  result.food_items?.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-[#163126]/8 bg-white px-3 py-1 text-xs font-medium text-[#163126]/70"
                    >
                      {item}
                    </span>
                  ))
                ) : (
                  <span className="rounded-full border border-[#163126]/8 bg-white px-3 py-1 text-xs font-medium text-[#163126]/50">
                    분석된 음식 항목이 없어요
                  </span>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-[28px] border border-[#163126]/8 bg-[#f9fcfa] p-5 md:p-6"
          >
            <p className="text-sm font-semibold text-[#2E7D5B]">분석 요약</p>
            <h2 className="mt-3 text-3xl font-bold text-[#163126]">
              {result.food_name ?? "식단 분석 결과"}
            </h2>

            <div className="mt-6 flex items-center gap-4">
              {mode === "premium" ? (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#ecf9f1] text-center">
                  <div>
                    <p className="text-3xl font-bold text-[#2E7D5B]">
                      {scoreText}
                    </p>
                    <p className="text-xs font-semibold text-[#163126]/55">
                      / 10점
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex h-24 min-w-[96px] items-center justify-center rounded-[24px] border border-[#2E7D5B]/10 bg-[#ecf9f1] px-4 text-center">
                  <div>
                    <p className="text-sm font-semibold text-[#2E7D5B]">
                      무료 분석
                    </p>
                    <p className="mt-1 text-xs font-medium text-[#163126]/55">
                      요약 제공
                    </p>
                  </div>
                </div>
              )}

              <div className="flex-1 rounded-[22px] bg-white px-4 py-4">
                <p className="text-sm leading-7 text-[#163126]/68">
                  {summaryText}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {(mode === "premium" || hasEstimatedCalories) && (
                <StatCard title="예상 칼로리" value={calorieText} />
              )}
              {(mode === "premium" || hasSodiumLevel) && (
                <StatCard
                  title="나트륨 수준"
                  value={sodiumLevel}
                  pill
                  pillClassName={levelColor(sodiumLevel)}
                />
              )}
              {(mode === "premium" || hasVitaminLevel) && (
                <StatCard
                  title="비타민"
                  value={vitaminLevel}
                  pill
                  pillClassName={levelColor(vitaminLevel)}
                />
              )}
              {(mode === "premium" || hasMineralLevel) && (
                <StatCard
                  title="무기질"
                  value={mineralLevel}
                  pill
                  pillClassName={levelColor(mineralLevel)}
                />
              )}
            </div>
          </motion.div>
        </div>

        <div
          className={`mt-6 grid gap-6 ${
            mode === "premium" ? "xl:grid-cols-[1fr_1fr]" : "xl:grid-cols-1"
          }`}
        >
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="rounded-[28px] border border-[#2E7D5B]/10 bg-[#F6FBF8] p-5 shadow-[0_18px_40px_rgba(46,125,91,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_48px_rgba(46,125,91,0.12)] md:p-6"
          >
            <div className="mb-5 flex items-center gap-2">
              <HeartPulse size={18} className="text-[#2E7D5B]" />
              <p className="text-sm font-semibold text-[#163126]">탄단지 비율</p>
            </div>

            <MacroDonutChart macros={macros} />
          </motion.div>

          {mode === "premium" && (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
            >
              <DailyMealRatioCard
                calories={dailyMealRatio.calories}
                carbohydrate={dailyMealRatio.carbohydrate}
                protein={dailyMealRatio.protein}
                fat={dailyMealRatio.fat}
                sodium={dailyMealRatio.sodium}
              />
            </motion.div>
          )}
        </div>

        {mode === "premium" && (
          <div className="mt-6 grid gap-6">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
              className="grid gap-6 xl:grid-cols-2"
            >
              <DetailCard
                icon={<CheckCircle2 size={18} className="text-[#2E7D5B]" />}
                title="좋은 점"
                content={result.detailed_analysis?.strength ?? "분석 내용이 없어요."}
              />
              <DetailCard
                icon={<AlertTriangle size={18} className="text-[#c67800]" />}
                title="개선하면 좋은 점"
                content={
                  result.detailed_analysis?.improvement ?? "분석 내용이 없어요."
                }
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid gap-6 xl:grid-cols-[1fr_1fr]"
            >
              <div className="rounded-[28px] border border-[#2E7D5B]/10 bg-[#F8FCFF] p-5 shadow-[0_14px_36px_rgba(46,125,91,0.06)] md:p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Leaf size={18} className="text-[#2E7D5B]" />
                  <p className="text-sm font-semibold text-[#163126]">추천 음식</p>
                </div>

                {(result.recommendations ?? []).length > 0 ? (
                  result.recommendations?.map((rec, idx) => (
                    <div
                      key={`${rec.nutrient}-${idx}`}
                      className="mb-4 rounded-[22px] bg-white px-4 py-4 last:mb-0"
                    >
                      <p className="text-sm font-semibold text-[#2E7D5B]">
                        {rec.nutrient ?? "추천 영양소"}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {(rec.foods ?? []).map((food) => (
                          <span
                            key={food}
                            className="rounded-full bg-[#ecf9f1] px-3 py-1 text-xs font-semibold text-[#2E7D5B]"
                          >
                            {food}
                          </span>
                        ))}
                      </div>

                      <p className="mt-4 text-sm leading-7 text-[#163126]/68">
                        {rec.reason ?? ""}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[22px] bg-white px-4 py-4 text-sm text-[#163126]/60">
                    추천 음식 정보가 없어요.
                  </div>
                )}
              </div>

              <div className="rounded-[28px] border border-[#2E7D5B]/10 bg-[#F6FBF8] p-5 shadow-[0_14px_36px_rgba(46,125,91,0.06)] md:p-6">
                <div className="mb-4 flex items-center gap-2">
                  <ArrowRight size={18} className="text-[#2E7D5B]" />
                  <p className="text-sm font-semibold text-[#163126]">다음 끼니 제안</p>
                </div>

                <div className="rounded-[22px] bg-white px-4 py-4">
                  <p className="text-sm font-semibold text-[#2E7D5B]">
                    {result.next_meal_suggestion?.concept || "다음 식사 가이드"}
                  </p>

                  <div className="mt-4 space-y-2">
                    {(result.next_meal_suggestion?.menu_example ?? []).length >
                    0 ? (
                      result.next_meal_suggestion?.menu_example?.map((menu) => (
                        <div
                          key={menu}
                          className="rounded-2xl bg-[#f8fbf8] px-3 py-3 text-sm text-[#163126]"
                        >
                          {menu}
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl bg-[#f8fbf8] px-3 py-3 text-sm text-[#163126]/60">
                        추천 메뉴 정보가 없어요.
                      </div>
                    )}
                  </div>

                  <p className="mt-4 text-sm leading-7 text-[#163126]/68">
                    {result.next_meal_suggestion?.reason ?? ""}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            onClick={() => router.push("/diet-analysis")}
            className="rounded-full border border-[#163126]/10 bg-white px-5 py-3 text-sm font-semibold text-[#163126] transition hover:bg-[#f7faf8]"
          >
            다시 분석하기
          </button>
        </div>
      </div>
    </section>
  );
}

function StatCard({
  title,
  value,
  pill = false,
  pillClassName = "",
}: {
  title: string;
  value: string | number;
  pill?: boolean;
  pillClassName?: string;
}) {
  return (
    <div className="rounded-[22px] bg-white px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2E7D5B]">
        {title}
      </p>

      {pill ? (
        <div className="mt-3">
          <span
            className={`rounded-full px-3 py-1 text-sm font-semibold ${pillClassName}`}
          >
            {value}
          </span>
        </div>
      ) : (
        <p className="mt-3 text-2xl font-bold text-[#163126]">{value}</p>
      )}
    </div>
  );
}

function DetailCard({
  icon,
  title,
  content,
}: {
  icon: React.ReactNode;
  title: string;
  content: string;
}) {
  return (
    <div className="rounded-[28px] border border-[#163126]/8 bg-white/80 p-5 shadow-[0_14px_36px_rgba(22,49,38,0.05)] md:p-6">
      <div className="mb-4 flex items-center gap-2">
        {icon}
        <p className="text-sm font-semibold text-[#163126]">{title}</p>
      </div>

      <div className="rounded-[22px] bg-white px-4 py-4 text-sm leading-7 text-[#163126]/68">
        {content}
      </div>
    </div>
  );
}
