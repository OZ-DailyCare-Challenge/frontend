"use client";

import { motion } from "framer-motion";

const sections = [
  {
    id: 1,
    eyebrow: "Health Analysis",
    title: "건강 데이터를 더 쉽게 이해해요",
    desc: "혈압, 혈당, 생활 습관 같은 건강 신호를 복잡한 숫자 대신 이해하기 쉬운 구조로 보여줘요.",
    reverse: false,
  },
  {
    id: 2,
    eyebrow: "Report",
    title: "한눈에 보는 리포트로 핵심만 정리해요",
    desc: "지금 내 상태에서 중요한 포인트를 먼저 보여줘서 사용자가 빠르게 판단할 수 있어요.",
    reverse: true,
  },
  {
    id: 3,
    eyebrow: "Habit Guide",
    title: "작은 습관부터 바꿀 수 있게 도와줘요",
    desc: "무리한 변화보다 오늘 바로 실천할 수 있는 건강 습관을 제안해서 부담을 줄여줘요.",
    reverse: false,
  },
  {
    id: 4,
    eyebrow: "Challenge",
    title: "꾸준함을 만드는 챌린지 구조를 넣었어요",
    desc: "단기 목표와 성취 경험을 통해 사용자가 건강한 루틴을 자연스럽게 유지하게 만들어요.",
    reverse: true,
  },
];

export default function FeatureSections() {
  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-6 py-24 md:px-10">
      {sections.map((section, index) => (
        <motion.div
          key={section.id}
          initial={{ opacity: 0, y: 70 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.75, delay: index * 0.08 }}
          className={`grid min-h-[340px] items-center gap-8 rounded-[38px] border border-[#163126]/6 bg-white/52 p-6 shadow-[0_18px_50px_rgba(46,125,91,0.08)] backdrop-blur-xl md:grid-cols-2 md:p-10 ${
            section.reverse ? "md:[&>*:first-child]:order-2" : ""
          }`}
        >
          <div className="relative flex h-[260px] items-center justify-center overflow-hidden rounded-[30px] bg-[linear-gradient(135deg,rgba(179,243,201,0.72),rgba(255,255,255,0.56))]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.36),transparent_30%)]" />
            <div className="flex h-[190px] w-[190px] items-center justify-center rounded-full border border-white/45 bg-white/18 text-6xl shadow-[0_16px_40px_rgba(131,182,149,0.12)] backdrop-blur-xl">
              🫧
            </div>
          </div>

          <div className="px-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2E7D5B]">
              {section.eyebrow}
            </p>
            <h2 className="mt-3 text-3xl font-bold leading-tight text-[#163126] md:text-4xl">
              {section.title}
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-[#163126]/70 md:text-base">
              {section.desc}
            </p>

            <button className="mt-6 rounded-full border border-[#163126]/10 bg-[#163126] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d4232]">
              자세히 보기
            </button>
          </div>
        </motion.div>
      ))}
    </section>
  );
}
