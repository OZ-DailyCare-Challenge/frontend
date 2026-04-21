"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { storage } from "@/src/utils/storage";
import { logoutUser } from "@/src/api/user";
import { isHealthFlowComplete } from "@/src/utils/health-flow";

type HeaderProps = {
  visible?: boolean;
  theme?: "light" | "dark";
};

export default function Header({
  visible = true,
  theme = "light",
}: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [displayName, setDisplayName] = useState("버디");
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const token = storage.getAccessToken?.();
    const loggedIn = Boolean(token);

    setIsLoggedIn(loggedIn);

    if (!loggedIn) {
      setDisplayName("버디");
      return;
    }

    const user = storage.getUser?.();
    setDisplayName(user?.nickname || "버디");
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const isLight = theme === "light";

  const handleLoginClick = () => {
    router.push("/login");
  };

  const handleDashboardMove = () => {
    setMenuOpen(false);

    if (!isHealthFlowComplete()) {
      alert("건강 분석을 완료하면 이용할 수 있어요.");
      router.push("/mypage");
      return;
    }

    router.push("/dashboard");
  };

  const handleMyPageMove = () => {
    setMenuOpen(false);
    router.push("/mypage");
  };

  const handleLogout = async () => {
    const confirmed = window.confirm("로그아웃 하시겠어요?");
    if (!confirmed) return;

    try {
      setLoggingOut(true);
      await logoutUser();
      setIsLoggedIn(false);
      setDisplayName("버디");
      setMenuOpen(false);
      window.location.replace("/login");
    } catch (error) {
      console.error("로그아웃 실패:", error);
      alert("로그아웃에 실패했어요.");
    } finally {
      setLoggingOut(false);
    }
  };

  const buttonClass = `rounded-full px-5 py-2.5 text-sm font-semibold transition ${
    isLight
      ? "border border-white/30 bg-white/14 text-white shadow-[0_10px_30px_rgba(0,0,0,0.10)] backdrop-blur-xl hover:bg-white/20"
      : "border border-[#d8e6dc] bg-white/85 text-[#163126] shadow-[0_10px_24px_rgba(22,49,38,0.06)] backdrop-blur-xl hover:bg-white"
  }`;

  return (
    <header
      className={`fixed left-0 top-0 z-[120] w-full transition-all duration-500 ${
        visible ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"
      }`}
    >
      <div className="flex h-[88px] w-full items-center justify-between px-6 md:px-10 lg:px-16">
        <button
          onClick={() => router.push("/")}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            isLight
              ? "border border-white/20 bg-white/10 text-white backdrop-blur-xl hover:bg-white/16"
              : "border border-[#d8e6dc] bg-white/80 text-[#163126] backdrop-blur-xl hover:bg-white"
          }`}
        >
          MyHealthBuddy
        </button>

        {!isLoggedIn ? (
          <button onClick={handleLoginClick} className={buttonClass}>
            로그인
          </button>
        ) : (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className={buttonClass}
            >
              {displayName}님 ▾
            </button>

            {menuOpen && (
              <div
                className={`absolute right-0 mt-3 w-44 overflow-hidden rounded-2xl border shadow-[0_14px_36px_rgba(22,49,38,0.12)] ${
                  isLight
                    ? "border-white/20 bg-white/88 text-[#163126] backdrop-blur-xl"
                    : "border-[#d8e6dc] bg-white text-[#163126]"
                }`}
              >
                <button
                  onClick={handleDashboardMove}
                  className="block w-full px-4 py-3 text-left text-sm font-medium transition hover:bg-[#f4faf6]"
                >
                  대시보드
                </button>

                <button
                  onClick={handleMyPageMove}
                  className="block w-full px-4 py-3 text-left text-sm font-medium transition hover:bg-[#f4faf6]"
                >
                  마이페이지
                </button>

                <button
                  onClick={() => void handleLogout()}
                  disabled={loggingOut}
                  className="block w-full px-4 py-3 text-left text-sm font-medium text-[#c25555] transition hover:bg-[#fff6f6] disabled:opacity-60"
                >
                  {loggingOut ? "로그아웃 중..." : "로그아웃"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}