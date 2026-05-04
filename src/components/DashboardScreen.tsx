"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  Clock3,
  CalendarDays,
  Gift,
  Bell,
  Star,
  X,
  Heart,
  Moon,
  Footprints,
  Flame,
} from "lucide-react";
import { useChallengeStore } from "@/src/store/challenge-store";
import { getTodayChecklistFromChallenges } from "@/src/lib/challenge-utils";
import {
  getMyActiveChallenges,
  type Challenge as ApiChallenge,
  type MyActiveChallenge,
} from "@/src/api/challenge";
import { getFeed, getFriendRequests, type FeedItem } from "@/src/api/social";
import HealthGuidePanel from "@/src/components/dashboard/HealthGuidePanel";
import DashboardBottomBuddy from "@/src/components/dashboard/DashboardBottomBuddy";
import FriendAddModal from "@/src/components/social/FriendAddModal";
import FriendRequestModal from "@/src/components/social/FriendRequestModal";
import ProfileNameAvatar from "@/src/components/ProfileNameAvatar";

type ShopTab = "모자" | "옷/스카프" | "액세서리" | "배경";

type ShopItem = {
  id: number;
  tab: ShopTab;
  name: string;
  price: number;
  owned: boolean;
  equipped: boolean;
  emoji: string;
};


export type DashboardViewData = {
  nickname: string;
  point: number;
  healthScore: number;
  heartAge: number | null;
  actualAge: number | null;
  streak: number;
  characterStage: number;
  challengeProgress: number;
  nextUpdateDays: number;
  riskTags: string[];
};

type Props = {
  dashboardData: DashboardViewData;
  mock?: boolean;
};

type TodayHealthRecord = {
  heartRate: string;
  sleepHours: string;
  steps: string;
  stress: string;
};

type HeroReactionType = "none" | "success" | "streak";

const DASHBOARD_HERO_BG = "/images/skygreen.png";
const TODAY_HEALTH_RECORD_KEY = "dashboard:today-health-record";
const defaultTodayHealthRecord: TodayHealthRecord = {
  heartRate: "",
  sleepHours: "",
  steps: "",
  stress: "",
};

function loadTodayHealthRecord() {
  if (typeof window === "undefined") return defaultTodayHealthRecord;

  const raw = window.sessionStorage.getItem(TODAY_HEALTH_RECORD_KEY);
  if (!raw) return defaultTodayHealthRecord;

  try {
    return {
      ...defaultTodayHealthRecord,
      ...JSON.parse(raw),
    };
  } catch {
    window.sessionStorage.removeItem(TODAY_HEALTH_RECORD_KEY);
    return defaultTodayHealthRecord;
  }
}

function formatSteps(value: string) {
  const numeric = Number(value.replaceAll(",", ""));
  if (!Number.isFinite(numeric)) return value;
  return numeric.toLocaleString("ko-KR");
}

function getStressLabel(value: string) {
  if (!value) return "-";

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return value;
  if (numeric >= 70) return "높음";
  if (numeric >= 40) return "보통";
  return "낮음";
}

const feedCardVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
    scale: 0.96,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
    scale: 0.96,
  }),
};


const initialShopItems: ShopItem[] = [
  {
    id: 1,
    tab: "모자",
    name: "초록 비니",
    price: 0,
    owned: true,
    equipped: true,
    emoji: "🎩",
  },
  {
    id: 2,
    tab: "모자",
    name: "황금 왕관",
    price: 200,
    owned: false,
    equipped: false,
    emoji: "👑",
  },
  {
    id: 3,
    tab: "모자",
    name: "야구 모자",
    price: 0,
    owned: true,
    equipped: false,
    emoji: "🧢",
  },
  {
    id: 4,
    tab: "옷/스카프",
    name: "파란 스카프",
    price: 0,
    owned: true,
    equipped: true,
    emoji: "🧣",
  },
  {
    id: 5,
    tab: "옷/스카프",
    name: "졸업 망토",
    price: 300,
    owned: false,
    equipped: false,
    emoji: "🎓",
  },
  {
    id: 6,
    tab: "액세서리",
    name: "꽃 장식",
    price: 150,
    owned: false,
    equipped: false,
    emoji: "🌸",
  },
  {
    id: 7,
    tab: "액세서리",
    name: "반짝 별핀",
    price: 120,
    owned: false,
    equipped: false,
    emoji: "⭐",
  },
  {
    id: 8,
    tab: "배경",
    name: "숲속 배경",
    price: 180,
    owned: false,
    equipped: false,
    emoji: "🌿",
  },
];

function pickRandom(messages: string[]) {
  return messages[Math.floor(Math.random() * messages.length)];
}

const successBubbleMessages = [
  "우와, 오늘도 해냈네요!\n제가 다 뿌듯해요 🐹",
  "좋아요!\n제가 옆에서 보고 있었어요 ✨",
  "이번 것도 성공이에요!\n정말 잘하고 있어요 💚",
  "하나 더 채웠네요!\n제가 괜히 신나요 😊",
  "이 정도면 제가\n간식 드리고 싶어요 🌰",
];

const streakBubbleMessages = [
  "우와, 이건 정말\n대단한 흐름이에요! 🐹🔥",
  "계속 이어가고 있네요,\n제가 다 신나요",
  "이 정도면 루틴이\n되고 있는 거예요 ✨",
  "정말 잘하고 있어요.\n제가 괜히 뿌듯해요 💚",
  "버디가 박수 치고 있어요!\n짝짝 👏",
];

function getHeroReactionType({
  streak,
  totalCount,
  completedCount,
}: {
  streak: number;
  totalCount: number;
  completedCount: number;
}): HeroReactionType {
  if (streak >= 3) return "streak";
  if (totalCount > 0 && completedCount === totalCount) return "success";
  return "none";
}

function getHeroBubbleMessage(type: HeroReactionType) {
  if (type === "streak") return pickRandom(streakBubbleMessages);
  if (type === "success") return pickRandom(successBubbleMessages);
  return "";
}

const mockFeedItems: FeedItem[] = [
  {
    user_id: 1,
    nickname: "민지",
    profile_image: null,
    challenge_title: "물 8잔 마시기",
    log_date: "2026-05-04",
    current_streak: 4,
    created_at: "2026-05-04T09:20:00",
  },
  {
    user_id: 1,
    nickname: "민지",
    profile_image: null,
    challenge_title: "저염 식단 실천",
    log_date: "2026-05-04",
    current_streak: 3,
    created_at: "2026-05-04T12:10:00",
  },
  {
    user_id: 2,
    nickname: "준호",
    profile_image: null,
    challenge_title: "30분 걷기",
    log_date: "2026-05-04",
    current_streak: 5,
    created_at: "2026-05-04T18:30:00",
  },
  {
    user_id: 3,
    nickname: "서연",
    profile_image: null,
    challenge_title: "스트레칭하기",
    log_date: "2026-05-04",
    current_streak: 2,
    created_at: "2026-05-04T21:00:00",
  },
];

const mockServerChallenges: ApiChallenge[] = [
  {
    id: 1,
    category: "생활습관",
    title: "물 8잔 마시기",
    description: "하루 동안 물을 충분히 마셔요.",
    expected_effect: "혈액 순환과 컨디션 관리에 도움",
    verification_method: "checklist",
    target_risk_factors: "혈압",
    duration_days: 7,
    required_success_days: 5,
    user_challenge: {
      id: 101,
      status: "active",
      current_streak: 4,
      completed_at: new Date().toISOString(),
    },
  },
  {
    id: 2,
    category: "운동",
    title: "30분 걷기",
    description: "가볍게 걸으며 활동량을 채워요.",
    expected_effect: "심혈관 건강 관리",
    verification_method: "checklist",
    target_risk_factors: "운동 부족",
    duration_days: 14,
    required_success_days: 10,
    user_challenge: {
      id: 102,
      status: "active",
      current_streak: 2,
      completed_at: null,
    },
  },
];

export default function DashboardScreen({ dashboardData, mock = false }: Props) {
  const router = useRouter();
  const challenges = useChallengeStore((state) => state.challenges);
  const submitCheck = useChallengeStore((state) => state.submitCheck);

  const [cheeredKeys, setCheeredKeys] = useState<Set<string>>(new Set());
  const [shopOpen, setShopOpen] = useState(false);
  const [shopTab, setShopTab] = useState<ShopTab>("모자");
  const [points, setPoints] = useState(dashboardData.point);
  const [shopItems, setShopItems] = useState(initialShopItems);
  const [bubbleMessage, setBubbleMessage] = useState("");
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [myActiveChallenges, setMyActiveChallenges] = useState<MyActiveChallenge[]>([]);
  const [activeFeedIndex, setActiveFeedIndex] = useState(0);
  const [dragDirection, setDragDirection] = useState(0);
  const [guidePanelOpen, setGuidePanelOpen] = useState(true);
  const [friendAddOpen, setFriendAddOpen] = useState(false);
  const [friendRequestOpen, setFriendRequestOpen] = useState(false);
  const [friendActivityOpen, setFriendActivityOpen] = useState(false);
  const [friendRequestCount, setFriendRequestCount] = useState(0);
  const [healthRecordOpen, setHealthRecordOpen] = useState(false);
  const [todayHealthRecord, setTodayHealthRecord] = useState<TodayHealthRecord>(
    loadTodayHealthRecord
  );

  const healthRecordItems = useMemo(
    () => [
      {
        label: "심박수",
        value: todayHealthRecord.heartRate || "-",
        unit: "bpm",
        icon: Heart,
        color: "bg-[#fff0f0] text-[#e84d5b]",
      },
      {
        label: "수면",
        value: todayHealthRecord.sleepHours || "-",
        unit: "시간",
        icon: Moon,
        color: "bg-[#eef4ff] text-[#4f7ee8]",
      },
      {
        label: "걸음 수",
        value: todayHealthRecord.steps ? formatSteps(todayHealthRecord.steps) : "-",
        unit: "걸음",
        icon: Footprints,
        color: "bg-[#eef9f2] text-[#07955f]",
      },
      {
        label: "스트레스",
        value: getStressLabel(todayHealthRecord.stress),
        unit: todayHealthRecord.stress || "",
        icon: Flame,
        color: "bg-[#fff5e8] text-[#f09a24]",
      },
    ],
    [todayHealthRecord]
  );

  const handleSaveTodayHealthRecord = (record: TodayHealthRecord) => {
    setTodayHealthRecord(record);
    window.sessionStorage.setItem(
      TODAY_HEALTH_RECORD_KEY,
      JSON.stringify(record)
    );
    setHealthRecordOpen(false);
  };

  useEffect(() => {
    if (mock) {
      setFeedItems(mockFeedItems);
      return;
    }

    getFeed().then(setFeedItems).catch(() => {});
  }, [mock]);

  useEffect(() => {
    if (mock) {
      setFriendRequestCount(2);
      return;
    }

    const loadRequestCount = () => {
      getFriendRequests()
        .then((requests) => setFriendRequestCount(requests.length))
        .catch(() => {});
    };

    loadRequestCount();
    const interval = window.setInterval(loadRequestCount, 30000);

    return () => window.clearInterval(interval);
  }, [mock]);

  useEffect(() => {
    getMyActiveChallenges()
      .then((res) => setMyActiveChallenges(res.challenges ?? []))
      .catch(() => setMyActiveChallenges([]));
  }, []);

  const groupedFeedItems = useMemo(() => {
    const map = new Map<
      number,
      {
        user_id: number;
        nickname: string;
        profile_image?: string | null;
        challenges: FeedItem[];
      }
    >();

    feedItems.forEach((item) => {
      const existing = map.get(item.user_id);

      if (existing) {
        existing.challenges.push(item);
        return;
      }

      map.set(item.user_id, {
        user_id: item.user_id,
        nickname: item.nickname,
        profile_image: item.profile_image,
        challenges: [item],
      });
    });

    return Array.from(map.values());
  }, [feedItems]);

  const activeFeed = groupedFeedItems[activeFeedIndex] ?? null;

  const visibleFriends = useMemo(() => {
    if (groupedFeedItems.length <= 2) return groupedFeedItems;

    const previousIndex =
      (activeFeedIndex - 1 + groupedFeedItems.length) % groupedFeedItems.length;
    const nextIndex = (activeFeedIndex + 1) % groupedFeedItems.length;

    return [
      groupedFeedItems[previousIndex],
      groupedFeedItems[activeFeedIndex],
      groupedFeedItems[nextIndex],
    ];
  }, [activeFeedIndex, groupedFeedItems]);

  const handlePrevFeed = () => {
    setDragDirection(-1);
    setActiveFeedIndex((prev) =>
      groupedFeedItems.length
        ? (prev - 1 + groupedFeedItems.length) % groupedFeedItems.length
        : 0
    );
  };

  const handleNextFeed = () => {
    setDragDirection(1);
    setActiveFeedIndex((prev) =>
      groupedFeedItems.length ? (prev + 1) % groupedFeedItems.length : 0
    );
  };

  const todayChallenges = getTodayChecklistFromChallenges(challenges);
  const activeChallengeCount = myActiveChallenges.length;
  const completedTodayCount = 0;

  const dashboardChallengePercent = activeChallengeCount
    ? Math.round((completedTodayCount / activeChallengeCount) * 100)
    : 0;
  const completedCount = todayChallenges.filter((item) => item.done).length;
  const challengePercent = todayChallenges.length
    ? Math.round((completedCount / todayChallenges.length) * 100)
    : 0;

  const equippedItems = shopItems.filter((item) => item.equipped);

  const visibleShopItems = useMemo(
    () => shopItems.filter((item) => item.tab === shopTab),
    [shopItems, shopTab]
  );

  const heartAgeDiff =
    dashboardData.actualAge !== null && dashboardData.heartAge !== null
      ? dashboardData.heartAge - dashboardData.actualAge
      : null;
  const heartAgeStatus =
    heartAgeDiff === null
      ? "심혈관 나이 분석 데이터를 확인하고 있어요"
      : heartAgeDiff > 0
      ? `실제 나이보다 ${heartAgeDiff}세 높아요`
      : heartAgeDiff < 0
      ? `실제 나이보다 ${Math.abs(heartAgeDiff)}세 낮아요`
      : "실제 나이와 비슷한 수준이에요";

  const heroReactionType = useMemo(
    () =>
      getHeroReactionType({
        streak: dashboardData.streak,
        totalCount: todayChallenges.length,
        completedCount,
      }),
    [dashboardData.streak, todayChallenges.length, completedCount]
  );

  useEffect(() => {
    if (heroReactionType === "none") {
      setBubbleMessage("");
      return;
    }

    setBubbleMessage(getHeroBubbleMessage(heroReactionType));

    const timer = window.setTimeout(() => {
      setBubbleMessage("");
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [heroReactionType]);

  const handleCheer = (key: string) => {
    setCheeredKeys((prev) => new Set(prev).add(key));
  };

  const handleEquip = (target: ShopItem) => {
    if (!target.owned) return;

    setShopItems((prev) =>
      prev.map((item) =>
        item.tab === target.tab
          ? { ...item, equipped: item.id === target.id }
          : item
      )
    );
  };

  const handleUnequip = (target: ShopItem) => {
    setShopItems((prev) =>
      prev.map((item) =>
        item.id === target.id ? { ...item, equipped: false } : item
      )
    );
  };

  const handleBuy = (target: ShopItem) => {
    if (target.owned || points < target.price) return;

    setPoints((prev) => prev - target.price);
    setShopItems((prev) =>
      prev.map((item) =>
        item.id === target.id ? { ...item, owned: true } : item
      )
    );
  };

  return (
    <>
      <section
        className={`mx-auto grid w-full max-w-7xl min-w-0 gap-6 overflow-hidden transition-[grid-template-columns] duration-300 ${
          guidePanelOpen
            ? "min-[1800px]:grid-cols-[minmax(0,1fr)_340px]"
            : "min-[1800px]:grid-cols-[minmax(0,1fr)_64px]"
        }`}
      >
        <div className="min-w-0 space-y-6">
          <div className="grid min-w-0 items-start gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr))]">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-[28px] border border-white/20 shadow-[0_18px_50px_rgba(20,42,31,0.12)]"
            >
              <img
                src={DASHBOARD_HERO_BG}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-[rgba(15,45,30,0.28)]" />

              <div className="relative z-10 flex min-h-[620px] flex-col p-5 text-white md:p-7">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d7f6df]">
                    buddy & today
                  </p>

                  <div className="shrink-0 rounded-full border border-[#f6d8a6]/50 bg-[#fff6e8] px-4 py-2 text-xs font-semibold text-[#c67800]">
                    🔥{" "}
                    {dashboardData.streak > 0
                      ? `${dashboardData.streak}일 연속 달성 중`
                      : "오늘부터 시작"}
                  </div>
                </div>

                <div className="relative mt-8 flex flex-1 items-center justify-center">
                  <AnimatePresence>
                    {bubbleMessage && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        className="absolute top-0 left-1/2 z-20 w-[min(260px,90%)] -translate-x-1/2 rounded-[24px] border border-white/18 bg-white/14 px-4 py-3 text-center text-sm font-medium leading-6 text-white shadow-[0_18px_36px_rgba(22,49,38,0.10)] backdrop-blur-md"
                      >
                        <span className="whitespace-pre-line">
                          {bubbleMessage}
                        </span>
                        <span className="absolute bottom-[-10px] left-1/2 h-5 w-5 -translate-x-1/2 rotate-45 rounded-[4px] border-r border-b border-white/14 bg-white/14 backdrop-blur-md" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="relative mt-12 flex aspect-square w-full max-w-[280px] items-center justify-center overflow-hidden rounded-[30px] border border-white/16 bg-white/8 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-sm">
                    <div className="absolute inset-4 rounded-[24px] border border-white/12" />
                    <div className="absolute left-6 top-6 h-3 w-3 rounded-full bg-white/35" />
                    <div className="absolute right-6 top-6 h-3 w-3 rounded-full bg-white/18" />
                    <div className="absolute bottom-6 left-6 h-3 w-3 rounded-full bg-white/18" />
                    <div className="absolute bottom-6 right-6 h-3 w-3 rounded-full bg-white/35" />

                    <div className="relative z-10 flex h-full items-center justify-center">
                      <BuddyCharacter
                        reactionType={heroReactionType}
                        hatEmoji={
                          equippedItems.find((item) => item.tab === "모자")
                            ?.emoji ?? ""
                        }
                        scarfEmoji={
                          equippedItems.find(
                            (item) => item.tab === "옷/스카프"
                          )?.emoji ?? ""
                        }
                        accessoryEmoji={
                          equippedItems.find(
                            (item) => item.tab === "액세서리"
                          )?.emoji ?? ""
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px] lg:items-end">
                  <div className="min-w-0 rounded-[22px] border border-white/12 bg-white/10 px-4 py-4 backdrop-blur-sm">
                    <div className="flex items-end gap-2">
                      <span className="text-4xl font-bold md:text-5xl">-</span>
                      <span className="pb-1 text-sm text-white/75">
                        점 · 오늘의 건강 점수
                      </span>
                    </div>

                    <p className="mt-3 text-xs text-white/70">
                      추후 건강 데이터 기반으로 표시될 예정이에요
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2 text-sm text-white/80">
                      {dashboardData.riskTags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-white/14 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex min-w-0 flex-col gap-3">
                    <div className="rounded-[20px] border border-white/12 bg-white/12 px-4 py-4 backdrop-blur-sm">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d7f6df]">
                        보유 포인트
                      </p>
                      <p className="mt-2 text-2xl font-bold">{points}P</p>
                    </div>

                    <button
                      onClick={() => setShopOpen(true)}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-semibold text-[#163126] transition hover:bg-[#f4fbf6]"
                    >
                      <ShoppingBag size={16} />
                      꾸미기
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="min-w-0 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 }}
                className="self-start rounded-[28px] border border-[#163126]/8 bg-white/82 p-5 shadow-[0_18px_50px_rgba(46,125,91,0.06)]"
              >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#2E7D5B]">
                    심혈관 나이
                  </p>
                  <div className="mt-2 flex items-end gap-2">
                    <span className="text-6xl font-black leading-none text-[#2E7D5B]">
                      {dashboardData.heartAge ?? "-"}
                    </span>
                    <span className="pb-2 text-base font-bold text-[#163126]/55">
                      세
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[#163126]/58">
                    실제 나이 {dashboardData.actualAge ?? "-"}세 기준
                  </p>
                </div>

                {heartAgeDiff !== null && (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      heartAgeDiff > 0
                        ? "bg-[#fff0f0] text-[#d24c4c]"
                        : heartAgeDiff < 0
                        ? "bg-[#ecf9f1] text-[#2E7D5B]"
                        : "bg-[#eef4ff] text-[#4f7ee8]"
                    }`}
                  >
                    {heartAgeDiff > 0
                      ? `+${heartAgeDiff}세`
                      : heartAgeDiff < 0
                      ? `${heartAgeDiff}세`
                      : "동일"}
                  </span>
                )}
              </div>

              <div
                className={`mt-5 rounded-[22px] px-4 py-3 text-sm font-bold ${
                  heartAgeDiff === null
                    ? "bg-[#f8fbf8] text-[#163126]/58"
                    : heartAgeDiff > 0
                    ? "bg-[#fff0f0] text-[#d24c4c]"
                    : heartAgeDiff < 0
                    ? "bg-[#eef9f2] text-[#2E7D5B]"
                    : "bg-[#eef4ff] text-[#4f7ee8]"
                }`}
              >
                {heartAgeStatus}
              </div>

              <div className="mt-5 space-y-3">
                <InfoMiniRow
                  icon={<Clock3 size={16} />}
                  text={`다음 수치 업데이트까지 ${dashboardData.nextUpdateDays}일 남았어요`}
                />
                <InfoMiniRow
                  icon={<CalendarDays size={16} />}
                  text="건강 수치 개선을 위한 루틴을 이어가고 있어요"
                />
              </div>

              <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-[#163126]/8">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#8ce7a7,#b7f3c9)]"
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(100, dashboardData.challengeProgress)
                    )}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-[#163126]/52">
                {dashboardData.challengeProgress}% 달성
              </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="rounded-[28px] border border-[#163126]/8 bg-white/82 p-5 shadow-[0_18px_50px_rgba(46,125,91,0.06)]"
              >
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#2E7D5B]">
                      오늘의 건강 기록
                    </p>
                    <p className="mt-1 text-xs text-[#163126]/55">
                      매일 기록하는 건강 루틴이에요
                    </p>
                  </div>
                  <button
                    onClick={() => setHealthRecordOpen(true)}
                    className="shrink-0 rounded-full bg-[#07955f] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#08794f]"
                  >
                    입력
                  </button>
                </div>

                <div className="grid min-w-0 grid-cols-1 gap-3">
                  {healthRecordItems.map((item) => (
                    <div
                      key={item.label}
                      className="flex min-w-0 items-center gap-3 rounded-[22px] border border-[#163126]/8 bg-[#fbfdfb] px-4 py-4"
                    >
                      <span
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] ${item.color}`}
                      >
                        <item.icon size={22} fill="currentColor" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-[#163126]/58">
                          {item.label}
                        </p>
                        <div className="mt-1 flex min-w-0 flex-wrap items-end gap-x-1 gap-y-0.5">
                          <span className="break-keep text-2xl font-bold text-[#163126]">
                            {item.value}
                          </span>
                          <span className="shrink-0 pb-1 text-xs font-medium text-[#6f7d73]">
                            {item.unit}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>

          <div className="min-w-0">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-[28px] border border-[#163126]/8 bg-white/82 p-5 shadow-[0_18px_50px_rgba(46,125,91,0.06)]"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#163126]">
                    오늘의 할 일
                  </p>
                  <p className="mt-1 text-xs text-[#163126]/55">
                    {completedTodayCount}/{activeChallengeCount} 완료
                  </p>
                </div>
                <span className="rounded-full bg-[#eff8df] px-3 py-1 text-xs font-semibold text-[#6a8c1e]">
                  {dashboardChallengePercent}% 달성
                </span>
              </div>

              <div className="mb-4 h-2.5 overflow-hidden rounded-full bg-[#163126]/8">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#8ce7a7,#b7f3c9)] transition-all"
                  style={{ width: `${dashboardChallengePercent}%` }}
                />
              </div>

              <div className="space-y-3">
                {myActiveChallenges.length === 0 ? (
                  <div className="rounded-2xl bg-[#f8fbf8] px-4 py-5 text-sm text-[#163126]/50">
                    진행 중인 챌린지가 없어요.
                  </div>
                ) : (
                  myActiveChallenges.slice(0, 3).map((challenge) => (
                    <div
                      key={challenge.user_challenge_id}
                      className="flex w-full items-center justify-between rounded-2xl border border-[#163126]/8 bg-[#fbfdfb] px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-[#163126]">
                          {challenge.title}
                        </p>
                        <p className="mt-1 text-xs text-[#163126]/45">
                          {challenge.current_streak}일 연속 진행 중
                        </p>
                      </div>
                      <span className="rounded-full bg-[#ecf9f1] px-3 py-1 text-xs font-semibold text-[#2E7D5B]">
                        진행중
                      </span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 }}
            className="rounded-[28px] border border-[#163126]/8 bg-white/82 p-5 shadow-[0_18px_50px_rgba(46,125,91,0.06)]"
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#163126]">친구 활동</p>
                <p className="mt-1 text-xs text-[#163126]/55">
                  친구들의 챌린지 인증 소식을 확인해보세요
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFriendRequestOpen(true)}
                  className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[#dce9e0] bg-white text-[#2E7D5B] transition hover:bg-[#f4fbf6]"
                  aria-label="받은 친구 요청 확인"
                >
                  <Bell size={16} />
                  {friendRequestCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {friendRequestCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setFriendAddOpen(true)}
                  className="rounded-full border border-[#dce9e0] bg-white px-3 py-2 text-xs font-semibold text-[#2E7D5B] transition hover:bg-[#f4fbf6]"
                >
                  친구 추가 +
                </button>
              </div>
            </div>

            {groupedFeedItems.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-[24px] bg-[#f8fbf8] px-5 py-10 text-center">
                <img
                  src="/images/buddy-friend.png"
                  alt=""
                  className="h-28 w-28 object-contain"
                />
                <p className="text-sm font-semibold text-[#163126]">
                  아직 친구 활동이 없어요
                </p>
                <p className="text-xs text-[#163126]/45">
                  친구가 챌린지를 인증하면 여기에 표시돼요.
                </p>
              </div>
            ) : (
              <div>
                <div className="mb-5 flex gap-4 overflow-x-auto scroll-smooth px-1 pb-3 pt-1 scrollbar-hide cursor-grab active:cursor-grabbing">
                  {groupedFeedItems.map((friend, index) => {
                    const active = index === activeFeedIndex;

                    return (
                      <button
                        key={friend.user_id}
                        onClick={() => {
                          setDragDirection(index > activeFeedIndex ? 1 : -1);
                          setActiveFeedIndex(index);
                        }}
                        className="flex shrink-0 flex-col items-center gap-2"
                      >
                        <div
                          className={`rounded-full transition ${
                            active
                              ? "ring-2 ring-[#2E7D5B] ring-offset-2"
                              : "opacity-70 hover:opacity-100"
                          }`}
                        >
                          <ProfileNameAvatar
                            name={friend.nickname}
                            image={friend.profile_image}
                            className="h-14 w-14"
                            textClassName="text-[10px]"
                          />
                        </div>

                        <span className="max-w-[64px] truncate text-xs font-medium text-[#163126]">
                          {friend.nickname}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="relative overflow-hidden">
                  <AnimatePresence mode="wait" custom={dragDirection}>
                    {visibleFriends.length > 0 && (
                      <motion.div
                        key={activeFeed?.user_id ?? activeFeedIndex}
                        custom={dragDirection}
                        variants={feedCardVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                          x: { type: "spring", stiffness: 280, damping: 28 },
                          opacity: { duration: 0.18 },
                          scale: { duration: 0.2 },
                        }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.18}
                        onDragEnd={(_, info) => {
                          if (info.offset.x < -70) handleNextFeed();
                          if (info.offset.x > 70) handlePrevFeed();
                        }}
                        className="grid min-w-0 gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr))]"
                      >
                        {visibleFriends.map((friend) => {
                          const cheerKey = `feed-${friend.user_id}`;
                          const cheered = cheeredKeys.has(cheerKey);

                          return (
                            <div
                              key={`visible-${friend.user_id}`}
                              className="rounded-[26px] border border-[#163126]/8 bg-white p-5 shadow-[0_14px_36px_rgba(46,125,91,0.06)]"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-3">
                                  <ProfileNameAvatar
                                    name={friend.nickname}
                                    image={friend.profile_image}
                                    className="h-12 w-12"
                                    textClassName="text-[10px]"
                                  />

                                  <div>
                                    <p className="text-sm font-bold text-[#163126]">
                                      {friend.nickname}
                                    </p>
                                    <p className="mt-1 text-xs text-[#163126]/45">
                                      오늘 인증 완료
                                    </p>
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleCheer(cheerKey)}
                                  disabled={cheered}
                                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                                    cheered
                                      ? "cursor-default bg-[#ecf9f1] text-[#2E7D5B]"
                                      : "bg-[#163126] text-white hover:bg-[#1d4232]"
                                  }`}
                                >
                                  {cheered ? "응원 완료" : "응원하기"}
                                </button>
                              </div>

                              <div className="mt-5 rounded-[22px] bg-[#f8fbf8] px-4 py-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2E7D5B]">
                                  today challenge
                                </p>

                                <div className="mt-3 space-y-2">
                                  {friend.challenges.slice(0, 2).map((challenge) => (
                                    <div
                                      key={`${challenge.user_id}-${challenge.challenge_title}-${challenge.created_at}`}
                                      className="flex items-center justify-between gap-3 rounded-2xl bg-white px-3 py-3"
                                    >
                                      <span className="min-w-0 truncate text-sm font-semibold text-[#163126]">
                                        {challenge.challenge_title}
                                      </span>

                                      <span className="shrink-0 rounded-full bg-[#ecf9f1] px-3 py-1 text-xs font-semibold text-[#2E7D5B]">
                                        {challenge.current_streak}일
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {groupedFeedItems.length > 3 && (
                  <div className="mt-4 flex justify-center gap-2">
                    {groupedFeedItems.map((friend, index) => (
                      <button
                        key={`dot-${friend.user_id}`}
                        onClick={() => {
                          setDragDirection(index > activeFeedIndex ? 1 : -1);
                          setActiveFeedIndex(index);
                        }}
                        className={`h-2 rounded-full transition-all ${
                          index === activeFeedIndex
                            ? "w-5 bg-[#2E7D5B]"
                            : "w-2 bg-[#d8e6dd]"
                        }`}
                      />
                    ))}
                  </div>
                )}

                <div className="mt-5 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setFriendActivityOpen(true)}
                    className="rounded-full border border-[#dce9e0] bg-white px-5 py-2.5 text-xs font-bold text-[#2E7D5B] transition hover:-translate-y-0.5 hover:bg-[#f4fbf6]"
                  >
                    전체보기
                  </button>
                </div>
              </div>
            )}
          </motion.div>

          <DashboardBottomBuddy />
        </div>

        <HealthGuidePanel
          isOpen={guidePanelOpen}
          onToggle={() => setGuidePanelOpen((prev) => !prev)}
        />
      </section>

      <FriendAddModal
        open={friendAddOpen}
        onClose={() => setFriendAddOpen(false)}
      />

      <FriendRequestModal
        open={friendRequestOpen}
        onClose={() => setFriendRequestOpen(false)}
        onChanged={setFriendRequestCount}
      />
      <FriendActivityModal
        open={friendActivityOpen}
        onClose={() => setFriendActivityOpen(false)}
        friends={groupedFeedItems}
        onCheer={handleCheer}
        cheeredKeys={cheeredKeys}
      />

      <HealthRecordInputModal
        open={healthRecordOpen}
        value={todayHealthRecord}
        onClose={() => setHealthRecordOpen(false)}
        onSave={handleSaveTodayHealthRecord}
      />

      <AnimatePresence>
        {shopOpen && (
          <ShopModal
            points={points}
            tab={shopTab}
            onTabChange={setShopTab}
            items={visibleShopItems}
            equippedItems={equippedItems}
            onClose={() => setShopOpen(false)}
            onEquip={handleEquip}
            onUnequip={handleUnequip}
            onBuy={handleBuy}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function BuddyCharacter({
  reactionType,
  hatEmoji,
  scarfEmoji,
  accessoryEmoji,
}: {
  reactionType: HeroReactionType;
  hatEmoji: string;
  scarfEmoji: string;
  accessoryEmoji: string;
}) {
  const isJumping = reactionType === "success" || reactionType === "streak";
  const jumpHeight = reactionType === "streak" ? -20 : -10;

  return (
    <motion.div
      animate={
        isJumping
          ? {
              y: [0, jumpHeight, 0, jumpHeight / 2, 0],
            }
          : {
              y: [0, -2, 0],
            }
      }
      transition={
        isJumping
          ? {
              duration: reactionType === "streak" ? 1.0 : 0.7,
              ease: "easeInOut",
              repeat: 1,
            }
          : {
              duration: 3.2,
              ease: "easeInOut",
              repeat: Infinity,
            }
      }
      className="relative flex h-[180px] w-[140px] items-center justify-center"
    >
      <div className="relative h-[140px] w-[120px]">
        <div className="absolute left-2 top-2 h-9 w-9 rounded-full bg-[#ffb6b6]" />
        <div className="absolute right-2 top-2 h-9 w-9 rounded-full bg-[#ffb6b6]" />

        <div className="absolute left-3 top-3 h-6 w-6 rounded-full bg-[#ffd7d7]" />
        <div className="absolute right-3 top-3 h-6 w-6 rounded-full bg-[#ffd7d7]" />

        <div className="absolute inset-x-0 top-6 mx-auto h-[110px] w-[110px] rounded-full bg-[radial-gradient(circle_at_35%_30%,#ffd7b8_0%,#f7b48d_52%,#e68b5e_100%)] shadow-[0_10px_20px_rgba(22,49,38,0.08)]" />

        <motion.div
          animate={{ scaleY: [1, 1, 1, 0.15, 1, 1] }}
          transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-[30px] top-[56px] h-4 w-4 rounded-full bg-[#2b1f1a]"
          style={{ transformOrigin: "center center" }}
        />
        <motion.div
          animate={{ scaleY: [1, 1, 1, 0.15, 1, 1] }}
          transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute right-[30px] top-[56px] h-4 w-4 rounded-full bg-[#2b1f1a]"
          style={{ transformOrigin: "center center" }}
        />

        <div className="absolute left-[26px] top-[52px] h-7 w-7 rounded-full border-2 border-white/50" />
        <div className="absolute right-[26px] top-[52px] h-7 w-7 rounded-full border-2 border-white/50" />

        <div className="absolute left-[47px] top-[80px] h-3 w-3 rounded-full bg-[#8d5b4d]" />
        <div className="absolute right-[47px] top-[80px] h-3 w-3 rounded-full bg-[#8d5b4d]" />
        <div className="absolute left-1/2 top-[78px] h-4 w-4 -translate-x-1/2 rounded-full bg-[#ff8e9a]" />

        <div className="absolute left-1/2 top-[92px] h-3 w-6 -translate-x-1/2 rounded-b-full border-b-2 border-[#6c3d38]" />
        <div className="absolute left-[50px] top-[100px] h-5 w-2 rotate-12 rounded-full bg-[#ff8aa0]" />
        <div className="absolute right-[50px] top-[100px] h-5 w-2 -rotate-12 rounded-full bg-[#ff8aa0]" />

        {hatEmoji && (
          <span className="absolute right-[2px] top-[18px] text-3xl">
            {hatEmoji}
          </span>
        )}
        {scarfEmoji && (
          <span className="absolute left-[-8px] bottom-[8px] text-2xl">
            {scarfEmoji}
          </span>
        )}
        {accessoryEmoji && (
          <span className="absolute right-[6px] bottom-[10px] text-xl">
            {accessoryEmoji}
          </span>
        )}
      </div>
    </motion.div>
  );
}

function InfoMiniRow({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-[#f8fbf8] px-3 py-3 text-sm text-[#163126]/72">
      <span className="text-[#2E7D5B]">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function HealthRecordInputModal({
  open,
  value,
  onClose,
  onSave,
}: {
  open: boolean;
  value: TodayHealthRecord;
  onClose: () => void;
  onSave: (record: TodayHealthRecord) => void;
}) {
  const [draft, setDraft] = useState<TodayHealthRecord>(value);

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  if (!open) return null;

  const updateField = (field: keyof TodayHealthRecord, nextValue: string) => {
    setDraft((prev) => ({
      ...prev,
      [field]: nextValue,
    }));
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#163126]/28 px-4 py-6 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <section className="relative z-10 w-full max-w-lg overflow-hidden rounded-[28px] border border-[#163126]/10 bg-white shadow-[0_28px_90px_rgba(22,49,38,0.22)]">
        <div className="flex items-center justify-between gap-4 border-b border-[#163126]/8 px-5 py-5">
          <div>
            <h2 className="text-lg font-bold text-[#163126]">
              오늘의 건강 기록
            </h2>
            <p className="mt-1 text-sm text-[#163126]/55">
              입력한 값은 현재 브라우저 세션에만 저장돼요.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#163126]/10 text-[#163126] transition hover:bg-[#f6faf7]"
            aria-label="건강 기록 입력 닫기"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
          <HealthInputField
            label="심박수"
            unit="bpm"
            value={draft.heartRate}
            onChange={(nextValue) => updateField("heartRate", nextValue)}
          />
          <HealthInputField
            label="수면"
            unit="시간"
            value={draft.sleepHours}
            step="0.1"
            onChange={(nextValue) => updateField("sleepHours", nextValue)}
          />
          <HealthInputField
            label="걸음 수"
            unit="걸음"
            value={draft.steps}
            onChange={(nextValue) => updateField("steps", nextValue)}
          />
          <HealthInputField
            label="스트레스"
            unit="0-100"
            value={draft.stress}
            onChange={(nextValue) => updateField("stress", nextValue)}
          />
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[#163126]/8 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#163126]/10 px-5 py-3 text-sm font-semibold text-[#163126]"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => onSave(draft)}
            className="rounded-full bg-[#07955f] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#08794f]"
          >
            저장하기
          </button>
        </div>
      </section>
    </div>
  );
}

function HealthInputField({
  label,
  unit,
  value,
  step = "1",
  onChange,
}: {
  label: string;
  unit: string;
  value: string;
  step?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block rounded-[22px] border border-[#163126]/8 bg-[#fbfdfb] px-4 py-4">
      <span className="text-sm font-bold text-[#163126]">{label}</span>
      <div className="mt-3 flex items-center gap-2">
        <input
          type="number"
          min="0"
          step={step}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 min-w-0 flex-1 rounded-2xl border border-[#163126]/10 bg-white px-3 text-sm font-semibold text-[#163126] outline-none focus:border-[#2E7D5B]/50"
        />
        <span className="shrink-0 text-xs font-semibold text-[#163126]/48">
          {unit}
        </span>
      </div>
    </label>
  );
}

type GroupedFeedFriend = {
  user_id: number;
  nickname: string;
  profile_image?: string | null;
  challenges: FeedItem[];
};

function FriendActivityModal({
  open,
  onClose,
  friends,
  onCheer,
  cheeredKeys,
}: {
  open: boolean;
  onClose: () => void;
  friends: GroupedFeedFriend[];
  onCheer: (key: string) => void;
  cheeredKeys: Set<string>;
}) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#163126]/28 px-4 py-6 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <section className="relative z-10 flex max-h-[86vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-[#163126]/10 bg-white shadow-[0_28px_90px_rgba(22,49,38,0.22)]">
        <div className="flex items-center justify-between gap-4 border-b border-[#163126]/8 px-5 py-5">
          <div>
            <h2 className="text-lg font-bold text-[#163126]">
              친구 활동 전체보기
            </h2>
            <p className="mt-1 text-sm text-[#163126]/55">
              친구들의 오늘 챌린지 인증 기록을 모아봤어요.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#163126]/10 text-[#163126] transition hover:bg-[#f6faf7]"
            aria-label="친구 활동 전체보기 닫기"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-[320px] overflow-auto px-5 py-5">
          {friends.length === 0 ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[24px] bg-[#f8fbf8] px-5 py-10 text-center">
              <img
                src="/images/buddy-friend.png"
                alt=""
                className="h-24 w-24 object-contain"
              />
              <p className="mt-3 text-sm font-semibold text-[#163126]">
                아직 친구 활동이 없어요
              </p>
              <p className="mt-1 text-xs text-[#163126]/45">
                친구가 챌린지를 인증하면 여기에 표시돼요.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {friends.map((friend) => {
                const cheerKey = `feed-${friend.user_id}`;
                const cheered = cheeredKeys.has(cheerKey);

                return (
                  <div
                    key={`all-feed-${friend.user_id}`}
                    className="rounded-[26px] border border-[#163126]/8 bg-[#fbfdfb] p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <ProfileNameAvatar
                          name={friend.nickname}
                          image={friend.profile_image}
                          className="h-12 w-12"
                          textClassName="text-[10px]"
                        />

                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-[#163126]">
                            {friend.nickname}
                          </p>
                          <p className="mt-1 text-xs text-[#163126]/45">
                            오늘 인증 {friend.challenges.length}개
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onCheer(cheerKey)}
                        disabled={cheered}
                        className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${
                          cheered
                            ? "cursor-default bg-[#ecf9f1] text-[#2E7D5B]"
                            : "bg-[#163126] text-white hover:bg-[#1d4232]"
                        }`}
                      >
                        {cheered ? "응원 완료" : "응원하기"}
                      </button>
                    </div>

                    <div className="mt-5 space-y-2">
                      {friend.challenges.map((challenge) => (
                        <div
                          key={`all-${challenge.user_id}-${challenge.challenge_title}-${challenge.created_at}`}
                          className="rounded-2xl bg-white px-4 py-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="min-w-0 truncate text-sm font-semibold text-[#163126]">
                              {challenge.challenge_title}
                            </span>
                            <span className="shrink-0 rounded-full bg-[#ecf9f1] px-3 py-1 text-xs font-semibold text-[#2E7D5B]">
                              {challenge.current_streak}일
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function ShopModal({
  points,
  tab,
  onTabChange,
  items,
  equippedItems,
  onClose,
  onEquip,
  onUnequip,
  onBuy,
}: {
  points: number;
  tab: ShopTab;
  onTabChange: (tab: ShopTab) => void;
  items: ShopItem[];
  equippedItems: ShopItem[];
  onClose: () => void;
  onEquip: (item: ShopItem) => void;
  onUnequip: (item: ShopItem) => void;
  onBuy: (item: ShopItem) => void;
}) {
  const tabs: ShopTab[] = ["모자", "옷/스카프", "액세서리", "배경"];

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/28 px-4 py-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{ opacity: 0, y: 22, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        className="w-full max-w-5xl overflow-hidden rounded-[32px] border border-[#163126]/10 bg-white shadow-[0_24px_80px_rgba(22,49,38,0.18)]"
      >
        <div className="flex items-center justify-between border-b border-[#163126]/8 px-5 py-5 md:px-7">
          <h3 className="text-xl font-bold text-[#163126]">캐릭터 꾸미기</h3>

          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#eff8df] px-4 py-2 text-sm font-semibold text-[#6a8c1e]">
              <Star size={16} />
              {points}P 보유
            </div>

            <button
              onClick={onClose}
              className="rounded-full border border-[#163126]/10 p-2 text-[#163126]"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="grid min-h-[560px] md:grid-cols-[280px_1fr]">
          <div className="border-b border-r border-[#163126]/8 bg-[#f7fbf6] p-5 md:border-b-0">
            <p className="text-sm font-semibold text-[#2E7D5B]">미리보기</p>

            <div className="mt-4 flex h-[230px] items-center justify-center rounded-[24px] border border-[#9bdfb6] bg-white">
              <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-[#f3f7eb] text-6xl">
                🐹
                <span className="absolute -right-2 top-0 text-2xl">
                  {equippedItems.find((item) => item.tab === "모자")?.emoji ??
                    ""}
                </span>
                <span className="absolute -left-2 bottom-0 text-xl">
                  {equippedItems.find((item) => item.tab === "옷/스카프")
                    ?.emoji ?? ""}
                </span>
                <span className="absolute right-0 bottom-0 text-lg">
                  {equippedItems.find((item) => item.tab === "액세서리")
                    ?.emoji ?? ""}
                </span>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-sm font-semibold text-[#163126]">
                착용 중인 아이템
              </p>

              <div className="mt-3 space-y-2">
                {equippedItems.length === 0 && (
                  <div className="rounded-2xl border border-[#163126]/8 bg-white px-4 py-3 text-sm text-[#163126]/55">
                    아직 착용 중인 아이템이 없어요.
                  </div>
                )}

                {equippedItems.map((item) => (
                  <div
                    key={`equipped-${item.id}`}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-[#9bdfb6] bg-white px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{item.emoji}</span>
                      <span className="text-sm font-medium text-[#163126]">
                        {item.name}
                      </span>
                    </div>

                    <button
                      onClick={() => onUnequip(item)}
                      className="rounded-full border border-[#163126]/10 px-3 py-2 text-xs font-semibold text-[#163126]"
                    >
                      해제
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex min-h-0 flex-col">
            <div className="border-b border-[#163126]/8 px-5 pt-4 md:px-7">
              <div className="flex flex-wrap gap-6">
                {tabs.map((item) => (
                  <button
                    key={item}
                    onClick={() => onTabChange(item)}
                    className={`border-b-2 pb-3 text-sm font-semibold transition ${
                      tab === item
                        ? "border-[#73d99c] text-[#2E7D5B]"
                        : "border-transparent text-[#163126]/55 hover:text-[#163126]"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-auto px-5 py-5 md:px-7">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-[24px] border p-5 text-center ${
                      item.equipped
                        ? "border-[#73d99c] bg-[#eef9f2]"
                        : "border-[#163126]/8 bg-white"
                    }`}
                  >
                    <div className="text-4xl">{item.emoji}</div>
                    <p className="mt-4 text-sm font-semibold text-[#163126]">
                      {item.name}
                    </p>

                    <div className="mt-3">
                      {item.equipped ? (
                        <span className="text-sm font-semibold text-[#2E7D5B]">
                          착용 중
                        </span>
                      ) : item.owned ? (
                        <span className="text-sm font-semibold text-[#6a8c1e]">
                          보유 중
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#d19900]">
                          <Gift size={14} />
                          {item.price}P
                        </span>
                      )}
                    </div>

                    <div className="mt-4">
                      {item.equipped ? (
                        <button className="rounded-full bg-[#163126] px-4 py-2 text-xs font-semibold text-white">
                          선택됨
                        </button>
                      ) : item.owned ? (
                        <button
                          onClick={() => onEquip(item)}
                          className="rounded-full border border-[#163126]/10 px-4 py-2 text-xs font-semibold text-[#163126]"
                        >
                          착용하기
                        </button>
                      ) : (
                        <button
                          onClick={() => onBuy(item)}
                          className="rounded-full border border-[#d7e7dc] bg-[#f9fcfa] px-4 py-2 text-xs font-semibold text-[#163126]"
                        >
                          구매하기
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-[#163126]/8 px-5 py-4 md:px-7">
              <p className="text-xs text-[#163126]/55">
                아이템을 선택하면 미리보기에 바로 반영돼요.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="rounded-full border border-[#163126]/10 px-5 py-3 text-sm font-semibold text-[#163126]"
                >
                  취소
                </button>
                <button
                  onClick={onClose}
                  className="rounded-full bg-[#163126] px-5 py-3 text-sm font-semibold text-white"
                >
                  저장하기
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
