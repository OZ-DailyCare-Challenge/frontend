"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  Clock3,
  CalendarDays,
  Gift,
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
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
import {
  getFeed,
  getFeedNotifications,
  getFriendRequests,
  sendFeedCheer,
  type FeedItem,
} from "@/src/api/social";
import { notificationStorage } from "@/src/utils/notificationStorage";
import { sessionPoints } from "@/src/utils/sessionPoints";
import {
  TODAY_CHALLENGE_PROGRESS_EVENT,
  todayChallengeProgress,
} from "@/src/utils/todayChallengeProgress";
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
  imageSrc?: string;
  equippedImageSrc?: string;
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
const FEED_NOTIFICATION_SEEN_KEY = "social-feed-notification-seen-ids";
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

function parseFeedLogDate(logDate?: string | null) {
  if (!logDate) return null;

  const [year, month, day] = logDate.split("-").map(Number);
  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
}

function getFeedTodayStatusLabel(item: FeedItem) {
  return item.certified_today ? "인증 완료" : "";
}

function getFriendTodaySummary(challenges: FeedItem[]) {
  const certifiedCount = challenges.filter((item) => item.certified_today).length;
  const pendingCount = challenges.length - certifiedCount;

  if (certifiedCount > 0 && pendingCount > 0) {
    return `오늘 ${certifiedCount}개 인증 · ${pendingCount}개 미인증`;
  }
  if (certifiedCount > 0) return `오늘 ${certifiedCount}개 인증 완료`;
  return "오늘 아직 인증하지 않았어요";
}

function getFeedItemTime(item: FeedItem) {
  const createdAtTime = new Date(item.created_at).getTime();
  if (Number.isFinite(createdAtTime)) return createdAtTime;

  const logDate = parseFeedLogDate(item.log_date);
  return logDate?.getTime() ?? 0;
}

function getFeedChallengeKey(item: FeedItem) {
  return item.challenge_title.trim().toLowerCase();
}

const initialShopItems: ShopItem[] = [
  {
    id: 1,
    tab: "모자",
    name: "버디 포근 모자",
    price: 0,
    owned: true,
    equipped: true,
    emoji: "🧸",
    imageSrc: "/images/buddy-hat.png",
    equippedImageSrc: "/images/buddy-hat-on.png",
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
    challenge_id: 101,
    user_challenge_id: 1001,
    challenge_log_id: 1,
    user_id: 1,
    nickname: "민지",
    profile_image: null,
    challenge_title: "물 8잔 마시기",
    log_date: "2026-05-04",
    current_streak: 4,
    created_at: "2026-05-04T09:20:00",
    certified_today: true,
  },
  {
    challenge_id: 102,
    user_challenge_id: 1002,
    challenge_log_id: null,
    user_id: 1,
    nickname: "민지",
    profile_image: null,
    challenge_title: "저염 식단 실천",
    log_date: null,
    current_streak: 3,
    created_at: "2026-05-04T12:10:00",
    certified_today: false,
  },
  {
    challenge_id: 103,
    user_challenge_id: 1003,
    challenge_log_id: 3,
    user_id: 2,
    nickname: "준호",
    profile_image: null,
    challenge_title: "30분 걷기",
    log_date: "2026-05-04",
    current_streak: 5,
    created_at: "2026-05-04T18:30:00",
    certified_today: true,
  },
  {
    challenge_id: 104,
    user_challenge_id: 1004,
    challenge_log_id: null,
    user_id: 3,
    nickname: "서연",
    profile_image: null,
    challenge_title: "스트레칭하기",
    log_date: null,
    current_streak: 2,
    created_at: "2026-05-04T21:00:00",
    certified_today: false,
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
  const [shopNotice, setShopNotice] = useState("");
  const [points, setPoints] = useState(() =>
    sessionPoints.initialize(dashboardData.point)
  );
  const [shopItems, setShopItems] = useState(initialShopItems);
  const [bubbleMessage, setBubbleMessage] = useState("");
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [myActiveChallenges, setMyActiveChallenges] = useState<MyActiveChallenge[]>([]);
  const [certifiedTodayIds, setCertifiedTodayIds] = useState<Set<number>>(
    () => todayChallengeProgress.getIds()
  );
  const [activeFeedIndex, setActiveFeedIndex] = useState(0);
  const [guidePanelOpen, setGuidePanelOpen] = useState(true);
  const [friendAddOpen, setFriendAddOpen] = useState(false);
  const [friendRequestOpen, setFriendRequestOpen] = useState(false);
  const [friendActivityOpen, setFriendActivityOpen] = useState(false);
  const [friendRequestCount, setFriendRequestCount] = useState(0);
  const [feedNotificationMessage, setFeedNotificationMessage] = useState("");
  const [healthRecordOpen, setHealthRecordOpen] = useState(false);
  const [todayHealthRecord, setTodayHealthRecord] = useState<TodayHealthRecord>(
    loadTodayHealthRecord
  );
  const feedCarouselRef = useRef<HTMLDivElement | null>(null);
  const feedCardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const feedScrollFrame = useRef<number | null>(null);
  const feedProgrammaticScroll = useRef(false);
  const feedProgrammaticScrollTimer = useRef<number | null>(null);

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
      const timer = window.setTimeout(() => setFeedItems(mockFeedItems), 0);
      return () => window.clearTimeout(timer);
    }

    getFeed().then(setFeedItems).catch(() => {});
  }, [mock]);

  useEffect(() => {
    if (mock) {
      const timer = window.setTimeout(() => setFriendRequestCount(2), 0);
      return () => window.clearTimeout(timer);
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

  useEffect(() => {
    const syncCertifiedIds = () =>
      setCertifiedTodayIds(todayChallengeProgress.getIds());

    window.addEventListener(TODAY_CHALLENGE_PROGRESS_EVENT, syncCertifiedIds);
    window.addEventListener("focus", syncCertifiedIds);

    return () => {
      window.removeEventListener(TODAY_CHALLENGE_PROGRESS_EVENT, syncCertifiedIds);
      window.removeEventListener("focus", syncCertifiedIds);
    };
  }, []);

  useEffect(() => {
    if (mock) return;

    const loadSeenIds = () => {
      try {
        return new Set<number>(
          JSON.parse(
            window.localStorage.getItem(FEED_NOTIFICATION_SEEN_KEY) ?? "[]"
          )
        );
      } catch {
        return new Set<number>();
      }
    };

    const saveSeenIds = (ids: Set<number>) => {
      window.localStorage.setItem(
        FEED_NOTIFICATION_SEEN_KEY,
        JSON.stringify([...ids].slice(-100))
      );
    };

    const pollNotifications = async () => {
      if (!notificationStorage.isFriendAlertOn()) return;

      try {
        const notifications = await getFeedNotifications();
        const seenIds = loadSeenIds();
        const unseen = notifications.filter((item) => !seenIds.has(item.id));

        if (unseen.length > 0) {
          const latest = unseen[0];
          setFeedNotificationMessage(latest.message);
          window.setTimeout(() => setFeedNotificationMessage(""), 3500);
        }

        notifications.forEach((item) => seenIds.add(item.id));
        saveSeenIds(seenIds);
      } catch {
        // 알림 polling 실패는 화면 흐름을 막지 않는다.
      }
    };

    void pollNotifications();
    const interval = window.setInterval(pollNotifications, 30000);

    return () => window.clearInterval(interval);
  }, [mock]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPoints(sessionPoints.initialize(dashboardData.point));
    }, 0);
    const handlePointChange = () => setPoints(sessionPoints.get());
    window.addEventListener("session-points-change", handlePointChange);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("session-points-change", handlePointChange);
    };
  }, [dashboardData.point]);

  const groupedFeedItems = useMemo(() => {
    const map = new Map<
      number,
      {
        user_id: number;
        nickname: string;
        profile_image?: string | null;
        challengeMap: Map<string, FeedItem>;
      }
    >();

    feedItems.forEach((item) => {
      const existing = map.get(item.user_id);
      const challengeKey = getFeedChallengeKey(item);

      if (existing) {
        const current = existing.challengeMap.get(challengeKey);
        if (!current || getFeedItemTime(item) > getFeedItemTime(current)) {
          existing.challengeMap.set(challengeKey, item);
        }
        return;
      }

      map.set(item.user_id, {
        user_id: item.user_id,
        nickname: item.nickname,
        profile_image: item.profile_image,
        challengeMap: new Map([[challengeKey, item]]),
      });
    });

    return Array.from(map.values()).map((friend) => ({
      user_id: friend.user_id,
      nickname: friend.nickname,
      profile_image: friend.profile_image,
      challenges: Array.from(friend.challengeMap.values()).sort(
        (a, b) => Number(b.certified_today) - Number(a.certified_today) || getFeedItemTime(b) - getFeedItemTime(a)
      ),
    }));
  }, [feedItems]);

  const normalizedActiveFeedIndex =
    groupedFeedItems.length > 0
      ? Math.min(activeFeedIndex, groupedFeedItems.length - 1)
      : 0;

  useEffect(() => {
    return () => {
      if (feedScrollFrame.current !== null) {
        window.cancelAnimationFrame(feedScrollFrame.current);
      }
      if (feedProgrammaticScrollTimer.current !== null) {
        window.clearTimeout(feedProgrammaticScrollTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    feedCardRefs.current[normalizedActiveFeedIndex]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [normalizedActiveFeedIndex]);

  const handleFeedCarouselScroll = () => {
    if (feedProgrammaticScroll.current) return;

    if (feedScrollFrame.current !== null) {
      window.cancelAnimationFrame(feedScrollFrame.current);
    }

    feedScrollFrame.current = window.requestAnimationFrame(() => {
      const container = feedCarouselRef.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const centerX = containerRect.left + containerRect.width / 2;

      const nearestIndex = feedCardRefs.current.reduce(
        (nearest, card, index) => {
          if (!card) return nearest;

          const rect = card.getBoundingClientRect();
          const distance = Math.abs(rect.left + rect.width / 2 - centerX);

          return distance < nearest.distance ? { index, distance } : nearest;
        },
        { index: normalizedActiveFeedIndex, distance: Number.POSITIVE_INFINITY }
      ).index;

      if (nearestIndex !== normalizedActiveFeedIndex) {
        setActiveFeedIndex(nearestIndex);
      }
    });
  };

  const selectFeedIndex = (index: number) => {
    feedProgrammaticScroll.current = true;
    if (feedProgrammaticScrollTimer.current !== null) {
      window.clearTimeout(feedProgrammaticScrollTimer.current);
    }
    feedProgrammaticScrollTimer.current = window.setTimeout(() => {
      feedProgrammaticScroll.current = false;
    }, 450);
    setActiveFeedIndex(index);
    feedCardRefs.current[index]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  };

  const handlePrevFeed = () => {
    if (!groupedFeedItems.length) return;
    selectFeedIndex(
      (normalizedActiveFeedIndex - 1 + groupedFeedItems.length) %
        groupedFeedItems.length
    );
  };

  const handleNextFeed = () => {
    if (!groupedFeedItems.length) return;
    selectFeedIndex((normalizedActiveFeedIndex + 1) % groupedFeedItems.length);
  };

  const todayChallenges = getTodayChecklistFromChallenges(challenges);
  const activeChallengeCount = myActiveChallenges.length;
  const completedTodayCount = myActiveChallenges.filter((challenge) =>
    certifiedTodayIds.has(challenge.user_challenge_id)
  ).length;

  const dashboardChallengePercent = activeChallengeCount
    ? Math.round((completedTodayCount / activeChallengeCount) * 100)
    : 0;
  const completedCount = todayChallenges.filter((item) => item.done).length;
  const challengePercent = todayChallenges.length
    ? Math.round((completedCount / todayChallenges.length) * 100)
    : 0;
  const todayTaskPercent = activeChallengeCount
    ? dashboardChallengePercent
    : challengePercent;
  const todayTaskCompletedCount = activeChallengeCount
    ? completedTodayCount
    : completedCount;
  const todayTaskTotalCount = activeChallengeCount
    ? activeChallengeCount
    : todayChallenges.length;

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
      const timer = window.setTimeout(() => setBubbleMessage(""), 0);
      return () => window.clearTimeout(timer);
    }

    const showTimer = window.setTimeout(
      () => setBubbleMessage(getHeroBubbleMessage(heroReactionType)),
      0
    );

    const hideTimer = window.setTimeout(() => {
      setBubbleMessage("");
    }, 3500);

    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
    };
  }, [heroReactionType]);

  const handleCheer = async (
    key: string,
    targetUserId: number,
    challengeLogId?: number | null
  ) => {
    if (cheeredKeys.has(key)) return;

    setCheeredKeys((prev) => new Set(prev).add(key));

    try {
      await sendFeedCheer(targetUserId, challengeLogId);
    } catch (error) {
      console.error("응원 보내기 실패:", error);
      setCheeredKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      alert("응원 보내기에 실패했어요.");
    }
  };

  const handleEquip = (target: ShopItem) => {
    if (!target.owned) return;
    setShopNotice("");

    setShopItems((prev) =>
      prev.map((item) =>
        item.tab === target.tab
          ? { ...item, equipped: item.id === target.id }
          : item
      )
    );
  };

  const handleUnequip = (target: ShopItem) => {
    setShopNotice("");
    setShopItems((prev) =>
      prev.map((item) =>
        item.id === target.id ? { ...item, equipped: false } : item
      )
    );
  };

  const handleBuy = (target: ShopItem) => {
    if (target.owned) return;
    if (points < target.price) {
      setShopNotice(
        `${target.name} 구매에 ${(target.price - points).toLocaleString(
          "ko-KR"
        )}P가 부족해요. 챌린지를 인증해 포인트를 모아보세요.`
      );
      return;
    }

    setShopNotice("");
    setPoints(sessionPoints.add(-target.price, "shop_purchase", `${target.name} 구매`));
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
                          hatImageSrc={
                            equippedItems.find((item) => item.tab === "모자")
                              ?.equippedImageSrc ??
                            equippedItems.find((item) => item.tab === "모자")
                              ?.imageSrc
                          }
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

              <div className="mt-5 flex items-center justify-between gap-3">
                <p className="text-xs font-bold text-[#163126]/60">
                  오늘 챌린지 달성률
                </p>
                <p className="text-xs font-semibold text-[#2E7D5B]">
                  {todayTaskCompletedCount}/{todayTaskTotalCount} 완료
                </p>
              </div>

              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#163126]/8">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#8ce7a7,#b7f3c9)]"
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(100, todayTaskPercent)
                    )}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-[#163126]/52">
                오늘 진행 중인 챌린지 기준 {todayTaskPercent}% 달성
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

              <div className="max-h-[282px] space-y-3 overflow-y-auto pr-1">
                {myActiveChallenges.length === 0 ? (
                  <div className="rounded-2xl bg-[#f8fbf8] px-4 py-5 text-sm text-[#163126]/50">
                    진행 중인 챌린지가 없어요.
                  </div>
                ) : (
                  myActiveChallenges.map((challenge) => {
                    const certifiedToday = certifiedTodayIds.has(
                      challenge.user_challenge_id
                    );

                    return (
                      <div
                        key={challenge.user_challenge_id}
                        className="flex w-full items-center justify-between rounded-2xl border border-[#163126]/8 bg-[#fbfdfb] px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-[#163126]">
                            {challenge.title}
                          </p>
                          <p className="mt-1 text-xs text-[#163126]/45">
                            {certifiedToday
                              ? "오늘 인증 완료"
                              : `${challenge.current_streak}일 연속 진행 중`}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            certifiedToday
                              ? "bg-[#2E7D5B] text-white"
                              : "bg-[#ecf9f1] text-[#2E7D5B]"
                          }`}
                        >
                          {certifiedToday ? "완료" : "진행중"}
                        </span>
                      </div>
                    );
                  })
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
                <div className="mb-4 flex gap-4 overflow-x-auto scroll-smooth px-1 pb-4 pt-2 scrollbar-hide">
                  {groupedFeedItems.map((friend, index) => {
                    const active = index === normalizedActiveFeedIndex;

                    return (
                      <button
                        key={friend.user_id}
                        onClick={() => {
                          selectFeedIndex(index);
                        }}
                        className={`relative flex shrink-0 flex-col items-center gap-2 rounded-2xl px-1.5 py-1 transition duration-200 ${
                          active
                            ? "scale-[1.05] opacity-100"
                            : "scale-[0.92] opacity-60 hover:opacity-85"
                        }`}
                        aria-current={active ? "true" : undefined}
                      >
                        <div
                          className={`rounded-full transition duration-200 ${
                            active
                              ? "shadow-[0_10px_24px_rgba(46,125,91,0.22)] ring-2 ring-[#2E7D5B] ring-offset-2 ring-offset-white"
                              : ""
                          }`}
                        >
                          <ProfileNameAvatar
                            name={friend.nickname}
                            image={friend.profile_image}
                            className="h-14 w-14"
                            textClassName="text-[10px]"
                          />
                        </div>

                        <span
                          className={`max-w-[64px] truncate text-xs text-[#163126] transition ${
                            active ? "font-bold" : "font-medium"
                          }`}
                        >
                          {friend.nickname}
                        </span>

                        <span
                          className={`h-1 rounded-full bg-[#2E7D5B] transition-all ${
                            active ? "w-6 opacity-100" : "w-1 opacity-0"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>

                <div className="group relative -mx-5 overflow-hidden px-0">
                  {groupedFeedItems.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={handlePrevFeed}
                        className="absolute left-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#dce9e0] bg-white/88 text-[#2E7D5B] opacity-0 shadow-[0_12px_28px_rgba(22,49,38,0.12)] backdrop-blur transition hover:-translate-x-0.5 hover:bg-white group-hover:opacity-100 md:flex"
                        aria-label="이전 친구 활동 보기"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={handleNextFeed}
                        className="absolute right-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#dce9e0] bg-white/88 text-[#2E7D5B] opacity-0 shadow-[0_12px_28px_rgba(22,49,38,0.12)] backdrop-blur transition hover:translate-x-0.5 hover:bg-white group-hover:opacity-100 md:flex"
                        aria-label="다음 친구 활동 보기"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </>
                  )}

                  <div
                    ref={feedCarouselRef}
                    onScroll={handleFeedCarouselScroll}
                    className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-[6%] pb-5 pt-2 scrollbar-hide sm:px-[12%] md:px-[18%]"
                  >
                    <AnimatePresence initial={false}>
                      {groupedFeedItems.map((friend, index) => {
                          const active = index === normalizedActiveFeedIndex;
                          const targetLog =
                            friend.challenges.find((challenge) => challenge.certified_today) ??
                            friend.challenges[0];
                          const cheerKey = `friend-${friend.user_id}`;
                          const cheered = cheeredKeys.has(cheerKey);
                          const todaySummary = getFriendTodaySummary(friend.challenges);

                          return (
                            <motion.div
                              key={`visible-${friend.user_id}`}
                              ref={(node) => {
                                feedCardRefs.current[index] = node;
                              }}
                              layout
                              animate={{
                                scale: active ? 1 : 0.94,
                                opacity: active ? 1 : 0.62,
                                y: active ? 0 : 5,
                              }}
                              whileHover={active ? { y: -4 } : undefined}
                              whileTap={active ? { scale: 0.98 } : undefined}
                              transition={{ type: "spring", stiffness: 260, damping: 26 }}
                              className={`min-h-[268px] w-[88%] max-w-[520px] shrink-0 snap-center overflow-hidden rounded-[26px] border bg-white p-4 transition-shadow sm:w-[76%] sm:p-5 md:w-[64%] lg:w-[58%] ${
                                active
                                  ? "border-[#2E7D5B]/18 shadow-[0_24px_58px_rgba(46,125,91,0.16)]"
                                  : "border-[#163126]/8 shadow-[0_12px_28px_rgba(46,125,91,0.05)]"
                              }`}
                            >
                              <div
                                className={`transition-opacity duration-200 ${
                                  active
                                    ? "opacity-100"
                                    : "pointer-events-none opacity-0"
                                }`}
                                aria-hidden={!active}
                              >
                              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                                <div className="flex min-w-0 items-center gap-3">
                                  <ProfileNameAvatar
                                    name={friend.nickname}
                                    image={friend.profile_image}
                                    className="h-11 w-11 shrink-0 sm:h-12 sm:w-12"
                                    textClassName="text-[10px]"
                                  />

                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-bold text-[#163126]">
                                      {friend.nickname}
                                    </p>
                                    <p className="mt-1 break-keep text-xs leading-5 text-[#163126]/45">
                                      {todaySummary}
                                    </p>
                                  </div>
                                </div>

                                <button
                                  onClick={() =>
                                    handleCheer(
                                      cheerKey,
                                      friend.user_id,
                                      targetLog?.challenge_log_id
                                    )
                                  }
                                  disabled={cheered}
                                  className={`max-w-full shrink-0 self-start rounded-full px-4 py-2 text-xs font-semibold leading-4 transition sm:self-auto ${
                                    cheered
                                      ? "cursor-default bg-[#ecf9f1] text-[#2E7D5B]/80 opacity-85"
                                      : "bg-[#163126] text-white hover:bg-[#1d4232]"
                                  }`}
                                >
                                  {cheered ? (
                                    <span className="flex items-center gap-1.5">
                                      <Check size={13} />
                                      응원 보냈어요
                                    </span>
                                  ) : (
                                    "응원하기"
                                  )}
                                </button>
                              </div>

                              <div className="mt-5 rounded-[22px] bg-[#f8fbf8] px-3 py-4 sm:px-4">
                                <p className="break-keep text-[11px] font-semibold uppercase tracking-[0.12em] text-[#2E7D5B] sm:text-xs sm:tracking-[0.16em]">
                                  today challenge
                                </p>

                                <div className="mt-3 space-y-2">
                                  {friend.challenges.slice(0, 2).map((challenge) => (
                                    <div
                                      key={`${challenge.user_id}-${challenge.challenge_title}-${challenge.created_at}`}
                                      className="grid min-w-0 gap-2 rounded-2xl bg-white px-3 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-3"
                                    >
                                      <span className="min-w-0 break-keep text-sm font-semibold leading-5 text-[#163126]">
                                        {challenge.challenge_title}
                                      </span>

                                      <div className="flex min-w-0 flex-wrap items-center gap-2 sm:justify-end">
                                        {challenge.certified_today && (
                                          <span className="max-w-full rounded-full bg-[#ecf9f1] px-3 py-1 text-center text-xs font-semibold leading-4 text-[#2E7D5B]">
                                            {getFeedTodayStatusLabel(challenge)}
                                          </span>
                                        )}
                                        <span className="max-w-full rounded-full bg-[#ecf9f1] px-3 py-1 text-center text-xs font-semibold leading-4 text-[#2E7D5B]">
                                          {challenge.current_streak}일
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              </div>
                            </motion.div>
                          );
                        })}
                    </AnimatePresence>
                  </div>
                </div>

                {groupedFeedItems.length > 3 && (
                  <div className="mt-4 flex justify-center gap-2">
                    {groupedFeedItems.map((friend, index) => (
                      <button
                        key={`dot-${friend.user_id}`}
                        onClick={() => {
                          selectFeedIndex(index);
                        }}
                        className={`h-2 rounded-full transition-all ${
                          index === normalizedActiveFeedIndex
                            ? "w-8 bg-[#2E7D5B]"
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
            notice={shopNotice}
            onClose={() => setShopOpen(false)}
            onEquip={handleEquip}
            onUnequip={handleUnequip}
            onBuy={handleBuy}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {feedNotificationMessage && (
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            className="fixed bottom-6 left-1/2 z-[90] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-[22px] border border-[#cfe9d7] bg-white px-5 py-4 text-sm font-bold text-[#163126] shadow-[0_18px_50px_rgba(22,49,38,0.16)]"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#ecf9f1] text-[#2E7D5B]">
                <Heart size={17} fill="currentColor" />
              </span>
              <p className="min-w-0 leading-6">{feedNotificationMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function BuddyCharacter({
  reactionType,
  hatImageSrc,
  hatEmoji,
  scarfEmoji,
  accessoryEmoji,
}: {
  reactionType: HeroReactionType;
  hatImageSrc?: string;
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
      className="relative flex h-[220px] w-[180px] items-center justify-center pt-5"
    >
      <div className="relative h-[178px] w-[144px]">
        <img
          src="/images/buddy-dashboard.png"
          alt=""
          className="h-full w-full rounded-[28px] object-cover object-center shadow-[0_18px_34px_rgba(22,49,38,0.18)]"
        />

        {hatImageSrc ? (
          <img
            src={hatImageSrc}
            alt=""
            className="pointer-events-none absolute left-[48%] -top-8 h-[90px] w-36 -translate-x-1/2 object-contain"
          />
        ) : hatEmoji ? (
          <span className="absolute right-1 top-2 text-3xl">{hatEmoji}</span>
        ) : null}
        {scarfEmoji && (
          <span className="absolute left-2 bottom-8 text-2xl">
            {scarfEmoji}
          </span>
        )}
        {accessoryEmoji && (
          <span className="absolute right-2 bottom-8 text-xl">
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
    if (!open) return;

    const timer = window.setTimeout(() => setDraft(value), 0);
    return () => window.clearTimeout(timer);
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
  onCheer: (key: string, targetUserId: number, challengeLogId?: number | null) => void;
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
              친구들의 오늘 챌린지 상태를 모아봤어요.
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
                const targetLog =
                  friend.challenges.find((challenge) => challenge.certified_today) ??
                  friend.challenges[0];
                const cheerKey = `friend-${friend.user_id}`;
                const cheered = cheeredKeys.has(cheerKey);
                const todaySummary = getFriendTodaySummary(friend.challenges);

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
                            {todaySummary}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          onCheer(cheerKey, friend.user_id, targetLog?.challenge_log_id)
                        }
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

                    <div className="mt-5 max-h-[174px] space-y-2 overflow-y-auto pr-1">
                      {friend.challenges.map((challenge) => (
                        <div
                          key={`all-${challenge.user_id}-${challenge.challenge_title}-${challenge.created_at}`}
                          className="rounded-2xl bg-white px-4 py-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <span className="min-w-0 flex-1 break-keep text-sm font-semibold leading-5 text-[#163126]">
                              {challenge.challenge_title}
                            </span>
                            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                              {challenge.certified_today && (
                                <span className="rounded-full bg-[#ecf9f1] px-3 py-1 text-xs font-semibold text-[#2E7D5B]">
                                  {getFeedTodayStatusLabel(challenge)}
                                </span>
                              )}
                              <span className="rounded-full bg-[#ecf9f1] px-3 py-1 text-xs font-semibold text-[#2E7D5B]">
                                {challenge.current_streak}일
                              </span>
                            </div>
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
  notice,
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
  notice: string;
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
              <div className="relative flex h-36 w-28 items-center justify-center rounded-[24px] bg-[#f3f7eb] pt-3">
                <img
                  src="/images/buddy-dashboard.png"
                  alt=""
                  className="h-full w-full object-cover"
                />
                {equippedItems.find((item) => item.tab === "모자")?.imageSrc ? (
                  <img
                    src={
                      equippedItems.find((item) => item.tab === "모자")
                        ?.equippedImageSrc ??
                      equippedItems.find((item) => item.tab === "모자")
                        ?.imageSrc
                    }
                    alt=""
                    className="pointer-events-none absolute left-[48%] -top-6 h-[76px] w-32 -translate-x-1/2 object-contain"
                  />
                ) : (
                  <span className="absolute -right-2 top-0 text-2xl">
                    {equippedItems.find((item) => item.tab === "모자")
                      ?.emoji ?? ""}
                  </span>
                )}
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
                      {item.imageSrc ? (
                        <img
                          src={item.imageSrc}
                          alt=""
                          className="h-8 w-10 rounded-[10px] object-cover"
                        />
                      ) : (
                        <span className="text-xl">{item.emoji}</span>
                      )}
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
              {notice && (
                <div className="mb-4 rounded-[18px] border border-[#f3d99b] bg-[#fff8e8] px-4 py-3 text-sm font-semibold text-[#8a6400]">
                  {notice}
                </div>
              )}

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
                    <div className="flex h-16 items-center justify-center">
                      {item.imageSrc ? (
                        <img
                          src={item.imageSrc}
                          alt=""
                          className="h-14 w-20 rounded-[16px] object-cover shadow-[0_8px_18px_rgba(22,49,38,0.10)]"
                        />
                      ) : (
                        <span className="text-4xl">{item.emoji}</span>
                      )}
                    </div>
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
                        <button
                          onClick={() => onUnequip(item)}
                          className="rounded-full bg-[#163126] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#28513f]"
                        >
                          해제하기
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
                          className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                            points < item.price
                              ? "border-[#ead9b0] bg-[#fff8e8] text-[#8a6400]"
                              : "border-[#d7e7dc] bg-[#f9fcfa] text-[#163126] hover:bg-[#eef8f1]"
                          }`}
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
