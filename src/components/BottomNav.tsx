"use client";

import { useMemo } from "react";
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

type BottomNavProps = {
  onRequireLogin?: () => void;
};

type NavItem = {
  key: string;
  href: string;
  label: string;
  icon: React.ReactNode;
  loginRequired?: boolean;
};

function getBottomItems(accessLevel: AccessLevel): NavItem[] {
  const memberItems: NavItem[] = [
    {
      key: "dashboard",
      href: "/dashboard",
      label: "대시",
      icon: <LayoutDashboard size={18} strokeWidth={2.2} />,
    },
    {
      key: "analysis",
      href: "/result",
      label: "분석",
      icon: <HeartPulse size={18} strokeWidth={2.2} />,
    },
    {
      key: "challenge",
      href: "/challenge",
      label: "챌린지",
      icon: <Trophy size={18} strokeWidth={2.2} />,
    },
    {
      key: "diet",
      href: "/diet-analysis",
      label: "식단",
      icon: <Utensils size={18} strokeWidth={2.2} />,
    },
    {
      key: "growth",
      href: "/growth",
      label: "성장",
      icon: <ChartNoAxesColumn size={18} strokeWidth={2.2} />,
    },
    {
      key: "mypage",
      href: "/mypage",
      label: "마이",
      icon: <User size={18} strokeWidth={2.2} />,
    },
  ];

  switch (accessLevel) {
    case "guest":
      return [
        {
          key: "analysis",
          href: "/input",
          label: "분석",
          icon: <HeartPulse size={18} strokeWidth={2.2} />,
        },
        {
          key: "challenge",
          href: "/challenge",
          label: "챌린지",
          icon: <Trophy size={18} strokeWidth={2.2} />,
          loginRequired: true,
        },
      ];

    case "member_profile_only":
    case "member_done":
      return memberItems;
  }
}

export default function BottomNav({ onRequireLogin }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const hydrated = useAccessStore((state) => state.hydrated);
  const accessLevel = useAccessStore((state) => state.accessLevel);

  const items = useMemo(() => {
    if (!hydrated) return [];
    return getBottomItems(accessLevel);
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
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

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
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#163126]/8 bg-white/95 px-2 py-2 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-xl items-center justify-around gap-1">
        {items.map((item) => {
          const active = isActive(item.href);

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => handleMove(item)}
              className={`flex min-w-0 flex-1 flex-col items-center justify-center rounded-2xl px-2 py-2 text-[11px] font-semibold transition ${
                active
                  ? "bg-[#eaf7ee] text-[#163126]"
                  : "text-[#163126]/60 hover:bg-[#f6faf7]"
              }`}
            >
              <span className="mb-1">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
