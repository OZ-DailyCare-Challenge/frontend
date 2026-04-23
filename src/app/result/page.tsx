"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import AppShell from "@/src/components/AppShell";
import {
  AlertTriangle,
  CalendarClock,
  ChevronRight,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import {
  getAnalysisHistory,
  type AnalysisHistoryItem,
  type AnalysisResultResponse,
} from "@/src/api/analysis";
import { getDashboard } from "@/src/api/user";
import { storage } from "@/src/utils/storage";
import { analysisStorage } from "@/src/utils/analysisStorage";
import { guestAnalysisStorage } from "@/src/utils/guestAnalysisStorage";
import { markHealthFlowComplete } from "@/src/utils/health-flow";
import { useAccessStore } from "@/src/store/access-store";

type Mission = {
  title?: string;
  action?: string;
  reason?: string;
};

type ChallengeCardItem = {
  title: string;
  description: string;
  effect?: string;
};

type NormalizedResult = {
  riskPercent: number | null;
  heartAge: number | null;
  riskGrade: string;
  characterStage: number | null;
  topRiskFactors: string[];
  evaluation: string;
  alert: string;
  encouragement: string;
  missions: ChallengeCardItem[];
  createdAt: string;
  source: "session" | "history" | "guest" | "empty";
};

type DashboardProfile = {
  age?: number | string;
  birth_year?: number;
  birthYear?: number;
};

type GuestProfile = {
  birthYear?: number;
  birth_year?: number;
};

function normalizeRiskGrade(value?: string) {
  if (!value) return "-";

  const normalized = value.trim().toLowerCase();

  if (normalized.includes("high")) return "높음";
  if (normalized.includes("medium")) return "보통";
  if (normalized.includes("low")) return "낮음";

  if (value.includes("높")) return "높음";
  if (value.includes("보통") || value.includes("중간")) return "보통";
  if (value.includes("낮")) return "낮음";

  return value;
}

function normalizeMissionItem(mission: unknown): ChallengeCardItem | null {
  if (!mission) return null;

  if (typeof mission === "string") {
    const trimmed = mission.trim();
    if (!trimmed) return null;

    const parts = trimmed
      .split("·")
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length >= 3) {
      return {
        title: parts[0],
        description: parts[1],
        effect: parts.slice(2).join(" · "),
      };
    }

    if (parts.length === 2) {
      return {
        title: parts[0],
        description: parts[1],
      };
    }

    return {
      title: trimmed,
      description: "추천된 실천 항목이에요.",
    };
  }

  if (typeof mission === "object") {
    const m = mission as Mission;

    const title = m.title?.trim() || "추천 챌린지";
    const description =
      m.action?.trim() || m.reason?.trim() || "추천된 실천 항목이에요.";
    const effect =
      m.action?.trim() && m.reason?.trim() ? m.reason.trim() : undefined;

    return {
      title,
      description,
      effect,
    };
  }

  return null;
}

function normalizeFromAnalysisResult(
  result: AnalysisResultResponse,
  source: "session" | "guest" = "session"
): NormalizedResult {
  const rawMissions = result?.data?.ml1_comment?.missions ?? [];

  return {
    riskPercent:
      typeof result?.data?.ml1_predict?.risk_percent === "number"
        ? result.data.ml1_predict.risk_percent
        : null,
    heartAge:
      typeof result?.data?.ml1_predict?.heart_age === "number"
        ? result.data.ml1_predict.heart_age
        : null,
    riskGrade: normalizeRiskGrade(result?.data?.ml1_predict?.risk_grade),
    characterStage:
      typeof result?.data?.ml1_predict?.character_stage === "number"
        ? result.data.ml1_predict.character_stage
        : null,
    topRiskFactors: Array.isArray(result?.data?.ml1_predict?.top_risk_factors)
      ? result.data.ml1_predict.top_risk_factors.filter(Boolean)
      : [],
    evaluation: result?.data?.ml1_comment?.evaluation ?? "",
    alert: result?.data?.ml1_comment?.alert ?? "",
    encouragement: result?.data?.ml1_comment?.encouragement ?? "",
    missions: Array.isArray(rawMissions)
      ? (rawMissions
          .map(normalizeMissionItem)
          .filter(Boolean) as ChallengeCardItem[])
      : [],
    createdAt: "",
    source,
  };
}

function normalizeFromHistoryItem(item: AnalysisHistoryItem): NormalizedResult {
  return {
    riskPercent:
      typeof item?.cvd_risk_percent === "number" ? item.cvd_risk_percent : null,
    heartAge: typeof item?.cvd_age === "number" ? item.cvd_age : null,
    riskGrade: normalizeRiskGrade(item?.risk_level),
    characterStage: null,
    topRiskFactors: Array.isArray(item?.top_risk_factors)
      ? item.top_risk_factors.filter(Boolean)
      : [],
    evaluation: item?.ai_evaluation ?? "",
    alert: item?.ai_alert ?? "",
    encouragement: item?.ai_encouragement ?? "",
    missions: Array.isArray(item?.ai_missions)
      ? (item.ai_missions
          .map(normalizeMissionItem)
          .filter(Boolean) as ChallengeCardItem[])
      : [],
    createdAt: item?.created_at ?? "",
    source: "history",
  };
}

function emptyResult(): NormalizedResult {
  return {
    riskPercent: null,
    heartAge: null,
    riskGrade: "-",
    characterStage: null,
    topRiskFactors: [],
    evaluation: "",
    alert: "",
    encouragement: "",
    missions: [],
    createdAt: "",
    source: "empty",
  };
}

function formatDateTime(value?: string) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getRiskTone(riskPercent: number | null, riskGrade: string) {
  const grade = riskGrade.trim();

  if (
    riskPercent != null
      ? riskPercent >= 60
      : grade.includes("높음") || grade.toLowerCase().includes("high")
  ) {
    return {
      label: "높음",
      heroClass: "border-[#efcfd1] bg-[#f9ecec]",
      heroTextClass: "text-[#8f2626]",
      gaugeBorderClass: "border-[#e55353]",
      ringTrackClass: "border-[#f3c7c7]",
      alertClass: "border-[#efc7c7] bg-[#fff3f3] text-[#b33636]",
      bodyCardClass: "bg-[#fbefef]",
      riskItemIconClass: "text-[#e55353]",
      badgeClass: "bg-[#fde8e8] text-[#c54848]",
    };
  }

  if (
    riskPercent != null
      ? riskPercent >= 30
      : grade.includes("보통") ||
        grade.includes("중간") ||
        grade.toLowerCase().includes("medium")
  ) {
    return {
      label: "보통",
      heroClass: "border-[#f0dfb9] bg-[#fff6e7]",
      heroTextClass: "text-[#9b6512]",
      gaugeBorderClass: "border-[#eda52a]",
      ringTrackClass: "border-[#f4dfb8]",
      alertClass: "border-[#f0dfb9] bg-[#fff8ec] text-[#9b6512]",
      bodyCardClass: "bg-[#fff8ec]",
      riskItemIconClass: "text-[#eda52a]",
      badgeClass: "bg-[#fff0d8] text-[#a06712]",
    };
  }

  return {
    label: "낮음",
    heroClass: "border-[#cfe5d7] bg-[#eef7f1]",
    heroTextClass: "text-[#1b6f53]",
    gaugeBorderClass: "border-[#78c5a3]",
    ringTrackClass: "border-[#cfe5d7]",
    alertClass: "border-[#d5e9dc] bg-[#f4fbf6] text-[#2e7d5b]",
    bodyCardClass: "bg-[#eef9f2]",
    riskItemIconClass: "text-[#2e7d5b]",
    badgeClass: "bg-[#dff3e7] text-[#2e7d5b]",
  };
}

function getRiskStatusLabel(riskFactors: string[], riskGrade: string) {
  if (riskFactors.length >= 3) return "주의 필요";
  if (riskFactors.length === 2) return "관리 권장";
  if (riskFactors.length === 1) return "확인 필요";
  if (riskGrade === "높음") return "주의 필요";
  if (riskGrade === "보통") return "관리 권장";
  return "양호";
}

function useCountUp(target: number | null, duration = 1200) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (target == null || Number.isNaN(target)) {
      setCount(0);
      return;
    }

    const totalSteps = Math.max(Math.floor(duration / 16), 1);
    let currentStep = 0;

    const timer = window.setInterval(() => {
      currentStep += 1;
      const progress = Math.min(currentStep / totalSteps, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextValue = Number((target * eased).toFixed(1));

      setCount(nextValue);

      if (progress >= 1) {
        window.clearInterval(timer);
      }
    }, 16);

    return () => {
      window.clearInterval(timer);
    };
  }, [target, duration]);

  return count;
}

function AgeInline({
  value,
  numberClassName,
  suffixClassName,
}: {
  value: string;
  numberClassName: string;
  suffixClassName: string;
}) {
  if (!value || value === "-") {
    return <span className={numberClassName}>-</span>;
  }

  const numeric = value.replace("세", "");

  return (
    <span className={numberClassName}>
      {numeric}
      <span className={suffixClassName}>세</span>
    </span>
  );
}

export default function ResultPage() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [result, setResult] = useState<NormalizedResult>(emptyResult());
  const [loading, setLoading] = useState(true);
  const [actualAgeText, setActualAgeText] = useState("-");

  const isGuest = !storage.getAccessToken();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);

        const isLoggedIn = Boolean(storage.getAccessToken());

        if (isLoggedIn) {
          const [history, dashboard] = await Promise.all([
            getAnalysisHistory().catch((error) => {
              console.warn("분석 히스토리 조회 실패:", error);
              return null;
            }),
            getDashboard().catch((error) => {
              console.warn("대시보드 조회 실패:", error);
              return null;
            }),
          ]);

          if (cancelled) return;

          if (history?.items?.length) {
            const latest = normalizeFromHistoryItem(history.items[0]);
            setResult(latest);
            markHealthFlowComplete();
            useAccessStore.getState().markAnalysisComplete();
          } else {
            const storedResult =
              analysisStorage.getResult<AnalysisResultResponse>();

            if (storedResult) {
              setResult(normalizeFromAnalysisResult(storedResult, "session"));
              markHealthFlowComplete();
              useAccessStore.getState().markAnalysisComplete();
            } else {
              setResult(emptyResult());
            }
          }

          const profile = (dashboard ?? null) as DashboardProfile | null;

          if (typeof profile?.age === "number") {
            setActualAgeText(`${profile.age}세`);
          } else if (
            typeof profile?.age === "string" &&
            profile.age.trim() &&
            !Number.isNaN(Number(profile.age))
          ) {
            setActualAgeText(`${Number(profile.age)}세`);
          } else if (typeof profile?.birth_year === "number") {
            const currentYear = new Date().getFullYear();
            setActualAgeText(`${currentYear - profile.birth_year}세`);
          } else if (typeof profile?.birthYear === "number") {
            const currentYear = new Date().getFullYear();
            setActualAgeText(`${currentYear - profile.birthYear}세`);
          } else {
            setActualAgeText("-");
          }

          return;
        }

        const guestResult =
          guestAnalysisStorage.getResult<AnalysisResultResponse>();

        if (!cancelled && guestResult) {
          setResult(normalizeFromAnalysisResult(guestResult, "guest"));
        } else if (!cancelled) {
          setResult(emptyResult());
        }

        const storedGuest = sessionStorage.getItem("guest-profile");

        if (!storedGuest) {
          setActualAgeText("-");
          return;
        }

        try {
          const parsed = JSON.parse(storedGuest) as GuestProfile;
          const birthYear = Number(parsed?.birthYear ?? parsed?.birth_year);

          if (birthYear && birthYear > 1900) {
            const currentYear = new Date().getFullYear();
            setActualAgeText(`${currentYear - birthYear}세`);
          } else {
            setActualAgeText("-");
          }
        } catch {
          setActualAgeText("-");
        }
      } catch (error) {
        console.error("건강 분석 결과 로드 실패:", error);

        if (!cancelled) {
          setResult(emptyResult());
          setActualAgeText("-");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [mounted]);

  const actualAgeNumber = useMemo(() => {
    const parsed = Number(actualAgeText.replace("세", ""));
    return Number.isFinite(parsed) ? parsed : null;
  }, [actualAgeText]);

  const ageDiff = useMemo(() => {
    if (result.heartAge == null || actualAgeNumber == null) return null;
    return result.heartAge - actualAgeNumber;
  }, [result.heartAge, actualAgeNumber]);

  const ageCompareText = useMemo(() => {
    if (result.heartAge == null) return "실제 나이와의 비교 정보가 아직 없어요.";
    if (actualAgeText === "-") return "실제 나이 정보가 없어 비교하지 못했어요.";

    if (ageDiff === 0) return "실제 나이와 심혈관 나이가 같아요.";
    if ((ageDiff ?? 0) < 0) return `실제보다 ${Math.abs(ageDiff ?? 0)}세 젊음`;
    return `실제보다 ${ageDiff}세 높음`;
  }, [result.heartAge, actualAgeText, ageDiff]);

  const tone = useMemo(
    () => getRiskTone(result.riskPercent, result.riskGrade),
    [result.riskPercent, result.riskGrade]
  );

  const riskStatusText = useMemo(
    () => getRiskStatusLabel(result.topRiskFactors, result.riskGrade),
    [result.topRiskFactors, result.riskGrade]
  );

  const animatedRisk = useCountUp(loading ? null : result.riskPercent, 1300);

  const handleRequireLogin = () => {
    const confirmed = window.confirm(
      "로그인하면 방금 입력한 건강 정보와 분석 결과를 저장하고,\n맞춤 챌린지와 다른 기능을 이어서 이용할 수 있어요.\n로그인 페이지로 이동할까요?"
    );

    if (!confirmed) return;

    guestAnalysisStorage.setMigrationNeeded(true);
    guestAnalysisStorage.setPostLoginRedirect("/challenge");
    router.push("/login");
  };

  const handleChallengeClick = () => {
    if (isGuest) {
      handleRequireLogin();
      return;
    }

    router.push("/challenge");
  };

  if (!mounted) {
    return (
      <AppShell isGuest={isGuest} onRequireLogin={handleRequireLogin}>
        <div className="flex min-h-[60vh] items-center justify-center rounded-[32px] border border-white/40 bg-white/60 text-[#163126]/60 shadow-[0_18px_50px_rgba(46,125,91,0.08)] backdrop-blur-xl">
          화면을 불러오는 중이에요...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell isGuest={isGuest} onRequireLogin={handleRequireLogin}>
      <section className="mx-auto w-full max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="rounded-[32px] border border-[#163126]/8 bg-white/85 p-6 shadow-[0_18px_50px_rgba(46,125,91,0.06)] backdrop-blur-xl md:p-10"
        >
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.45 }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#2E7D5B]">
              health result
            </p>
            <h1 className="mt-3 text-3xl font-bold leading-tight text-[#163126] md:text-6xl">
              심혈관 건강 분석 결과
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-[#163126]/65 md:text-base">
              입력한 건강검진 수치와 생활습관 정보를 바탕으로 심혈관 건강 상태를
              분석했어요.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.12, duration: 0.5 }}
            className={`mt-8 rounded-[28px] border p-6 md:p-8 ${tone.heroClass}`}
          >
            <div className="grid gap-6 lg:grid-cols-[1.3fr_170px] lg:items-center">
              <div>
                <p className={`text-base font-semibold ${tone.heroTextClass}`}>
                  심혈관 위험도
                </p>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18, duration: 0.45 }}
                  className={`mt-4 text-5xl font-bold md:text-6xl ${tone.heroTextClass}`}
                >
                  {loading
                    ? "..."
                    : result.riskPercent != null
                    ? `${animatedRisk.toFixed(1)}%`
                    : "-"}
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.82, rotate: -8 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ delay: 0.22, duration: 0.55, type: "spring" }}
                className="mx-auto"
              >
                <div
                  className={`flex h-[132px] w-[132px] items-center justify-center rounded-full border-[10px] ${tone.gaugeBorderClass} bg-white/80`}
                >
                  <div
                    className={`flex h-[102px] w-[102px] flex-col items-center justify-center rounded-full border ${tone.ringTrackClass} bg-white/90`}
                  >
                    <p className="text-xs font-bold tracking-[0.22em] text-[#163126]/48">
                      RISK
                    </p>
                    <p className={`mt-2 text-2xl font-bold ${tone.heroTextClass}`}>
                      {loading ? "-" : tone.label}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.45 }}
            className="mt-5 rounded-[26px] border border-[#163126]/8 bg-white p-6"
          >
            <p className="text-sm font-semibold text-[#163126]/60">위험도 스펙트럼</p>

            <div className="mt-6 px-2 md:px-6">
              <div className="relative h-3 rounded-full bg-[linear-gradient(to_right,#22a06b_0%,#22a06b_33%,#eda52a_33%,#eda52a_66%,#e55353_66%,#e55353_100%)]">
                {!loading && result.riskPercent != null && (
                  <motion.div
                    initial={{ left: "0%", opacity: 0 }}
                    animate={{ left: `${result.riskPercent}%`, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
                    className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
                  >
                    <div className="h-6 w-[2px] bg-[#163126]" />
                    <p className="mt-1 whitespace-nowrap text-xs font-semibold text-[#163126]">
                      {result.riskPercent}%
                    </p>
                  </motion.div>
                )}
              </div>

              <div className="mt-4 grid grid-cols-3 text-center text-xs font-semibold">
                <span className="text-[#22a06b]">낮음</span>
                <span className="text-[#b27712]">중간</span>
                <span className="text-[#d44848]">높음</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.45 }}
            className="mt-5 rounded-[28px] border border-[#163126]/8 bg-white p-6"
          >
            <div className="grid gap-6 lg:grid-cols-[320px_1fr] lg:items-center">
              <div className="flex items-center gap-5">
                <div className="shrink-0">
                  <p className="text-sm text-[#163126]/58">실제 나이</p>
                  <p className="mt-2 font-bold text-[#163126]">
                    <AgeInline
                      value={actualAgeText}
                      numberClassName="text-4xl font-bold text-[#163126]"
                      suffixClassName="ml-1 text-lg font-semibold text-[#163126]/70"
                    />
                  </p>
                </div>

                <div className="flex flex-1 flex-col items-center justify-center rounded-[28px] bg-[#fff7f7] px-4 py-5">
                  <motion.div
                    animate={{ scale: [1, 1.04, 1] }}
                    transition={{
                      duration: 1.9,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="relative flex items-center justify-center"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-[138px] w-[138px]"
                      fill="#e55353"
                    >
                      <path d="M12 21s-6.716-5.435-9.428-8.147C.86 11.14.86 8.01 2.572 6.3a5 5 0 0 1 7.071 0L12 8.657l2.357-2.357a5 5 0 0 1 7.071 7.071C18.716 15.565 12 21 12 21z" />
                    </svg>

                    <div className="absolute text-center">
                      <p className="text-4xl font-bold text-white">
                        {loading ? (
                          "..."
                        ) : result.heartAge != null ? (
                          <>
                            {result.heartAge}
                            <span className="ml-1 text-lg font-semibold text-white/85">
                              세
                            </span>
                          </>
                        ) : (
                          "-"
                        )}
                      </p>
                    </div>
                  </motion.div>

                  <p className="mt-2 text-lg font-bold text-[#163126]">심혈관 나이</p>

                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.48, duration: 0.35 }}
                    className="mt-6"
                  >
                    <span className="inline-flex rounded-full bg-[#dff3e7] px-3 py-1 text-sm font-semibold text-[#2E7D5B]">
                      {loading ? "비교 계산 중..." : ageCompareText}
                    </span>
                  </motion.div>
                </div>
              </div>

              <div className="border-t border-[#163126]/8 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-bold text-[#163126]">주요 위험 요인</p>

                    <div className="mt-4 space-y-3">
                      {loading ? (
                        <p className="text-sm text-[#163126]/55">
                          주요 위험 요인을 불러오는 중이에요.
                        </p>
                      ) : result.topRiskFactors.length ? (
                        result.topRiskFactors.slice(0, 3).map((factor, index) => (
                          <motion.div
                            key={`${factor}-${index}`}
                            initial={{ opacity: 0, x: 12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{
                              delay: 0.35 + index * 0.08,
                              duration: 0.35,
                            }}
                            className="flex items-center gap-3"
                          >
                            {index === 0 ? (
                              <AlertTriangle
                                size={18}
                                className={tone.riskItemIconClass}
                              />
                            ) : (
                              <div
                                className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${tone.badgeClass}`}
                              >
                                !
                              </div>
                            )}
                            <p className="text-base font-semibold text-[#163126]/88">
                              {factor}
                            </p>
                          </motion.div>
                        ))
                      ) : (
                        <p className="text-sm text-[#163126]/55">
                          주요 위험 요인이 아직 없어요.
                        </p>
                      )}
                    </div>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${tone.badgeClass}`}
                  >
                    {riskStatusText}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.34, duration: 0.4 }}
            className={`mt-5 rounded-[20px] border px-5 py-4 text-sm font-semibold md:text-base ${tone.alertClass}`}
          >
            {loading
              ? "주의 알림을 불러오는 중이에요."
              : result.alert || "현재 별도 경고 메시지는 없어요."}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className={`mt-5 rounded-[24px] border border-[#163126]/8 p-6 ${tone.bodyCardClass}`}
          >
            <div className="flex items-center gap-2">
              <ShieldAlert size={18} className="text-[#2E7D5B]" />
              <p className="text-lg font-bold text-[#163126]">AI 평가</p>
            </div>
            <p className="mt-4 text-sm leading-7 text-[#163126]/75">
              {loading
                ? "분석 내용을 불러오는 중이에요."
                : result.evaluation || "분석 평가 내용이 아직 없어요."}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.46, duration: 0.4 }}
            className="mt-5 rounded-[26px] border border-[#163126]/8 bg-white p-6"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-[#2E7D5B]" />
                <p className="text-lg font-bold text-[#163126]">AI 추천 챌린지</p>
              </div>

              <button
                type="button"
                onClick={handleChallengeClick}
                className="inline-flex items-center justify-center rounded-full bg-[#163126] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                맞춤 챌린지 보러가기
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {loading ? (
                <ChallengeRow
                  index={1}
                  title="추천 챌린지를 불러오는 중이에요."
                  description="잠시만 기다려 주세요."
                />
              ) : result.missions.length ? (
                result.missions.map((mission, index) => (
                  <ChallengeRow
                    key={`${mission.title}-${index}`}
                    index={index + 1}
                    title={mission.title}
                    description={mission.description}
                    effect={mission.effect}
                    delay={0.54 + index * 0.06}
                  />
                ))
              ) : (
                <ChallengeRow
                  index={1}
                  title="아직 추천 챌린지가 없어요."
                  description="건강 분석 결과가 더 쌓이면 개인 맞춤 챌린지를 추천해드릴게요."
                  delay={0.54}
                />
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.58, duration: 0.4 }}
            className="mt-5 rounded-[26px] border border-[#163126]/8 bg-[#fbfcfb] p-6"
          >
            <div className="flex items-center gap-2">
              <CalendarClock size={18} className="text-[#2E7D5B]" />
              <p className="text-lg font-bold text-[#163126]">분석 시점</p>
            </div>
            <p className="mt-4 text-sm leading-7 text-[#163126]/60">
              {loading
                ? "시점을 확인하는 중이에요."
                : result.createdAt
                ? formatDateTime(result.createdAt)
                : "최근 저장된 분석 시점 정보가 없어요."}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.64, duration: 0.4 }}
            className={`mt-5 rounded-[26px] border border-[#163126]/8 p-6 ${tone.bodyCardClass}`}
          >
            <div className="flex items-center gap-2">
              <ShieldAlert size={18} className="text-[#2E7D5B]" />
              <p className="text-lg font-bold text-[#163126]">버디의 한마디</p>
            </div>
            <p className="mt-3 text-sm leading-7 text-[#163126]/72">
              {loading
                ? "응원 메시지를 불러오는 중이에요."
                : result.encouragement ||
                  "지금처럼 작은 실천을 이어가면 건강한 변화가 분명히 쌓여요."}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.4 }}
            className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end"
          >
            <button
              type="button"
              onClick={() => router.push("/input")}
              className="rounded-full bg-[#163126] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              다시 분석하기
            </button>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="rounded-full border border-[#163126]/10 bg-white px-5 py-3 text-sm font-semibold text-[#163126] transition hover:bg-[#f7faf8]"
            >
              홈으로
            </button>
          </motion.div>
        </motion.div>
      </section>
    </AppShell>
  );
}

function ChallengeRow({
  index,
  title,
  description,
  effect,
  delay = 0,
}: {
  index: number;
  title: string;
  description: string;
  effect?: string;
  delay?: number;
}) {
  const numberTone =
    index === 1
      ? "bg-[#22a06b]"
      : index === 2
      ? "bg-[#c98918]"
      : "bg-[#e06a3a]";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.35 }}
      className="rounded-[18px] border border-[#163126]/8 bg-white"
    >
      <div className="flex items-start gap-4 px-4 py-4 md:px-5">
        <div
          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${numberTone}`}
        >
          {index}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-base font-bold text-[#163126] md:text-lg">{title}</p>
          <p className="mt-1 text-sm leading-7 text-[#163126]/72">
            {description}
          </p>

          {effect ? (
            <span className="mt-3 inline-flex rounded-full bg-[#f2eadf] px-3 py-1 text-xs font-semibold text-[#9a6a1e]">
              {effect}
            </span>
          ) : null}
        </div>

        <ChevronRight size={18} className="mt-1 shrink-0 text-[#163126]/28" />
      </div>
    </motion.div>
  );
}