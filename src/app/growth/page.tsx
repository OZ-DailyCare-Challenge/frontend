"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/src/components/AppShell";
import GrowthRecordScreen, {
  type GrowthRecordViewData,
  type GrowthBadgeSticker,
} from "@/src/components/GrowthRecordScreen";
import { getDashboard } from "@/src/api/user";
import { getHealthRecords } from "@/src/api/health";
import { getAnalysisHistory } from "@/src/api/analysis";
import { storage } from "@/src/utils/storage";
import { useChallengeStore } from "@/src/store/challenge-store";
import { getMyActiveChallenges } from "@/src/api/challenge";

type HealthRecord = {
  id?: number;
  record_id?: number;
  created_at?: string;
  recorded_at?: string;
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
  id?: number;
  record_id?: number;
  cvd_age?: number;
  created_at?: string;
};

type ChallengeLike = {
  id: number | string;
  title?: string;
  currentStreak?: number;
  status?: string;
  logs?: Array<boolean | null>;
};

const extractArray = (res: unknown): HealthRecord[] => {
  if (Array.isArray(res)) return res as HealthRecord[];

  if (res && typeof res === "object") {
    const obj = res as {
      data?: unknown;
      items?: unknown;
      records?: unknown;
    };

    if (Array.isArray(obj.data)) return obj.data as HealthRecord[];
    if (Array.isArray(obj.items)) return obj.items as HealthRecord[];
    if (Array.isArray(obj.records)) return obj.records as HealthRecord[];
  }

  return [];
};

const formatRecordDate = (value?: string) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
};

const toCalendarKey = (value?: string) => {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
};

const buildWeeklyChallenge = (challenges: ChallengeLike[]) => {
  const labels = ["월", "화", "수", "목", "금", "토", "일"];
  const today = new Date();
  const currentDay = today.getDay(); // 0=일, 1=월, ...

  const monday = new Date(today);
  const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  monday.setDate(today.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  return labels.map((label, index) => {
    const targetDate = new Date(monday);
    targetDate.setDate(monday.getDate() + index);

    const value =
      targetDate > today
        ? 0
        : challenges.reduce((count, challenge) => {
            const successCount = (challenge.logs ?? []).filter((log) => log === true).length;
            return count + successCount;
          }, 0);

    return {
      day: label,
      value: index === (currentDay === 0 ? 6 : currentDay - 1) ? value : 0,
    };
  });
};

const buildBadgesFromChallenges = (challenges: ChallengeLike[]) => {
  return challenges.map((challenge) => {
    const successCount = (challenge.logs ?? []).filter((log) => log === true).length;
    const earned = successCount > 0 || challenge.status === "done";

    return {
      name: challenge.title || "챌린지",
      icon: earned ? "🏅" : "🔒",
      earned,
    };
  });
};

const buildBadgeCalendar = (
  healthRecords: HealthRecord[],
  challenges: ChallengeLike[]
): GrowthBadgeSticker[] => {
  const sortedRecords = [...healthRecords].sort((a, b) => {
    const aTime = new Date(a.created_at ?? a.recorded_at ?? 0).getTime();
    const bTime = new Date(b.created_at ?? b.recorded_at ?? 0).getTime();
    return aTime - bTime;
  });

  const stickers: GrowthBadgeSticker[] = [];

  sortedRecords.forEach((record, index) => {
    const key = toCalendarKey(record.created_at ?? record.recorded_at);
    if (!key) return;

    const badges: { name: string; icon: string }[] = [];

    if (index === 0) badges.push({ name: "첫 기록", icon: "🌱" });
    if (record.exercise_yn === true) badges.push({ name: "운동 기록", icon: "💪" });
    if (record.smoke_yn === false) badges.push({ name: "금연 유지", icon: "🚭" });
    if (record.alcohol_yn === false) badges.push({ name: "절주 실천", icon: "💧" });

    if (
      typeof record.systolic_bp === "number" &&
      typeof record.diastolic_bp === "number" &&
      record.systolic_bp < 120 &&
      record.diastolic_bp < 80
    ) {
      badges.push({ name: "혈압 안정", icon: "🫀" });
    }

    if (typeof record.glucose === "number" && record.glucose < 100) {
      badges.push({ name: "혈당 안정", icon: "✨" });
    }

    if (badges.length === 0) return;

    stickers.push({
      date: key,
      badges,
    });
  });

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

  const challengeBadges: { name: string; icon: string }[] = [];
  challenges.forEach((challenge) => {
    const successCount = (challenge.logs ?? []).filter((log) => log === true).length;
    if (successCount > 0) {
      challengeBadges.push({
        name: challenge.title || "챌린지 실천",
        icon: "🏅",
      });
    }
  });

  if (challengeBadges.length > 0) {
    const existing = stickers.find((item) => item.date === todayKey);

    if (existing) {
      existing.badges.push(...challengeBadges.slice(0, 4));
    } else {
      stickers.push({
        date: todayKey,
        badges: challengeBadges.slice(0, 4),
      });
    }
  }

  return stickers;
};

const buildViewData = (
  dashboardRes: any,
  healthRecords: HealthRecord[],
  storedUser: any,
  challenges: ChallengeLike[],
  analysisItems: AnalysisHistoryLike[]
): GrowthRecordViewData => {
  const nickname =
    dashboardRes?.nickname ??
    dashboardRes?.user?.nickname ??
    storedUser?.nickname ??
    "버디";

  const profileImage =
    dashboardRes?.profile_image ??
    dashboardRes?.user?.profile_image ??
    storedUser?.profile_image ??
    "";

  const point = Number(
    dashboardRes?.current_point ??
      dashboardRes?.point ??
      dashboardRes?.points ??
      storedUser?.current_point ??
      0
  );

  const birthYear = Number(
    dashboardRes?.birth_year ??
      dashboardRes?.user?.birth_year ??
      storedUser?.birth_year
  );

  const actualAge =
    birthYear && birthYear > 1900 ? new Date().getFullYear() - birthYear : null;

  const sortedRecords = [...healthRecords].sort((a, b) => {
    const aTime = new Date(a.created_at ?? a.recorded_at ?? 0).getTime();
    const bTime = new Date(b.created_at ?? b.recorded_at ?? 0).getTime();
    return bTime - aTime;
  });

  const cardioAgeHistory = [...analysisItems]
    .filter(
      (item) => typeof item?.cvd_age === "number" && !!item?.created_at
    )
    .sort(
      (a, b) =>
        new Date(a.created_at ?? 0).getTime() -
        new Date(b.created_at ?? 0).getTime()
    )
    .map((item) => ({
      label: formatRecordDate(item.created_at),
      value: Number(item.cvd_age),
    }));

  const healthHistory = sortedRecords.map((record) => {
    const systolic = Number(record.systolic_bp ?? 0);
    const diastolic = Number(record.diastolic_bp ?? 0);
    const glucose = Number(record.glucose ?? 0);
    const cholesterol = Number(record.total_cholesterol ?? 0);

    const matchedAnalysis = analysisItems.find(
      (item) => item.record_id === (record.record_id ?? record.id)
    );

    return {
      date: formatRecordDate(record.created_at ?? record.recorded_at),
      bp: systolic > 0 && diastolic > 0 ? `${systolic}/${diastolic}` : "-",
      glucose: glucose > 0 ? glucose : "-",
      cholesterol: cholesterol > 0 ? cholesterol : "-",
      cardioAge:
        typeof matchedAnalysis?.cvd_age === "number"
          ? Number(matchedAnalysis.cvd_age)
          : null,
    };
  });

  const firstRecord = sortedRecords[sortedRecords.length - 1];
  const firstRecordDate = formatRecordDate(
    firstRecord?.created_at ?? firstRecord?.recorded_at
  );

  const streakDays = Math.max(
    0,
    ...challenges.map((challenge) => Number(challenge.currentStreak ?? 0))
  );

  const badges = buildBadgesFromChallenges(challenges);
  const earnedBadgeCount = badges.filter((badge) => badge.earned).length;
  const badgeCalendar = buildBadgeCalendar(sortedRecords, challenges);
  const weeklyChallenge = buildWeeklyChallenge(challenges);

  return {
    nickname,
    profileImage,
    point,
    actualAge,
    firstRecordLabel:
      firstRecordDate !== "-" ? `${firstRecordDate}부터 기록 중` : "건강 기록 연동 중",
    streakDays,
    badgeCount: earnedBadgeCount,
    cardioAgeHistory,
    healthHistory,
    weeklyChallenge,
    earnedBadgeCount,
    badges,
    badgeCalendar,
  };
};

export default function GrowthPage() {
  const router = useRouter();
  const hydrated = useChallengeStore((state) => state.hydrated);

  const [loading, setLoading] = useState(true);
  const [viewData, setViewData] = useState<GrowthRecordViewData | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const token = storage.getAccessToken();

        if (!token) {
          router.replace("/login");
          return;
        }

        const storedUser = storage.getUser?.();

        const [dashboardRes, healthRes, analysisRes, myActiveRes] = await Promise.all([
          getDashboard().catch(() => null),
          getHealthRecords().catch(() => []),
          getAnalysisHistory().catch(() => ({ items: [] })),
          getMyActiveChallenges().catch(() => ({ challenges: [] })),
        ]);

        // API 활성 챌린지를 ChallengeLike로 변환, 없으면 Zustand 스토어 폴백
        const apiChallenges: ChallengeLike[] = (myActiveRes.challenges ?? []).map((c) => ({
          id: c.challenge_id,
          title: c.title,
          currentStreak: c.current_streak,
          status: "in_progress",
          logs: [],
        }));
        const challenges: ChallengeLike[] = apiChallenges.length > 0
          ? apiChallenges
          : (useChallengeStore.getState().challenges ?? []) as ChallengeLike[];

        const records = extractArray(healthRes);
        if (records.length === 0) {
          router.replace("/input");
          return;
        }

        const analysisItems = Array.isArray(analysisRes?.items)
          ? analysisRes.items
          : [];

        const data = buildViewData(
          dashboardRes,
          records,
          storedUser,
          challenges,
          analysisItems
        );

        setViewData(data);
      } catch (error) {
        console.error("성장 기록 페이지 초기화 실패:", error);
        router.replace("/input");
      } finally {
        setLoading(false);
      }
    };

    if (hydrated) {
      void init();
    }

    const unsubscribe = useChallengeStore.subscribe((state) => {
      setViewData((prev) => {
        if (!prev) return prev;

        const challenges = (state.challenges ?? []) as ChallengeLike[];
        const badges = buildBadgesFromChallenges(challenges);
        const earnedBadgeCount = badges.filter((badge) => badge.earned).length;

        return {
          ...prev,
          streakDays: Math.max(
            0,
            ...challenges.map((challenge) => Number(challenge.currentStreak ?? 0))
          ),
          weeklyChallenge: buildWeeklyChallenge(challenges),
          badges,
          badgeCount: earnedBadgeCount,
          earnedBadgeCount,
        };
      });
    });

    return () => {
      unsubscribe();
    };
  }, [router, hydrated]);

  if (loading || !hydrated) {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] items-center justify-center rounded-[32px] border border-white/40 bg-white/60 text-[#163126]/60 shadow-[0_18px_50px_rgba(46,125,91,0.08)] backdrop-blur-xl">
          성장 기록을 불러오는 중이에요...
        </div>
      </AppShell>
    );
  }

  if (!viewData) return null;

  return (
    <AppShell>
      <GrowthRecordScreen data={viewData} />
    </AppShell>
  );
}