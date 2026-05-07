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
import ProfileNameAvatar from "@/src/components/ProfileNameAvatar";

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
  const memberItems: NavItem[] = [
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
    case "member_done":
      return memberItems;
  }
}

function getSidebarGuide(pathname: string) {
  if (pathname === "/dashboard" || pathname === "/social/feed") {
    return {
      title: "대시보드",
      description: "오늘의 건강 상태와 친구 활동을 한눈에 확인해요.",
    };
  }

  if (
    pathname === "/input" ||
    pathname.startsWith("/input/") ||
    pathname === "/result" ||
    pathname === "/analyzing" ||
    pathname.startsWith("/result/")
  ) {
    return {
      title: "AI 건강 분석",
      description: "건강검진 수치와 생활 습관으로 심혈관 위험을 분석해요.",
    };
  }

  if (pathname.startsWith("/challenge")) {
    return {
      title: "챌린지",
      description: "나에게 맞는 건강 습관을 매일 인증하며 이어가요.",
    };
  }

  if (pathname.startsWith("/diet-analysis")) {
    return {
      title: "식단 분석",
      description: "음식 사진으로 영양 균형과 식사 방향을 확인해요.",
    };
  }

  if (pathname.startsWith("/growth")) {
    return {
      title: "성장 기록",
      description: "챌린지 기록과 건강 변화를 달력으로 돌아봐요.",
    };
  }

  if (pathname.startsWith("/mypage")) {
    return {
      title: "마이페이지",
      description: "내 정보와 건강 데이터를 편하게 관리할 수 있어요.",
    };
  }

  return {
    title: "MyHealthBuddy",
    description: "건강한 하루를 기록하고 작은 변화를 쌓아가요.",
  };
}

export default function Sidebar({ onRequireLogin }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const hydrated = useAccessStore((state) => state.hydrated);
  const accessLevel = useAccessStore((state) => state.accessLevel);
  const displayName = useAccessStore((state) => state.displayName);
  const profileImage = useAccessStore((state) => state.profileImage);

  const sidebarMessage = useMemo(
    () => getSidebarMessageByHour(new Date().getHours()),
    []
  );

  const navItems = useMemo(() => {
    if (!hydrated) return [];
    return getNavItems(accessLevel);
  }, [accessLevel, hydrated]);
  const guide = useMemo(() => getSidebarGuide(pathname), [pathname]);

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
      return pathname === "/dashboard" || pathname === "/social/feed";
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
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[260px] flex-col border-r border-[#163126]/6 bg-white px-6 py-6 transition-colors duration-300 lg:flex">
      <div>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="group flex items-center gap-3 text-left"
        >
          <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-[#f7fbf8]">
            <img
              src="/images/buddy-face.png"
              alt=""
              className="h-10 w-10 object-cover"
            />
          </span>

          <span>
            <span className="block text-[18px] font-black leading-none text-[#1f5c45]">
              MyHealthBuddy
            </span>
            <span className="mt-1 block text-[10px] font-bold text-[#163126]/45">
              건강한 하루를 함께 기록해요
            </span>
          </span>
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
          className="mt-7 w-full rounded-[18px] border border-[#163126]/8 bg-white px-4 py-4 text-left transition hover:-translate-y-0.5 hover:border-[#46B96A]/35 hover:bg-[#fbfdfb]"
        >
          <div className="flex items-center gap-3">
            <ProfileNameAvatar
              name={displayName}
              image={profileImage}
              className="h-[66px] w-[66px] ring-4 ring-[#eff8f1]"
              textClassName="text-[11px]"
            />

            <div className="min-w-0 flex-1">
              <p className="break-keep text-[18px] font-black leading-6 text-[#163126]">
                {displayName}
                <span className="ml-1 text-sm">💚</span>
              </p>

              <p className="mt-1 break-keep text-[11px] font-bold leading-4 text-[#2E7D5B]">
                {sidebarMessage}
              </p>
            </div>
          </div>
        </button>
      </div>

      <nav className="mt-6 flex-1">
        <ul className="space-y-1.5">
          {navItems.map((item) => {
            const active = isActive(item.href);

            return (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() => handleMove(item)}
                  className={`group flex w-full items-center gap-3 rounded-[16px] px-4 py-3 text-left transition ${
                    active
                      ? "bg-[linear-gradient(90deg,#e4f4e8_0%,rgba(228,244,232,0.55)_100%)] text-[#1f7a46] shadow-[inset_3px_0_0_#46B96A]"
                      : "text-[#163126]/72 hover:bg-[#f7fbf8] hover:text-[#1f7a46]"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[12px] ${
                      active
                        ? "text-[#1f7a46]"
                        : "text-[#163126]/58 group-hover:text-[#1f7a46]"
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

      <div className="rounded-[18px] border border-[#163126]/8 bg-[#fbfdfb] px-4 py-4">
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#2E7D5B]">
          page guide
        </p>
        <p className="mt-2 break-keep text-[15px] font-black leading-5 text-[#1f5c45]">
          {guide.title}
        </p>
        <p className="mt-2 break-keep text-[12px] font-semibold leading-5 text-[#163126]/58">
          {guide.description}
        </p>

      </div>
    </aside>
  );
}
