"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import Image from "next/image";

import Header from "../components/Header";

const FloatingBubbles = dynamic(
  () => import("../components/FloatingBubbles"),
  { ssr: false }
);

const BubbleModal = dynamic(() => import("../components/BubbleModal"), {
  ssr: false,
});

const bubbleData = [
  {
    id: 1,
    emoji: "🫧",
    hint: "···",
    title: "건강 루틴 시작",
    summary: "작은 습관, 같이 만들어볼까요?",
    detail:
      "하루 하나씩 실천하면서 자연스럽게 건강한 루틴을 만들어봐요.",
  },
  {
    id: 2,
    emoji: "💚",
    hint: "?",
    title: "AI 건강 분석",
    summary: "지금 내 몸 상태, 궁금하지 않으세요?",
    detail:
      "건강검진 수치와 생활 습관을 바탕으로 내 심혈관 상태를 쉽게 알 수 있어요.",
  },
  {
    id: 3,
    emoji: "✨",
    hint: "!",
    title: "리포트 제공",
    summary: "복잡한 수치, 쉽게 볼 수 있어요",
    detail:
      "한눈에 정리된 결과로 내 건강 상태를 빠르게 확인해보세요.",
  },
  {
    id: 4,
    emoji: "🌿",
    hint: "··?",
    title: "Buddy와 함께",
    summary: "혼자 말고, 같이 해볼까요?",
    detail:
      "Buddy와 함께 성장하면서 더 재미있게 건강 습관을 이어가봐요.",
  },
];

const showcaseSections = [
  {
    id: 1,
    pill: "핵심 기능",
    title: "기록에서 끝나지 않고\n실행과 건강 관리로 이어집니다",
    desc: "",
    mainTitle: "심혈관 AI 예측",
    mainDesc:
      "혈압, 혈당, 콜레스테롤 수치를 바탕으로 심혈관 질환 위험도와 건강 점수를 분석해요.",
    subTitle: "맞춤 챌린지",
    subDesc:
      "금연, 금주, 걷기, 운동하기 등 생활습관 챌린지로 건강한 변화를 시작할 수 있어요.",
    accent: "white",
    align: "split",
  },
  {
    id: 2,
    pill: "AI 심혈관 분석",
    title: "건강검진 수치로 미리 보는\n심혈관 질환 위험 신호",
    desc:
      "수축기 혈압, 이완기 혈압, 공복 혈당, 총 콜레스테롤 같은 건강검진 데이터를 기반으로 AI가 심혈관 위험도를 분석합니다.",
    mainTitle: "심혈관 위험도",
    mainDesc:
      "혈압과 혈당, 콜레스테롤 수치를 바탕으로 현재 심혈관 질환 관련 위험 신호를 분석합니다.",
    subTitle: "심혈관 나이",
    subDesc:
      "실제 나이와 비교한 혈관 건강 상태를 확인하고 생활습관 개선 방향을 파악할 수 있어요.",
    extraTitle: "건강 점수",
    extraDesc:
      "여러 건강 데이터를 종합해 현재 상태를 점수로 보여주고, 주요 위험 요인과 AI 코멘트를 제공합니다.",
    accent: "tint",
    align: "stack",
  },
  {
    id: 3,
    pill: "식단 분석",
    title: "심혈관 건강을 위한\nAI 식단 분석",
    desc:
      "음식 사진을 업로드하면 AI가 탄수화물, 단백질, 지방 비율과 나트륨, 비타민, 무기질 상태를 분석합니다.",
    mainTitle: "식단 분석 예시 리포트",
    mainDesc: "음식 사진 한 장으로 영양 밸런스를 빠르게 확인하세요",
    subTitle: "영양 점수",
    subDesc: "4.2 / 5",
    accent: "white",
    align: "report",
  },
  {
    id: 4,
    pill: "Buddy 스토리",
    title: "반복되는 일상 속에서도\n건강 루틴은 함께 이어집니다",
    desc:
      "버디와 함께 기록과 챌린지를 연결하면서 건강 루틴을 부담 없이 이어갈 수 있어요.",
    mainTitle: "Buddy와 함께 건강 습관 만들기",
    mainDesc:
      "기록과 챌린지를 연결해주는 Buddy는 함께 성장하고, 혼자가 아니라 같이 만드는 건강 루틴을 제안해요.",
    subTitle: "이번 주 건강 스탬프",
    subDesc: "3일 연속 기록 중 · 오늘도 진행 중",
    accent: "tint",
    align: "buddy",
  },
];

export default function HomePage() {
  const router = useRouter();

  const [selectedBubble, setSelectedBubble] =
    useState<(typeof bubbleData)[0] | null>(null);
  const [launching, setLaunching] = useState(false);
  const [introDone] = useState(true);
  const [enableBubbles] = useState(true);
  const [headerTheme, setHeaderTheme] = useState<"light" | "dark">("light");

  const heroSectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const hero = heroSectionRef.current;
    if (!hero) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setHeaderTheme(entry.isIntersecting ? "light" : "dark");
      },
      {
        root: null,
        threshold: 0.12,
        rootMargin: "-80px 0px 0px 0px",
      }
    );

    observer.observe(hero);

    return () => observer.disconnect();
  }, []);

  const particles = useMemo(
    () => [
      { id: 1, x: -84, y: -26, delay: 0.0 },
      { id: 2, x: -54, y: -76, delay: 0.08 },
      { id: 3, x: 0, y: -96, delay: 0.16 },
      { id: 4, x: 56, y: -72, delay: 0.24 },
      { id: 5, x: 86, y: -18, delay: 0.32 },
      { id: 6, x: 44, y: 52, delay: 0.4 },
    ],
    []
  );

  const handleBubbleOpen = (bubble: (typeof bubbleData)[0]) => {
    if (launching || !introDone || !enableBubbles) return;
    setSelectedBubble(bubble);
  };

  const handleAnalyze = () => {
    if (launching || !introDone) return;

    setLaunching(true);
    setSelectedBubble(null);

    window.setTimeout(() => {
      router.push("/input");
    }, 1100);
  };

  return (
    <main className="min-h-screen text-[#163126]">
      <Header visible={introDone} theme={headerTheme} />

      <div className="relative overflow-hidden bg-white">
        <section
          ref={heroSectionRef}
          className="relative min-h-screen overflow-hidden"
        >
          <div className="absolute inset-0 z-0 overflow-hidden">
            <Image
              src="/images/brush-green.webp"
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
            />
          </div>

          {introDone && enableBubbles ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: launching ? 0 : 1 }}
              transition={{ duration: 0.35 }}
              className="pointer-events-none absolute inset-0 z-[60]"
            >
              <FloatingBubbles
                bubbles={bubbleData}
                onOpen={handleBubbleOpen}
                onHover={() => null}
              />
            </motion.div>
          ) : null}

          <div className="relative z-20 mx-auto grid min-h-screen w-full max-w-[1600px] grid-cols-1 items-center gap-10 px-8 pb-14 pt-28 lg:grid-cols-[0.88fr_1.12fr] lg:px-16">
            <motion.div
              initial={false}
              animate={{
                opacity: introDone ? (launching ? 0 : 1) : 0,
                y: introDone ? (launching ? -14 : 0) : 24,
                scale: introDone ? 1 : 1.02,
              }}
              transition={{ duration: 0.5, delay: 0.12, ease: "easeOut" }}
              className="relative z-20 max-w-[620px] pointer-events-none"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/92 drop-shadow-[0_2px_8px_rgba(0,0,0,0.16)]">
                HEALTH JOURNEY
              </p>

              <h1 className="mt-5 text-5xl font-bold leading-[1.02] text-white drop-shadow-[0_4px_18px_rgba(0,0,0,0.18)] md:text-7xl lg:text-[92px]">
                My
                <br />
                Health
                <br />
                Buddy
              </h1>

              <p className="mt-6 max-w-[560px] text-base leading-8 text-white/95 drop-shadow-[0_2px_10px_rgba(0,0,0,0.14)]">
                심혈관 건강, 어렵게 생각하지 말아요
                <br />
                작은 습관 하나부터 시작해서 나만의 건강 루틴을 만들어봐요
              </p>

              <div
                className={`mt-9 ${
                  introDone && !launching
                    ? "pointer-events-auto"
                    : "pointer-events-none"
                }`}
              >
                <motion.button
                  onClick={handleAnalyze}
                  whileHover={!launching ? { y: -2, scale: 1.03 } : {}}
                  whileTap={!launching ? { scale: 0.985 } : {}}
                  className="
                    group relative overflow-hidden
                    rounded-full
                    border border-white/60
                    bg-white/30
                    px-8 py-4
                    text-sm font-semibold
                    text-[#1F5C45]
                    backdrop-blur-md
                    shadow-[0_12px_30px_rgba(22,49,38,0.12)]
                    transition
                    hover:bg-white/40
                    hover:shadow-[0_16px_40px_rgba(22,49,38,0.18)]
                    active:scale-[0.97]
                  "
                >
                  <span className="relative z-10">
                    {launching
                      ? "건강 분석 화면으로 이동 중..."
                      : "심혈관 건강 분석하기"}
                  </span>
                </motion.button>
              </div>
            </motion.div>

            <motion.div
              initial={false}
              animate={{
                opacity: introDone ? (launching ? 0 : 1) : 0,
                y: introDone ? (launching ? -8 : 42) : 64,
                x: introDone ? (launching ? 12 : 42) : 76,
                scale: introDone ? 1 : 0.97,
              }}
              transition={{ duration: 0.58, delay: 0.24, ease: "easeOut" }}
              className="relative z-20 flex items-end justify-center lg:justify-end pointer-events-none"
            >
              <div className="relative flex w-full max-w-[820px] items-end justify-center lg:justify-end">
                <motion.div
                  animate={
                    launching
                      ? { scale: [1, 1.06, 0.94], opacity: [1, 1, 0.94] }
                      : { scale: [1, 1.01, 1] }
                  }
                  transition={
                    launching
                      ? { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
                      : {
                          duration: 3.4,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }
                  }
                  className="relative"
                >
                  <motion.div
                    animate={
                      launching
                        ? { scale: [1, 1.14, 0.88], opacity: [0.12, 0.22, 0] }
                        : { scale: [1, 1.03, 1], opacity: [0.1, 0.18, 0.1] }
                    }
                    transition={
                      launching
                        ? { duration: 0.8, ease: "easeInOut" }
                        : {
                            duration: 3.2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }
                    }
                    className="absolute left-1/2 top-1/2 h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.22)_0%,rgba(199,255,220,0.15)_28%,rgba(255,255,255,0.06)_48%,transparent_72%)] blur-2xl"
                  />

                  {launching && (
                    <div className="pointer-events-none absolute inset-0">
                      {particles.map((p) => (
                        <motion.span
                          key={p.id}
                          initial={{ opacity: 0, scale: 0.4, x: 0, y: 0 }}
                          animate={{
                            opacity: [0, 1, 0],
                            scale: [0.4, 1, 0.7],
                            x: p.x,
                            y: p.y,
                          }}
                          transition={{
                            duration: 0.8,
                            delay: p.delay,
                            ease: "easeOut",
                          }}
                          className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/90 shadow-[0_0_14px_rgba(255,255,255,0.85)]"
                        />
                      ))}
                    </div>
                  )}

                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{
                      y: introDone ? 0 : 10,
                      opacity: introDone ? 1 : 0,
                    }}
                    transition={{ duration: 0.45, delay: 0.42, ease: "easeOut" }}
                    className="absolute left-[-2%] top-[-18%] z-30"
                  >
                    <div className="relative w-[210px] rounded-[26px] border border-white/35 bg-white/18 px-5 py-4 shadow-[0_16px_40px_rgba(22,49,38,0.08)] backdrop-blur-xl md:w-[236px]">
                      <div className="absolute inset-0 rounded-[26px] bg-[linear-gradient(135deg,rgba(255,255,255,0.34),rgba(255,255,255,0.08))]" />

                      <div className="relative z-10">
                        <p className="text-sm font-semibold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.14)]">
                          반가워요 🐹
                        </p>
                        <p className="mt-1 text-sm text-white/95 drop-shadow-[0_1px_6px_rgba(0,0,0,0.12)]">
                          저는 Buddy예요
                        </p>
                        <p className="mt-3 text-[18px] font-bold leading-snug text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.14)]">
                          떠다니는 큰 비눗방울을
                          <br />
                          눌러볼까요?
                        </p>
                      </div>

                      <div className="absolute bottom-[-8px] left-[60%] h-4 w-4 -translate-x-1/2 rotate-45 border-r border-b border-white/35 bg-white/18 backdrop-blur-xl" />
                    </div>
                  </motion.div>

                  <div className="relative w-[340px] sm:w-[410px] lg:w-[500px]">
                    <Image
                      src="/images/hamster-bubble.png"
                      alt="MyHealthBuddy 햄스터 캐릭터"
                      width={500}
                      height={500}
                      priority
                      sizes="(max-width: 640px) 340px, (max-width: 1024px) 410px, 500px"
                      className="h-auto w-full object-contain drop-shadow-[0_22px_46px_rgba(0,0,0,0.10)]"
                    />
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {showcaseSections.map((section, index) => (
          <ShowcaseSection
            key={section.id}
            section={section}
            sectionNumber={index + 2}
          />
        ))}

        <section className="relative px-4 pb-28 pt-20 md:px-10">
          <div className="mx-auto max-w-[1120px]">
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.28 }}
              transition={{ duration: 0.65, ease: "easeOut" }}
              className="relative overflow-hidden rounded-[42px]"
            >
              <ArrivalBackground />

              <div className="relative z-10 px-8 py-16 text-center md:px-16 md:py-20">
                <p className="text-xs font-semibold tracking-[0.3em] text-[#2E7D5B]/80">
                  HEALTH JOURNEY
                </p>

                <h2 className="mt-4 text-3xl font-bold leading-tight text-[#163126] md:text-5xl">
                  이제 건강 루틴을 시작해보세요
                </h2>

                <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[#163126]/72 md:text-base">
                  작은 습관이 모여 더 건강한 일상을 만듭니다.
                  <br />
                  분석 결과를 바탕으로 나에게 맞는 챌린지를 시작해보세요.
                </p>

                <button
                  onClick={handleAnalyze}
                  className="mt-10 rounded-full bg-[#163126] px-8 py-4 text-base font-semibold text-white shadow-[0_10px_30px_rgba(22,49,38,0.2)] transition hover:scale-[1.04] hover:bg-[#1b3a2d]"
                >
                  시작하기
                </button>
              </div>
            </motion.div>
          </div>
        </section>
      </div>

      <BubbleModal
        bubble={selectedBubble}
        onClose={() => setSelectedBubble(null)}
      />
    </main>
  );
}

function ShowcaseSection({
  section,
}: {
  section: {
    pill: string;
    title: string;
    desc: string;
    mainTitle: string;
    mainDesc: string;
    subTitle: string;
    subDesc: string;
    extraTitle?: string;
    extraDesc?: string;
    accent: string;
    align: string;
  };
  sectionNumber: number;
}) {
  return (
    <section className="relative z-20 mx-auto flex min-h-[92vh] w-full max-w-7xl items-center px-4 py-10 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.22 }}
        transition={{ duration: 0.62, ease: "easeOut" }}
        className="relative w-full"
      >
        <SectionBackdrop />

        <div className="relative z-10 min-h-[720px] px-2 py-4 md:px-6 md:py-6">
          <div className="mb-10 max-w-4xl">
            <div className="inline-flex rounded-full bg-[#eef7ee] px-4 py-2 text-sm font-semibold text-[#63b275]">
              {section.pill}
            </div>
            <h3 className="mt-5 whitespace-pre-line text-3xl font-bold leading-tight text-[#163126] md:text-5xl">
              {section.title}
            </h3>
            {section.desc ? (
              <p className="mt-5 max-w-5xl text-sm leading-8 text-[#163126]/62 md:text-base">
                {section.desc}
              </p>
            ) : null}
          </div>

          {section.align === "split" && (
            <div className="grid gap-6 lg:grid-cols-2">
              <MainCard
                title={section.mainTitle}
                desc={section.mainDesc}
                icon="🫀"
              />
              <SubCard
                title={section.subTitle}
                desc={section.subDesc}
                icon="🏃"
              />
            </div>
          )}

          {section.align === "stack" && (
            <div className="grid gap-6 lg:grid-cols-3">
              <MainCard
                title={section.mainTitle}
                desc={section.mainDesc}
                icon="🧪"
              />
              <SubCard
                title={section.subTitle}
                desc={section.subDesc}
                icon="🫀"
              />
              <SubCard
                title={section.extraTitle || ""}
                desc={section.extraDesc || ""}
                icon="📊"
              />
            </div>
          )}

          {section.align === "report" && (
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <MainCard
                title={section.mainTitle}
                desc={section.mainDesc}
                icon="🥗"
                report
              />
              <SubCard
                title={section.subTitle}
                desc={section.subDesc}
                icon="⭐"
                highlight
              />
            </div>
          )}

          {section.align === "buddy" && (
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <MainCard
                title={section.mainTitle}
                desc={section.mainDesc}
                icon="🐹"
                green
              />
              <SubCard
                title={section.subTitle}
                desc={section.subDesc}
                icon="🗓️"
                green
              />
            </div>
          )}
        </div>
      </motion.div>
    </section>
  );
}

function MainCard({
  title,
  desc,
  icon,
  report = false,
  green = false,
}: {
  title: string;
  desc: string;
  icon: string;
  report?: boolean;
  green?: boolean;
}) {
  return (
    <div
      className={`rounded-[32px] border p-6 ${
        green
          ? "border-[#93d0a1]/45 bg-[#68b978] shadow-[0_16px_36px_rgba(22,49,38,0.06)]"
          : "border-[#e5efe8] bg-white shadow-[0_10px_30px_rgba(22,49,38,0.06)]"
      }`}
    >
      <div
        className={`mb-6 flex h-12 w-12 items-center justify-center rounded-2xl ${
          green ? "bg-white/22 text-white" : "bg-[#eaf6ec] text-[#163126]"
        }`}
      >
        <span className="text-xl">{icon}</span>
      </div>

      <h4
        className={`text-3xl font-bold leading-tight ${
          green ? "text-white" : "text-[#163126]"
        }`}
      >
        {title}
      </h4>

      <p
        className={`mt-4 text-sm leading-8 ${
          green ? "text-white/82" : "text-[#163126]/62"
        }`}
      >
        {desc}
      </p>

      {report && (
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <MiniStat title="탄단지 비율" value="탄수 50 · 단백질 30 · 지방 20" />
          <MiniStat
            title="나트륨 상태"
            value="높음"
            valueClass="text-[#d8614d]"
          />
          <MiniStat title="비타민 / 무기질" value="보통 / 부족" />
          <MiniStat title="추천 식사 방향" value="저염 채소 중심" />
        </div>
      )}

      {green && (
        <div className="mt-6 flex flex-wrap gap-2">
          {[
            "건강검진 기반 AI 예측",
            "걷기 · 금주 · 금연 챌린지",
            "식단 분석 결과 연동",
          ].map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-white/18 px-3 py-2 text-xs font-semibold text-white"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function SubCard({
  title,
  desc,
  icon,
  highlight = false,
  green = false,
}: {
  title: string;
  desc: string;
  icon: string;
  highlight?: boolean;
  green?: boolean;
}) {
  return (
    <div
      className={`rounded-[28px] border p-6 ${
        green
          ? "border-[#93d0a1]/45 bg-[#6fbd7d] shadow-[0_14px_30px_rgba(22,49,38,0.05)]"
          : highlight
          ? "border-[#e5efe8] bg-[#f7fbf8] shadow-[0_10px_30px_rgba(22,49,38,0.06)]"
          : "border-[#e5efe8] bg-white shadow-[0_10px_30px_rgba(22,49,38,0.06)]"
      }`}
    >
      <div
        className={`mb-5 flex h-11 w-11 items-center justify-center rounded-2xl ${
          green ? "bg-white/20 text-white" : "bg-[#eaf6ec] text-[#163126]"
        }`}
      >
        <span className="text-lg">{icon}</span>
      </div>

      <h5
        className={`text-2xl font-bold leading-tight ${
          green ? "text-white" : "text-[#163126]"
        }`}
      >
        {title}
      </h5>

      <p
        className={`mt-4 text-sm leading-7 ${
          green ? "text-white/82" : "text-[#163126]/62"
        }`}
      >
        {desc}
      </p>
    </div>
  );
}

function MiniStat({
  title,
  value,
  valueClass = "text-[#163126]",
}: {
  title: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-[18px] border border-[#d9eadc] bg-[#f6faf6] px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#63b275]">
        {title}
      </p>
      <p className={`mt-2 text-sm font-semibold ${valueClass}`}>{value}</p>
    </div>
  );
}

function SectionBackdrop() {
  return <div className="absolute inset-0 bg-white" />;
}

function ArrivalBackground() {
  return (
    <>
      <div className="absolute inset-0 rounded-[42px] bg-[linear-gradient(135deg,#eef8ef_0%,#f8fcf8_100%)]" />
      <div className="absolute inset-0 rounded-[42px] bg-[radial-gradient(circle_at_50%_20%,rgba(160,220,175,0.18)_0%,rgba(160,220,175,0.06)_30%,transparent_65%)]" />
    </>
  );
}