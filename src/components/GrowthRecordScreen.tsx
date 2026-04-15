"use client";

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

export type GrowthBadge = {
  name: string;
  icon: string;
  earned: boolean;
  earnedDate?: string;
};

export type GrowthBadgeSticker = {
  date: string;
  badges: {
    name: string;
    icon: string;
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
  earnedBadgeCount?: number | null;
  badges: GrowthBadge[];
  badgeCalendar: GrowthBadgeSticker[];
};

type Props = {
  data: GrowthRecordViewData;
};

function buildMonthCalendar(baseDate = new Date()) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0).getDate();
  const startWeekday = firstDay.getDay();

  const cells: Array<{
    key: string;
    day: number | null;
    fullDate: string | null;
    isToday: boolean;
  }> = [];

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

export default function GrowthRecordScreen({ data }: Props) {
  const hasCardioAgeHistory = data.cardioAgeHistory.length > 0;
  const hasWeeklyChallenge = data.weeklyChallenge.length > 0;
  const hasBadges = data.badges.length > 0;
  const hasHealthHistory = data.healthHistory.length > 0;

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

  const latestBP =
    latestHealth && latestHealth.bp !== "-" ? latestHealth.bp : "-";

  const latestGlucose =
    latestHealth && latestHealth.glucose !== "-"
      ? latestHealth.glucose
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

  const weeklyItems = hasWeeklyChallenge ? data.weeklyChallenge : fallbackWeekly;
  const maxBar = Math.max(...weeklyItems.map((item) => item.value), 1);

  const badgeMap = new Map(
    (data.badgeCalendar ?? []).map((item) => [item.date, item.badges])
  );

  const monthCalendar = buildMonthCalendar();
  const weekLabels = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <section className="mx-auto w-full max-w-7xl space-y-6">
      <div className="rounded-[28px] border border-[#163126]/8 bg-white/82 p-6 shadow-[0_18px_50px_rgba(46,125,91,0.06)]">
        <div className="grid gap-5 lg:grid-cols-[180px_1fr] lg:items-center">
          <div className="flex items-center justify-center rounded-[24px] bg-[#f7fbf8] p-5">
            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-[#f1f8eb] text-6xl">
              {data.profileImage ? (
                <img
                  src={data.profileImage}
                  alt="프로필 이미지"
                  className="h-full w-full object-cover"
                />
              ) : (
                "🐹"
              )}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-[#163126]">
              {data.nickname || "사용자"}
            </h2>
            <p className="mt-1 text-sm text-[#163126]/55">
              {data.firstRecordLabel || "기록 없음"}
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <SummaryBox
                label="연속 달성"
                value={
                  typeof data.streakDays === "number" ? `${data.streakDays}일` : "-"
                }
              />
              <SummaryBox label="포인트" value={`${data.point ?? 0}`} />
              <SummaryBox
                label="뱃지"
                value={
                  typeof data.badgeCount === "number" ? `${data.badgeCount}개` : "-"
                }
                highlight
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-[#163126]/8 bg-white/82 p-6 shadow-[0_18px_50px_rgba(46,125,91,0.06)]">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xl font-bold text-[#163126]">심혈관 나이 변화</h3>
          {improvement !== null && improvement > 0 && (
            <span className="rounded-full bg-[#eff8df] px-3 py-1 text-xs font-semibold text-[#6a8c1e]">
              {improvement}세 개선 중
            </span>
          )}
        </div>

        {hasCardioAgeHistory ? (
          <div className="mt-6">
            <div className="relative flex items-center justify-between gap-2">
              <div className="absolute left-0 right-0 top-4 h-[2px] bg-[#dfeadf]" />
              {data.cardioAgeHistory.map((item, index) => (
                <div
                  key={`cardio-age-${item.label}-${item.value}-${index}`}
                  className="relative z-10 flex flex-1 flex-col items-center"
                >
                  <div
                    className={`flex h-4 w-4 rounded-full border-4 ${
                      index === data.cardioAgeHistory.length - 1
                        ? "border-[#2E7D5B] bg-[#2E7D5B]"
                        : "border-[#d6e7d7] bg-white"
                    }`}
                  />
                  <p className="mt-3 text-lg font-bold text-[#2E7D5B]">
                    {item.value}세
                  </p>
                  <p className="mt-1 text-center text-xs text-[#163126]/55">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyStateBox text="아직 심혈관 나이 데이터가 없어요. 건강 분석 결과가 연결되면 여기에 변화가 표시돼요." />
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-[28px] border border-[#163126]/8 bg-white/82 p-6 shadow-[0_18px_50px_rgba(46,125,91,0.06)]">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-xl font-bold text-[#163126]">이번 주 챌린지</h3>
            <span className="rounded-full bg-[#eff8df] px-3 py-1 text-xs font-semibold text-[#6a8c1e]">
              {weeklyItems.reduce((sum, item) => sum + item.value, 0)}회
            </span>
          </div>

          <div className="flex h-56 items-end justify-between gap-3">
            {weeklyItems.map((item, index) => (
              <div
                key={`weekly-${item.day}-${item.value}-${index}`}
                className="flex flex-1 flex-col items-center gap-3"
              >
                <div className="flex h-40 w-full items-end">
                  <div
                    className={`w-full rounded-t-2xl ${
                      hasWeeklyChallenge
                        ? "bg-[linear-gradient(180deg,#6fc17d_0%,#4ea85d_100%)]"
                        : "bg-[#dfe9e1]"
                    }`}
                    style={{ height: `${(item.value / maxBar) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-[#163126]/60">
                  {item.day}
                </span>
              </div>
            ))}
          </div>

          {!hasWeeklyChallenge && (
            <div className="mt-5">
              <EmptyStateBox
                text="아직 이번 주 챌린지 기록이 없어요. 챌린지 데이터가 연결되면 이곳에 주간 진행 상황이 보여요."
                compact
              />
            </div>
          )}
        </div>

        <div className="rounded-[28px] border border-[#163126]/8 bg-white/82 p-6 shadow-[0_18px_50px_rgba(46,125,91,0.06)]">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-xl font-bold text-[#163126]">건강 요약</h3>
            {data.actualAge !== null && (
              <span className="rounded-full bg-[#eff8df] px-3 py-1 text-xs font-semibold text-[#6a8c1e]">
                실제 나이 {data.actualAge}세
              </span>
            )}
          </div>

          <div className="space-y-4">
            <InfoCard
              label="현재 심혈관 나이"
              value={currentCardioAge !== null ? `${currentCardioAge}세` : "-"}
            />
            <InfoCard
              label="최근 혈압"
              value={latestBP !== "-" ? latestBP : "기록 없음"}
            />
            <InfoCard
              label="최근 혈당"
              value={latestGlucose !== "-" ? `${latestGlucose}` : "기록 없음"}
            />
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-[#163126]/8 bg-white/82 p-6 shadow-[0_18px_50px_rgba(46,125,91,0.06)]">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-xl font-bold text-[#163126]">챌린지 기록</h3>
          <span className="text-sm text-[#163126]/45">
            챌린지 기록을 스티커로 표시해요.
          </span>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <p className="text-lg font-bold text-[#163126]">{monthCalendar.title}</p>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {weekLabels.map((label) => (
            <div
              key={`week-${label}`}
              className="py-2 text-center text-sm font-semibold text-[#163126]/45"
            >
              {label}
            </div>
          ))}

          {monthCalendar.cells.map((cell, index) => {
            const stickers = cell.fullDate ? badgeMap.get(cell.fullDate) ?? [] : [];

            return (
              <div
                key={`month-cell-${cell.key}-${index}`}
                className={`min-h-[110px] rounded-[18px] border p-2 ${
                  cell.day
                    ? "border-[#e4eee5] bg-[#f9fcfa]"
                    : "border-transparent bg-transparent"
                }`}
              >
                {cell.day ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-sm font-semibold ${
                          cell.isToday
                            ? "rounded-full bg-[#163126] px-2 py-0.5 text-white"
                            : "text-[#163126]"
                        }`}
                      >
                        {cell.day}
                      </span>

                      {stickers.length > 0 && (
                        <span className="text-[11px] text-[#2E7D5B]">
                          {stickers.length}개
                        </span>
                      )}
                    </div>

                    {stickers.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {stickers.slice(0, 3).map((badge, stickerIndex) => (
                          <div
                            key={`calendar-badge-${cell.fullDate}-${badge.name}-${stickerIndex}`}
                            title={badge.name}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-base shadow-[0_4px_12px_rgba(46,125,91,0.08)]"
                          >
                            {badge.icon}
                          </div>
                        ))}

                        {stickers.length > 3 && (
                          <div className="flex h-8 min-w-[32px] items-center justify-center rounded-full bg-[#eef7f0] px-2 text-[11px] font-semibold text-[#2E7D5B]">
                            +{stickers.length - 3}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-3 rounded-[12px] border border-dashed border-[#d9e7db] px-2 py-4 text-center text-[11px] text-[#163126]/30">
                        없음
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-[28px] border border-[#163126]/8 bg-white/82 p-6 shadow-[0_18px_50px_rgba(46,125,91,0.06)]">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-xl font-bold text-[#163126]">건강 수치 히스토리</h3>
          <span className="text-sm text-[#163126]/45">검진 기록 기준</span>
        </div>

        {hasHealthHistory ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left text-sm text-[#163126]/45">
                  <th className="px-3 py-2">날짜</th>
                  <th className="px-3 py-2">혈압</th>
                  <th className="px-3 py-2">혈당</th>
                  <th className="px-3 py-2">콜레스테롤</th>
                  <th className="px-3 py-2">심혈관 나이</th>
                </tr>
              </thead>
              <tbody>
                {data.healthHistory.map((row, index) => (
                  <tr
                    key={`health-history-${row.date}-${row.bp}-${row.glucose}-${row.cholesterol}-${row.cardioAge ?? "na"}-${index}`}
                    className="rounded-2xl bg-[#f9fcfa] text-sm font-medium text-[#163126]"
                  >
                    <td className="px-3 py-3">{row.date}</td>
                    <td className="px-3 py-3">{row.bp}</td>
                    <td className="px-3 py-3">{row.glucose}</td>
                    <td className="px-3 py-3">{row.cholesterol}</td>
                    <td className="px-3 py-3">
                      {typeof row.cardioAge === "number" ? `${row.cardioAge}세` : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyStateBox text="아직 표시할 건강 기록이 없어요. 건강검진 수치를 입력하면 이곳에 기록이 쌓여요." />
        )}
      </div>

      <div className="rounded-[28px] border border-[#163126]/8 bg-white/82 p-6 shadow-[0_18px_50px_rgba(46,125,91,0.06)]">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-xl font-bold text-[#163126]">획득 뱃지</h3>
          <span className="text-sm font-semibold text-[#6a8c1e]">
            {data.earnedBadgeCount ?? 0}/{data.badges.length} 획득
          </span>
        </div>

        {hasBadges ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {data.badges.map((badge, index) => (
              <div
                key={`badge-${badge.name}-${badge.icon}-${index}`}
                className={`rounded-[22px] border p-5 text-center ${
                  badge.earned
                    ? "border-[#dfeadf] bg-[#f9fcfa]"
                    : "border-[#eef2ef] bg-[#fbfcfb] opacity-40"
                }`}
              >
                <div className="text-3xl">{badge.icon}</div>
                <p className="mt-3 text-sm font-semibold text-[#163126]">
                  {badge.name}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyStateBox text="아직 획득한 뱃지가 없어요. 기록이 쌓이면 이곳에 뱃지가 표시돼요." />
        )}
      </div>
    </section>
  );
}

function SummaryBox({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-[22px] px-5 py-5 text-center ${
        highlight ? "border border-[#8cc89b] bg-white" : "bg-[#f7fbf8]"
      }`}
    >
      <p className="text-sm font-semibold text-[#163126]/45">{label}</p>
      <p className="mt-2 text-3xl font-bold text-[#45a65b]">{value}</p>
    </div>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[22px] bg-[#f7fbf8] px-5 py-5">
      <p className="text-sm font-semibold text-[#163126]/45">{label}</p>
      <p className="mt-2 text-2xl font-bold text-[#163126]">{value}</p>
    </div>
  );
}

function EmptyStateBox({
  text,
  compact = false,
}: {
  text: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-[20px] border border-dashed border-[#d9e7db] bg-[#f9fcfa] text-center text-sm leading-6 text-[#163126]/45 ${
        compact ? "px-4 py-4" : "mt-6 px-5 py-8"
      }`}
    >
      {text}
    </div>
  );
}