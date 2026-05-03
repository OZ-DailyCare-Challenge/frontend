"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import { logoutUser } from "@/src/api/user";
import { useAccessStore } from "@/src/store/access-store";

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
  const [loggingOut, setLoggingOut] = useState(false);

  const hydrated = useAccessStore((state) => state.hydrated);
  const accessLevel = useAccessStore((state) => state.accessLevel);
  const initialize = useAccessStore((state) => state.initialize);
  const setGuestSession = useAccessStore((state) => state.setGuestSession);
  const clearClientSession = useAccessStore((state) => state.clearClientSession);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    if (!hydrated) return;
    if (!isGuest) return;
    if (accessLevel !== "guest") return;

    setGuestSession();
  }, [hydrated, isGuest, accessLevel, setGuestSession]);

  const isLoggedIn = accessLevel !== "guest";
  const isProfileOnly = accessLevel === "member_profile_only";
  const showGuestBanner = isGuest && accessLevel === "guest";
  const showProfileOnlyBanner = !isGuest && isProfileOnly;

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
      await logoutUser().catch(() => null);
      clearClientSession();
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
      <Sidebar onRequireLogin={onRequireLogin} />

      <div className="min-h-screen min-w-0 overflow-x-hidden lg:pl-[260px]">
        <div className="flex min-h-screen min-w-0 flex-col">
          <header className="sticky top-0 z-20 border-b border-[#e7efe9] bg-[#f7faf8]/88 backdrop-blur-md">
            <div className="flex items-center justify-between px-4 py-4 md:px-6 xl:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2E7D5B]">
                MyHealthBuddy
              </p>

              <button
                onClick={handleAuthButtonClick}
                disabled={!hydrated || loggingOut}
                className="shrink-0 rounded-full border border-[#163126]/10 bg-white px-4 py-2 text-sm font-medium text-[#163126] transition hover:bg-[#f8fbf8] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {!hydrated
                  ? ""
                  : isLoggedIn
                  ? loggingOut
                    ? "로그아웃 중..."
                    : "로그아웃"
                  : "로그인"}
              </button>
            </div>

            {showGuestBanner && (
              <div className="px-4 pb-4 md:px-6 xl:px-8">
                <div className="rounded-2xl border border-[#2E7D5B]/10 bg-[#f4faf6] px-4 py-3 text-sm leading-6 text-[#163126]/70">
                  현재 게스트 체험 중이에요. 로그인 후 챌린지, 식단 분석,
                  성장 기록, 마이페이지 등 다른 서비스를 이용할 수 있어요.
                </div>
              </div>
            )}

            {showProfileOnlyBanner && (
              <div className="px-4 pb-4 md:px-6 xl:px-8">
                <div className="rounded-2xl border border-[#dbe9df] bg-white px-4 py-3 text-sm leading-6 text-[#163126]/70">
                  건강 분석을 완료하면 대시보드, 챌린지, 성장 기록 등
                  모든 기능을 이용할 수 있어요.
                </div>
              </div>
            )}
          </header>

          <main className="min-w-0 flex-1 overflow-x-hidden px-4 py-5 pb-24 md:px-6 md:py-6 md:pb-8 xl:px-8 xl:py-8">
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

      <BottomNav onRequireLogin={onRequireLogin} />
    </div>
  );
}
