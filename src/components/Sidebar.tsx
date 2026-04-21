"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  HeartPulse,
  Trophy,
  Utensils,
  ChartNoAxesColumn,
  User,
} from "lucide-react";
import { useAccessStore } from "@/src/store/access-store";
import { storage, type AccessLevel } from "@/src/utils/storage";

type SidebarProps = {
  onRequireLogin?: () => void;
};

type NavItem = {
  key: string;
  href: string;
  label: string;
  icon: React.ReactNode;
  loginRequired?: boolean;
};

function getSidebarMessageByHour(hour: number) {
  if (hour >= 0 && hour < 6) {
    return "천천히 쉬어가도 괜찮아요";
  }

  if (hour < 12) {
    return "오늘도 기록해봐요";
  }

  if (hour < 18) {
    return "작은 것부터 시작해요";
  }

  if (hour < 22) {
    return "오늘도 잘하고 있어요";
  }

  return "버디가 같이 볼게요";
}

function getNavItems(accessLevel: AccessLevel): NavItem[] {
  switch (accessLevel) {
    case "guest":
      return [
        {
          key: "analysis",
          href: "/input",
          label: "AI 건강 분석",
          icon: <HeartPulse size={20} strokeWidth={2.1} />,
        },
        {
          key: "challenge",
          href: "/challenge",
          label: "챌린지",
          icon: <Trophy size={20} strokeWidth={2.1} />,
          loginRequired: true,
        },
      ];

    case "member_profile_only":
      return [
        {
          key: "analysis",
          href: "/input",
          label: "AI 건강 분석",
          icon: <HeartPulse size={20} strokeWidth={2.1} />,
        },
        {
          key: "mypage",
          href: "/mypage",
          label: "마이페이지",
          icon: <User size={20} strokeWidth={2.1} />,
        },
      ];

    case "member_done":
      return [
        {
          key: "dashboard",
          href: "/dashboard",
          label: "대시보드",
          icon: <LayoutDashboard size={20} strokeWidth={2.1} />,
        },
        {
          key: "analysis",
          href: "/result",
          label: "AI 건강 분석",
          icon: <HeartPulse size={20} strokeWidth={2.1} />,
        },
        {
          key: "challenge",
          href: "/challenge",
          label: "챌린지",
          icon: <Trophy size={20} strokeWidth={2.1} />,
        },
        {
          key: "diet",
          href: "/diet-analysis",
          label: "식단 분석",
          icon: <Utensils size={20} strokeWidth={2.1} />,
        },
        {
          key: "growth",
          href: "/growth",
          label: "성장 기록",
          icon: <ChartNoAxesColumn size={20} strokeWidth={2.1} />,
        },
        {
          key: "mypage",
          href: "/mypage",
          label: "마이페이지",
          icon: <User size={20} strokeWidth={2.1} />,
        },
      ];
  }
}

export default function Sidebar({ onRequireLogin }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const hydrated = useAccessStore((state) => state.hydrated);
  const accessLevel = useAccessStore((state) => state.accessLevel);
  const displayName = useAccessStore((state) => state.displayName);
  const profileImage = useAccessStore((state) => state.profileImage);

  const [sidebarMessage, setSidebarMessage] = useState("작은 것부터 시작해요");

  useEffect(() => {
    const hour = new Date().getHours();
    setSidebarMessage(getSidebarMessageByHour(hour));
  }, []);

  const navItems = useMemo(() => {
    if (!hydrated) return [];
    return getNavItems(accessLevel);
  }, [accessLevel, hydrated]);

  const handleRequireLogin = (targetPath: string) => {
    storage.setPostLoginRedirectPath(targetPath);

    if (onRequireLogin) {
      onRequireLogin();
      return;
    }

    router.push("/login");
  };

  const handleMove = (item: NavItem) => {
    if (item.loginRequired && accessLevel === "guest") {
      handleRequireLogin(item.href);
      return;
    }

    router.push(item.href);
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";

    if (href === "/input") {
      return pathname === "/input" || pathname.startsWith("/input/");
    }

    if (href === "/result") {
      return (
        pathname === "/result" ||
        pathname === "/analyzing" ||
        pathname.startsWith("/result/")
      );
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  if (!hydrated) {
    return null;
  }

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[260px] flex-col border-r border-[#163126]/8 bg-[#f7faf8] md:flex">
      <div className="border-b border-[#163126]/8 px-6 py-5">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mb-5 text-left text-[11px] font-bold uppercase tracking-[0.24em] text-[#2E7D5B]"
        >
          MYHEALTHBUDDY
        </button>

        <button
          type="button"
          onClick={() => {
            if (accessLevel === "guest") {
              handleRequireLogin("/mypage");
              return;
            }

            router.push("/mypage");
          }}
          className="flex w-full items-center gap-4 rounded-[20px] text-left transition hover:bg-white/70"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#eef9f2] shadow-[0_6px_18px_rgba(46,125,91,0.08)]">
            {profileImage ? (
              <img
                src={profileImage}
                alt="프로필 이미지"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-2xl">🐹</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[20px] font-bold tracking-[-0.03em] text-[#163126]">
              {displayName}
              <span className="ml-1 text-base">💚</span>
            </p>

            <p className="mt-1 truncate text-sm font-semibold text-[#2E7D5B]">
              {sidebarMessage}
            </p>
          </div>
        </button>
      </div>

      <nav className="flex-1 px-4 py-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const active = isActive(item.href);

            return (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() => handleMove(item)}
                  className={`flex w-full items-center gap-3 rounded-[22px] px-4 py-3 text-left transition ${
                    active
                      ? "bg-[#eaf7ee] text-[#163126]"
                      : "text-[#163126]/72 hover:bg-white"
                  }`}
                >
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] ${
                      active
                        ? "bg-white text-[#163126]"
                        : "bg-transparent text-[#163126]/58"
                    }`}
                  >
                    {item.icon}
                  </span>

                  <span className="text-[15px] font-semibold leading-5">
                    {item.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}