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

const extractArray = (res: any) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.items)) return res.items;
  if (Array.isArray(res?.records)) return res.records;
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
  const challenges = (useChallengeStore.getState().challenges ?? []) as any[];

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
  dashboard: any,
  latestRecord: HealthRecordLike | null,
  latestAnalysis: AnalysisHistoryLike | null
): DashboardViewData => {
  const currentYear = new Date().getFullYear();

  const birthYear = Number(
    dashboard?.birth_year ??
      dashboard?.birthYear ??
      dashboard?.profile?.birth_year
  );

  const actualAge =
    birthYear && birthYear > 1900 ? currentYear - birthYear : null;

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
    dashboard?.nickname ?? dashboard?.name ?? dashboard?.user?.nickname ?? "버디";

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

export default function DashboardPage() {
  const router = useRouter();
  const hydrated = useChallengeStore((state) => state.hydrated);

  const [checking, setChecking] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardViewData | null>(
    null
  );

  useEffect(() => {
    perfMark("dashboard:mounted");
  }, []);

  useEffect(() => {
    const init = async () => {
      let dataStarted = false;
      let ready = false;

      try {
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

        const healthRecords = extractArray(healthRes);
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
          latestAnalysis
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
  }, [router, hydrated]);

  if (checking || !hydrated) {
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
      <DashboardScreen dashboardData={dashboardData} />
    </AppShell>
  );
}
