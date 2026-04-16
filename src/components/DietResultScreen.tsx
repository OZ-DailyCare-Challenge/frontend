"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Coins,
  HeartPulse,
  Leaf,
  Loader2,
  Sparkles,
} from "lucide-react";
import type {
  MealAnalysisMode,
  MealAnalysisResult,
  RequestMealAnalysisResponse,
} from "@/src/types/meals";
import { requestMealAnalysis } from "@/src/api/meals";

type NormalizedMealResult = MealAnalysisResult & {
  feedback?: string;
  feedback_summary?: string;
  estimated_calories?: number | null;
  overall_score?: number | null;
  sodium_level?: string;
  vitamin_info?: {
    level?: string;
    description?: string;
  } | null;
  mineral_info?: {
    level?: string;
    description?: string;
  } | null;
};

type Props = {
  mode: MealAnalysisMode;
  image: string;
  result: NormalizedMealResult;
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

function dataUrlToFile(dataUrl: string, filename = "meal-image.jpg") {
  const [header, body] = dataUrl.split(",");
  const mime = header.match(/data:(.*?);base64/)?.[1] ?? "image/jpeg";
  const binary = atob(body);
  const array = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    array[i] = binary.charCodeAt(i);
  }

  return new File([array], filename, { type: mime });
}

export default function DietResultScreen({ mode, image, result }: Props) {
  const router = useRouter();
  const [upgrading, setUpgrading] = useState(false);

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
  const calorieText =
    result.estimated_calories != null
      ? `${result.estimated_calories} kcal`
      : "분석 정보 없음";
  const scoreText = result.overall_score != null ? result.overall_score : "-";

  const handleUpgradeToPremium = async () => {
    try {
      setUpgrading(true);

      const file = dataUrlToFile(image, "meal-image.jpg");
      const response: RequestMealAnalysisResponse = await requestMealAnalysis(
        file,
        "premium"
      );

      const responseWithOptionalResult =
        response as RequestMealAnalysisResponse & {
          result?: {
            task_id?: string;
          };
        };

      const taskId =
        responseWithOptionalResult.task_id ??
        responseWithOptionalResult.result?.task_id;

      if (!taskId) {
        console.error("프리미엄 식단 분석 응답:", response);
        throw new Error("프리미엄 식단 분석 task_id를 찾을 수 없어요.");
      }

      sessionStorage.setItem(
        "diet-analysis-pending",
        JSON.stringify({
          taskId,
          mode: "premium",
          image,
        })
      );

      router.push("/diet-analysis/analyzing");
    } catch (error) {
      console.error("프리미엄 식단 분석 재요청 실패:", error);
      alert("프리미엄 식단 분석 요청에 실패했어요.");
    } finally {
      setUpgrading(false);
    }
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

              <div className="flex-1 rounded-[22px] bg-white px-4 py-4">
                <p className="text-sm leading-7 text-[#163126]/68">
                  {summaryText}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <StatCard title="예상 칼로리" value={calorieText} />
              <StatCard
                title="나트륨 수준"
                value={sodiumLevel}
                pill
                pillClassName={levelColor(sodiumLevel)}
              />
              <StatCard
                title="비타민"
                value={vitaminLevel}
                pill
                pillClassName={levelColor(vitaminLevel)}
              />
              <StatCard
                title="무기질"
                value={mineralLevel}
                pill
                pillClassName={levelColor(mineralLevel)}
              />
            </div>
          </motion.div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="rounded-[28px] border border-[#163126]/8 bg-[#f9fcfa] p-5 md:p-6"
          >
            <div className="mb-5 flex items-center gap-2">
              <HeartPulse size={18} className="text-[#2E7D5B]" />
              <p className="text-sm font-semibold text-[#163126]">핵심 영양 수치</p>
            </div>

            <div className="space-y-5">
              {macros.map((macro) => (
                <div key={macro.label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-[#163126]">
                      {macro.label}
                    </span>
                    <span className="text-[#163126]/60">{macro.value}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-[#163126]/8">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#8ce7a7,#b7f3c9)]"
                      style={{
                        width: `${Math.max(0, Math.min(100, macro.value))}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="rounded-[28px] border border-[#163126]/8 bg-[#f9fcfa] p-5 md:p-6"
          >
            <p className="text-sm font-semibold text-[#163126]">핵심 코멘트</p>
            <div className="mt-4 rounded-[22px] bg-white px-4 py-4 text-sm leading-7 text-[#163126]/68">
              {summaryText}
            </div>

            {mode === "free" && (
              <div className="mt-5 rounded-[24px] border border-dashed border-[#163126]/12 bg-white px-4 py-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff6e8]">
                    <Coins size={18} className="text-[#c67800]" />
                  </div>

                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#163126]">
                      더 자세한 분석이 필요하신가요?
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#163126]/62">
                      같은 사진으로 바로 이어서 프리미엄 분석을 진행할 수 있어요.
                      추천 음식, 상세 피드백, 다음 끼니 제안까지 확인해보세요.
                    </p>

                    <button
                      onClick={handleUpgradeToPremium}
                      disabled={upgrading}
                      className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#163126] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {upgrading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          프리미엄 분석 준비 중...
                        </>
                      ) : (
                        <>
                          <Coins size={16} />
                          300P로 자세히 분석하기
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
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
              <div className="rounded-[28px] border border-[#163126]/8 bg-[#f9fcfa] p-5 md:p-6">
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

              <div className="rounded-[28px] border border-[#163126]/8 bg-[#f9fcfa] p-5 md:p-6">
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
            className="rounded-full border border-[#163126]/10 bg-white px-5 py-3 text-sm font-semibold text-[#163126]"
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
    <div className="rounded-[28px] border border-[#163126]/8 bg-[#f9fcfa] p-5 md:p-6">
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