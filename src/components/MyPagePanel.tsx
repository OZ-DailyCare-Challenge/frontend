"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import MyPageContent from "@/src/components/MyPageContent";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function MyPagePanel({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex bg-black/25">
      <button
        onClick={onClose}
        className="flex-1 cursor-pointer"
        aria-label="마이페이지 닫기"
      />

      <div className="relative h-full w-full max-w-[1200px] overflow-y-auto bg-[#f5f8f6] shadow-[-12px_0_40px_rgba(0,0,0,0.12)]">
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-[#163126]/8 bg-[#f5f8f6]/95 px-8 py-5 backdrop-blur">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2E7D5B]">
              MyHealthBuddy
            </p>
            <h2 className="mt-2 text-3xl font-bold text-[#163126]">
              마이페이지
            </h2>
          </div>

          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-full border border-[#163126]/10 bg-white px-4 py-2 text-sm font-semibold text-[#163126]"
          >
            <X size={16} />
            닫기
          </button>
        </div>

        <div className="p-8">
          <MyPageContent />
        </div>
      </div>
    </div>
  );
}