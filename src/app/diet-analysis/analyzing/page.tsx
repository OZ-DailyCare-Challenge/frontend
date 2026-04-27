"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import AppShell from "@/src/components/AppShell";
import ECGLoader from "@/src/components/ECGLoader";
import { getMealAnalysisResult } from "@/src/api/meals";
import type { MealAnalysisMode } from "@/src/types/meals";

type PendingMealAnalysis = {
  taskId: string;
  mode: MealAnalysisMode;
  image: string;
};

type NormalizedMealResult = {
  food_name: string;
  food_items: string[];
  nutrition_ratio: {
    carbohydrate_pct: number;
    protein_pct: number;
    fat_pct: number;
  };
  sodium_level: string;
  estimated_calories: number | null;
  overall_score: number | null;
  vitamin_info: {
    level?: string;
    description?: string;
  } | null;
  mineral_info: {
    level?: string;
    description?: string;
  } | null;
  feedback_summary: string;
  feedback?: string;
  detailed_analysis?: {
    strength?: string;
    improvement?: string;
  } | null;
  recommendations?: Array<{
    nutrient?: string;
    foods?: string[];
    reason?: string;
  }>;
  next_meal_suggestion?: {
    concept?: string;
    menu_example?: string[];
    reason?: string;
  } | null;
};

const messages = [
  "음식 구성을 분석하고 있어요",
  "영양 비율을 정리하고 있어요",
  "식단 피드백을 작성하고 있어요",
];

function normalizeMealResult(raw: any): NormalizedMealResult {
  const core =
    raw?.result?.data?.result ??
    raw?.data?.result ??
    raw?.result ??
    raw ??
    {};

  const nutritionRatio = core?.nutrition_ratio ?? {};

  return {
    food_name: core?.food_name ?? "식단 분석 결과",
    food_items: Array.isArray(core?.food_items) ? core.food_items : [],
    nutrition_ratio: {
      carbohydrate_pct: Number(nutritionRatio?.carbohydrate_pct ?? 0),
      protein_pct: Number(nutritionRatio?.protein_pct ?? 0),
      fat_pct: Number(nutritionRatio?.fat_pct ?? 0),
    },
    sodium_level: core?.sodium_level ?? "분석 정보 없음",
    estimated_calories:
      core?.estimated_calories != null
        ? Number(core.estimated_calories)
        : null,
    overall_score:
      core?.overall_score != null ? Number(core.overall_score) : null,
    vitamin_info: core?.vitamin_info ?? null,
    mineral_info: core?.mineral_info ?? null,
    feedback_summary:
      core?.feedback_summary ??
      core?.feedback ??
      "식단 분석 결과를 정리했어요.",
    feedback: core?.feedback ?? "",
    detailed_analysis: core?.detailed_analysis ?? null,
    recommendations: Array.isArray(core?.recommendations)
      ? core.recommendations
      : [],
    next_meal_suggestion: core?.next_meal_suggestion ?? null,
  };
}

function isCompletedResponse(result: any) {
  const outerStatus = String(result?.status ?? "").toUpperCase();
  const innerStatus = String(result?.result?.status ?? "").toUpperCase();

  return (
    outerStatus === "SUCCESS" ||
    outerStatus === "COMPLETED" ||
    innerStatus === "SUCCESS" ||
    innerStatus === "COMPLETED"
  );
}

function isPendingResponse(result: any) {
  const outerStatus = String(result?.status ?? "").toUpperCase();
  const innerStatus = String(result?.result?.status ?? "").toUpperCase();

  return (
    outerStatus === "" ||
    outerStatus === "PENDING" ||
    outerStatus === "PROCESSING" ||
    outerStatus === "RUNNING" ||
    innerStatus === "PENDING" ||
    innerStatus === "PROCESSING" ||
    innerStatus === "RUNNING"
  );
}

export default function DietAnalyzingPage() {
  const router = useRouter();

  const [started, setStarted] = useState(false);
  const [pulling, setPulling] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  const mountedRef = useRef(false);
  const inFlightRef = useRef(false);
  const finishedRef = useRef(false);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    mountedRef.current = true;

    const startTimer = setTimeout(() => {
      if (!mountedRef.current) return;

      setPulling(true);

      const pullTimer = setTimeout(() => {
        if (!mountedRef.current) return;
        setPulling(false);
        setStarted(true);
      }, 650);

      retryTimeoutRef.current = pullTimer;
    }, 800);

    const messageTimer = setInterval(() => {
      if (!mountedRef.current) return;
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 1400);

    return () => {
      mountedRef.current = false;
      clearTimeout(startTimer);
      clearInterval(messageTimer);

      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const clearRetryTimer = () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };

    const scheduleRetry = (delay = 1800) => {
      clearRetryTimer();

      retryTimeoutRef.current = setTimeout(() => {
        if (!mountedRef.current || cancelled || finishedRef.current) return;
        void poll();
      }, delay);
    };

    const getPendingData = (): PendingMealAnalysis | null => {
      const raw = sessionStorage.getItem("diet-analysis-pending");
      if (!raw) return null;

      try {
        return JSON.parse(raw) as PendingMealAnalysis;
      } catch (error) {
        console.error("diet-analysis-pending 파싱 실패:", error);
        return null;
      }
    };

    const saveAndMove = (
      mode: MealAnalysisMode,
      image: string,
      apiResponse: any
    ) => {
      const normalized = normalizeMealResult(apiResponse);

      sessionStorage.setItem(
        "diet-analysis-result",
        JSON.stringify({
          mode,
          image,
          result: normalized,
          raw: apiResponse,
        })
      );

      finishedRef.current = true;
      clearRetryTimer();
      router.replace("/diet-analysis/result");
    };

    const poll = async () => {
      if (
        cancelled ||
        !mountedRef.current ||
        finishedRef.current ||
        inFlightRef.current
      ) {
        return;
      }

      const pending = getPendingData();

      if (!pending?.taskId || !pending?.image || !pending?.mode) {
        alert("식단 분석 요청 정보가 없어요. 다시 시도해주세요.");
        router.replace("/diet-analysis");
        return;
      }

      inFlightRef.current = true;

      try {
        const response = await getMealAnalysisResult(pending.taskId);

        if (cancelled || !mountedRef.current || finishedRef.current) return;

        if (response?.error) {
          setErrorMessage(String(response.error));
          scheduleRetry(2500);
          return;
        }

        if (isCompletedResponse(response)) {
          setErrorMessage("");
          saveAndMove(pending.mode, pending.image, response);
          return;
        }

        if (isPendingResponse(response)) {
          setErrorMessage("");
          scheduleRetry(1500);
          return;
        }

        setErrorMessage("분석 상태를 다시 확인하고 있어요.");
        scheduleRetry(2200);
      } catch (error) {
        console.error("식단 분석 polling 실패:", error);

        if (cancelled || !mountedRef.current || finishedRef.current) return;

        setErrorMessage(
          "결과를 다시 확인하고 있어요. 네트워크 상태에 따라 조금 더 걸릴 수 있어요."
        );
        scheduleRetry(2500);
      } finally {
        inFlightRef.current = false;
      }
    };

    void poll();

    return () => {
      cancelled = true;
      clearRetryTimer();
      inFlightRef.current = false;
    };
  }, [router]);

  const currentMessage = useMemo(() => messages[messageIndex], [messageIndex]);

  return (
    <AppShell>
      <main className="min-h-[calc(100vh-120px)] overflow-hidden">
        <div className="mx-auto flex min-h-[calc(100vh-160px)] w-full max-w-6xl items-center justify-center px-4 py-6 sm:px-6">
          <motion.section
            initial={{ opacity: 0, y: 18, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45 }}
            className="relative w-full overflow-hidden rounded-[34px] border border-white/40 bg-white/58 px-5 py-8 shadow-[0_18px_50px_rgba(46,125,91,0.08)] backdrop-blur-xl sm:px-8 sm:py-10 md:px-10"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(126,232,167,0.10),transparent_24%)]" />

            <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_1fr]">
              <div className="order-2 text-center lg:order-1 lg:text-left">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#2E7D5B]">
                  analyzing
                </p>

                <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
                  식단 이미지를
                  <br />
                  분석하고 있어요
                </h1>

                <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#163126]/68 lg:mx-0 md:text-base">
                  음식 구성, 영양 비율, 나트륨 level과 식단 피드백을 정리하고 있어요.
                </p>

                <div className="mt-7 min-h-[32px]">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={currentMessage}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                      className="text-sm font-medium text-[#2E7D5B] md:text-base"
                    >
                      {currentMessage}
                    </motion.p>
                  </AnimatePresence>
                </div>

                <ECGLoader />

                {errorMessage ? (
                  <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-7 text-amber-700">
                    {errorMessage}
                  </div>
                ) : (
                  <p className="mt-6 text-xs text-[#163126]/52 md:text-sm">
                    잠시만 기다려주세요. 곧 식단 분석 결과를 보여드릴게요.
                  </p>
                )}
              </div>

              <div className="order-1 flex items-center justify-center lg:order-2">
                <div className="relative h-[470px] w-full max-w-[450px]">
                  <div className="absolute left-1/2 top-0 h-[280px] w-[280px] -translate-x-1/2 rounded-[42px] bg-[linear-gradient(180deg,#ffffff_0%,#f4f7f5_60%,#eef2f0_100%)] shadow-[0_28px_70px_rgba(22,49,38,0.10)]">
                    <div className="absolute inset-[14px] rounded-[34px] border border-[#163126]/7 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.92),rgba(248,250,249,0.78)_42%,rgba(236,242,239,0.98)_100%)]" />
                    <div className="absolute inset-[22px] rounded-[28px] opacity-35 [background-image:radial-gradient(rgba(22,49,38,0.10)_0.6px,transparent_0.6px)] [background-size:8px_8px]" />

                    <div className="absolute left-1/2 top-1/2 h-[172px] w-[172px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_35%_30%,rgba(255,255,255,0.98),rgba(255,255,255,0.65)_34%,rgba(208,214,211,0.95)_65%,rgba(255,255,255,0.98)_100%)] shadow-[inset_0_0_28px_rgba(255,255,255,0.8),0_12px_30px_rgba(22,49,38,0.08)]">
                      <motion.div
                        animate={started ? { rotate: 360 } : { rotate: 0 }}
                        transition={
                          started
                            ? {
                                rotate: {
                                  duration: 2.2,
                                  repeat: Infinity,
                                  ease: "linear",
                                },
                              }
                            : { duration: 0.2 }
                        }
                        className="absolute inset-[12px] rounded-full border border-[#163126]/8 bg-[conic-gradient(from_0deg,#fdfdfd,#d9dedd,#9ea4a1,#f7f8f7,#b6bbb8,#fcfcfc)]"
                      >
                        <div className="absolute inset-0 rounded-full opacity-55 [background:conic-gradient(from_0deg,transparent_0_18deg,rgba(0,0,0,0.52)_18deg_36deg,transparent_36deg_72deg,rgba(0,0,0,0.40)_72deg_100deg,transparent_100deg_145deg,rgba(0,0,0,0.30)_145deg_170deg,transparent_170deg_230deg,rgba(0,0,0,0.24)_230deg_258deg,transparent_258deg_300deg,rgba(0,0,0,0.38)_300deg_326deg,transparent_326deg_360deg)]" />
                      </motion.div>

                      <div className="absolute left-1/2 top-1/2 h-[32px] w-[32px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#163126]/15 bg-[radial-gradient(circle_at_30%_30%,#6b6f6d,#252928)] shadow-[0_0_10px_rgba(0,0,0,0.18)]" />
                    </div>
                  </div>

                  <motion.div
                    animate={{ height: pulling ? 136 : 104 }}
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                    className="absolute left-1/2 top-[280px] z-20 ml-[6px] w-[2px] -translate-x-1/2 bg-[#163126]"
                  />

                  <motion.div
                    animate={{ y: pulling ? 30 : 0 }}
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                    className="absolute left-1/2 top-[382px] z-20 ml-[6px] h-[10px] w-[10px] -translate-x-1/2 rounded-full border border-[#163126]/20 bg-white"
                  />

                  <motion.div
                    animate={{
                      y: pulling ? 26 : 0,
                    }}
                    transition={
                      {
                        duration: 0.35,
                        ease: "easeInOut",
                      }
                    }
                    className="absolute bottom-[-18px] left-1/2 h-[190px] w-[170px] -translate-x-1/2"
                  >
                    <img
                      src="/images/buddy-analyzing.png"
                      alt="Buddy"
                      className="pointer-events-none absolute bottom-[30px] left-1/2 z-10 ml-[40px] w-[140px] -translate-x-1/2 translate-y-[34px]"
                    />
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.section>
        </div>
      </main>
    </AppShell>
  );
}
