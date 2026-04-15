"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import { storage } from "@/src/utils/storage";
import { logoutUser } from "@/src/api/user";
import { getHealthRecords } from "@/src/api/health";
import { getAnalysisHistory } from "@/src/api/analysis";
import {
  syncHealthFlowComplete,
  clearHealthFlowComplete,
} from "@/src/utils/health-flow";

type Props = {
  title?: string;
  children: React.ReactNode;
  isGuest?: boolean;
  onRequireLogin?: () => void;
};

export default function AppShell({
  title,
  children,
  isGuest = false,
  onRequireLogin,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);
  const [displayName, setDisplayName] = useState("버디");
  const [profileImage, setProfileImage] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const token = storage.getAccessToken();
    setIsLoggedIn(Boolean(token) && !isGuest);

    if (!token || isGuest) {
      const storedGuest = sessionStorage.getItem("guest-profile");

      if (isGuest && storedGuest) {
        try {
          const parsed = JSON.parse(storedGuest);
          if (parsed?.nickname) {
            setDisplayName(parsed.nickname);
            setProfileImage(parsed.profile_image ?? "");
            return;
          }
        } catch (error) {
          console.error("guest-profile 파싱 실패:", error);
        }
      }

      setDisplayName("버디");
      setProfileImage("");
      return;
    }

    const user = storage.getUser();

    if (user?.nickname) {
      setDisplayName(user.nickname);
      setProfileImage(user.profile_image ?? "");
      return;
    }

    setDisplayName("버디");
    setProfileImage("");
  }, [mounted, pathname, isGuest]);

  useEffect(() => {
    if (!mounted) return;

    const token = storage.getAccessToken();

    if (!token || isGuest) {
      clearHealthFlowComplete();
      return;
    }

    const syncFlow = async () => {
      try {
        const [recordsRes, analysisRes] = await Promise.all([
          getHealthRecords().catch(() => []),
          getAnalysisHistory().catch(() => ({ items: [] })),
        ]);

        const hasHealthRecord = Array.isArray(recordsRes)
          ? recordsRes.length > 0
          : Array.isArray((recordsRes as { records?: unknown[] })?.records)
          ? ((recordsRes as { records: unknown[] }).records?.length ?? 0) > 0
          : false;

        const hasAnalysisHistory =
          Array.isArray(analysisRes?.items) && analysisRes.items.length > 0;

        syncHealthFlowComplete({
          hasHealthRecord,
          hasAnalysisHistory,
        });
      } catch (error) {
        console.error("health flow 동기화 실패:", error);
      }
    };

    void syncFlow();
  }, [mounted, pathname, isGuest]);

  const handleAuthButtonClick = async () => {
    if (!isLoggedIn) {
      if (onRequireLogin) {
        onRequireLogin();
        return;
      }

      router.push("/login");
      return;
    }

    const confirmed = window.confirm("로그아웃 하시겠어요?");
    if (!confirmed) return;

    try {
      setLoggingOut(true);
      await logoutUser();
      setDisplayName("버디");
      setProfileImage("");
      setIsLoggedIn(false);
      alert("로그아웃 되었어요.");
      window.location.replace("/login");
    } catch (error) {
      console.error("로그아웃 실패:", error);
      alert("로그아웃에 실패했어요.");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7faf8]">
      <Sidebar
        isGuest={isGuest}
        onRequireLogin={onRequireLogin}
        displayName={displayName}
        profileImage={profileImage}
      />

      <div className="min-h-screen md:pl-[260px]">
        <div className="flex min-h-screen min-w-0 flex-col">
          <header className="sticky top-0 z-20 border-b border-[#e7efe9] bg-[#f7faf8]/88 backdrop-blur-md">
            <div className="flex items-center justify-between px-4 py-4 md:px-6 xl:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2E7D5B]">
                MyHealthBuddy
              </p>

              <button
                onClick={handleAuthButtonClick}
                disabled={!mounted || loggingOut}
                className="shrink-0 rounded-full border border-[#163126]/10 bg-white px-4 py-2 text-sm font-medium text-[#163126] transition hover:bg-[#f8fbf8] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {!mounted
                  ? ""
                  : isLoggedIn
                  ? loggingOut
                    ? "로그아웃 중..."
                    : "로그아웃"
                  : "로그인"}
              </button>
            </div>

            {isGuest && (
              <div className="px-4 pb-4 md:px-6 xl:px-8">
                <div className="rounded-2xl border border-[#2E7D5B]/10 bg-[#f4faf6] px-4 py-3 text-sm leading-6 text-[#163126]/70">
                  현재 게스트 체험 중이에요. 로그인 후 챌린지, 식단 분석,
                  성장 기록, 마이페이지 등 다른 서비스를 이용할 수 있어요.
                </div>
              </div>
            )}
          </header>

          <main className="min-w-0 flex-1 px-4 py-5 pb-24 md:px-6 md:py-6 md:pb-8 xl:px-8 xl:py-8">
            {title ? (
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-[#163126] md:text-3xl">
                  {title}
                </h1>
              </div>
            ) : null}

            {children}
          </main>
        </div>
      </div>

      <BottomNav
        isGuest={isGuest}
        onRequireLogin={onRequireLogin}
        displayName={displayName}
      />
    </div>
  );
}