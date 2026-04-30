"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid,
  Clock3,
  CheckCircle2,
  Lock,
  Loader2,
  RotateCcw,
  X,
  Camera,
} from "lucide-react";
import {
  getChallengesWithFallback,
  getRecommendations,
  joinChallengeWithFallback,
  abandonChallengeWithFallback,
  logChallengeWithFallback,
  type Challenge as ApiChallenge,
  type RecommendItem,
  type UserChallengeResponse,
} from "@/src/api/challenge";
import {
  requestExerciseVerification,
  waitExerciseVerificationCompletion,
} from "@/src/api/exercise";

type ChallengeStatus = "in_progress" | "done" | "locked";
type VerificationType = "check" | "number" | "photo";
type FilterType = "all" | ChallengeStatus;

type Mission = {
  title?: string;
  action?: string;
  reason?: string;
};

type ChallengeLogPayload =
  | {
      verification_type: "checklist";
    }
  | {
      verification_type: "input";
      input_value: string;
    }
  | {
      verification_type: "cv";
      cv_result_id?: number;
    };

type ChallengeItem = {
  id: number | string;
  challengeId?: number;
  category: string;
  title: string;
  description: string;
  effect: string;
  riskTarget: string;
  verification: VerificationType;
  durationDays: number;
  completionWindow: number;
  currentDay: number;
  status: ChallengeStatus;
  logs: Array<boolean | null>;
  lastSubmittedDate: string | null;
  recommended?: boolean;
  aiRecommended?: boolean;
  source?: "base" | "ai";
  aiReason?: string;
  userChallengeId?: number;
  currentStreak?: number;
};

type StoredActiveChallengeMap = Record<
  number,
  {
    userChallengeId: number;
    status: ChallengeStatus;
    currentStreak: number;
    logs: Array<boolean | null>;
    lastSubmittedDate: string | null;
  }
>;

const dayLabels = Array.from({ length: 30 }, (_, i) => `${i + 1}일`);
const ACTIVE_CHALLENGES_STORAGE_KEY = "active-user-challenges-v1";

function getStoredActiveChallengeMap(): StoredActiveChallengeMap {
  if (typeof window === "undefined") return {};

  try {
    const raw = sessionStorage.getItem(ACTIVE_CHALLENGES_STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as StoredActiveChallengeMap;
    return parsed ?? {};
  } catch (error) {
    console.error("활성 챌린지 저장값 파싱 실패:", error);
    return {};
  }
}

function setStoredActiveChallengeMap(map: StoredActiveChallengeMap) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(ACTIVE_CHALLENGES_STORAGE_KEY, JSON.stringify(map));
}

function mapVerificationType(value: string): VerificationType {
  const normalized = value.trim().toLowerCase();

  if (
    normalized.includes("photo") ||
    normalized.includes("image") ||
    normalized.includes("ocr") ||
    normalized.includes("capture") ||
    normalized.includes("cv")
  ) {
    return "photo";
  }

  if (
    normalized.includes("number") ||
    normalized.includes("numeric") ||
    normalized.includes("count") ||
    normalized.includes("input")
  ) {
    return "number";
  }

  return "check";
}

function mapVerificationTypeToApi(
  type: VerificationType
): "checklist" | "input" | "cv" {
  if (type === "check") return "checklist";
  if (type === "number") return "input";
  return "cv";
}

function mapApiStatusToUiStatus(
  status?: string | null
): ChallengeStatus | null {
  if (!status) return null;

  const normalized = status.toLowerCase();

  if (normalized === "active" || normalized === "in_progress") {
    return "in_progress";
  }

  if (normalized === "completed" || normalized === "done") {
    return "done";
  }

  if (normalized === "abandoned" || normalized === "locked") {
    return "locked";
  }

  return null;
}

function mapApiChallengeToUi(
  challenge: ApiChallenge,
  activeMap: StoredActiveChallengeMap
): ChallengeItem {
  const active = activeMap[challenge.id];
  const durationDays = Number(challenge.duration_days) || 7;
  const completionWindow = Number(challenge.required_success_days) || 5;

  const apiUserChallenge = challenge.user_challenge ?? null;
  const apiStatus = mapApiStatusToUiStatus(apiUserChallenge?.status);

  const logs =
    active?.logs && active.logs.length === durationDays
      ? active.logs
      : Array(durationDays).fill(null);

  const successCount = logs.filter((v) => v === true).length;

  const resolvedStatus: ChallengeStatus =
    apiStatus ??
    active?.status ??
    (successCount >= completionWindow ? "done" : "locked");

  const firstEmptyIndex = logs.findIndex((log) => log === null);
  const currentDay =
    firstEmptyIndex === -1
      ? Math.min(durationDays, successCount + 1)
      : firstEmptyIndex + 1;

  return {
    id: challenge.id,
    challengeId: challenge.id,
    category: challenge.category,
    title: challenge.title,
    description: challenge.description,
    effect: challenge.expected_effect,
    riskTarget: challenge.target_risk_factors,
    verification: mapVerificationType(challenge.verification_method),
    durationDays,
    completionWindow,
    currentDay,
    status: resolvedStatus,
    logs,
    lastSubmittedDate: active?.lastSubmittedDate ?? null,
    userChallengeId: apiUserChallenge?.id ?? active?.userChallengeId,
    currentStreak:
      apiUserChallenge?.current_streak ?? active?.currentStreak ?? 0,
    source: "base",
    aiRecommended: false,
  };
}

function buildLogUpdatedChallenge(
  challenge: ChallengeItem,
  success: boolean,
  currentStreak?: number,
  isCompleted?: boolean
): ChallengeItem {
  const nextLogs = [...challenge.logs];
  const firstEmptyIndex = nextLogs.findIndex((log) => log === null);

  if (firstEmptyIndex !== -1) {
    nextLogs[firstEmptyIndex] = success;
  }

  const successCount = nextLogs.filter((v) => v === true).length;
  const nextStatus: ChallengeStatus =
    isCompleted || successCount >= challenge.completionWindow
      ? "done"
      : "in_progress";

  const nextFirstEmptyIndex = nextLogs.findIndex((log) => log === null);
  const nextCurrentDay =
    nextFirstEmptyIndex === -1
      ? challenge.durationDays
      : nextFirstEmptyIndex + 1;

  return {
    ...challenge,
    logs: nextLogs,
    lastSubmittedDate: new Date().toISOString().slice(0, 10),
    status: nextStatus,
    currentDay: nextCurrentDay,
    currentStreak:
      typeof currentStreak === "number"
        ? currentStreak
        : success
        ? (challenge.currentStreak ?? 0) + 1
        : challenge.currentStreak ?? 0,
  };
}

function persistChallengeItemToStorage(challenge: ChallengeItem) {
  if (typeof challenge.challengeId !== "number") return;
  if (typeof challenge.userChallengeId !== "number") return;

  const current = getStoredActiveChallengeMap();

  current[challenge.challengeId] = {
    userChallengeId: challenge.userChallengeId,
    status: challenge.status,
    currentStreak: challenge.currentStreak ?? 0,
    logs: challenge.logs,
    lastSubmittedDate: challenge.lastSubmittedDate,
  };

  setStoredActiveChallengeMap(current);
}

function removeChallengeItemFromStorage(challengeId: number) {
  const current = getStoredActiveChallengeMap();
  delete current[challengeId];
  setStoredActiveChallengeMap(current);
}

export default function ChallengeScreen() {
  const [baseChallenges, setBaseChallenges] = useState<ChallengeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [usingFallbackChallenges, setUsingFallbackChallenges] = useState(false);

  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedId, setSelectedId] = useState<number | string | null>(null);
  const [numberInput, setNumberInput] = useState("");
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [pulseChallengeId, setPulseChallengeId] = useState<
    number | string | null
  >(null);
  const [ragRecommendations, setRagRecommendations] = useState<RecommendItem[]>(
    []
  );
  const [aiMissions, setAiMissions] = useState<Mission[]>([]);
  const [photoSubmitting, setPhotoSubmitting] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [exerciseVerifyOpen, setExerciseVerifyOpen] = useState(false);
  const [hasAutoSelected, setHasAutoSelected] = useState(false);

  const detailRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("health-ai-missions");
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as Mission[];
      const deduped = parsed.filter(
        (mission, index, arr) =>
          index ===
          arr.findIndex(
            (m) => normalize(m.title || "") === normalize(mission.title || "")
          )
      );
      setAiMissions(deduped);
    } catch (error) {
      console.error("AI 미션 파싱 실패:", error);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);

        const [challengeResponse, recommendResponse] = await Promise.allSettled([
          getChallengesWithFallback(),
          getRecommendations(),
        ]);

        if (challengeResponse.status === "fulfilled") {
          setUsingFallbackChallenges(challengeResponse.value.isFallback);
          const activeMap = getStoredActiveChallengeMap();
          const mapped = (challengeResponse.value.challenges ?? []).map(
            (challenge) => mapApiChallengeToUi(challenge, activeMap)
          );
          setBaseChallenges(mapped);
        } else {
          console.error("챌린지 목록 조회 실패:", challengeResponse.reason);
          setBaseChallenges([]);
        }

        if (recommendResponse.status === "fulfilled") {
          setRagRecommendations(recommendResponse.value.recommendations ?? []);
        }
      } finally {
        setLoading(false);
      }
    };

    void init();
  }, []);

  const mergedChallenges = useMemo(() => {
    if (ragRecommendations.length > 0) {
      return applyRagRecommendations(baseChallenges, ragRecommendations);
    }
    return mergeAiRecommendations(baseChallenges, aiMissions);
  }, [baseChallenges, ragRecommendations, aiMissions]);

  const streak = useMemo(() => {
    return baseChallenges.reduce(
      (acc, challenge) => acc + (challenge.currentStreak ?? 0),
      0
    );
  }, [baseChallenges]);

  const counts = useMemo(
    () => getMergedChallengeCounts(mergedChallenges),
    [mergedChallenges]
  );

  const filteredChallenges = useMemo(() => {
    if (filter === "all") return mergedChallenges;
    return mergedChallenges.filter((challenge) => challenge.status === filter);
  }, [filter, mergedChallenges]);

  const selectedChallenge =
    selectedId !== null
      ? mergedChallenges.find((challenge) => challenge.id === selectedId) ?? null
      : null;

  useEffect(() => {
    if (!mergedChallenges.length) return;
    if (hasAutoSelected) return;

    const firstAi = mergedChallenges.find((item) => item.aiRecommended);
    if (firstAi) {
      setSelectedId(firstAi.id);
    } else {
      setSelectedId(mergedChallenges[0].id);
    }

    setHasAutoSelected(true);
  }, [mergedChallenges, hasAutoSelected]);

  const todayKey = new Date().toISOString().slice(0, 10);
  const isSubmittedToday =
    !!selectedChallenge && selectedChallenge.lastSubmittedDate === todayKey;

  const detailProgressPercent = selectedChallenge
    ? (selectedChallenge.logs.filter((v) => v !== null).length /
        selectedChallenge.durationDays) *
      100
    : 0;

  const handleChangeFilter = (nextFilter: FilterType) => {
    setFilter(nextFilter);
    setSelectedId(null);
    setNumberInput("");
    setPhotoUploaded(false);
    setPhotoError("");
    setExerciseVerifyOpen(false);
  };

  const handleSelectChallenge = (id: number | string) => {
    setSelectedId(id);
    setNumberInput("");
    setPhotoUploaded(false);
    setPhotoError("");
    setExerciseVerifyOpen(false);

    if (typeof window !== "undefined" && window.innerWidth < 1280) {
      setTimeout(() => {
        detailRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 80);
    }
  };

  const triggerCardPulse = (challengeId: number | string) => {
    setPulseChallengeId(challengeId);
    setTimeout(() => setPulseChallengeId(null), 700);
  };

  const updateBaseChallenge = (updatedChallenge: ChallengeItem) => {
    setBaseChallenges((prev) =>
      prev.map((item) =>
        item.challengeId === updatedChallenge.challengeId ? updatedChallenge : item
      )
    );
  };

  const refreshBaseChallengesFromServer = async () => {
    const challengeResponse = await getChallengesWithFallback();
    setUsingFallbackChallenges(challengeResponse.isFallback);

    const activeMap = getStoredActiveChallengeMap();
    const mapped = (challengeResponse.challenges ?? []).map((challenge) =>
      mapApiChallengeToUi(challenge, activeMap)
    );

    setBaseChallenges(mapped);
    return mapped;
  };

  const handleStartChallenge = async () => {
    if (!selectedChallenge) return;
    if (typeof selectedChallenge.challengeId !== "number") return;

    try {
      setLoadingAction(true);

      const result = await joinChallengeWithFallback(
        selectedChallenge.challengeId
      );

      const joined: UserChallengeResponse = result.data;

      const updatedChallenge: ChallengeItem = {
        ...selectedChallenge,
        userChallengeId: joined.id,
        currentStreak: joined.current_streak ?? 0,
        status: "in_progress",
        logs:
          selectedChallenge.logs?.length === selectedChallenge.durationDays
            ? selectedChallenge.logs
            : Array(selectedChallenge.durationDays).fill(null),
      };

      updateBaseChallenge(updatedChallenge);
      persistChallengeItemToStorage(updatedChallenge);

      alert(
        result.isFallback
          ? "임시 모드로 챌린지를 시작했어요."
          : "챌린지를 시작했어요!"
      );
    } catch (error) {
      console.error("챌린지 시작 실패:", error);

      if (
        error instanceof Error &&
        (error.message.includes("409") ||
          error.message.includes("이미 참여 중인 챌린지입니다"))
      ) {
        try {
          await refreshBaseChallengesFromServer();
          alert("이미 참여 중인 챌린지예요. 진행 상태를 동기화했어요.");
        } catch (refreshError) {
          console.error("챌린지 상태 재조회 실패:", refreshError);
          alert("이미 참여 중인 챌린지예요. 화면을 새로고침해주세요.");
        }
      } else {
        alert("챌린지 시작에 실패했어요.");
      }
    } finally {
      setLoadingAction(false);
    }
  };

  const handleRestartChallenge = async () => {
    if (!selectedChallenge) return;
    if (typeof selectedChallenge.challengeId !== "number") return;

    try {
      setLoadingAction(true);

      const result = await joinChallengeWithFallback(
        selectedChallenge.challengeId
      );

      const joined = result.data;

      const updatedChallenge: ChallengeItem = {
        ...selectedChallenge,
        userChallengeId: joined.id,
        currentStreak: joined.current_streak ?? 0,
        status: "in_progress",
        logs: Array(selectedChallenge.durationDays).fill(null),
        lastSubmittedDate: null,
        currentDay: 1,
      };

      updateBaseChallenge(updatedChallenge);
      persistChallengeItemToStorage(updatedChallenge);

      alert(
        result.isFallback
          ? "임시 모드로 챌린지를 다시 시작했어요."
          : "챌린지를 다시 시작했어요!"
      );
    } catch (error) {
      console.error("챌린지 재시작 실패:", error);

      if (
        error instanceof Error &&
        (error.message.includes("409") ||
          error.message.includes("이미 참여 중인 챌린지입니다"))
      ) {
        try {
          await refreshBaseChallengesFromServer();
          alert("이미 참여 중인 챌린지예요. 진행 상태를 동기화했어요.");
        } catch (refreshError) {
          console.error("챌린지 상태 재조회 실패:", refreshError);
          alert("이미 참여 중인 챌린지예요. 화면을 새로고침해주세요.");
        }
      } else {
        alert("챌린지 재시작에 실패했어요.");
      }
    } finally {
      setLoadingAction(false);
    }
  };

  const handleAbandonChallenge = async () => {
    if (!selectedChallenge) return;
    if (typeof selectedChallenge.challengeId !== "number") return;
    if (typeof selectedChallenge.userChallengeId !== "number") {
      alert("포기할 진행중 챌린지 정보가 없어요.");
      return;
    }

    const ok = window.confirm("진행 중인 챌린지를 포기할까요?");
    if (!ok) return;

    try {
      setLoadingAction(true);

      const result = await abandonChallengeWithFallback(
        selectedChallenge.userChallengeId
      );

      const updatedChallenge: ChallengeItem = {
        ...selectedChallenge,
        userChallengeId: undefined,
        currentStreak: 0,
        status: "locked",
        logs: Array(selectedChallenge.durationDays).fill(null),
        lastSubmittedDate: null,
        currentDay: 1,
      };

      updateBaseChallenge(updatedChallenge);
      removeChallengeItemFromStorage(selectedChallenge.challengeId);

      alert(
        result.isFallback
          ? "임시 모드로 챌린지를 포기했어요."
          : "챌린지를 포기했어요."
      );
    } catch (error) {
      console.error("챌린지 포기 실패:", error);
      alert("챌린지 포기에 실패했어요.");
    } finally {
      setLoadingAction(false);
    }
  };

  const submitChallengeLog = async (
    challenge: ChallengeItem,
    inputValue?: string,
    cvResultId?: number,
    forceInputMode?: boolean
  ) => {
    if (typeof challenge.userChallengeId !== "number") {
      alert("먼저 챌린지를 시작해주세요.");
      return;
    }

    const verificationType = forceInputMode
      ? "input"
      : mapVerificationTypeToApi(challenge.verification);

    let payload: ChallengeLogPayload;

    if (verificationType === "input") {
      payload = {
        verification_type: "input",
        input_value: inputValue ?? "",
      };
    } else if (verificationType === "cv") {
      payload = {
        verification_type: "cv",
        ...(typeof cvResultId === "number" ? { cv_result_id: cvResultId } : {}),
      };
    } else {
      payload = {
        verification_type: "checklist",
      };
    }

    const { data: logResult } = await logChallengeWithFallback(
      challenge.userChallengeId,
      payload
    );

    const success = true;

    if (logResult.is_completed) {
      alert(`🎉 챌린지 달성! "${challenge.title}" 챌린지를 완료했어요!`);
    } else {
      alert(`✅ ${logResult.current_streak}일 연속 인증 완료!`);
    }

    const updatedChallenge = buildLogUpdatedChallenge(
      challenge,
      success,
      logResult.current_streak,
      logResult.is_completed
    );
    updateBaseChallenge(updatedChallenge);
    persistChallengeItemToStorage(updatedChallenge);
    triggerCardPulse(challenge.id);
  };

  const handleDailyCheck = async (_value: boolean) => {
    if (!selectedChallenge || selectedChallenge.status !== "in_progress") return;
    if (typeof selectedChallenge.challengeId !== "number") return;
    if (isSubmittedToday) return;

    try {
      setLoadingAction(true);
      await submitChallengeLog(selectedChallenge);
    } catch (error) {
      console.error("챌린지 체크 인증 실패:", error);
      alert("오늘 인증에 실패했어요.");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleNumberSubmit = async () => {
    if (!selectedChallenge || selectedChallenge.status !== "in_progress") return;
    if (typeof selectedChallenge.challengeId !== "number") return;
    if (!numberInput.trim()) return;
    if (isSubmittedToday) return;

    try {
      setLoadingAction(true);

      await submitChallengeLog(
        selectedChallenge,
        numberInput.trim(),
        undefined,
        true
      );

      setNumberInput("");
    } catch (error) {
      console.error("챌린지 수치 인증 실패:", error);
      alert("오늘 인증에 실패했어요.");
    } finally {
      setLoadingAction(false);
    }
  };

  const handlePhotoSubmit = async (file: File) => {
    if (!selectedChallenge) return;
    if (typeof selectedChallenge.challengeId !== "number") return;
    if (isSubmittedToday) return;

    try {
      setPhotoSubmitting(true);
      setPhotoError("");
      setPhotoUploaded(false);

      const task = await requestExerciseVerification(file);
      const verifyResult = await waitExerciseVerificationCompletion(task.task_id);

      console.log("exercise verify result:", verifyResult);

      const verifyResultRecord = verifyResult as Record<string, unknown>;

      const resolvedCvResultId =
        typeof verifyResultRecord.cv_result_id === "number"
          ? verifyResultRecord.cv_result_id
          : typeof verifyResultRecord.result_id === "number"
          ? verifyResultRecord.result_id
          : undefined;

      await submitChallengeLog(
        selectedChallenge,
        undefined,
        resolvedCvResultId
      );

      setPhotoUploaded(true);
      setExerciseVerifyOpen(false);
    } catch (error) {
      console.error("운동 사진 인증 실패:", error);
      setPhotoError(
        error instanceof Error
          ? error.message
          : "운동 인증 중 오류가 발생했어요."
      );
    } finally {
      setPhotoSubmitting(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-6xl">
      <div className="rounded-[28px] border border-[#163126]/8 bg-white/80 p-5 shadow-[0_18px_50px_rgba(46,125,91,0.06)] backdrop-blur-xl md:p-8">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2E7D5B]">
            challenge
          </p>
          <h1 className="mt-3 text-2xl font-bold text-[#163126] md:text-4xl">
            건강 챌린지
          </h1>
          <p className="mt-3 text-sm leading-7 text-[#163126]/68 md:text-base">
            건강 분석 결과 기반 AI 추천과 기본 챌린지를 함께 확인하고 실천할 수
            있어요.
          </p>
        </div>

        {usingFallbackChallenges && (
          <div className="mb-6 rounded-[18px] border border-[#f3dfb2] bg-[#fffaf0] px-4 py-3 text-sm text-[#8a6c00]">
            현재는 임시 챌린지 목록을 보여주고 있어요. API 연결 후 실제 데이터로
            자동 전환돼요.
          </div>
        )}

        <div className="mb-6 rounded-[20px] border border-[#163126]/8 bg-[#f9fcfa] px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔥</span>
            <div>
              <p className="text-sm font-semibold text-[#163126]">
                {streak > 0
                  ? `${streak}일 누적 실천 기록`
                  : "오늘부터 건강 실천 시작하기"}
              </p>
              <p className="text-xs text-[#163126]/58 md:text-sm">
                진행중 챌린지는 시작, 포기, 인증이 가능해요.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6 grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
          <FilterButton
            active={filter === "all"}
            label="전체"
            count={counts.all}
            icon={LayoutGrid}
            onClick={() => handleChangeFilter("all")}
          />
          <FilterButton
            active={filter === "in_progress"}
            label="진행중"
            count={counts.in_progress}
            icon={Clock3}
            onClick={() => handleChangeFilter("in_progress")}
          />
          <FilterButton
            active={filter === "done"}
            label="완료"
            count={counts.done}
            icon={CheckCircle2}
            onClick={() => handleChangeFilter("done")}
          />
          <FilterButton
            active={filter === "locked"}
            label="잠금"
            count={counts.locked}
            icon={Lock}
            onClick={() => handleChangeFilter("locked")}
          />
        </div>

        <div className="mb-8">
          <div className="h-3 overflow-hidden rounded-full bg-[#163126]/8">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#7EE8A7,#B7F3C9)] transition-all duration-500"
              style={{ width: `${detailProgressPercent}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-[#163126]/55 md:text-sm">
            현재 선택한 챌린지 진행률 {Math.round(detailProgressPercent)}%
          </p>
        </div>

        {loading ? (
          <div className="rounded-[24px] border border-[#163126]/8 bg-[#f9fcfa] px-5 py-10 text-center text-sm text-[#163126]/60">
            챌린지 목록을 불러오는 중이에요...
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,720px)_minmax(360px,1fr)] xl:items-start">
            <div className="grid w-full max-w-[720px] grid-cols-1 gap-4 sm:grid-cols-2">
              {filteredChallenges.length === 0 ? (
                <div className="sm:col-span-2 rounded-[22px] border border-[#163126]/8 bg-[#f9fcfa] px-5 py-10 text-center text-sm text-[#163126]/60">
                  표시할 챌린지가 없어요.
                </div>
              ) : (
                filteredChallenges.map((challenge) => {
                  const selected = challenge.id === selectedId;
                  const successCount = challenge.logs.filter(
                    (v) => v === true
                  ).length;
                  const shouldPulse = pulseChallengeId === challenge.id;

                  return (
                    <motion.button
                      key={String(challenge.id)}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.99 }}
                      animate={
                        shouldPulse
                          ? {
                              scale: [1, 1.03, 1],
                              boxShadow: [
                                "0 0 0 rgba(0,0,0,0)",
                                "0 18px 36px rgba(22,49,38,0.12)",
                                "0 0 0 rgba(0,0,0,0)",
                              ],
                            }
                          : { scale: 1 }
                      }
                      transition={{ duration: 0.55 }}
                      onClick={() => handleSelectChallenge(challenge.id)}
                      className={`rounded-[22px] border p-5 text-left transition ${
                        selected
                          ? "border-[#73d99c] bg-[#ecf9f1] shadow-[0_12px_28px_rgba(22,49,38,0.08)]"
                          : "border-[#163126]/8 bg-[#f9fcfa] hover:bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2E7D5B]">
                              {challenge.category}
                            </p>
                            {challenge.aiRecommended && <RecommendBadge />}
                          </div>

                          <h3 className="mt-2 text-lg font-bold text-[#163126]">
                            {challenge.title}
                          </h3>
                        </div>

                        <StatusBadge status={challenge.status} />
                      </div>

                      <p className="mt-3 text-sm leading-6 text-[#163126]/65">
                        {challenge.description}
                      </p>

                      <div className="mt-4 flex items-center justify-between text-xs text-[#163126]/55">
                        <span>{challenge.durationDays}일 챌린지</span>
                        <span>
                          {successCount}/{challenge.durationDays} 성공
                        </span>
                      </div>
                    </motion.button>
                  );
                })
              )}
            </div>

            <div
              ref={detailRef}
              className="rounded-[24px] border border-[#163126]/8 bg-[#f9fcfa] p-5 md:p-6"
            >
              <AnimatePresence mode="wait">
                {!selectedChallenge ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex min-h-[560px] flex-col items-center justify-center text-center"
                  >
                    <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#ecf9f1] text-2xl">
                      🎯
                    </div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#2E7D5B]">
                      challenge detail
                    </p>
                    <h2 className="mt-3 text-2xl font-bold text-[#163126]">
                      챌린지를 선택해주세요
                    </h2>
                    <p className="mt-3 max-w-md text-sm leading-7 text-[#163126]/62">
                      왼쪽 카드에서 챌린지를 클릭하면 상세 정보와 인증 영역이
                      열려요.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key={String(selectedChallenge.id)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2E7D5B]">
                            {selectedChallenge.category}
                          </p>
                          {selectedChallenge.aiRecommended && <RecommendBadge />}
                        </div>

                        <h2 className="mt-2 text-2xl font-bold text-[#163126]">
                          {selectedChallenge.title}
                        </h2>
                      </div>

                      <StatusBadge status={selectedChallenge.status} />
                    </div>

                    <p className="mt-4 text-sm leading-7 text-[#163126]/68 md:text-base">
                      {selectedChallenge.description}
                    </p>

                    {selectedChallenge.aiRecommended &&
                      selectedChallenge.aiReason && (
                        <div className="mt-4 rounded-[18px] bg-[#fff8df] px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a6c00]">
                            AI 추천 이유
                          </p>
                          <p className="mt-2 text-sm leading-6 text-[#5c4a00]">
                            {selectedChallenge.aiReason}
                          </p>
                        </div>
                      )}

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <InfoCard label="기대효과" value={selectedChallenge.effect} />
                      <InfoCard
                        label="대상 위험 요인"
                        value={selectedChallenge.riskTarget}
                      />
                      <InfoCard
                        label="인증 방식"
                        value={verificationLabel(selectedChallenge.verification)}
                      />
                      <InfoCard
                        label="완료 기준"
                        value={`${selectedChallenge.durationDays}일 중 ${selectedChallenge.completionWindow}일 성공`}
                      />
                    </div>

                    {selectedChallenge.verification === "photo" && (
                      <div className="mt-4 rounded-[18px] bg-white px-4 py-4 text-sm leading-7 text-[#163126]/68">
                        <p className="font-semibold text-[#163126]">
                          포인트 안내
                        </p>
                        <p className="mt-2">운동 캡처 인증 성공 시 +100포인트</p>
                      </div>
                    )}

                    <div className="mt-6">
                      <p className="text-sm font-semibold text-[#163126]">
                        진행 현황
                      </p>
                      <div className="mt-3 grid grid-cols-7 gap-2">
                        {selectedChallenge.logs.map((log, idx) => (
                          <div
                            key={idx}
                            className={`rounded-2xl border px-2 py-3 text-center text-xs font-medium ${
                              log === true
                                ? "border-[#73d99c] bg-[#ecf9f1] text-[#163126]"
                                : log === false
                                ? "border-[#f1d8d8] bg-[#fff5f5] text-[#8f5c5c]"
                                : "border-[#163126]/8 bg-white text-[#163126]/45"
                            }`}
                          >
                            <div>{dayLabels[idx]}</div>
                            <div className="mt-1 text-base">
                              {log === true ? "✔" : log === false ? "✖" : "-"}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 rounded-[22px] border border-[#163126]/8 bg-white p-5">
                      {selectedChallenge.status === "locked" ? (
                        <div>
                          <p className="text-sm font-semibold text-[#163126]">
                            아직 시작하지 않은 챌린지예요
                          </p>
                          <p className="mt-2 text-sm leading-6 text-[#163126]/62">
                            시작하기를 누르면 진행중 상태로 전환돼요.
                          </p>

                          {typeof selectedChallenge.challengeId === "number" && (
                            <button
                              onClick={handleStartChallenge}
                              disabled={loadingAction}
                              className="mt-5 rounded-full bg-[#163126] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d4232] disabled:opacity-50"
                            >
                              {loadingAction ? "시작 중..." : "챌린지 시작하기"}
                            </button>
                          )}
                        </div>
                      ) : selectedChallenge.status === "done" ? (
                        <div>
                          <p className="text-sm font-semibold text-[#2E7D5B]">
                            🎉 챌린지 성공!
                          </p>
                          <p className="mt-2 text-sm leading-6 text-[#163126]/62">
                            완료된 챌린지는 다시 시도할 수 있어요.
                          </p>

                          {typeof selectedChallenge.challengeId === "number" && (
                            <button
                              onClick={handleRestartChallenge}
                              disabled={loadingAction}
                              className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#163126] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d4232] disabled:opacity-50"
                            >
                              <RotateCcw className="h-4 w-4" />
                              {loadingAction ? "재시작 중..." : "다시 시도하기"}
                            </button>
                          )}
                        </div>
                      ) : isSubmittedToday ? (
                        <div className="rounded-2xl bg-[#ecf9f1] px-4 py-4">
                          <p className="text-sm font-semibold text-[#163126]">
                            ✔ 오늘 인증 완료
                          </p>
                          <p className="mt-1 text-sm leading-6 text-[#163126]/62">
                            다음 인증은 내일 다시 열려요.
                          </p>

                          <button
                            onClick={handleAbandonChallenge}
                            disabled={loadingAction}
                            className="mt-4 rounded-full border border-[#163126]/10 bg-white px-4 py-2.5 text-sm font-semibold text-[#163126] disabled:opacity-50"
                          >
                            챌린지 포기하기
                          </button>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-[#163126]">
                                오늘의 인증
                              </p>
                              <p className="mt-2 text-sm leading-6 text-[#163126]/62">
                                Day {selectedChallenge.currentDay} /{" "}
                                {selectedChallenge.durationDays}
                              </p>
                            </div>

                            <button
                              onClick={handleAbandonChallenge}
                              disabled={loadingAction}
                              className="rounded-full border border-[#163126]/10 bg-white px-4 py-2.5 text-sm font-semibold text-[#163126] disabled:opacity-50"
                            >
                              포기하기
                            </button>
                          </div>

                          {selectedChallenge.verification === "check" && (
                            <div className="mt-5 flex gap-3">
                              <button
                                onClick={() => void handleDailyCheck(true)}
                                disabled={Boolean(isSubmittedToday) || loadingAction}
                                className="rounded-full bg-[#163126] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d4232] disabled:cursor-not-allowed disabled:bg-[#163126]/25"
                              >
                                예
                              </button>
                              <button
                                onClick={() => void handleDailyCheck(false)}
                                disabled={Boolean(isSubmittedToday) || loadingAction}
                                className="rounded-full border border-[#163126]/10 bg-white px-5 py-3 text-sm font-semibold text-[#163126] disabled:cursor-not-allowed disabled:opacity-45"
                              >
                                아니오
                              </button>
                            </div>
                          )}

                          {selectedChallenge.verification === "number" && (
                            <div className="mt-5">
                              <div className="flex gap-3">
                                <input
                                  type="number"
                                  value={numberInput}
                                  onChange={(e) => setNumberInput(e.target.value)}
                                  placeholder="오늘 수치 입력"
                                  className="h-12 flex-1 rounded-2xl border border-[#163126]/10 bg-white px-4 text-sm outline-none"
                                />
                                <button
                                  onClick={() => void handleNumberSubmit()}
                                  disabled={Boolean(isSubmittedToday) || loadingAction}
                                  className="rounded-full bg-[#163126] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d4232] disabled:cursor-not-allowed disabled:bg-[#163126]/25"
                                >
                                  저장
                                </button>
                              </div>
                              <p className="mt-2 text-xs text-[#163126]/48">
                                현재 로직은 0 입력 시 오늘 성공으로 처리해요.
                              </p>
                            </div>
                          )}

                          {selectedChallenge.verification === "photo" && (
                            <div className="mt-5">
                              <button
                                onClick={() => setExerciseVerifyOpen(true)}
                                disabled={photoSubmitting}
                                className="inline-flex items-center gap-2 rounded-full bg-[#163126] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d4232] disabled:cursor-not-allowed disabled:bg-[#163126]/25"
                              >
                                <Camera className="h-4 w-4" />
                                운동 앱으로 인증하기
                              </button>

                              <p className="mt-2 text-xs text-[#163126]/48">
                                운동 앱 스크린샷을 업로드하면 AI가 인증해요.
                              </p>

                              {photoSubmitting && (
                                <div className="mt-4 flex items-center gap-2 rounded-2xl bg-[#f8fbf8] px-4 py-3 text-sm text-[#163126]">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  운동 캡처를 인증하는 중이에요...
                                </div>
                              )}

                              {photoUploaded && (
                                <div className="mt-4 rounded-2xl bg-[#ecf9f1] px-4 py-3 text-sm text-[#163126]">
                                  업로드 완료 · 운동 인증이 정상적으로 처리되었어요.
                                  +100포인트가 반영돼요.
                                </div>
                              )}

                              {photoError && (
                                <div className="mt-4 rounded-2xl bg-[#fff5f5] px-4 py-3 text-sm text-[#8f5c5c]">
                                  {photoError}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      <ExerciseVerifyModal
        open={exerciseVerifyOpen}
        onClose={() => setExerciseVerifyOpen(false)}
        onSubmit={handlePhotoSubmit}
        challengeTitle={selectedChallenge?.title ?? "운동 인증"}
        errorMessage={photoError}
        submitting={photoSubmitting}
      />
    </section>
  );
}

function FilterButton({
  label,
  count,
  active,
  onClick,
  icon: Icon,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <button
      onClick={onClick}
      className={`h-16 w-full rounded-[20px] px-4 transition ${
        active
          ? "bg-[#163126] text-white shadow-[0_10px_24px_rgba(22,49,38,0.14)]"
          : "border border-[#163126]/8 bg-white text-[#163126]/65 hover:bg-[#f8fbf8]"
      }`}
    >
      <div className="flex items-center justify-center gap-2">
        <Icon
          size={18}
          className={active ? "text-white" : "text-[#163126]/55"}
        />
        <span className="text-sm font-semibold">{label}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
            active
              ? "bg-white/14 text-white"
              : "bg-[#f3f7f4] text-[#163126]/65"
          }`}
        >
          {count}
        </span>
      </div>
    </button>
  );
}

function StatusBadge({ status }: { status: ChallengeStatus }) {
  const labelMap = {
    in_progress: "진행중",
    done: "완료",
    locked: "잠금",
  };

  const classMap = {
    in_progress: "bg-[#ecf9f1] text-[#163126]",
    done: "bg-[#eef6ff] text-[#315b8f]",
    locked: "bg-[#f3f5f4] text-[#7f8b84]",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${classMap[status]}`}
    >
      {labelMap[status]}
    </span>
  );
}

function RecommendBadge() {
  return (
    <span className="rounded-full bg-[#fff8df] px-2.5 py-1 text-[11px] font-semibold text-[#8a6c00]">
      AI 추천
    </span>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#163126]/8 bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2E7D5B]">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-[#163126]">{value}</p>
    </div>
  );
}

function ExerciseVerifyModal({
  open,
  onClose,
  onSubmit,
  challengeTitle,
  errorMessage,
  submitting,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (file: File) => Promise<void>;
  challengeTitle: string;
  errorMessage: string;
  submitting: boolean;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [localError, setLocalError] = useState("");
  const displayError = localError || errorMessage;
  const hasUploadError = Boolean(displayError);

  useEffect(() => {
    if (!open) {
      setFile(null);
      setPreviewUrl("");
      setLocalError("");
    }
  }, [open]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!file) {
      setLocalError("운동 앱 스크린샷을 업로드해주세요.");
      return;
    }

    setLocalError("");
    await onSubmit(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-lg rounded-[28px] bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-[#163126]">
              {challengeTitle} 인증
            </h3>
            <p className="mt-1 text-sm leading-6 text-[#163126]/60">
              운동 앱 캡처 화면을 업로드해서 인증을 요청해요.
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-full px-2 py-1 text-[#163126]/45"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 rounded-[20px] border border-[#163126]/8 bg-[#f9fcfa] p-4">
          <p className="text-sm font-semibold text-[#163126]">OCR 확인 기준</p>
          <p className="mt-2 text-sm leading-6 text-[#163126]/60">
            운동 앱 화면에 아래 정보가 보이도록 캡처해주세요.
          </p>

          <div className="mt-3 rounded-[16px] border border-dashed border-[#cfe0d4] bg-white px-4 py-3 text-sm text-[#163126]/70">
            • 운동 종류 (걷기, 달리기 등)
            <br />
            • 운동 시간 또는 이동 거리
            <br />
            • 칼로리 또는 걸음 수
            <br />
            <br />※ 2개 이상 확인되면 인증 성공
            <br />※ 흐리거나 잘린 이미지는 인증이 실패할 수 있어요
          </div>
        </div>

        <div className="mt-5">
          <p className="mb-3 text-sm font-semibold text-[#163126]">
            운동 앱 스크린샷 업로드
          </p>

          <label className="block cursor-pointer">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => {
                setLocalError("");
                setFile(e.target.files?.[0] ?? null);
              }}
              className="hidden"
            />

            {!file ? (
              <div
                className={`flex min-h-[220px] flex-col items-center justify-center rounded-[28px] border px-6 py-8 text-center transition ${
                  hasUploadError
                    ? "border-[#ef9a9a] bg-[#fff5f5] shadow-[0_18px_40px_rgba(239,68,68,0.08)]"
                    : "border-[#cfe0d4] bg-[#f9fcfa] hover:border-[#9fd3b0] hover:bg-white"
                }`}
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#eef9f2] text-[#2E7D5B]">
                  <Camera className="h-9 w-9" />
                </div>

                <p className="mt-6 text-[28px] font-bold leading-tight text-[#163126]">
                  운동 앱 화면을 업로드해주세요
                </p>

                <p className="mt-3 text-base text-[#163126]/55">
                  JPG, PNG, WebP, GIF 업로드 가능
                </p>

                <p className="mt-2 text-sm text-[#163126]/42">
                  날짜, 운동 시간, 걸음 수가 보이도록 캡처하면 더 정확해요
                </p>
              </div>
            ) : (
              <div
                className={`rounded-[28px] border p-4 transition ${
                  hasUploadError
                    ? "border-[#ef9a9a] bg-[#fff5f5] shadow-[0_18px_40px_rgba(239,68,68,0.08)]"
                    : "border-[#cfe0d4] bg-[#f9fcfa] hover:border-[#9fd3b0] hover:bg-white"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`h-24 w-24 shrink-0 overflow-hidden rounded-[22px] border bg-white ${
                      hasUploadError ? "border-[#ef9a9a]" : "border-[#dce9df]"
                    }`}
                  >
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="운동 앱 미리보기"
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-bold text-[#163126]">
                      사진이 선택되었어요
                    </p>
                    <p className="mt-1 truncate text-sm text-[#163126]/58">
                      {file.name}
                    </p>
                    <p className="mt-2 text-sm text-[#163126]/48">
                      다른 사진으로 바꾸려면 이 영역을 다시 눌러주세요
                    </p>
                  </div>
                </div>
              </div>
            )}
          </label>

          {displayError && (
            <p className="mt-3 text-xs font-semibold text-[#e05252]">
              {displayError}
            </p>
          )}
        </div>

        <div className="mt-5 rounded-[16px] bg-[#eef9f2] px-4 py-3 text-sm font-medium text-[#2E7D5B]">
          운동 캡처 인증 성공 시 +100포인트
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-full border border-[#163126]/10 px-4 py-2.5 text-sm font-semibold text-[#163126]"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-full bg-[#163126] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting ? "인증 중..." : "인증 요청"}
          </button>
        </div>
      </div>
    </div>
  );
}

function verificationLabel(type: VerificationType) {
  if (type === "check") return "체크리스트 (Y/N)";
  if (type === "number") return "수치 입력";
  return "운동 앱 캡처 인증";
}

function normalize(text: string) {
  return text.replace(/\s+/g, "").toLowerCase();
}

function detectCategory(title: string, action: string) {
  const joined = `${title} ${action}`;

  if (
    joined.includes("걷기") ||
    joined.includes("운동") ||
    joined.includes("유산소") ||
    joined.includes("달리기") ||
    joined.includes("보")
  ) {
    return "운동";
  }

  if (
    joined.includes("금연") ||
    joined.includes("금주") ||
    joined.includes("물")
  ) {
    return "생활습관";
  }

  return "식습관";
}

function createAiOnlyChallenge(mission: Mission, index: number): ChallengeItem {
  const title = mission.title?.trim() || `AI 추천 미션 ${index + 1}`;
  const action = mission.action?.trim() || "건강한 습관을 실천해보세요.";
  const reason =
    mission.reason?.trim() || "건강 관리에 도움이 되는 추천 미션입니다.";
  const category = detectCategory(title, action);
  const isNumber = title.includes("금연") || title.includes("금주");
  const isPhoto =
    title.includes("운동") || title.includes("걷기") || title.includes("보");

  const durationDays = isNumber ? 30 : 7;
  const completionWindow = isNumber ? 21 : 5;

  return {
    id: `ai-mission-${index}-${normalize(title)}`,
    category,
    title,
    description: action,
    effect: reason,
    riskTarget: "건강 분석 기반 맞춤 추천",
    verification: isNumber ? "number" : isPhoto ? "photo" : "check",
    durationDays,
    completionWindow,
    currentDay: 1,
    status: "locked",
    logs: Array(durationDays).fill(null),
    lastSubmittedDate: null,
    recommended: true,
    aiRecommended: true,
    source: "ai",
    aiReason: reason,
  };
}

function isAiMatch(baseTitle: string, aiTitle: string, aiAction: string) {
  const title = normalize(baseTitle);
  const target = normalize(aiTitle);

  return (
    title.includes(target) ||
    target.includes(title) ||
    (target.includes("저염") && title.includes("저염")) ||
    (target.includes("포화지방") && title.includes("포화지방")) ||
    (target.includes("당") && title.includes("당류")) ||
    (target.includes("야식") && title.includes("야식")) ||
    (target.includes("유산소") && title.includes("유산소")) ||
    (target.includes("7000보") && title.includes("7000보")) ||
    (target.includes("걷기") && title.includes("걷기")) ||
    (target.includes("금연") && title.includes("금연")) ||
    (target.includes("금주") && title.includes("금주")) ||
    (target.includes("물") && title.includes("물")) ||
    normalize(aiAction).includes(title)
  );
}

function mergeAiRecommendations(
  baseChallenges: ChallengeItem[],
  missions: Mission[]
): ChallengeItem[] {
  if (!missions.length) return baseChallenges;

  const usedBaseIds = new Set<number | string>();
  const merged: ChallengeItem[] = [];

  missions.forEach((mission, index) => {
    const title = mission.title?.trim() || "";
    const action = mission.action?.trim() || "";
    const reason = mission.reason?.trim() || "";

    const matchedBase = baseChallenges.find(
      (base) => !usedBaseIds.has(base.id) && isAiMatch(base.title, title, action)
    );

    if (matchedBase) {
      merged.push({
        ...matchedBase,
        aiRecommended: true,
        recommended: true,
        aiReason: reason,
        source: "base",
      });
      usedBaseIds.add(matchedBase.id);
    } else {
      merged.push(createAiOnlyChallenge(mission, index));
    }
  });

  const remainingBase = baseChallenges.filter(
    (item) => !usedBaseIds.has(item.id)
  );
  return [...merged, ...remainingBase];
}

function applyRagRecommendations(
  baseChallenges: ChallengeItem[],
  recommendations: RecommendItem[]
): ChallengeItem[] {
  if (!recommendations.length) return baseChallenges;

  const recommendMap = new Map(
    recommendations.map((r) => [r.challenge_id, r.reason])
  );

  const recommended = baseChallenges
    .filter((c) => {
      const challengeId = c.challengeId;
      return typeof challengeId === "number" && recommendMap.has(challengeId);
    })
    .map((c) => {
      const challengeId = c.challengeId as number;

      return {
        ...c,
        aiRecommended: true,
        recommended: true,
        aiReason: recommendMap.get(challengeId) ?? "",
        source: "base" as const,
      };
    });

  const rest = baseChallenges.filter((c) => {
    const challengeId = c.challengeId;
    return typeof challengeId !== "number" || !recommendMap.has(challengeId);
  });

  return [...recommended, ...rest];
}

function getMergedChallengeCounts(challenges: ChallengeItem[]) {
  return {
    all: challenges.length,
    in_progress: challenges.filter((item) => item.status === "in_progress")
      .length,
    done: challenges.filter((item) => item.status === "done").length,
    locked: challenges.filter((item) => item.status === "locked").length,
  };
}
