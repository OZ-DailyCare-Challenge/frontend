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
  Users,
} from "lucide-react";
import { isHealthFlowComplete } from "@/src/utils/health-flow";

type SidebarProps = {
  isGuest?: boolean;
  onRequireLogin?: () => void;
  displayName?: string;
  profileImage?: string;
};

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
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

export default function Sidebar({
  isGuest = false,
  onRequireLogin,
  displayName = "버디",
  profileImage = "",
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [sidebarMessage, setSidebarMessage] = useState("작은 것부터 시작해요");
  const [flowComplete, setFlowComplete] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const hour = new Date().getHours();
    setSidebarMessage(getSidebarMessageByHour(hour));
    setFlowComplete(isHealthFlowComplete());
  }, [mounted, pathname]);

  const navItems: NavItem[] = useMemo(
    () => [
      {
        href: "/dashboard",
        label: "대시보드",
        icon: <LayoutDashboard size={20} strokeWidth={2.1} />,
      },
      {
        href: "/result",
        label: "AI 건강 분석",
        icon: <HeartPulse size={20} strokeWidth={2.1} />,
      },
      {
        href: "/challenge",
        label: "챌린지",
        icon: <Trophy size={20} strokeWidth={2.1} />,
      },
      {
        href: "/diet-analysis",
        label: "식단 분석",
        icon: <Utensils size={20} strokeWidth={2.1} />,
      },
      {
        href: "/growth",
        label: "성장 기록",
        icon: <ChartNoAxesColumn size={20} strokeWidth={2.1} />,
      },
      {
        href: "/social",
        label: "친구",
        icon: <Users size={20} strokeWidth={2.1} />,
      },
      {
        href: "/mypage",
        label: "마이페이지",
        icon: <User size={20} strokeWidth={2.1} />,
      },
    ],
    []
  );

  const canAccessMenu = (href: string) => {
    if (href === "/mypage") return true;
    if (href === "/result") return true;
    if (href === "/social") return true;
    return flowComplete;
  };

  const handleProtectedMove = (href: string) => {
    if (isGuest) {
      if (onRequireLogin) {
        onRequireLogin();
        return;
      }

      router.push("/login");
      return;
    }

    if (href === "/result") {
      if (!flowComplete) {
        alert("AI 건강 분석을 위해 먼저 건강 정보를 입력해주세요.");
        router.push("/input");
        return;
      }

      router.push("/result");
      return;
    }

    if (!canAccessMenu(href)) {
      alert("건강 분석을 완료하면 이용할 수 있어요.");
      router.push("/mypage");
      return;
    }

    router.push(href);
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";

    if (href === "/result") {
      return (
        pathname === "/result" ||
        pathname === "/analyzing" ||
        pathname.startsWith("/result/")
      );
    }

    return pathname === href || pathname.startsWith(href + "/");
  };

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
          onClick={() => handleProtectedMove("/mypage")}
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
            const locked = mounted ? !isGuest && !canAccessMenu(item.href) : false;

            return (
              <li key={item.href}>
                <button
                  type="button"
                  onClick={() => handleProtectedMove(item.href)}
                  className={`flex w-full items-center gap-3 rounded-[22px] px-4 py-3 text-left transition ${
                    active
                      ? "bg-[#eaf7ee] text-[#163126]"
                      : "text-[#163126]/72 hover:bg-white"
                  } ${locked ? "opacity-45" : ""}`}
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

                  {locked && (
                    <span className="ml-auto rounded-full bg-[#f3f5f4] px-2 py-0.5 text-[11px] font-semibold text-[#7f8b84]">
                      잠금
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}