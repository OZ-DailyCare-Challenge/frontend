"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { storage } from "@/src/utils/storage";
import { logoutUser } from "@/src/api/user";
import { isHealthFlowComplete } from "@/src/utils/health-flow";
import { useAccessStore } from "@/src/store/access-store";

type HeaderProps = {
  visible?: boolean;
  theme?: "light" | "dark";
};

export default function Header({
  visible = true,
  theme = "dark",
}: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const hydrated = useAccessStore((state) => state.hydrated);
  const displayName = useAccessStore((state) => state.displayName);
  const initialize = useAccessStore((state) => state.initialize);
  const clearClientSession = useAccessStore((state) => state.clearClientSession);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    const token = storage.getAccessToken?.();
    setIsLoggedIn(Boolean(token));
  }, [pathname, hydrated]);

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
      clearClientSession();
      setIsLoggedIn(false);
      setMenuOpen(false);
      window.location.replace("/login");
    } catch (error) {
      console.error("로그아웃 실패:", error);
      alert("로그아웃에 실패했어요.");
    } finally {
      setLoggingOut(false);
    }
  };

  const isTransparent = theme === "light";
  const brandTitleClass = isTransparent ? "text-[#1f5c45]" : "text-[#1f5c45]";
  const brandSubClass = isTransparent ? "text-[#2E7D5B]/72" : "text-[#163126]/45";
  const buttonClass = isTransparent
    ? "rounded-full border border-[#1f5c45]/18 bg-white/35 px-5 py-2.5 text-sm font-bold text-[#1f5c45] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/50"
    : "rounded-full border border-[#163126]/10 bg-white px-5 py-2.5 text-sm font-bold text-[#163126]/70 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#f7fbf8] hover:text-[#163126]";

  return (
    <header
      className={`fixed left-0 top-0 z-[120] w-full transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        visible ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"
      }`}
    >
      <div className="relative">
        <div
          className={`absolute inset-0 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isTransparent
              ? "border-b border-transparent bg-transparent backdrop-blur-0"
              : "border-b border-[#163126]/6 bg-white/92 backdrop-blur-md"
          }`}
        />

        <div className="relative z-10 flex h-[76px] w-full items-center justify-between px-6 md:px-10 lg:px-16">
          <button
            onClick={() => router.push("/")}
            className="group flex items-center gap-3 text-left transition-all duration-300"
          >
            <span
              className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl ${
                isTransparent ? "bg-white/75 backdrop-blur-md" : "bg-[#f7fbf8]"
              }`}
            >
              <img
                src="/images/buddy-face.png"
                alt=""
                className="h-10 w-10 object-cover"
              />
            </span>
            <span>
              <span className={`block text-[18px] font-black leading-none ${brandTitleClass}`}>
                MyHealthBuddy
              </span>
              <span className={`mt-1 block text-[10px] font-bold ${brandSubClass}`}>
                건강한 하루를 함께 기록해요
              </span>
            </span>
          </button>

          {!isLoggedIn ? (
            <button
              onClick={handleLoginClick}
              className={buttonClass}
            >
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
                  className="absolute right-0 mt-3 w-44 overflow-hidden rounded-2xl border border-[#163126]/8 bg-white text-[#163126] shadow-[0_14px_36px_rgba(22,49,38,0.08)]"
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
      </div>
    </header>
  );
}
