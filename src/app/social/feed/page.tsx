"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import AppShell from "@/src/components/AppShell";
import { storage } from "@/src/utils/storage";
import ProfileNameAvatar from "@/src/components/ProfileNameAvatar";

type FeedItem = {
  challenge_id: number;
  user_challenge_id: number;
  challenge_log_id?: number | null;
  user_id: number;
  nickname: string;
  profile_image?: string | null;
  challenge_title: string;
  log_date?: string | null;
  current_streak: number;
  created_at: string;
  certified_today: boolean;
};

const mockFeedItems: FeedItem[] = [
  {
    challenge_id: 1,
    user_challenge_id: 101,
    challenge_log_id: 1,
    user_id: 1,
    nickname: "이형석",
    challenge_title: "물 2L 마시기",
    log_date: "2026-05-01",
    current_streak: 3,
    created_at: "2026-05-01T09:00:00",
    certified_today: true,
  },
  {
    challenge_id: 2,
    user_challenge_id: 102,
    challenge_log_id: null,
    user_id: 2,
    nickname: "김민지",
    challenge_title: "30분 걷기",
    log_date: null,
    current_streak: 5,
    created_at: "2026-05-01T08:30:00",
    certified_today: false,
  },
  {
    challenge_id: 3,
    user_challenge_id: 103,
    challenge_log_id: 3,
    user_id: 3,
    nickname: "최지영",
    challenge_title: "저염식 식단 지키기",
    log_date: "2026-05-01",
    current_streak: 2,
    created_at: "2026-05-01T07:40:00",
    certified_today: true,
  },
];

function parseFeedLogDate(logDate?: string | null) {
  if (!logDate) return null;

  const [year, month, day] = logDate.split("-").map(Number);
  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
}

function getFeedTodayStatusLabel(item: FeedItem) {
  return item.certified_today ? "오늘 인증 완료" : "오늘 아직 인증하지 않았어요";
}

function getFeedItemTime(item: FeedItem) {
  const createdAtTime = new Date(item.created_at).getTime();
  if (Number.isFinite(createdAtTime)) return createdAtTime;

  const logDate = parseFeedLogDate(item.log_date);
  return logDate?.getTime() ?? 0;
}

function getFeedChallengeKey(item: FeedItem) {
  return `${item.user_id}:${item.challenge_title.trim().toLowerCase()}`;
}

function getLatestFeedItemsByChallenge(items: FeedItem[]) {
  const map = new Map<string, FeedItem>();

  items.forEach((item) => {
    const key = getFeedChallengeKey(item);
    const current = map.get(key);
    if (!current || getFeedItemTime(item) > getFeedItemTime(current)) {
      map.set(key, item);
    }
  });

  return Array.from(map.values()).sort(
    (a, b) => Number(b.certified_today) - Number(a.certified_today) || getFeedItemTime(b) - getFeedItemTime(a)
  );
}

async function getFeed(): Promise<FeedItem[]> {
  const accessToken = storage.getAccessToken();
  if (!accessToken) throw new Error("액세스 토큰이 없습니다.");
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const response = await fetch(`${apiBaseUrl}/api/v1/social/feed`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error("피드 조회 실패");
  const data = await response.json();
  return data.items ?? [];
}

async function postCheer(targetUserId: number, challengeLogId?: number | null): Promise<void> {
  const accessToken = storage.getAccessToken();
  if (!accessToken) return;
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const response = await fetch(`${apiBaseUrl}/api/v1/social/feed/cheer`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      target_user_id: targetUserId,
      challenge_log_id: challengeLogId ?? null,
    }),
  });

  if (!response.ok) throw new Error("응원 보내기 실패");
}

export default function SocialFeedPage() {
  const router = useRouter();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cheered, setCheered] = useState<Set<string>>(new Set());

  useEffect(() => {
    const isMockPreview =
      process.env.NODE_ENV === "development" &&
      new URLSearchParams(window.location.search).get("mock") === "1";

    if (isMockPreview) {
      const timer = window.setTimeout(() => {
        setItems(mockFeedItems);
        setLoading(false);
      }, 0);
      return () => window.clearTimeout(timer);
    }

    getFeed()
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCheer = async (
    key: string,
    targetUserId: number,
    challengeLogId?: number | null
  ) => {
    setCheered((prev) => new Set(prev).add(key));
    try {
      await postCheer(targetUserId, challengeLogId);
    } catch (error) {
      console.error("응원 보내기 실패:", error);
      setCheered((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      alert("응원 보내기에 실패했어요.");
    }
  };

  return (
    <AppShell title="친구 활동">
      <div className="mx-auto w-full max-w-3xl space-y-5">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="inline-flex items-center gap-2 rounded-full border border-[#dce9e0] bg-white px-4 py-2.5 text-sm font-semibold text-[#163126]/72 transition hover:bg-[#f4fbf6] hover:text-[#163126]"
        >
          <ArrowLeft size={16} />
          대시보드
        </button>

        <div className="rounded-[28px] border border-[#163126]/8 bg-white px-5 py-5 shadow-[0_18px_50px_rgba(46,125,91,0.06)]">
          <div>
            <p className="text-sm font-semibold text-[#2E7D5B]">
              친구 활동 전체보기
            </p>
            <p className="mt-2 text-sm text-[#163126]/58">
              친구들의 오늘 챌린지 상태를 한 번에 확인해보세요.
            </p>
          </div>
        </div>

        {loading && (
          <p className="py-10 text-center text-sm text-[#163126]/40">불러오는 중...</p>
        )}
        {!loading && items.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-[#e7efe9] bg-white px-6 py-16 text-center">
            <p className="text-base font-semibold text-[#163126]">아직 피드가 없어요</p>
            <p className="text-sm text-[#163126]/50">
              친구가 챌린지를 인증하면 여기에 표시돼요.
            </p>
          </div>
        )}
        {getLatestFeedItemsByChallenge(items).map((item) => {
          const cardKey = `${item.user_id}-${item.user_challenge_id}`;
          const cheerKey = `friend-${item.user_id}`;
          const ischeered = cheered.has(cheerKey);
          return (
            <div
              key={cardKey}
              className="flex items-center justify-between rounded-2xl border border-[#e7efe9] bg-white px-4 py-4"
            >
              <div className="flex items-center gap-3">
                <ProfileNameAvatar
                  name={item.nickname}
                  image={item.profile_image}
                  className="h-10 w-10"
                  textClassName="text-[10px]"
                />
                <div>
                  <p className="text-sm font-semibold text-[#163126]">
                    {item.nickname}
                  </p>
                  <p className="text-sm text-[#2E7D5B] font-medium">{item.challenge_title}</p>
                  <p className="mt-0.5 text-xs text-[#163126]/40">
                    {item.current_streak}일 연속 · {getFeedTodayStatusLabel(item)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => void handleCheer(cheerKey, item.user_id, item.challenge_log_id)}
                disabled={ischeered}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  ischeered
                    ? "bg-[#eaf7ee] text-[#2E7D5B] cursor-default"
                    : "bg-[#2E7D5B]/10 text-[#2E7D5B] hover:bg-[#2E7D5B]/20"
                }`}
              >
                {ischeered ? "응원했어요 💚" : "응원하기"}
              </button>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
