"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  Clock3,
  CalendarDays,
  Search,
  UserPlus,
  Gift,
  Star,
  X,
} from "lucide-react";
import { useChallengeStore } from "@/src/store/challenge-store";
import { getTodayChecklistFromChallenges } from "@/src/lib/challenge-utils";

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

type FriendFeed = {
  id: number;
  name: string;
  message: string;
};

type FriendSuggestion = {
  id: number;
  name: string;
  streak: string;
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
};

type HeroReactionType = "none" | "success" | "streak";

const DASHBOARD_HERO_BG = "/images/skygreen.png";

const friendFeedData: FriendFeed[] = [
  { id: 1, name: "영현", message: "걷기 챌린지 30일 연속 달성!" },
  { id: 2, name: "형석", message: "금연 챌린지 완료!" },
  { id: 3, name: "승희", message: "식단 기록 7일 달성!" },
  { id: 4, name: "소윤", message: "걷기 챌린지 완료!" },
];

const friendSuggestions: FriendSuggestion[] = [
  { id: 1, name: "Berry", streak: "1일차 진행 중" },
  { id: 2, name: "Chris", streak: "15일차 연속 중" },
  { id: 3, name: "Sandy", streak: "7일차 진행 중" },
];

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

export default function DashboardScreen({ dashboardData }: Props) {
  const challenges = useChallengeStore((state) => state.challenges);
  const submitCheck = useChallengeStore((state) => state.submitCheck);

  const [likedIds, setLikedIds] = useState<number[]>([]);
  const [friendKeyword, setFriendKeyword] = useState("");
  const [shopOpen, setShopOpen] = useState(false);
  const [shopTab, setShopTab] = useState<ShopTab>("모자");
  const [points, setPoints] = useState(dashboardData.point);
  const [shopItems, setShopItems] = useState(initialShopItems);
  const [bubbleMessage, setBubbleMessage] = useState("");

  const todayChallenges = getTodayChecklistFromChallenges(challenges);
  const completedCount = todayChallenges.filter((item) => item.done).length;
  const challengePercent = todayChallenges.length
    ? Math.round((completedCount / todayChallenges.length) * 100)
    : 0;

  const equippedItems = shopItems.filter((item) => item.equipped);

  const visibleShopItems = useMemo(
    () => shopItems.filter((item) => item.tab === shopTab),
    [shopItems, shopTab]
  );

  const filteredSuggestions = useMemo(() => {
    if (!friendKeyword.trim()) return friendSuggestions;
    return friendSuggestions.filter((friend) =>
      friend.name.toLowerCase().includes(friendKeyword.toLowerCase())
    );
  }, [friendKeyword]);

  const heartAgeDiff =
    dashboardData.actualAge !== null && dashboardData.heartAge !== null
      ? dashboardData.actualAge - dashboardData.heartAge
      : null;

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

  const handleCheer = (id: number) => {
    setLikedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
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
      <section className="mx-auto w-full max-w-7xl space-y-6">
        <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
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

            <div className="relative z-10 p-5 text-white md:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d7f6df]">
                    buddy & today
                  </p>
                </div>

                <div className="shrink-0 rounded-full border border-[#f6d8a6]/50 bg-[#fff6e8] px-4 py-2 text-xs font-semibold text-[#c67800]">
                  🔥{" "}
                  {dashboardData.streak > 0
                    ? `${dashboardData.streak}일 연속 달성 중`
                    : "오늘부터 시작"}
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-[250px_1fr_auto] md:items-center">
                <div className="relative flex items-center justify-center">
                  <AnimatePresence>
                    {bubbleMessage && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        className="absolute -top-2 left-1/2 z-20 w-[240px] -translate-x-1/2 rounded-[24px] border border-white/18 bg-white/14 px-4 py-3 text-center text-sm font-medium leading-6 text-white shadow-[0_18px_36px_rgba(22,49,38,0.10)] backdrop-blur-md"
                      >
                        <span className="whitespace-pre-line">
                          {bubbleMessage}
                        </span>
                        <span className="absolute bottom-[-10px] left-1/2 h-5 w-5 -translate-x-1/2 rotate-45 rounded-[4px] border-r border-b border-white/14 bg-white/14 backdrop-blur-md" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="relative mt-16 h-[250px] w-[200px] overflow-hidden rounded-[26px] border border-white/16 bg-white/8 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-sm">
                    <div className="absolute inset-3 rounded-[20px] border border-white/12" />
                    <div className="absolute left-4 top-4 h-3 w-3 rounded-full bg-white/35" />
                    <div className="absolute right-4 top-4 h-3 w-3 rounded-full bg-white/18" />
                    <div className="absolute bottom-4 left-4 h-3 w-3 rounded-full bg-white/18" />
                    <div className="absolute bottom-4 right-4 h-3 w-3 rounded-full bg-white/35" />

                    <div className="relative z-10 flex h-full items-end justify-center pb-4">
                      <BuddyCharacter
                        reactionType={heroReactionType}
                        hatEmoji={
                          equippedItems.find((item) => item.tab === "모자")
                            ?.emoji ?? ""
                        }
                        scarfEmoji={
                          equippedItems.find((item) => item.tab === "옷/스카프")
                            ?.emoji ?? ""
                        }
                        accessoryEmoji={
                          equippedItems.find((item) => item.tab === "액세서리")
                            ?.emoji ?? ""
                        }
                      />
                    </div>
                  </div>
                </div>

                <div>
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

                <div className="flex flex-col gap-3">
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

          <div className="grid gap-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 }}
              className="rounded-[28px] border border-[#163126]/8 bg-white/82 p-5 shadow-[0_18px_50px_rgba(46,125,91,0.06)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#2E7D5B]">
                    심혈관 나이
                  </p>
                  <div className="mt-2 flex items-end gap-2">
                    <span className="text-4xl font-bold text-[#2E7D5B]">
                      {dashboardData.heartAge ?? "-"}
                    </span>
                    <span className="pb-1 text-sm text-[#163126]/55">세</span>
                  </div>
                  <p className="mt-2 text-sm text-[#163126]/58">
                    실제 나이 {dashboardData.actualAge ?? "-"}세 기준
                  </p>
                </div>

                {heartAgeDiff !== null && heartAgeDiff > 0 && (
                  <span className="rounded-full bg-[#eff8df] px-3 py-1 text-xs font-semibold text-[#6a8c1e]">
                    {heartAgeDiff}세 개선
                  </span>
                )}
              </div>

              <div className="mt-5 space-y-3">
                <InfoMiniRow
                  icon={<Clock3 size={16} />}
                  text={`다음 수치 업데이트까지 ${dashboardData.nextUpdateDays}일 남았어요`}
                />
                <InfoMiniRow
                  icon={<CalendarDays size={16} />}
                  text={`오늘 챌린지 ${completedCount}개 완료 중`}
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
              transition={{ delay: 0.1 }}
              className="rounded-[28px] border border-[#163126]/8 bg-white/82 p-5 shadow-[0_18px_50px_rgba(46,125,91,0.06)]"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#163126]">
                    오늘의 챌린지
                  </p>
                  <p className="mt-1 text-xs text-[#163126]/55">
                    {completedCount}/{todayChallenges.length} 완료
                  </p>
                </div>
                <span className="rounded-full bg-[#eff8df] px-3 py-1 text-xs font-semibold text-[#6a8c1e]">
                  {challengePercent}% 달성
                </span>
              </div>

              <div className="mb-4 h-2.5 overflow-hidden rounded-full bg-[#163126]/8">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#8ce7a7,#b7f3c9)] transition-all"
                  style={{ width: `${challengePercent}%` }}
                />
              </div>

              <div className="space-y-3">
                {todayChallenges.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => submitCheck(item.id, !item.done)}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                      item.done
                        ? "border-[#cfeede] bg-[#f7fcf8]"
                        : "border-[#163126]/8 bg-[#fbfdfb] hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base">{item.done ? "✅" : "📝"}</span>
                      <span className="text-sm font-medium text-[#163126]">
                        {item.label}
                      </span>
                    </div>

                    <span
                      className={`h-4 w-4 rounded-full border ${
                        item.done
                          ? "border-[#2E7D5B] bg-[#2E7D5B]"
                          : "border-[#163126]/18 bg-white"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 }}
            className="rounded-[28px] border border-[#163126]/8 bg-white/82 p-5 shadow-[0_18px_50px_rgba(46,125,91,0.06)]"
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#163126]">
                  친구 챌린지 피드
                </p>
                <p className="mt-1 text-xs text-[#163126]/55">
                  친구들의 건강 실천 소식을 확인해보세요
                </p>
              </div>

              <button className="text-xs font-semibold text-[#2E7D5B]">
                응원하기
              </button>
            </div>

            <div className="space-y-3">
              {friendFeedData.map((item) => {
                const liked = likedIds.includes(item.id);

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-[#163126]/8 bg-[#fbfdfb] px-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#ecf9f1] text-sm font-bold text-[#2E7D5B]">
                        {item.name[0]}
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#163126]">
                          {item.name}
                        </p>
                        <p className="truncate text-xs text-[#163126]/58">
                          {item.message}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCheer(item.id)}
                      className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold transition ${
                        liked
                          ? "bg-[#163126] text-white"
                          : "border border-[#163126]/10 bg-white text-[#163126]"
                      }`}
                    >
                      {liked ? "응원 완료" : "응원"}
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="rounded-[28px] border border-[#163126]/8 bg-white/82 p-5 shadow-[0_18px_50px_rgba(46,125,91,0.06)]"
          >
            <div className="mb-5">
              <p className="text-sm font-semibold text-[#163126]">친구 추가</p>
              <p className="mt-1 text-xs text-[#163126]/55">
                친구를 검색하거나 추천 친구를 추가해보세요
              </p>
            </div>

            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#163126]/35"
                />
                <input
                  value={friendKeyword}
                  onChange={(e) => setFriendKeyword(e.target.value)}
                  placeholder="친구 이름 검색"
                  className="h-12 w-full rounded-2xl border border-[#163126]/10 bg-white pl-11 pr-4 text-sm outline-none"
                />
              </div>

              <button className="rounded-full bg-[#163126] px-5 py-3 text-sm font-semibold text-white">
                검색
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {filteredSuggestions.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-[#163126]/8 bg-[#fbfdfb] px-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eef7e8] text-sm font-semibold text-[#6a8c1e]">
                      {friend.name[0]}
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#163126]">
                        {friend.name}
                      </p>
                      <p className="truncate text-xs text-[#163126]/55">
                        {friend.streak}
                      </p>
                    </div>
                  </div>

                  <button className="inline-flex items-center gap-1 rounded-full border border-[#163126]/10 bg-white px-3 py-2 text-xs font-semibold text-[#163126]">
                    <UserPlus size={14} />
                    대기
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2E7D5B]">
                친구 추천
              </p>

              <div className="mt-3 grid grid-cols-3 gap-3">
                {friendSuggestions.map((friend) => (
                  <div
                    key={`mini-${friend.id}`}
                    className="rounded-2xl border border-[#163126]/8 bg-[#fbfdfb] px-3 py-4 text-center"
                  >
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#eef7e8] text-sm font-semibold text-[#6a8c1e]">
                      {friend.name[0]}
                    </div>
                    <p className="mt-2 text-sm font-semibold text-[#163126]">
                      {friend.name}
                    </p>
                    <p className="mt-1 text-[11px] text-[#163126]/52">
                      {friend.streak}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

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