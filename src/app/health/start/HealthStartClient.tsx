"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  LockKeyhole,
  PencilLine,
  RefreshCcw,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Upload,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";

type StartMode = "first" | "reanalyze";

type OptionCardProps = {
  href: string;
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  tags: { icon: React.ReactNode; label: string }[];
  visual: "manual" | "ocr" | "edit";
  actionLabel: string;
  accent?: "green" | "amber";
  delay?: number;
};

function OptionCard({
  href,
  icon,
  eyebrow,
  title,
  description,
  tags,
  visual,
  actionLabel,
  accent = "green",
  delay = 0,
}: OptionCardProps) {
  const isAmber = accent === "amber";

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, delay }}
      className="w-full"
    >
      <Link
        href={href}
        className="group relative grid min-h-[330px] w-full overflow-hidden rounded-[30px] border border-[#dfe9e2] bg-white p-7 shadow-[0_14px_34px_rgba(22,49,38,0.05)] transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-[#6DBA7B]/35 hover:shadow-[0_24px_55px_rgba(76,154,95,0.13)] md:grid-cols-[1.05fr_0.95fr]"
      >
        <div
          className={`pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${
            isAmber
              ? "bg-[radial-gradient(circle_at_top_right,rgba(255,190,92,0.12),transparent_36%)]"
              : "bg-[radial-gradient(circle_at_top_right,rgba(109,186,123,0.10),transparent_36%)]"
          }`}
        />

        <div className="relative z-10 flex min-w-0 flex-col">
          <div
            className={`mb-5 flex h-14 w-14 items-center justify-center rounded-[20px] transition-all duration-300 group-hover:scale-[1.04] ${
              isAmber
                ? "bg-[#fff3df] text-[#d18416]"
                : "bg-[#E8F5EA] text-[#1E4D3A]"
            }`}
          >
            {icon}
          </div>

          <p
            className={`mb-2 text-[11px] font-black uppercase tracking-[0.26em] ${
              isAmber ? "text-[#d18416]" : "text-[#4C9A5F]"
            }`}
          >
            {eyebrow}
          </p>

          <h3 className="text-[26px] font-black leading-tight text-[#163126] md:text-[30px]">
            {title}
          </h3>

          <p className="mt-4 text-[15px] font-semibold leading-8 text-[#5F6F67]">
            {description}
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag.label}
                className={`inline-flex items-center gap-1.5 rounded-[12px] px-3 py-2 text-xs font-black ${
                  isAmber
                    ? "bg-[#fff5e8] text-[#c47a13]"
                    : "bg-[#eef8f1] text-[#2E7D5B]"
                }`}
              >
                {tag.icon}
                {tag.label}
              </span>
            ))}
          </div>

          <div className="mt-auto pt-8">
            <span className="inline-flex items-center gap-3 rounded-[18px] bg-[#46B96A] px-6 py-4 text-sm font-black text-white transition-all duration-300 group-hover:bg-[#36a85a] group-hover:shadow-[0_10px_24px_rgba(70,185,106,0.20)]">
              {actionLabel}
              <ArrowRight size={17} />
            </span>
          </div>
        </div>

        <div className="relative z-10 mt-8 hidden items-center justify-center md:flex">
          {visual === "manual" || visual === "edit" ? (
            <div className="relative flex h-48 w-48 items-center justify-center rounded-full bg-[#eef8f1]">
              <div className="rounded-[24px] border border-[#dfe9e2] bg-white px-7 py-6 shadow-[0_16px_30px_rgba(22,49,38,0.06)]">
                <FileText size={72} className="text-[#2E7D5B]" />
                <div className="mt-4 space-y-2">
                  <span className="block h-2 w-24 rounded-full bg-[#cfe7d4]" />
                  <span className="block h-2 w-20 rounded-full bg-[#dcefe0]" />
                  <span className="block h-2 w-28 rounded-full bg-[#dcefe0]" />
                </div>
              </div>
              <span className="absolute bottom-8 right-7 flex h-14 w-14 items-center justify-center rounded-full bg-[#46B96A] text-white shadow-[0_12px_24px_rgba(70,185,106,0.25)]">
                <PencilLine size={26} />
              </span>
            </div>
          ) : (
            <div className="relative flex h-48 w-48 items-center justify-center rounded-full bg-[#fff5e8]">
              <div className="rounded-[24px] border border-[#f1dfc7] bg-white px-7 py-6 shadow-[0_16px_30px_rgba(22,49,38,0.06)]">
                <FileText size={78} className="text-[#cfc2ae]" />
              </div>
              <span className="absolute bottom-8 right-7 flex h-14 w-14 items-center justify-center rounded-full bg-[#f3a13b] text-white shadow-[0_12px_24px_rgba(243,161,59,0.28)]">
                <Upload size={26} />
              </span>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

export default function HealthStartClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = (searchParams.get("mode") ?? "first") as StartMode;

  const isReanalyze = mode === "reanalyze";

  const pageText = useMemo(() => {
    if (isReanalyze) {
      return {
        badge: "REANALYZE",
        title: "다시 입력할 방법을 선택해주세요",
        description:
          "기존 정보를 수정하거나 새 건강검진표를 업로드해서 새로운 분석 결과를 확인할 수 있어요.",
        guideTitle: "마지막 분석 이후 달라진 정보가 있나요?",
        guideDescription:
          "몸무게, 혈압, 혈당, 콜레스테롤 같은 값이 바뀌었다면 수정 후 다시 분석하는 것을 추천해요.",
      };
    }

    return {
      badge: "ANALYSIS START",
      title: "입력 방법을 선택해주세요",
      description:
        "직접 입력하거나 건강검진표 이미지를 업로드해서 심혈관 건강 분석을 시작할 수 있어요.",
      guideTitle: "어떤 방식이 더 편한가요?",
      guideDescription:
        "직접 입력은 빠르게 시작하기 좋고, 검진표 업로드는 수치를 자동으로 채우는 데 편리해요.",
    };
  }, [isReanalyze]);

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7fbf8] text-[#163126]">
      <header className="flex items-center justify-between px-4 py-5 sm:px-6 md:px-10">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="flex items-center gap-3 text-left"
        >
          <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-[#f7fbf8]">
            <img src="/images/buddy-face.png" alt="" className="h-10 w-10 object-cover" />
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

        <div className="inline-flex items-center gap-2 rounded-full border border-[#163126]/10 bg-white px-4 py-2 text-xs font-bold text-[#163126]/70 shadow-[0_8px_20px_rgba(22,49,38,0.04)] md:text-sm">
          <Sparkles size={15} className="text-[#2E7D5B]" />
          입력 시작
        </div>
      </header>

      <section className="px-4 pb-14 pt-4 sm:px-6 md:px-8 md:pb-16">
        <div className="mx-auto w-full max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="relative overflow-hidden rounded-[34px] border border-[#dfe9e2] bg-white px-7 py-8 shadow-[0_18px_50px_rgba(22,49,38,0.06)] md:px-10 md:py-9"
          >
            <div className="grid gap-8 lg:grid-cols-[1fr_330px] lg:items-center">
              <div className="min-w-0">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#4C9A5F]">
                  {pageText.badge}
                </p>
                <h1 className="text-[34px] font-black leading-tight text-[#163126] md:text-[46px]">
                  {pageText.title}
                </h1>
                <p className="mt-4 max-w-2xl text-[16px] font-semibold leading-8 text-[#5F6F67]">
                  {pageText.description}
                </p>

                <div className="mt-8 flex max-w-md items-center gap-4 rounded-[18px] border border-[#dfe9e2] bg-[#fbfdfb] px-5 py-4">
                  <ShieldCheck size={26} className="shrink-0 text-[#2E7D5B]" />
                  <div>
                    <p className="text-sm font-black text-[#163126]">
                      안전하고 정확한 분석
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#163126]/58">
                      개인정보는 안전하게 보호되며 분석 목적으로만 사용돼요.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="relative flex h-[230px] w-[230px] items-end justify-center">
                  <img
                    src="/images/buddy-input.png"
                    alt=""
                    className="h-[210px] w-[210px] object-contain drop-shadow-[0_14px_26px_rgba(22,49,38,0.08)]"
                  />
                </div>
              </div>

            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="my-6 rounded-[28px] border border-[#dfe9e2] bg-white px-6 py-5 shadow-[0_10px_26px_rgba(22,49,38,0.04)]"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#fff8df] text-[#d19622]">
                  <Sparkles size={23} />
                </div>
                <div>
                  <p className="text-[16px] font-black text-[#1E4D3A]">
                    {pageText.guideTitle}
                  </p>
                  <p className="mt-2 text-[15px] font-semibold leading-7 text-[#66756D]">
                    {pageText.guideDescription}
                  </p>
                </div>
              </div>

              <div className="grid w-full max-w-xl gap-3 sm:grid-cols-2">
                <div className="rounded-[18px] border border-[#dfe9e2] bg-[#fbfdfb] px-4 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eaf7ee] text-[#2E7D5B]">
                      <PencilLine size={19} />
                    </span>
                    <div>
                      <p className="text-sm font-black text-[#163126]">
                        직접 입력
                      </p>
                      <p className="mt-1 text-xs font-semibold text-[#163126]/55">
                        직접 확인하며 빠르게 작성
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[18px] border border-[#f1dfc7] bg-[#fffaf2] px-4 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff3df] text-[#d18416]">
                      <ScanLine size={19} />
                    </span>
                    <div>
                      <p className="text-sm font-black text-[#163126]">
                        검진표 업로드
                      </p>
                      <p className="mt-1 text-xs font-semibold text-[#163126]/55">
                        이미지에서 수치를 자동 추출
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
                  tags={[
                    { icon: <RefreshCcw size={14} />, label: "빠른 수정" },
                  ]}
                  visual="edit"
                  actionLabel="이전 정보 수정하기"
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
                tags={[
                  { icon: <Zap size={14} />, label: "빠른 시작" },
                  { icon: <PencilLine size={14} />, label: "직접 수정 가능" },
                ]}
                visual="manual"
                actionLabel={isReanalyze ? "새로 입력하기" : "직접 입력하기"}
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
                tags={[
                  { icon: <ScanLine size={14} />, label: "자동 수치 추출" },
                  { icon: <Zap size={14} />, label: "시간 절약" },
                ]}
                visual="ocr"
                actionLabel="검진표 업로드하기"
                accent="amber"
                delay={0.12}
              />
            </div>
          </div>

          <div className="mx-auto mt-8 flex w-fit items-center gap-3 rounded-full border border-[#dfe9e2] bg-white px-5 py-3 text-sm font-bold text-[#1f5c45] shadow-[0_10px_24px_rgba(22,49,38,0.05)]">
            <img src="/images/buddy-face.png" alt="" className="h-8 w-8 rounded-full" />
            어려우신가요? 두 방법 모두 분석 결과는 동일해요.
          </div>
        </div>
      </section>
    </main>
  );
}
