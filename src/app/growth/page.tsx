"use client";

import { useEffect, useRef, useState } from "react";
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
  description?: string;
  currentStreak?: number;
  status?: string;
  logs?: Array<boolean | null>;
  lastSubmittedDate?: string | null;
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

const toDateKey = (date: Date) => {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
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

const buildWeeklyChallengeForChallenge = (challenge: ChallengeLike) => {
  const labels = ["월", "화", "수", "목", "금", "토", "일"];
  const today = new Date();
  const currentDay = today.getDay();
  const monday = new Date(today);
  const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  const successDates = new Set<string>();
  const logs = challenge.logs ?? [];
  const lastSubmittedDate = challenge.lastSubmittedDate;

  monday.setDate(today.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  if (lastSubmittedDate) {
    const lastDate = new Date(lastSubmittedDate);

    if (!Number.isNaN(lastDate.getTime())) {
      const lastFilledIndex = logs.reduce(
        (latestIndex, log, index) => (log !== null ? index : latestIndex),
        -1
      );

      if (lastFilledIndex !== -1) {
        logs.forEach((log, index) => {
          if (log !== true) return;

          const date = addDays(lastDate, index - lastFilledIndex);
          successDates.add(toDateKey(date));
        });
      }
    }
  }

  return labels.map((label, index) => {
    const targetDate = new Date(monday);
    targetDate.setDate(monday.getDate() + index);

    return {
      day: label,
      value: successDates.has(toDateKey(targetDate)) ? 1 : 0,
    };
  });
};

const buildChallengeSummaries = (challenges: ChallengeLike[]) => {
  return challenges
    .filter((challenge) => challenge.status !== "locked")
    .map((challenge) => ({
      id: String(challenge.id),
      title: challenge.title || "챌린지",
      description: challenge.description || "오늘 인증하고 기록을 이어가세요.",
      icon: getChallengeStickerIcon(challenge.title),
      weekly: buildWeeklyChallengeForChallenge(challenge),
    }));
};

const getChallengeStickerIcon = (title?: string) => {
  const value = title ?? "";

  if (value.includes("저염") || value.includes("나트륨")) return "🧂";
  if (value.includes("포화지방") || value.includes("지방")) return "🥗";
  if (value.includes("당")) return "🍬";
  if (value.includes("야식")) return "🌙";
  if (value.includes("유산소") || value.includes("운동")) return "👟";
  if (value.includes("걸") || value.includes("보")) return "🚶";
  if (value.includes("물")) return "💧";
  if (value.includes("식후")) return "🍃";

  return "✓";
};

const getChallengeSuccessDates = (challenges: ChallengeLike[]) => {
  const successDates = new Set<string>();

  challenges.forEach((challenge) => {
    const logs = challenge.logs ?? [];
    const lastSubmittedDate = challenge.lastSubmittedDate;
    if (!lastSubmittedDate) return;

    const lastDate = new Date(lastSubmittedDate);
    if (Number.isNaN(lastDate.getTime())) return;

    const lastFilledIndex = logs.reduce(
      (latestIndex, log, index) => (log !== null ? index : latestIndex),
      -1
    );

    if (lastFilledIndex === -1) return;

    logs.forEach((log, index) => {
      if (log !== true) return;

      const date = addDays(lastDate, index - lastFilledIndex);
      successDates.add(toDateKey(date));
    });
  });

  return successDates;
};

const getIntegratedStreakDays = (challenges: ChallengeLike[]) => {
  const sortedSuccessDates = [...getChallengeSuccessDates(challenges)]
    .map((key) => ({ key, time: new Date(key).getTime() }))
    .filter((item) => Number.isFinite(item.time))
    .sort((a, b) => a.time - b.time);

  if (sortedSuccessDates.length === 0) return 0;

  let streak = 1;

  for (let index = sortedSuccessDates.length - 1; index > 0; index -= 1) {
    const current = sortedSuccessDates[index];
    const previous = sortedSuccessDates[index - 1];

    if (current.time - previous.time !== 24 * 60 * 60 * 1000) break;

    streak += 1;
  }

  return streak;
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
  const challengeSuccessDates = getChallengeSuccessDates(challenges);

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

  challenges.forEach((challenge) => {
    const logs = challenge.logs ?? [];
    const lastSubmittedDate = challenge.lastSubmittedDate;
    if (!lastSubmittedDate) return;

    const lastDate = new Date(lastSubmittedDate);
    if (Number.isNaN(lastDate.getTime())) return;

    const lastFilledIndex = logs.reduce(
      (latestIndex, log, index) => (log !== null ? index : latestIndex),
      -1
    );

    if (lastFilledIndex === -1) return;

    logs.forEach((log, index) => {
      if (log !== true) return;

      const date = addDays(lastDate, index - lastFilledIndex);
      const key = toDateKey(date);

      const badge = {
        name: challenge.title || "챌린지 실천",
        icon: getChallengeStickerIcon(challenge.title),
      };

      const existing = stickers.find((item) => item.date === key);
      if (existing) {
        existing.badges.push(badge);
        return;
      }

      stickers.push({
        date: key,
        badges: [badge],
      });
    });
  });

  const sortedSuccessDates = [...challengeSuccessDates]
    .map((key) => ({ key, time: new Date(key).getTime() }))
    .filter((item) => Number.isFinite(item.time))
    .sort((a, b) => a.time - b.time);
  const streakDates = new Set<string>();
  let streakRun: typeof sortedSuccessDates = [];

  const flushStreakRun = () => {
    if (streakRun.length < 2) return;
    streakRun.forEach((item) => streakDates.add(item.key));
  };

  sortedSuccessDates.forEach((item) => {
    const previous = streakRun[streakRun.length - 1];

    if (
      previous &&
      item.time - previous.time !== 24 * 60 * 60 * 1000
    ) {
      flushStreakRun();
      streakRun = [];
    }

    streakRun.push(item);
  });
  flushStreakRun();

  streakDates.forEach((date) => {
    const existing = stickers.find((item) => item.date === date);
    if (existing) {
      existing.streak = true;
      return;
    }

    stickers.push({
      date,
      streak: true,
      badges: [],
    });
  });

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
    dashboardRes?.name ??
    dashboardRes?.user?.name ??
    storedUser?.name ??
    "버디";

  const profileImage =
    dashboardRes?.profile_image ??
    dashboardRes?.user?.profile_image ??
    storedUser?.profile_image ??
    dashboardRes?.picture ??
    dashboardRes?.user?.picture ??
    storedUser?.picture ??
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

  const streakDays = getIntegratedStreakDays(challenges);

  const badges = buildBadgesFromChallenges(challenges);
  const earnedBadgeCount = badges.filter((badge) => badge.earned).length;
  const badgeCalendar = buildBadgeCalendar(sortedRecords, challenges);
  const weeklyChallenge = buildWeeklyChallenge(challenges);
  const challengeItems = buildChallengeSummaries(challenges);

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
    challengeItems,
    earnedBadgeCount,
    badges,
    badgeCalendar,
  };
};

const mockGrowthData: GrowthRecordViewData = {
  nickname: "d",
  profileImage: "",
  point: 120,
  actualAge: 26,
  firstRecordLabel: "4월 30일부터 기록 중",
  streakDays: 3,
  badgeCount: 2,
  cardioAgeHistory: [
    { label: "4/1", value: 27 },
    { label: "4/8", value: 26 },
    { label: "4/15", value: 25 },
    { label: "4/22", value: 24 },
    { label: "4/30", value: 24 },
  ],
  healthHistory: [
    {
      date: "4월 30일",
      bp: "120/80",
      glucose: 90,
      cholesterol: 180,
      cardioAge: 24,
    },
  ],
  weeklyChallenge: [
    { day: "월", value: 1 },
    { day: "화", value: 1 },
    { day: "수", value: 0 },
    { day: "목", value: 0 },
    { day: "금", value: 0 },
    { day: "토", value: 0 },
    { day: "일", value: 0 },
  ],
  challengeItems: [
    {
      id: "1",
      title: "저염식",
      description: "나트륨 섭취를 줄이고 가볍게 식사해보세요.",
      icon: "🧂",
      weekly: [
        { day: "월", value: 1 },
        { day: "화", value: 1 },
        { day: "수", value: 0 },
        { day: "목", value: 0 },
        { day: "금", value: 0 },
        { day: "토", value: 0 },
        { day: "일", value: 0 },
      ],
    },
    {
      id: "2",
      title: "포화지방 줄이기",
      description: "튀김과 고지방 메뉴를 줄이는 챌린지예요.",
      icon: "🥗",
      weekly: [
        { day: "월", value: 0 },
        { day: "화", value: 1 },
        { day: "수", value: 0 },
        { day: "목", value: 0 },
        { day: "금", value: 0 },
        { day: "토", value: 0 },
        { day: "일", value: 0 },
      ],
    },
    {
      id: "3",
      title: "유산소 운동 20분",
      description: "가볍게 숨이 찰 정도로 20분 움직여보세요.",
      icon: "👟",
      weekly: [
        { day: "월", value: 0 },
        { day: "화", value: 0 },
        { day: "수", value: 0 },
        { day: "목", value: 0 },
        { day: "금", value: 0 },
        { day: "토", value: 0 },
        { day: "일", value: 0 },
      ],
    },
  ],
  earnedBadgeCount: 2,
  badges: [
    { name: "저염식", icon: "🧂", earned: true },
    { name: "포화지방 줄이기", icon: "🥗", earned: true },
    { name: "당류 줄이기", icon: "🍬", earned: false },
    { name: "야식 금지", icon: "🌙", earned: false },
    { name: "유산소 운동 20분", icon: "👟", earned: false },
    { name: "하루 7,000보", icon: "🚶", earned: false },
    { name: "식후 15분 걷기", icon: "🍃", earned: false },
    { name: "물 2L 마시기", icon: "💧", earned: false },
  ],
  badgeCalendar: [
    { date: "2026-5-1", badges: [{ name: "저염식", icon: "🧂" }] },
    {
      date: "2026-5-3",
      streak: true,
      badges: [{ name: "포화지방 줄이기", icon: "🥗" }],
    },
    {
      date: "2026-5-4",
      streak: true,
      badges: [
        { name: "저염식", icon: "🧂" },
        { name: "포화지방 줄이기", icon: "🥗" },
        { name: "유산소 운동 20분", icon: "👟" },
      ],
    },
    { date: "2026-4-29", badges: [{ name: "운동 기록", icon: "💪" }] },
    { date: "2026-4-30", badges: [{ name: "첫 기록", icon: "🌱" }] },
  ],
};

export default function GrowthPage() {
  const router = useRouter();
  const hydrated = useChallengeStore((state) => state.hydrated);
  const healthRecordsRef = useRef<HealthRecord[]>([]);

  const [loading, setLoading] = useState(true);
  const [viewData, setViewData] = useState<GrowthRecordViewData | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const isMockPreview =
          process.env.NODE_ENV === "development" &&
          new URLSearchParams(window.location.search).get("mock") === "1";

        if (isMockPreview) {
          setViewData(mockGrowthData);
          setLoading(false);
          return;
        }

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
        healthRecordsRef.current = records;
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
          streakDays: getIntegratedStreakDays(challenges),
          weeklyChallenge: buildWeeklyChallenge(challenges),
          challengeItems: buildChallengeSummaries(challenges),
          badges,
          badgeCalendar: buildBadgeCalendar(
            healthRecordsRef.current,
            challenges
          ),
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
