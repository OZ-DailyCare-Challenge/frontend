"use client";

import { useState, useEffect } from "react";
import AppShell from "@/src/components/AppShell";
import { storage } from "@/src/utils/storage";

type FeedItem = {
  user_id: number;
  nickname: string;
  profile_image?: string | null;
  challenge_title: string;
  log_date: string;
  current_streak: number;
  created_at: string;
};

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

async function postCheer(): Promise<void> {
  const accessToken = storage.getAccessToken();
  if (!accessToken) return;
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  await fetch(`${apiBaseUrl}/api/v1/social/feed/cheer`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export default function SocialFeedPage() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cheered, setCheered] = useState<Set<string>>(new Set());

  useEffect(() => {
    getFeed()
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCheer = async (key: string) => {
    setCheered((prev) => new Set(prev).add(key));
    await postCheer();
  };

  return (
    <AppShell title="함께하기">
      <div className="mx-auto max-w-xl space-y-3">
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
        {items.map((item) => {
          const key = `${item.user_id}-${item.created_at}`;
          const ischeered = cheered.has(key);
          return (
            <div
              key={key}
              className="flex items-center justify-between rounded-2xl border border-[#e7efe9] bg-white px-4 py-4"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#e7efe9]">
                  {item.profile_image ? (
                    <img src={item.profile_image} alt={item.nickname} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-[#2E7D5B]">
                      {item.nickname[0]}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#163126]">
                    {item.nickname}
                    <span className="ml-1 font-normal text-[#163126]/50">님이</span>
                  </p>
                  <p className="text-sm text-[#2E7D5B] font-medium">{item.challenge_title}</p>
                  <p className="mt-0.5 text-xs text-[#163126]/40">
                    {item.current_streak}일 연속 · {item.log_date}
                  </p>
                </div>
              </div>
              <button
                onClick={() => void handleCheer(key)}
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
