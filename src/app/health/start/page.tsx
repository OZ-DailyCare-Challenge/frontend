"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FileText,
  PencilLine,
  RefreshCcw,
  ScanLine,
} from "lucide-react";
import { motion } from "framer-motion";

type StartMode = "first" | "reanalyze";

type OptionCardProps = {
  href: string;
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  delay?: number;
};

function OptionCard({
  href,
  icon,
  eyebrow,
  title,
  description,
  delay = 0,
}: OptionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, delay }}
      className="w-full"
    >
      <Link
        href={href}
        className="group relative flex h-full min-h-[340px] w-full flex-col overflow-hidden rounded-[30px] border border-[#163126]/8 bg-white/92 p-7 shadow-[0_14px_34px_rgba(22,49,38,0.06)] transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-[#6DBA7B]/35 hover:shadow-[0_24px_55px_rgba(76,154,95,0.15)]"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(109,186,123,0.10),transparent_32%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="relative z-10 mb-5 flex h-14 w-14 items-center justify-center rounded-[20px] bg-[#E8F5EA] text-[#1E4D3A] transition-all duration-300 group-hover:scale-[1.04] group-hover:bg-[#DFF2E3]">
          {icon}
        </div>

        <p className="relative z-10 mb-2 text-[11px] font-semibold uppercase tracking-[0.26em] text-[#4C9A5F]">
          {eyebrow}
        </p>

        <h3 className="relative z-10 text-[22px] font-semibold leading-tight text-[#163126] md:text-[24px]">
          {title}
        </h3>

        <p className="relative z-10 mt-4 text-[15px] leading-8 text-[#5F6F67]">
          {description}
        </p>

        <div className="relative z-10 mt-auto pt-8">
          <span className="inline-flex items-center rounded-full bg-[#163126] px-4 py-2 text-sm font-semibold text-white transition-all duration-300 group-hover:bg-[#1E4D3A] group-hover:shadow-[0_10px_24px_rgba(22,49,38,0.16)]">
            선택하기
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

export default function HealthStartPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = (searchParams.get("mode") ?? "first") as StartMode;

  const isReanalyze = mode === "reanalyze";

  const pageText = useMemo(() => {
    if (isReanalyze) {
      return {
        badge: "REANALYZE",
        title: "다시 분석할 방법을 선택해주세요",
        description:
          "기존 정보를 수정하거나 새 건강검진표를 업로드해서 새로운 분석 결과를 확인할 수 있어요.",
        guideTitle: "마지막 분석 이후 달라진 정보가 있나요?",
        guideDescription:
          "몸무게, 혈압, 혈당, 콜레스테롤 같은 값이 바뀌었다면 수정 후 다시 분석하는 것을 추천해요.",
      };
    }

    return {
      badge: "ANALYSIS START",
      title: "분석 방법을 선택해주세요",
      description:
        "직접 입력하거나 건강검진표 이미지를 업로드해서 심혈관 건강 분석을 시작할 수 있어요.",
      guideTitle: "어떤 방식이 더 편한가요?",
      guideDescription:
        "직접 입력은 빠르게 시작하기 좋고, 검진표 업로드는 수치를 자동으로 채우는 데 편리해요.",
    };
  }, [isReanalyze]);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FBF8_0%,#EEF7F0_100%)] text-[#163126]">
      <header className="flex items-center justify-between px-4 py-5 sm:px-6 md:px-10">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-sm font-semibold text-[#163126]"
        >
          <span className="h-2.5 w-2.5 rounded-full bg-[#7EE8A7]" />
          MyHealthBuddy
        </button>

        <div className="rounded-full border border-[#163126]/10 bg-white/70 px-4 py-2 text-xs font-medium text-[#163126]/70 backdrop-blur-md md:text-sm">
          분석 시작
        </div>
      </header>

      <section className="px-4 pb-10 pt-2 sm:px-6 md:px-8 md:pb-12">
        <div className="mx-auto w-full max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mb-4 rounded-[30px] border border-white/70 bg-white/82 px-7 py-5 shadow-[0_18px_42px_rgba(22,49,38,0.045)] backdrop-blur"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#4C9A5F]">
                  {pageText.badge}
                </p>
                <h1 className="text-[26px] font-semibold leading-tight text-[#163126] md:text-[34px]">
                  {pageText.title}
                </h1>
                <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#5F6F67]">
                  {pageText.description}
                </p>
              </div>

              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#E8F5EA] text-[#1E4D3A]">
                {isReanalyze ? <RefreshCcw size={24} /> : <FileText size={24} />}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="mb-6 rounded-[28px] border border-[#163126]/8 bg-white/76 px-6 py-4 shadow-[0_10px_26px_rgba(22,49,38,0.04)]"
          >
            <p className="text-[15px] font-semibold text-[#1E4D3A]">
              {pageText.guideTitle}
            </p>
            <p className="mt-2 text-[15px] leading-7 text-[#66756D]">
              {pageText.guideDescription}
            </p>
          </motion.div>

          <div className="w-full">
            <div
              className={`grid w-full gap-6 ${
                isReanalyze ? "md:grid-cols-2 xl:grid-cols-3" : "md:grid-cols-2"
              }`}
            >
              {isReanalyze && (
                <OptionCard
                  href="/input?mode=edit"
                  icon={<PencilLine size={22} />}
                  eyebrow="edit previous info"
                  title="이전 정보 수정하기"
                  description="마지막으로 입력한 건강정보를 불러와 수정한 뒤 다시 분석할 수 있어요."
                  delay={0}
                />
              )}

              <OptionCard
                href={isReanalyze ? "/input?mode=new" : "/input?mode=first"}
                icon={<FileText size={22} />}
                eyebrow={isReanalyze ? "start fresh" : "manual input"}
                title={isReanalyze ? "처음부터 새로 입력하기" : "직접 입력하기"}
                description={
                  isReanalyze
                    ? "기존 값과 관계없이 처음부터 새로운 건강정보를 입력하고 분석을 다시 시작해요."
                    : "혈압, 혈당, 콜레스테롤, 생활습관 정보를 직접 입력해서 분석할 수 있어요."
                }
                delay={0.06}
              />

              <OptionCard
                href={`/health/upload-checkup?mode=${
                  isReanalyze ? "reanalyze" : "first"
                }`}
                icon={<ScanLine size={22} />}
                eyebrow="ocr upload"
                title={isReanalyze ? "건강검진표 다시 업로드" : "건강검진표 업로드"}
                description="검진표 이미지를 올리면 OCR로 주요 수치를 추출해서 입력을 더 빠르게 도와드려요."
                delay={0.12}
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}