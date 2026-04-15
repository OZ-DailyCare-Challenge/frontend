"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  HeartPulse,
  Trophy,
  LineChart,
  User,
  Utensils,
} from "lucide-react";

const menus = [
  { label: "홈", href: "/dashboard", icon: Home },
  { label: "건강 분석", href: "/analyzing", icon: HeartPulse },
  { label: "챌린지", href: "/challenge", icon: Trophy },
  { label: "식단 분석", href: "/diet-analysis", icon: Utensils },
  { label: "기록", href: "/growth", icon: LineChart },
  { label: "마이", href: "/mypage", icon: User },
];

type Props = {
  isGuest?: boolean;
  onRequireLogin?: () => void;
  displayName?: string;
};

export default function BottomNav({
  isGuest = false,
  onRequireLogin,
}: Props) {
  const pathname = usePathname();

  const isMenuActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#e7efe9] bg-white/96 backdrop-blur-xl md:hidden">
      <div className="grid grid-cols-6 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2">
        {menus.map((menu) => {
          const Icon = menu.icon;
          const active = !isGuest && isMenuActive(menu.href);

          const content = (
            <>
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-2xl transition ${
                  isGuest
                    ? "bg-transparent"
                    : active
                    ? "bg-[#eaf7ee] shadow-[0_8px_20px_rgba(22,49,38,0.06)]"
                    : "bg-transparent"
                }`}
              >
                <Icon
                  size={20}
                  strokeWidth={2.2}
                  className={
                    isGuest
                      ? "text-[#163126]/30"
                      : active
                      ? "text-[#163126]"
                      : "text-[#163126]/45"
                  }
                />
              </div>

              <span
                className={`text-[11px] font-medium transition ${
                  isGuest
                    ? "text-[#163126]/30"
                    : active
                    ? "text-[#163126]"
                    : "text-[#163126]/45"
                }`}
              >
                {menu.label}
              </span>

              <span
                className={`mt-0.5 h-1.5 rounded-full bg-[#6ED39B] transition-all ${
                  active ? "w-5 opacity-100" : "w-1 opacity-0"
                }`}
              />
            </>
          );

          if (isGuest) {
            return (
              <button
                key={menu.href}
                type="button"
                onClick={() => onRequireLogin?.()}
                className="flex flex-col items-center justify-center gap-1.5 py-2"
              >
                {content}
              </button>
            );
          }

          return (
            <Link
              key={menu.href}
              href={menu.href}
              className="flex flex-col items-center justify-center gap-1.5 py-2"
            >
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}