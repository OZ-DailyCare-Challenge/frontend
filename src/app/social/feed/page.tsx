"use client";

import AppShell from "@/src/components/AppShell";
import { Users } from "lucide-react";

export default function SocialFeedPage() {
  return (
    <AppShell title="함께하기">
      <div className="mx-auto max-w-xl">
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-[#e7efe9] bg-white px-6 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#eaf7ee]">
            <Users size={28} className="text-[#2E7D5B]" strokeWidth={2} />
          </div>
          <div>
            <p className="text-base font-semibold text-[#163126]">친구 피드가 준비 중이에요</p>
            <p className="mt-1.5 text-sm text-[#163126]/50">
              친구들의 챌린지 현황과 응원 기능이 곧 추가될 예정이에요.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
