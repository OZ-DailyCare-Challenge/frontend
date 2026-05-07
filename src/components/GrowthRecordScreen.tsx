"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Droplet,
  Flame,
  Heart,
  Medal,
  Plus,
  ShieldCheck,
  Star,
} from "lucide-react";
import ProfileNameAvatar from "@/src/components/ProfileNameAvatar";
import { sessionPoints } from "@/src/utils/sessionPoints";

export type GrowthCardioPoint = {
  label: string;
  value: number;
};

export type GrowthHealthRow = {
  date: string;
  bp: string;
  glucose: number | string;
  cholesterol: number | string;
  cardioAge?: number | null;
};

export type GrowthWeeklyItem = {
  day: string;
  value: number;
};

export type GrowthChallengeSummary = {
  id: string;
  title: string;
  description: string;
  icon: string;
  weekly: GrowthWeeklyItem[];
};

export type GrowthBadge = {
  name: string;
  icon: string;
  earned: boolean;
  earnedDate?: string;
};

export type GrowthBadgeSticker = {
  date: string;
  streak?: boolean;
  badges: {
    name: string;
    icon: string;
    kind?: "sticker" | "badge";
  }[];
};

export type GrowthRecordViewData = {
  nickname: string;
  profileImage?: string;
  point: number;
  actualAge: number | null;
  firstRecordLabel: string;
  streakDays?: number | null;
  badgeCount?: number | null;
  cardioAgeHistory: GrowthCardioPoint[];
  healthHistory: GrowthHealthRow[];
  weeklyChallenge: GrowthWeeklyItem[];
  challengeItems?: GrowthChallengeSummary[];
  earnedBadgeCount?: number | null;
  badges: GrowthBadge[];
  badgeCalendar: GrowthBadgeSticker[];
};

type Props = {
  data: GrowthRecordViewData;
};

type CalendarCell = {
  key: string;
  day: number | null;
  fullDate: string | null;
  isToday: boolean;
};

function buildMonthCalendar(baseDate = new Date()) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0).getDate();
  const startWeekday = firstDay.getDay();

  const cells: CalendarCell[] = [];

  for (let i = 0; i < startWeekday; i += 1) {
    cells.push({
      key: `empty-start-${i}`,
      day: null,
      fullDate: null,
      isToday: false,
    });
  }

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

  for (let day = 1; day <= lastDate; day += 1) {
    const fullDate = `${year}-${month + 1}-${day}`;

    cells.push({
      key: fullDate,
      day,
      fullDate,
      isToday: fullDate === todayKey,
    });
  }

  while (cells.length % 7 !== 0) {
    const index = cells.length;
    cells.push({
      key: `empty-end-${index}`,
      day: null,
      fullDate: null,
      isToday: false,
    });
  }

  return {
    title: `${year}년 ${month + 1}월`,
    cells,
  };
}

function formatPercent(value: number, max: number) {
  if (max <= 0) return 0;
  return Math.max(8, Math.min(100, (value / max) * 100));
}

function getStatusLabel(value: number | string, kind: "bp" | "glucose" | "age") {
  if (kind === "bp") {
    if (typeof value !== "string" || !value.includes("/")) return "확인 중";
    const [systolic, diastolic] = value.split("/").map(Number);
    if (systolic < 120 && diastolic < 80) return "정상";
    if (systolic < 140 && diastolic < 90) return "주의";
    return "관리";
  }

  if (kind === "glucose") {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return "확인 중";
    if (numeric < 100) return "양호";
    if (numeric < 126) return "주의";
    return "관리";
  }

  return value === "-" ? "확인 중" : "좋아요";
}

function statusClass(label: string) {
  if (label === "정상" || label === "좋아요") return "border-[#6ac878] text-[#209242]";
  if (label === "양호") return "border-[#f0bd59] text-[#bd7b00]";
  if (label === "주의") return "border-[#f0bd59] text-[#bd7b00]";
  if (label === "관리") return "border-[#ef8c8c] text-[#c44747]";
  return "border-[#d8e3dc] text-[#6d7d73]";
}

function buildChartPoints(points: GrowthCardioPoint[]) {
  const width = 680;
  const height = 150;
  const padX = 22;
  const padY = 18;
  const values = points.map((point) => point.value);
  const min = Math.min(...values, 20) - 1;
  const max = Math.max(...values, 30) + 1;
  const range = Math.max(max - min, 1);

  return points.map((point, index) => {
    const x =
      points.length === 1
        ? width / 2
        : padX + (index / (points.length - 1)) * (width - padX * 2);
    const y = padY + ((max - point.value) / range) * (height - padY * 2);

    return {
      ...point,
      x,
      y,
    };
  });
}

export default function GrowthRecordScreen({ data }: Props) {
  const router = useRouter();
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [weeklyChallengeIndex, setWeeklyChallengeIndex] = useState(0);
  const [displayPoint, setDisplayPoint] = useState(() =>
    sessionPoints.initialize(data.point ?? 0)
  );
  const hasCardioAgeHistory = data.cardioAgeHistory.length > 0;
  const hasBadges = data.badges.length > 0;
  const hasHealthHistory = data.healthHistory.length > 0;

  useEffect(() => {
    sessionPoints.initialize(data.point ?? 0);
    const handlePointChange = () => setDisplayPoint(sessionPoints.get());
    window.addEventListener("session-points-change", handlePointChange);
    return () => window.removeEventListener("session-points-change", handlePointChange);
  }, [data.point]);

  const currentCardioAge = hasCardioAgeHistory
    ? data.cardioAgeHistory[data.cardioAgeHistory.length - 1]?.value ?? null
    : null;

  const initialCardioAge = hasCardioAgeHistory
    ? data.cardioAgeHistory[0]?.value ?? null
    : null;

  const improvement =
    currentCardioAge !== null && initialCardioAge !== null
      ? initialCardioAge - currentCardioAge
      : null;

  const latestHealth = data.healthHistory[0];
  const latestBP = latestHealth && latestHealth.bp !== "-" ? latestHealth.bp : "-";
  const latestGlucose =
    latestHealth && latestHealth.glucose !== "-" ? latestHealth.glucose : "-";
  const latestCholesterol =
    latestHealth && latestHealth.cholesterol !== "-"
      ? latestHealth.cholesterol
      : "-";

  const fallbackWeekly = [
    { day: "월", value: 0 },
    { day: "화", value: 0 },
    { day: "수", value: 0 },
    { day: "목", value: 0 },
    { day: "금", value: 0 },
    { day: "토", value: 0 },
    { day: "일", value: 0 },
  ];
  const weeklyItems =
    data.challengeItems?.[weeklyChallengeIndex]?.weekly?.length
      ? data.challengeItems[weeklyChallengeIndex].weekly
      : data.weeklyChallenge.length > 0
        ? data.weeklyChallenge
        : fallbackWeekly;
  const weeklyTotal = weeklyItems.reduce((sum, item) => sum + item.value, 0);
  const maxWeekly = Math.max(...weeklyItems.map((item) => item.value), 1);
  const weeklyChallenges = data.challengeItems ?? [];
  const selectedWeeklyChallenge = weeklyChallenges[weeklyChallengeIndex];

  const badgeMap = useMemo(
    () =>
      new Map(
        (data.badgeCalendar ?? []).map((item) => [item.date, item])
      ),
    [data.badgeCalendar]
  );

  const monthCalendar = buildMonthCalendar(calendarDate);
  const weekLabels = ["일", "월", "화", "수", "목", "금", "토"];
  const visibleStickerCount = monthCalendar.cells.reduce((count, cell) => {
    if (!cell.fullDate) return count;
    return count + (badgeMap.get(cell.fullDate)?.badges.length ?? 0);
  }, 0);
  const today = new Date();
  const isCurrentMonth =
    calendarDate.getFullYear() === today.getFullYear() &&
    calendarDate.getMonth() === today.getMonth();
  const currentStreakDays =
    typeof data.streakDays === "number" ? data.streakDays : 0;
  const hasCurrentStreak = currentStreakDays >= 2;

  const chartPoints = hasCardioAgeHistory
    ? buildChartPoints(data.cardioAgeHistory)
    : [];
  const linePoints = chartPoints.map((point) => `${point.x},${point.y}`).join(" ");
  const areaPoints =
    chartPoints.length > 0
      ? `22,150 ${linePoints} 658,150`
      : "";

  const moveCalendarMonth = (offset: number) => {
    setCalendarDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1)
    );
  };

  const resetCalendarMonth = () => {
    setCalendarDate(new Date());
  };

  const moveWeeklyChallenge = (offset: number) => {
    if (weeklyChallenges.length === 0) return;

    setWeeklyChallengeIndex((prev) => {
      const next = prev + offset;
      if (next < 0) return weeklyChallenges.length - 1;
      if (next >= weeklyChallenges.length) return 0;
      return next;
    });
  };

  const goChallengeVerification = () => {
    if (selectedWeeklyChallenge) {
      router.push(`/challenge?focus=${encodeURIComponent(selectedWeeklyChallenge.id)}`);
      return;
    }

    router.push("/challenge");
  };

  return (
    <section className="mx-auto w-full max-w-7xl space-y-4">
      <section className="rounded-[18px] border border-[#163126]/8 bg-white px-5 py-5 shadow-[0_16px_42px_rgba(46,125,91,0.06)]">
        <div className="grid gap-5 lg:grid-cols-[190px_minmax(0,1fr)_repeat(3,minmax(150px,1fr))] lg:items-center">
          <div className="flex items-center gap-4 lg:block">
            <ProfileNameAvatar
              name={data.nickname}
              image={data.profileImage}
              className="h-28 w-28 rounded-[24px] lg:mx-auto"
              textClassName="text-base"
            />
            <div className="lg:hidden">
              <h2 className="text-2xl font-black text-[#163126]">
                {data.nickname || "사용자"}
              </h2>
              <p className="mt-1 text-sm text-[#163126]/52">
                {data.firstRecordLabel || "기록 없음"}
              </p>
            </div>
          </div>

          <div className="min-w-0">
            <h2 className="hidden text-2xl font-black text-[#163126] lg:block">
              {data.nickname || "사용자"}
            </h2>
            <p className="hidden text-sm text-[#163126]/52 lg:mt-1 lg:block">
              {data.firstRecordLabel || "기록 없음"}
            </p>

            <div className="mt-3 rounded-full bg-[#eef8e9] px-5 py-4 text-sm font-bold leading-6 text-[#163126] lg:max-w-[330px]">
              오늘도 건강 챙겨볼까요?
              <br />
              작은 실천이 큰 변화를 만들어요!
            </div>
          </div>

          <StatTile
            icon={<Flame size={30} />}
            tone="green"
            label="연속 달성"
            value={
              typeof data.streakDays === "number" ? `${data.streakDays}일` : "-"
            }
            sub="연속 달성"
          />
          <StatTile
            icon={<Star size={30} fill="currentColor" />}
            tone="yellow"
            label="포인트"
            value={`${displayPoint.toLocaleString("ko-KR")}`}
            sub="이번 주 +30"
          />
          <StatTile
            icon={<Medal size={30} />}
            tone="purple"
            label="뱃지"
            value={
              typeof data.badgeCount === "number" ? `${data.badgeCount}개` : "-"
            }
            sub="챌린지 완료 보상"
          />
        </div>
      </section>

      <section className="rounded-[18px] border border-[#163126]/8 bg-white px-5 py-5 shadow-[0_16px_42px_rgba(46,125,91,0.06)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-black text-[#163126]">심혈관 나이 변화</h3>
            <ShieldCheck size={18} className="text-[#2E7D5B]" />
          </div>
          <span className="rounded-full border border-[#dce9e0] bg-white px-3 py-1.5 text-xs font-bold text-[#163126]/62">
            최근 30일
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center">
          <div className="min-h-[190px]">
            {hasCardioAgeHistory ? (
              <div className="relative">
                <svg
                  viewBox="0 0 680 180"
                  className="h-[210px] w-full overflow-visible"
                  aria-label="심혈관 나이 변화 차트"
                >
                  <defs>
                    <linearGradient id="cardioArea" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#8bdf98" stopOpacity="0.32" />
                      <stop offset="100%" stopColor="#8bdf98" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {[35, 80, 125].map((y) => (
                    <line
                      key={y}
                      x1="22"
                      x2="658"
                      y1={y}
                      y2={y}
                      stroke="#e5eee7"
                      strokeWidth="1"
                    />
                  ))}
                  {areaPoints && (
                    <polygon points={areaPoints} fill="url(#cardioArea)" />
                  )}
                  <polyline
                    points={linePoints}
                    fill="none"
                    stroke="#42ae55"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {chartPoints.map((point, index) => (
                    <g key={`cardio-dot-${point.label}-${index}`}>
                      <circle cx={point.x} cy={point.y} r="7" fill="#2ca345" />
                      <text
                        x={point.x}
                        y={point.y - 16}
                        textAnchor="middle"
                        className="fill-[#163126] text-[15px] font-bold"
                      >
                        {point.value}세
                      </text>
                      <text
                        x={point.x}
                        y="174"
                        textAnchor="middle"
                        className="fill-[#6c7d72] text-[13px] font-semibold"
                      >
                        {point.label}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            ) : (
              <EmptyStateBox text="아직 심혈관 나이 데이터가 없어요." />
            )}
          </div>

          <div className="rounded-[18px] border border-[#dfeee2] bg-[#f8fcf7] px-5 py-5">
            <p className="text-sm font-bold text-[#163126]/55">
              현재 심혈관 나이
            </p>
            <p className="mt-3 text-4xl font-black text-[#2E9C45]">
              {currentCardioAge !== null ? `${currentCardioAge}세` : "-"}
            </p>
            <p className="mt-3 text-sm font-bold text-[#2E7D5B]">
              {improvement !== null && improvement > 0
                ? `${improvement}세 개선 중`
                : "좋아요"}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <section className="rounded-[18px] border border-[#163126]/8 bg-white px-5 py-5 shadow-[0_16px_42px_rgba(46,125,91,0.06)]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-black text-[#163126]">이번 주 챌린지</h3>
            <span className="rounded-full bg-[#eff8df] px-3 py-1 text-xs font-black text-[#5d9d1e]">
              {weeklyTotal}/7 완료
            </span>
          </div>

          <div className="rounded-[18px] border border-[#e3efe5] bg-[#fbfefb] px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => moveWeeklyChallenge(-1)}
                disabled={weeklyChallenges.length <= 1}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#2E7D5B] shadow-[0_8px_18px_rgba(46,125,91,0.08)] transition hover:-translate-y-0.5 hover:bg-[#eef8e9] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                aria-label="이전 챌린지"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#e2f7df] text-[#2E9C45]">
                  {selectedWeeklyChallenge ? (
                    <span className="text-2xl">{selectedWeeklyChallenge.icon}</span>
                  ) : (
                    <Activity size={30} />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-lg font-black text-[#163126]">
                    {selectedWeeklyChallenge?.title ?? "챌린지를 시작해보세요"}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#163126]/58">
                    {selectedWeeklyChallenge?.description ??
                      "일주일 중 5일 이상 달성해보세요!"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => moveWeeklyChallenge(1)}
                disabled={weeklyChallenges.length <= 1}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#2E7D5B] shadow-[0_8px_18px_rgba(46,125,91,0.08)] transition hover:-translate-y-0.5 hover:bg-[#eef8e9] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                aria-label="다음 챌린지"
              >
                <ChevronRight size={18} />
              </button>
              <img
                src="/images/buddy-review.png"
                alt=""
                className="hidden h-24 w-24 object-contain sm:block"
              />
            </div>

            {weeklyChallenges.length > 1 && (
              <p className="mt-3 text-center text-xs font-black text-[#163126]/45">
                {weeklyChallengeIndex + 1}/{weeklyChallenges.length}
              </p>
            )}

            <div className="mt-5 grid grid-cols-7 gap-2">
              {weeklyItems.map((item) => {
                const done = item.value > 0;
                return (
                  <div
                    key={`weekly-dot-${item.day}`}
                    className="flex flex-col items-center gap-2"
                  >
                    <span className="text-sm font-bold text-[#163126]/62">
                      {item.day}
                    </span>
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-black ${
                        done
                          ? "bg-[#39b956] text-white"
                          : "bg-[#edf2ee] text-[#9ba9a0]"
                      }`}
                    >
                      {done ? "✓" : "-"}
                    </div>
                    <div
                      className="h-1.5 w-full rounded-full bg-[#e8efe9]"
                      aria-hidden="true"
                    >
                      <div
                        className="h-full rounded-full bg-[#2E9C45]"
                        style={{ width: `${formatPercent(item.value, maxWeekly)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={goChallengeVerification}
              className="mt-5 h-11 w-full rounded-xl bg-[#22a842] text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#1d9139] hover:shadow-[0_14px_30px_rgba(46,125,91,0.16)]"
            >
              오늘 인증하기
            </button>
          </div>
        </section>

        <section className="rounded-[18px] border border-[#163126]/8 bg-white px-5 py-5 shadow-[0_16px_42px_rgba(46,125,91,0.06)]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-black text-[#163126]">건강 요약</h3>
            {data.actualAge !== null && (
              <span className="rounded-full bg-[#eff8df] px-3 py-1 text-xs font-black text-[#5d9d1e]">
                실제 나이 {data.actualAge}세
              </span>
            )}
          </div>

          <div className="space-y-3">
            <HealthSummaryRow
              icon={<Heart size={24} fill="currentColor" />}
              label="심혈관 나이"
              value={currentCardioAge !== null ? `${currentCardioAge}세` : "-"}
              status={getStatusLabel(
                currentCardioAge !== null ? currentCardioAge : "-",
                "age"
              )}
              tone="red"
            />
            <HealthSummaryRow
              icon={<Droplet size={24} fill="currentColor" />}
              label="혈압"
              value={latestBP !== "-" ? `${latestBP} mmHg` : "기록 없음"}
              status={getStatusLabel(latestBP, "bp")}
              tone="red"
            />
            <HealthSummaryRow
              icon={<Activity size={24} />}
              label="최근 혈당"
              value={latestGlucose !== "-" ? `${latestGlucose}` : "기록 없음"}
              status={getStatusLabel(latestGlucose, "glucose")}
              tone="green"
            />
          </div>
        </section>
      </div>

      <section className="rounded-[18px] border border-[#163126]/8 bg-white px-5 py-5 shadow-[0_16px_42px_rgba(46,125,91,0.06)]">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-black text-[#163126]">챌린지 기록</h3>
            <button
              type="button"
              onClick={() => moveCalendarMonth(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#edf7ec] text-[#2E7D5B] transition hover:bg-[#dff1df]"
              aria-label="이전 달"
            >
              <ChevronLeft size={17} />
            </button>
            <p className="text-lg font-black text-[#163126]">{monthCalendar.title}</p>
            <button
              type="button"
              onClick={() => moveCalendarMonth(1)}
              disabled={isCurrentMonth}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#edf7ec] text-[#2E7D5B] transition hover:bg-[#dff1df] disabled:cursor-not-allowed disabled:opacity-45"
              aria-label="다음 달"
            >
              <ChevronRight size={17} />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-black text-[#163126]/62 sm:text-sm">
            <LegendDot icon="✓" className="bg-[#59c76a] text-white" text="일일 스티커" />
            <LegendDot icon="🏅" className="bg-[#f3d36b] text-[#7a4b00]" text="완료 뱃지" />
            {hasCurrentStreak && (
              <LegendDot
                icon="🔥"
                className="bg-[#fff1db] text-[#f08a16]"
                text={`${currentStreakDays}일 연속 달성`}
              />
            )}
            <LegendDot icon="-" className="bg-[#e5e8e6] text-[#9aa59f]" text="미달성" />
            <button
              type="button"
              onClick={resetCalendarMonth}
              disabled={isCurrentMonth}
              className="ml-0 inline-flex h-9 items-center gap-2 rounded-full border border-[#8acb98] bg-white px-4 text-sm font-black text-[#229542] transition hover:bg-[#f0fbf2] disabled:cursor-not-allowed disabled:opacity-45 lg:ml-2"
            >
              <Plus size={15} />
              이번 달
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 overflow-visible rounded-[18px] border border-[#e0ece2]">
          {weekLabels.map((label) => (
            <div
              key={`week-${label}`}
              className="border-b border-[#e0ece2] bg-[#fbfdfb] py-3 text-center text-sm font-black text-[#163126]/50"
            >
              {label}
            </div>
          ))}

          {monthCalendar.cells.map((cell) => {
            const calendarItem = cell.fullDate ? badgeMap.get(cell.fullDate) : null;
            const stickers = [...(calendarItem?.badges ?? [])].sort((a, b) =>
              a.kind === b.kind ? 0 : a.kind === "badge" ? -1 : 1
            );
            const visibleStickers = stickers.slice(0, 4);

            return (
              <div
                key={`month-cell-${cell.key}`}
                className={`min-h-[86px] border-r border-b border-[#e0ece2] px-3 py-2 last:border-r-0 ${
                  cell.day ? "bg-white" : "bg-[#fbfdfb]"
                } ${cell.isToday ? "ring-2 ring-inset ring-[#45ba60]" : ""}`}
              >
                {cell.day ? (
                  <div className="flex h-full flex-col justify-between gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-sm font-black ${
                            cell.isToday
                              ? "rounded-full bg-[#163126] px-2 py-0.5 text-white"
                              : "text-[#163126]"
                          }`}
                        >
                          {cell.day}
                        </span>
                        {calendarItem?.streak && (
                          <span
                            title="2일 이상 연속 달성"
                            className="flex h-5 w-5 items-center justify-center rounded-full bg-[#fff1db] text-[12px] text-[#f08a16]"
                          >
                            🔥
                          </span>
                        )}
                      </div>
                      {cell.isToday && (
                        <span className="text-xs font-black text-[#2E9C45]">오늘</span>
                      )}
                    </div>

                    <div className="flex min-h-[38px] items-center justify-center">
                      {visibleStickers.length > 0 ? (
                        <div className="flex flex-wrap items-center justify-center gap-1.5">
                          {visibleStickers.map((sticker, stickerIndex) => (
                            <button
                              type="button"
                              key={`${cell.fullDate}-${sticker.name}-${stickerIndex}`}
                              aria-label={`${sticker.name} ${
                                sticker.kind === "badge"
                                  ? "챌린지 완료 뱃지"
                                  : "일일 챌린지 스티커"
                              }`}
                              className={`group relative flex h-7 w-7 items-center justify-center rounded-full text-sm font-black shadow-[0_4px_10px_rgba(46,125,91,0.10)] transition-all duration-200 hover:-translate-y-0.5 hover:scale-110 hover:shadow-[0_8px_18px_rgba(46,125,91,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E9C45]/35 ${
                                sticker.kind === "badge"
                                  ? "bg-[#f3d36b] text-[#7a4b00] ring-2 ring-[#fff3bf]"
                                  : "bg-[#59c76a] text-white"
                              }`}
                            >
                              {sticker.icon || "✓"}
                              <span className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 max-w-[150px] -translate-x-1/2 whitespace-nowrap rounded-full bg-[#163126] px-3 py-1.5 text-[11px] font-black text-white opacity-0 shadow-[0_10px_24px_rgba(22,49,38,0.18)] transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                                {sticker.name}
                              </span>
                            </button>
                          ))}
                          {stickers.length > visibleStickers.length && (
                            <div className="flex h-7 min-w-7 items-center justify-center rounded-full bg-[#eef7f0] px-2 text-[11px] font-black text-[#2E7D5B]">
                              +{stickers.length - visibleStickers.length}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e5e8e6] text-sm font-black text-[#a0aaa4]">
                          -
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <p className="mt-3 text-right text-xs font-semibold text-[#163126]/45">
          {visibleStickerCount}개 스티커/뱃지 표시 중
        </p>
      </section>

      <section className="rounded-[18px] border border-[#163126]/8 bg-white px-5 py-5 shadow-[0_16px_42px_rgba(46,125,91,0.06)]">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#fff3db] text-2xl">
              📋
            </div>
            <h3 className="text-xl font-black text-[#163126]">건강 수치 히스토리</h3>
          </div>
          <span className="text-sm font-bold text-[#163126]/45">검진 기록 기준</span>
        </div>

        {hasHealthHistory ? (
          <div className="overflow-x-auto rounded-[16px] border border-[#e0ece2]">
            <table className="min-w-full text-sm">
              <thead className="bg-[#fbfdfb] text-left text-[#163126]/52">
                <tr>
                  <th className="px-5 py-3">날짜</th>
                  <th className="px-5 py-3">혈압</th>
                  <th className="px-5 py-3">혈당</th>
                  <th className="px-5 py-3">콜레스테롤</th>
                  <th className="px-5 py-3">심혈관 나이</th>
                </tr>
              </thead>
              <tbody>
                {data.healthHistory.map((row, index) => (
                  <tr
                    key={`health-history-${row.date}-${row.bp}-${row.glucose}-${row.cholesterol}-${row.cardioAge ?? "na"}-${index}`}
                    className="border-t border-[#e0ece2] font-bold text-[#163126]"
                  >
                    <td className="px-5 py-3">{row.date}</td>
                    <td className="px-5 py-3">{row.bp}</td>
                    <td className="px-5 py-3">{row.glucose}</td>
                    <td className="px-5 py-3">{row.cholesterol}</td>
                    <td className="px-5 py-3">
                      {typeof row.cardioAge === "number" ? `${row.cardioAge}세` : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyStateBox text="아직 표시할 건강 기록이 없어요." />
        )}
      </section>

      <section className="relative overflow-hidden rounded-[18px] border border-[#163126]/8 bg-white px-5 py-5 shadow-[0_16px_42px_rgba(46,125,91,0.06)]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-black text-[#163126]">획득 뱃지</h3>
          <span className="text-sm font-black text-[#2E9C45]">
            {data.earnedBadgeCount ?? 0}/{data.badges.length} 획득
          </span>
        </div>

        {hasBadges ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {data.badges.map((badge, index) => (
              <div
                key={`badge-${badge.name}-${badge.icon}-${index}`}
                className={`flex items-center gap-3 rounded-[16px] px-4 py-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(46,125,91,0.10)] ${
                  badge.earned
                    ? "bg-[#edf9ef]"
                    : "bg-[#f3f5f3]"
                }`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-[12px] text-xl ${
                    badge.earned ? "bg-[#ecf9ef]" : "bg-[#f1f2f1]"
                  }`}
                >
                  {badge.earned ? badge.icon : "🔒"}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-[#163126]">
                    {badge.name}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-[#163126]/45">
                    {badge.earned ? "획득 완료" : "목표 달성 시 획득"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyStateBox text="완료한 챌린지가 생기면 뱃지가 표시돼요." />
        )}

        <div className="mt-5 flex items-center justify-end gap-4">
          <div className="rounded-full bg-[#eef8e9] px-5 py-3 text-sm font-black text-[#2E7D5B]">
            하나씩 달성하며 건강한 습관을 만들어가요!
          </div>
          <img
            src="/images/buddy-bubble.png"
            alt=""
            className="hidden h-28 w-28 object-contain sm:block"
          />
        </div>
      </section>
    </section>
  );
}

function StatTile({
  icon,
  tone,
  label,
  value,
  sub,
}: {
  icon: ReactNode;
  tone: "green" | "yellow" | "purple";
  label: string;
  value: string;
  sub: string;
}) {
  const toneClass = {
    green: "bg-[#e6f8ec] text-[#13a45a]",
    yellow: "bg-[#fff4cf] text-[#f4b000]",
    purple: "bg-[#f2e7ff] text-[#8b52df]",
  }[tone];
  const tileClass = {
    green: "bg-[#f0fbf3]",
    yellow: "bg-[#fff8df]",
    purple: "bg-[#f7f0ff]",
  }[tone];

  return (
    <div
      className={`rounded-[18px] px-4 py-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(46,125,91,0.10)] ${tileClass}`}
    >
      <div className="flex items-center gap-3">
        <div className={`flex h-12 w-12 items-center justify-center rounded-full ${toneClass}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black text-[#163126]/62">{label}</p>
          <p className="text-3xl font-black text-[#163126]">{value}</p>
          <p className="mt-1 text-xs font-bold text-[#2E9C45]">{sub}</p>
        </div>
      </div>
    </div>
  );
}

function HealthSummaryRow({
  icon,
  label,
  value,
  status,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  status: string;
  tone: "red" | "green";
}) {
  const rowClass =
    tone === "red"
      ? "bg-[#fff6f5] hover:shadow-[0_14px_30px_rgba(240,90,90,0.10)]"
      : "bg-[#f0fbf3] hover:shadow-[0_14px_30px_rgba(46,125,91,0.10)]";

  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-[18px] px-4 py-4 transition-all duration-300 hover:-translate-y-1 ${rowClass}`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
            tone === "red"
              ? "bg-[#fff0f0] text-[#f05a5a]"
              : "bg-[#eaf8ed] text-[#2E9C45]"
          }`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#163126]/58">{label}</p>
          <p className="mt-1 text-xl font-black text-[#163126]">{value}</p>
        </div>
      </div>
      <span
        className={`shrink-0 rounded-full border px-3 py-1 text-xs font-black ${statusClass(
          status
        )}`}
      >
        {status}
      </span>
    </div>
  );
}

function LegendDot({
  icon,
  text,
  className,
}: {
  icon: string;
  text: string;
  className: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f7faf8] px-2.5 py-1.5">
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-black ${className}`}
      >
        {icon}
      </span>
      {text}
    </span>
  );
}

function EmptyStateBox({ text }: { text: string }) {
  return (
    <div className="rounded-[16px] border border-dashed border-[#d9e7db] bg-[#f9fcfa] px-5 py-8 text-center text-sm font-semibold leading-6 text-[#163126]/45">
      {text}
    </div>
  );
}
