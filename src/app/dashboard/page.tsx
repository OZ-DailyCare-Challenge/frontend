"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/src/components/AppShell";
import DashboardScreen, {
  type DashboardViewData,
} from "@/src/components/DashboardScreen";
import { getDashboard } from "@/src/api/user";
import { getHealthRecords } from "@/src/api/health";
import { getAnalysisHistory } from "@/src/api/analysis";
import { storage } from "@/src/utils/storage";
import { perfMark, perfMeasure } from "@/src/utils/perf";
import { useChallengeStore } from "@/src/store/challenge-store";
import { getTodayChecklistFromChallenges } from "@/src/lib/challenge-utils";

type HealthRecordLike = {
  id?: number;
  record_id?: number;
  systolic_bp?: number;
  diastolic_bp?: number;
  total_cholesterol?: number;
  glucose?: number;
  height?: number;
  weight?: number;
  smoke_yn?: boolean;
  alcohol_yn?: boolean;
  exercise_yn?: boolean;
};

type AnalysisHistoryLike = {
  cvd_risk_percent?: number;
  cvd_age?: number;
  top_risk_factors?: string[];
  created_at?: string;
};

type ChallengeLike = {
  id: number | string;
  currentStreak?: number;
};

type DashboardResponseLike = {
  age?: unknown;
  birth_year?: unknown;
  birthYear?: unknown;
  profile?: {
    birth_year?: unknown;
  };
  health_score?: unknown;
  today_health_score?: unknown;
  score?: unknown;
  heart_age?: unknown;
  vascular_age?: unknown;
  cardio_age?: unknown;
  current_point?: unknown;
  point?: unknown;
  points?: unknown;
  nickname?: unknown;
  user?: {
    age?: unknown;
    nickname?: unknown;
  };
  name?: unknown;
  character_stage?: unknown;
  next_update_days?: unknown;
};

type StoredUserLike = {
  age?: unknown;
  birth_year?: unknown;
  nickname?: unknown;
  name?: unknown;
};

const normalizeAge = (value: unknown) => {
  const age = Number(value);
  return Number.isFinite(age) && age > 0 ? age : null;
};

const calculateAgeFromBirthYear = (value: unknown) => {
  const birthYear = Number(value);
  if (!Number.isFinite(birthYear) || birthYear <= 1900) return null;
  return new Date().getFullYear() - birthYear + 1;
};

const asString = (value: unknown) =>
  typeof value === "string" && value.trim() ? value : null;

const extractArray = <T,>(res: unknown): T[] => {
  if (Array.isArray(res)) return res;
  if (!res || typeof res !== "object") return [];

  const source = res as {
    data?: unknown;
    items?: unknown;
    records?: unknown;
  };

  if (Array.isArray(source.data)) return source.data as T[];
  if (Array.isArray(source.items)) return source.items as T[];
  if (Array.isArray(source.records)) return source.records as T[];
  return [];
};

const buildRiskTags = (
  latestRecord: HealthRecordLike | null,
  latestAnalysis: AnalysisHistoryLike | null
) => {
  if (latestAnalysis?.top_risk_factors?.length) {
    return latestAnalysis.top_risk_factors.slice(0, 3);
  }

  if (!latestRecord) return ["건강 데이터 연동 중"];

  const tags: string[] = [];

  if (
    (latestRecord.systolic_bp ?? 0) >= 120 ||
    (latestRecord.diastolic_bp ?? 0) >= 80
  ) {
    tags.push("혈압 관리 필요");
  } else {
    tags.push("혈압 정상 범위");
  }

  if ((latestRecord.glucose ?? 0) >= 100) {
    tags.push("혈당 주의");
  } else if ((latestRecord.glucose ?? 0) > 0) {
    tags.push("혈당 양호");
  }

  if ((latestRecord.total_cholesterol ?? 0) >= 200) {
    tags.push("콜레스테롤 관리");
  }

  if ((latestRecord.smoke_yn ?? false) === true) {
    tags.push("흡연 관리");
  }

  if ((latestRecord.alcohol_yn ?? false) === true) {
    tags.push("음주 습관 점검");
  }

  if ((latestRecord.exercise_yn ?? false) === true) {
    tags.push("운동 실천 중");
  }

  return tags.length > 0 ? tags.slice(0, 3) : ["건강 데이터 연동 중"];
};

const getChallengeSummaryFromStore = () => {
  const challenges = (useChallengeStore.getState().challenges ??
    []) as ChallengeLike[];

  const todayChallenges = getTodayChecklistFromChallenges(challenges);
  const challengeProgress = todayChallenges.length
    ? Math.round(
        (todayChallenges.filter((item) => item.done).length /
          todayChallenges.length) *
          100
      )
    : 0;

  const streak = Math.max(
    0,
    ...challenges.map((challenge) => Number(challenge.currentStreak ?? 0))
  );

  return { streak, challengeProgress };
};

const buildDashboardViewData = (
  dashboard: DashboardResponseLike | null | undefined,
  latestRecord: HealthRecordLike | null,
  latestAnalysis: AnalysisHistoryLike | null,
  storedUser: StoredUserLike | null = null
): DashboardViewData => {
  const actualAge =
    normalizeAge(dashboard?.age) ??
    normalizeAge(dashboard?.user?.age) ??
    normalizeAge(storedUser?.age) ??
    calculateAgeFromBirthYear(
      dashboard?.birth_year ??
        dashboard?.birthYear ??
        dashboard?.profile?.birth_year ??
        storedUser?.birth_year
    );

  const healthScore = Number(
    dashboard?.health_score ?? dashboard?.today_health_score ?? dashboard?.score ?? 72
  );

  const heartAgeFromAnalysis =
    latestAnalysis?.cvd_age != null ? Number(latestAnalysis.cvd_age) : null;

  const heartAgeFromDashboard = Number(
    dashboard?.heart_age ??
      dashboard?.vascular_age ??
      dashboard?.cardio_age ??
      actualAge ??
      52
  );

  const heartAge =
    heartAgeFromAnalysis != null && Number.isFinite(heartAgeFromAnalysis)
      ? heartAgeFromAnalysis
      : heartAgeFromDashboard;

  const point = Number(
    dashboard?.current_point ?? dashboard?.point ?? dashboard?.points ?? 0
  );

  const nickname =
    asString(dashboard?.nickname) ??
    asString(dashboard?.user?.nickname) ??
    asString(storedUser?.nickname) ??
    asString(dashboard?.name) ??
    asString(storedUser?.name) ??
    "버디";

  const characterStage = Number(dashboard?.character_stage ?? 1);
  const nextUpdateDays = Number(dashboard?.next_update_days ?? 2);
  const riskTags = buildRiskTags(latestRecord, latestAnalysis);
  const { streak, challengeProgress } = getChallengeSummaryFromStore();

  return {
    nickname,
    point,
    healthScore,
    heartAge,
    actualAge,
    streak,
    characterStage,
    challengeProgress,
    nextUpdateDays,
    riskTags,
  };
};

const mockDashboardData: DashboardViewData = {
  nickname: "이형석",
  point: 1280,
  healthScore: 72,
  heartAge: 37,
  actualAge: 30,
  streak: 3,
  characterStage: 2,
  challengeProgress: 62,
  nextUpdateDays: 2,
  riskTags: ["혈압 관리 필요", "수면 습관 개선", "운동 실천 중"],
};

export default function DashboardPage() {
  const router = useRouter();
  const hydrated = useChallengeStore((state) => state.hydrated);

  const [isMock, setIsMock] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardViewData | null>(
    null
  );

  useEffect(() => {
    perfMark("dashboard:mounted");
  }, []);

  useEffect(() => {
    setIsMock(new URLSearchParams(window.location.search).get("mock") === "1");
  }, []);

  useEffect(() => {
    if (isMock === null) return;

    if (isMock) {
      setDashboardData(mockDashboardData);
      setChecking(false);
      return;
    }

    const init = async () => {
      let dataStarted = false;
      let ready = false;

      try {
        const isMockPreview =
          process.env.NODE_ENV === "development" &&
          new URLSearchParams(window.location.search).get("mock") === "1";

        if (isMockPreview) {
          setDashboardData(mockDashboardData);
          ready = true;
          return;
        }

        const token = storage.getAccessToken();

        if (!token) {
          router.replace("/login");
          return;
        }

        dataStarted = true;
        perfMark("dashboard:data:start");

        const [dashboardRes, healthRes, analysisRes] = await Promise.all([
          getDashboard(),
          getHealthRecords(),
          getAnalysisHistory().catch((error) => {
            console.warn("분석 이력 조회 실패:", error);
            return { items: [] };
          }),
        ]);

        const healthRecords = extractArray<HealthRecordLike>(healthRes);
        const latestRecord = healthRecords.length > 0 ? healthRecords[0] : null;

        if (!latestRecord) {
          router.replace("/input");
          return;
        }

        const latestAnalysis =
          Array.isArray(analysisRes?.items) && analysisRes.items.length > 0
            ? analysisRes.items[0]
            : null;

        const viewData = buildDashboardViewData(
          dashboardRes,
          latestRecord,
          latestAnalysis,
          storage.getUser?.()
        );

        setDashboardData(viewData);
        ready = true;
      } catch (error) {
        console.error("대시보드 초기화 실패:", error);
        router.replace("/input");
      } finally {
        if (dataStarted) {
          perfMark("dashboard:data:end");
          perfMeasure(
            "dashboard:data",
            "dashboard:data:start",
            "dashboard:data:end"
          );
        }

        if (ready) {
          perfMark("dashboard:ready");
        }

        setChecking(false);
      }
    };

    if (hydrated) {
      void init();
    }

    const unsubscribe = useChallengeStore.subscribe(() => {
      setDashboardData((prev) => {
        if (!prev) return prev;

        const { streak, challengeProgress } = getChallengeSummaryFromStore();

        return {
          ...prev,
          streak,
          challengeProgress,
        };
      });
    });

    return () => {
      unsubscribe();
    };
  }, [router, hydrated, isMock]);

  if (checking || isMock === null || (!hydrated && !isMock)) {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] items-center justify-center rounded-[32px] border border-white/40 bg-white/60 text-[#163126]/60 shadow-[0_18px_50px_rgba(46,125,91,0.08)] backdrop-blur-xl">
          대시보드 데이터를 불러오는 중이에요...
        </div>
      </AppShell>
    );
  }

  if (!dashboardData) return null;

  return (
    <AppShell>
      <DashboardScreen dashboardData={dashboardData} mock={isMock === true} />
    </AppShell>
  );
}
