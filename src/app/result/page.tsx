"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/src/components/AppShell";
import {
  AlertTriangle,
  CalendarClock,
  ChevronRight,
  HeartPulse,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  getAnalysisHistory,
  type AnalysisHistoryItem,
  type AnalysisResultResponse,
} from "@/src/api/analysis";
import { storage } from "@/src/utils/storage";
import { analysisStorage } from "@/src/utils/analysisStorage";
import { guestAnalysisStorage } from "@/src/utils/guestAnalysisStorage";

type Mission = {
  title?: string;
  action?: string;
  reason?: string;
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
  missions: string[];
  createdAt: string;
  source: "session" | "history" | "empty";
};

type StoredUser = {
  age?: number;
  birth_year?: number;
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

  return value;
}

function normalizeMissionText(mission: unknown): string {
  if (!mission) return "";

  if (typeof mission === "string") {
    return mission.trim();
  }

  if (typeof mission === "object") {
    const m = mission as Mission;
    return [m.title?.trim(), m.action?.trim(), m.reason?.trim()]
      .filter(Boolean)
      .join(" · ");
  }

  return "";
}

function normalizeFromAnalysisResult(
  result: AnalysisResultResponse
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
      ? rawMissions.map(normalizeMissionText).filter(Boolean)
      : [],
    createdAt: "",
    source: "session",
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
      ? item.ai_missions.map(normalizeMissionText).filter(Boolean)
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

export default function ResultPage() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [result, setResult] = useState<NormalizedResult>(emptyResult());
  const [loading, setLoading] = useState(true);
  const [actualAgeText, setActualAgeText] = useState("-");

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
          const storedResult =
            analysisStorage.getResult<AnalysisResultResponse>();

          if (storedResult && !cancelled) {
            setResult(normalizeFromAnalysisResult(storedResult));
          } else {
            const history = await getAnalysisHistory();

            if (!cancelled && history?.items?.length) {
              setResult(normalizeFromHistoryItem(history.items[0]));
            } else if (!cancelled) {
              setResult(emptyResult());
            }
          }

          const user = (storage.getUser?.() ?? null) as StoredUser | null;

          if (typeof user?.age === "number") {
            setActualAgeText(`${user.age}세`);
          } else if (typeof user?.birth_year === "number") {
            const currentYear = new Date().getFullYear();
            setActualAgeText(`${currentYear - user.birth_year}세`);
          } else {
            setActualAgeText("-");
          }

          return;
        }

        const guestResult =
          guestAnalysisStorage.getResult<AnalysisResultResponse>();

        if (!cancelled && guestResult) {
          setResult(normalizeFromAnalysisResult(guestResult));
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

  const riskPercentText = useMemo(() => {
    return result.riskPercent != null ? `${result.riskPercent}%` : "-";
  }, [result.riskPercent]);

  const heartAgeText = useMemo(() => {
    return result.heartAge != null ? String(result.heartAge) : "-";
  }, [result.heartAge]);

  const ageCompareText = useMemo(() => {
    if (result.heartAge == null) return "실제 나이와의 비교 정보가 아직 없어요.";
    if (actualAgeText === "-") return "실제 나이 정보가 없어 비교하지 못했어요.";

    const actualAgeNumber = Number(actualAgeText.replace("세", ""));
    if (!Number.isFinite(actualAgeNumber)) {
      return "실제 나이와의 비교 정보가 아직 없어요.";
    }

    const diff = result.heartAge - actualAgeNumber;

    if (diff === 0) return "실제 나이와 심혈관 나이가 같아요.";
    if (diff < 0) return `실제 나이보다 ${Math.abs(diff)}세 낮아요.`;
    return `실제 나이보다 ${diff}세 높아요.`;
  }, [result.heartAge, actualAgeText]);

  if (!mounted) {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] items-center justify-center rounded-[32px] border border-white/40 bg-white/60 text-[#163126]/60 shadow-[0_18px_50px_rgba(46,125,91,0.08)] backdrop-blur-xl">
          화면을 불러오는 중이에요...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="mx-auto w-full max-w-5xl">
        <div className="rounded-[32px] border border-[#163126]/8 bg-white/82 p-6 shadow-[0_18px_50px_rgba(46,125,91,0.06)] backdrop-blur-xl md:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#2E7D5B]">
                health result
              </p>
              <h1 className="mt-3 text-3xl font-bold leading-tight text-[#163126] md:text-6xl">
                심혈관 건강 분석
                <br />
                결과
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-[#163126]/65 md:text-base">
                입력한 건강검진 수치와 생활습관 정보를 바탕으로
                심혈관 건강 상태를 분석했어요.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => router.push("/input")}
                className="rounded-full border border-[#163126]/10 bg-white px-5 py-3 text-sm font-semibold text-[#163126]"
              >
                다시 분석하기
              </button>
              <button
                onClick={() => router.push("/challenge")}
                className="rounded-full bg-[#163126] px-5 py-3 text-sm font-semibold text-white"
              >
                맞춤 챌린지 보러가기
              </button>
              <button
                onClick={() => router.push("/")}
                className="rounded-full border border-[#163126]/10 bg-white px-5 py-3 text-sm font-semibold text-[#163126]"
              >
                홈으로
              </button>
            </div>
          </div>

          <div className="mt-8 rounded-[28px] border border-[#bfe3c9] bg-[radial-gradient(circle_at_50%_30%,rgba(166,224,185,0.18),rgba(238,248,240,0.82)_48%,rgba(248,252,249,0.94)_100%)] p-6 md:p-8">
            <div className="grid gap-6 lg:grid-cols-[1.3fr_220px] lg:items-center">
              <div>
                <p className="text-sm font-semibold text-[#2E7D5B]">
                  심혈관 위험도
                </p>
                <div className="mt-4 text-5xl font-bold text-[#163126] md:text-6xl">
                  {loading ? "..." : riskPercentText}
                </div>
                <p className="mt-3 text-base text-[#163126]/60">
                  {loading ? "분석 결과를 확인 중이에요." : result.riskGrade}
                </p>
              </div>

              <div className="mx-auto flex h-[150px] w-[150px] items-center justify-center rounded-full border-[10px] border-[#d8e6dc] bg-white/55">
                <div className="text-center">
                  <p className="text-sm font-semibold tracking-[0.24em] text-[#2E7D5B]">
                    RISK
                  </p>
                  <p className="mt-2 text-4xl font-bold text-[#163126]">
                    {loading
                      ? "..."
                      : result.riskPercent != null
                      ? result.riskPercent
                      : "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <InfoCard
              title="심혈관 나이"
              value={loading ? "..." : heartAgeText}
              caption="현재 추정 혈관 나이"
            />
            <InfoCard
              title="위험 등급"
              value={loading ? "..." : result.riskGrade}
              caption="AI 종합 판단"
            />
          </div>

          <div className="mt-5 rounded-[26px] border border-[#163126]/8 bg-[#fbfcfb] p-6">
            <p className="text-sm font-semibold text-[#2E7D5B]">나이 비교</p>
            <p className="mt-3 text-3xl font-bold text-[#163126]">
              실제 나이 {actualAgeText}
            </p>
            <p className="mt-3 text-sm leading-7 text-[#163126]/60">
              {loading ? "비교 정보를 계산 중이에요." : ageCompareText}
            </p>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <ResultBlock
              icon={<HeartPulse size={18} />}
              title="AI 평가"
              content={
                loading
                  ? "분석 내용을 불러오는 중이에요."
                  : result.evaluation || "분석 평가 내용이 아직 없어요."
              }
            />

            <ResultBlock
              icon={<AlertTriangle size={18} />}
              title="주의 알림"
              content={
                loading
                  ? "알림 내용을 불러오는 중이에요."
                  : result.alert || "현재 별도 경고 메시지는 없어요."
              }
            />
          </div>

          <div className="mt-5 rounded-[26px] border border-[#163126]/8 bg-[#fbfcfb] p-6">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-[#2E7D5B]" />
              <p className="text-lg font-bold text-[#163126]">주요 위험 요인</p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {loading ? (
                <span className="rounded-full bg-white px-3 py-2 text-sm text-[#163126]/55">
                  불러오는 중...
                </span>
              ) : result.topRiskFactors.length ? (
                result.topRiskFactors.map((factor, index) => (
                  <span
                    key={`${factor}-${index}`}
                    className="rounded-full bg-[#eef9f2] px-3 py-2 text-sm font-semibold text-[#2E7D5B]"
                  >
                    {factor}
                  </span>
                ))
              ) : (
                <span className="rounded-full bg-white px-3 py-2 text-sm text-[#163126]/55">
                  주요 위험 요인이 없어요.
                </span>
              )}
            </div>
          </div>

          <div className="mt-5 rounded-[26px] border border-[#163126]/8 bg-[#fbfcfb] p-6">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-[#2E7D5B]" />
              <p className="text-lg font-bold text-[#163126]">AI 추천 미션</p>
            </div>

            <div className="mt-4 space-y-3">
              {loading ? (
                <MissionRow text="추천 미션을 불러오는 중이에요." />
              ) : result.missions.length ? (
                result.missions.map((mission, index) => (
                  <MissionRow key={`${mission}-${index}`} text={mission} />
                ))
              ) : (
                <MissionRow text="아직 추천 미션이 없어요." />
              )}
            </div>
          </div>

          <div className="mt-5 rounded-[26px] border border-[#163126]/8 bg-[#fbfcfb] p-6">
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
          </div>

          <div className="mt-5 rounded-[26px] border border-[#163126]/8 bg-[#eef9f2] p-6">
            <p className="text-lg font-bold text-[#163126]">버디의 한마디</p>
            <p className="mt-3 text-sm leading-7 text-[#163126]/68">
              {loading
                ? "응원 메시지를 불러오는 중이에요."
                : result.encouragement ||
                  "지금처럼 작은 실천을 이어가면 건강한 변화가 분명히 쌓여요."}
            </p>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function InfoCard({
  title,
  value,
  caption,
}: {
  title: string;
  value: string;
  caption: string;
}) {
  return (
    <div className="rounded-[24px] border border-[#163126]/8 bg-[#fbfcfb] p-6">
      <p className="text-sm font-semibold text-[#2E7D5B]">{title}</p>
      <p className="mt-4 text-4xl font-bold text-[#163126]">{value}</p>
      <p className="mt-3 text-sm text-[#163126]/52">{caption}</p>
    </div>
  );
}

function ResultBlock({
  icon,
  title,
  content,
}: {
  icon: React.ReactNode;
  title: string;
  content: string;
}) {
  return (
    <div className="rounded-[26px] border border-[#163126]/8 bg-[#fbfcfb] p-6">
      <div className="flex items-center gap-2">
        <span className="text-[#2E7D5B]">{icon}</span>
        <p className="text-lg font-bold text-[#163126]">{title}</p>
      </div>
      <p className="mt-4 text-sm leading-7 text-[#163126]/65">{content}</p>
    </div>
  );
}

function MissionRow({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-[18px] border border-[#163126]/8 bg-white px-4 py-4">
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#eef9f2] text-[#2E7D5B]">
        <ChevronRight size={14} />
      </div>
      <p className="text-sm leading-7 text-[#163126]/68">{text}</p>
    </div>
  );
}