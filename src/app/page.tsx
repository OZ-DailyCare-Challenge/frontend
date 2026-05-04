"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  ArrowRight,
  BarChart3,
  ClipboardCheck,
  HeartPulse,
  LockKeyhole,
  Salad,
  Sparkles,
  Star,
  Trophy,
} from "lucide-react";

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
    emoji: "🌱",
    hint: "···",
    title: "건강 루틴 시작",
    summary: "작은 습관부터\n함께 시작해볼까요?",
    detail:
      "하루 하나씩 실천하며\n나에게 맞는 건강 루틴을 만들어가요.",
  },
  {
    id: 2,
    emoji: "🫀",
    hint: "?",
    title: "AI 건강 분석",
    summary: "내 건강 상태를\n쉽게 확인해보세요.",
    detail:
      "건강검진 수치와 생활 습관을 바탕으로\n심혈관 건강 신호를 분석해요.",
  },
  {
    id: 3,
    emoji: "📊",
    hint: "!",
    title: "리포트 제공",
    summary: "복잡한 수치를\n한눈에 정리해드려요.",
    detail:
      "위험도, 건강 점수, 주요 요인을\n리포트 형태로 쉽게 확인할 수 있어요.",
  },
  {
    id: 4,
    emoji: "🐹",
    image: "/images/buddy-face.png",
    hint: "··?",
    title: "Buddy와 함께",
    summary: "Buddy와 함께\n꾸준히 이어가요.",
    detail:
      "기록과 챌린지를 연결해\n부담 없는 건강 루틴을 제안해요.",
  },
];

const showcaseSections = [
  {
    id: 1,
    pill: "핵심 기능",
    title: "지금의 작은 관리가\n심혈관 건강을 바꿉니다",
    desc:
      "혈압, 혈당, 콜레스테롤 같은 작은 신호를 꾸준히 살피면\n심혈관 건강을 더 일찍 관리할 수 있어요.",
    mainTitle: "위험도 분석",
    mainDesc:
      "건강검진 수치를 분석해\n심혈관 질환 위험도를 예측해요.",
    subTitle: "생활 습관 개선",
    subDesc:
      "식습관, 운동, 스트레스 등\n건강한 습관을 만들 수 있도록 도와드려요.",
    accent: "white",
    align: "split",
  },
  {
    id: 2,
    pill: "AI 심혈관 분석",
    title: "건강검진 수치로 미리 보는\n심혈관 질환 위험 신호",
    desc:
      "수축기 혈압, 이완기 혈압, 공복 혈당,\n총 콜레스테롤 같은 건강검진 데이터를 기반으로\nAI가 심혈관 위험도를 분석합니다.",
    mainTitle: "심혈관 위험도",
    mainDesc:
      "혈압과 혈당, 콜레스테롤 수치를 바탕으로\n현재 심혈관 질환 관련 위험 신호를 분석합니다.",
    subTitle: "심혈관 나이",
    subDesc:
      "실제 나이와 비교한 혈관 건강 상태를 확인하고\n생활습관 개선 방향을 파악할 수 있어요.",
    extraTitle: "건강 점수",
    extraDesc:
      "여러 건강 데이터를 종합해 현재 상태를 점수로 보여주고,\n주요 위험 요인과 AI 코멘트를 제공합니다.",
    accent: "tint",
    align: "stack",
  },
  {
    id: 3,
    pill: "식단 분석",
    title: "심혈관 건강을 위한\nAI 식단 분석",
    desc:
      "음식 사진을 업로드하면 AI가 탄수화물, 단백질, 지방 비율과\n나트륨, 비타민, 무기질 상태를 분석합니다.",
    mainTitle: "식단 분석 예시 리포트",
    mainDesc: "음식 사진 한 장으로\n영양 밸런스를 빠르게 확인하세요",
    subTitle: "영양 점수",
    subDesc: "4.2 / 5",
    accent: "white",
    align: "report",
  },
  {
    id: 4,
    pill: "Buddy와 챌린지",
    title: "Buddy와 함께\n건강 루틴을 꾸준히 이어가요",
    desc:
      "매일의 기록과 챌린지를 연결해\n작은 건강 습관을 자연스럽게 쌓아갈 수 있어요.",
    mainTitle: "Buddy와 함께 건강 습관 만들기",
    mainDesc:
      "기록과 챌린지를 연결해주는 Buddy는 함께 성장하고,\n혼자가 아니라 같이 만드는 건강 루틴을 제안해요.",
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
      router.push("/health/start?mode=first");
    }, 1100);
  };

  return (
    <main className="h-screen overflow-hidden text-[#163126]">
      <Header visible={introDone} theme={headerTheme} />

      <div className="relative h-screen snap-y snap-mandatory overflow-y-auto overflow-x-hidden scroll-smooth bg-white overscroll-contain">
        <section
          ref={heroSectionRef}
          className="relative min-h-screen snap-start snap-always overflow-hidden"
        >
          <div className="absolute inset-0 z-0 overflow-hidden">
            <Image
              src="/images/forest-sky.png"
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

          <div className="relative z-20 mx-auto min-h-screen w-full max-w-[1480px] px-5 pb-8 pt-24 sm:px-8 sm:pb-10 sm:pt-28 lg:grid lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-8 lg:px-16">
            <motion.div
              initial={false}
              animate={{
                opacity: introDone ? (launching ? 0 : 1) : 0,
                y: introDone ? (launching ? -14 : 0) : 24,
                scale: introDone ? 1 : 1.02,
              }}
              transition={{ duration: 0.5, delay: 0.12, ease: "easeOut" }}
              className="relative z-20 min-w-0 max-w-[58vw] pointer-events-none pt-[10vh] sm:max-w-[560px] lg:max-w-[620px] lg:pt-0"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#74b66e] sm:text-xs sm:tracking-[0.34em]">
                🌿 HEALTH JOURNEY
              </p>

              <h1 className="mt-4 text-[clamp(42px,12vw,56px)] font-black leading-[1.02] text-[#3f8a3e] sm:mt-5 sm:text-6xl md:text-7xl lg:text-[92px]">
                My
                <br />
                Health
                <br />
                Buddy
              </h1>

              <p className="mt-5 max-w-[560px] text-sm font-semibold leading-7 text-[#335244] sm:mt-6 sm:text-base sm:leading-8">
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
                    group relative inline-flex items-center gap-2 overflow-hidden
                    rounded-full
                    border border-[#2E7D5B]/10
                    bg-[#3f8a3e]
                    px-4 py-3
                    text-xs font-semibold
                    text-white
                    shadow-[0_14px_30px_rgba(46,125,91,0.24)]
                    transition
                    hover:bg-[#357a36]
                    hover:shadow-[0_16px_38px_rgba(46,125,91,0.30)]
                    active:scale-[0.97]
                    sm:px-7 sm:py-3.5 sm:text-sm
                  "
                >
                  <HeartPulse size={16} className="relative z-10" />
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
                y: introDone ? (launching ? -8 : 28) : 56,
                x: introDone ? (launching ? 8 : 0) : 50,
                scale: introDone ? 1 : 0.97,
              }}
              transition={{ duration: 0.58, delay: 0.24, ease: "easeOut" }}
              className="absolute bottom-[8vh] right-[-2vw] z-20 flex min-w-0 items-center justify-end sm:bottom-[6vh] sm:right-[1vw] lg:relative lg:bottom-auto lg:right-auto lg:translate-x-20 lg:translate-y-14"
            >
              <div className="relative flex w-full max-w-[820px] items-center justify-center lg:justify-end">
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

                  {/* 데스크톱/태블릿: 캐릭터 가까이에 붙는 말풍선 */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{
                      opacity: introDone ? 1 : 0,
                      y: introDone ? 0 : 10,
                    }}
                    transition={{ duration: 0.45, delay: 0.4, ease: "easeOut" }}
                  className="absolute left-[38%] top-[-82px] z-30 block -translate-x-1/2 sm:left-[40%] sm:top-[-88px] lg:left-[36%] lg:top-[-108px]"
                >
                    <div className="relative w-[190px] rounded-[22px] border border-white/55 bg-white/46 px-4 py-3 text-[12px] leading-relaxed text-[#163126] shadow-[0_18px_38px_rgba(22,49,38,0.10)] backdrop-blur-xl sm:w-[228px] sm:rounded-[26px] sm:px-5 sm:py-4 sm:text-[13px] lg:w-[248px]">
                      <div className="absolute inset-0 rounded-[26px] bg-[linear-gradient(135deg,rgba(255,255,255,0.52),rgba(255,255,255,0.26))]" />

                      <div className="relative z-10">
                        <p className="text-xs font-black text-[#163126] sm:text-sm">
                          반가워요, 저는 Buddy예요
                        </p>

                        <p className="mt-1.5 text-xs font-semibold leading-5 text-[#3f5e4f] sm:mt-2 sm:text-sm sm:leading-6">
                          비눗방울을 눌러보며
                          <br />
                          건강 여정을 시작해봐요.
                        </p>
                      </div>

                      {/* 말풍선 꼬리 */}
                      <div className="absolute left-[66%] bottom-[-7px] h-4 w-4 -translate-x-1/2 rotate-45 border-b border-r border-white/55 bg-white/42 backdrop-blur-xl" />
                    </div>
                  </motion.div>

                  <div className="relative w-[clamp(190px,40vw,360px)] md:w-[390px] lg:w-[500px]">
                    <Image
                      src="/images/buddy-bubble.png"
                      alt="MyHealthBuddy 햄스터 캐릭터"
                      width={500}
                      height={500}
                      priority
                      sizes="(max-width: 640px) 48vw, (max-width: 1024px) 420px, 500px"
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

        <section className="relative flex min-h-screen snap-start snap-always items-center px-4 py-20 md:px-10">
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

function ShowcaseSection({ section }: ShowcaseSectionProps) {
  const tinted = section.accent === "tint";

  return (
    <section
      className={`relative z-20 flex min-h-screen w-full snap-start snap-always items-center px-4 py-14 sm:px-6 md:py-20 ${
        tinted ? "bg-[#f3faf5]" : "bg-white"
      }`}
    >
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.22 }}
        transition={{ duration: 0.62, ease: "easeOut" }}
        className="mx-auto w-full max-w-7xl"
      >
        {section.align === "split" ? <SplitShowcase section={section} /> : null}
        {section.align === "stack" ? <StackShowcase section={section} /> : null}
        {section.align === "report" ? <DietShowcase section={section} /> : null}
        {section.align === "buddy" ? <BuddyShowcase section={section} /> : null}
      </motion.div>
    </section>
  );
}

type ShowcaseSectionProps = {
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
  sectionNumber?: number;
};

function SectionIntro({ section }: ShowcaseSectionProps) {
  return (
    <div className="max-w-xl">
      <div className="inline-flex rounded-full bg-[#eaf7ee] px-4 py-2 text-sm font-black text-[#2E7D5B]">
        {section.pill}
      </div>
      <h3 className="mt-5 max-w-[720px] whitespace-pre-line text-balance text-3xl font-black leading-tight text-[#163126] md:text-4xl">
        {section.title}
      </h3>
      {section.desc ? (
        <p className="mt-5 whitespace-pre-line text-sm font-semibold leading-8 text-[#5F6F67] md:text-base">
          {section.desc}
        </p>
      ) : null}
    </div>
  );
}

function SplitShowcase({ section }: ShowcaseSectionProps) {
  return (
    <div className="relative overflow-hidden rounded-[34px] border border-[#dfe9e2] bg-white px-7 py-10 shadow-[0_18px_50px_rgba(22,49,38,0.06)] md:px-10 md:py-14">
      <img
        src="/images/buddy-background.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-top opacity-75"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.97)_0%,rgba(255,255,255,0.9)_44%,rgba(255,255,255,0.48)_72%,rgba(255,255,255,0.20)_100%)]" />

      <div className="relative z-10 grid gap-8 lg:grid-cols-[0.95fr_0.85fr] lg:items-center">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#eaf7ee] px-4 py-2 text-sm font-black text-[#2E7D5B]">
            <HeartPulse size={16} />
            왜 심혈관 건강을 관리해야 할까요?
          </div>
          <h3 className="mt-6 whitespace-pre-line text-4xl font-black leading-tight text-[#163126] md:text-5xl">
            지금의 작은 관리가
            <br />
            <span className="text-[#2E7D5B]">심혈관 건강을 바꿉니다</span>
          </h3>
          <p className="mt-6 whitespace-pre-line text-base font-semibold leading-8 text-[#4f6358]">
            {section.desc}
          </p>
        </div>

        <div className="relative hidden min-h-[330px] items-end justify-center lg:flex">
          <div className="absolute left-0 top-8 rounded-[28px] border border-[#dfe9e2] bg-white/58 px-7 py-5 text-center shadow-[0_16px_36px_rgba(22,49,38,0.08)] backdrop-blur-md">
            <p className="text-sm font-black leading-7 text-[#2E7D5B]">
              오늘의 작은 관리가
              <br />
              건강한 내일을 만들어요!
            </p>
            <div className="absolute bottom-[-8px] right-8 h-4 w-4 rotate-45 border-b border-r border-[#dfe9e2] bg-white/58" />
          </div>
          <img
            src="/images/buddy-heart.png"
            alt=""
            className="relative z-10 h-[310px] w-[310px] translate-x-8 object-contain drop-shadow-[0_18px_32px_rgba(22,49,38,0.10)]"
          />
        </div>
      </div>

      <div className="relative z-10 mx-auto mt-12 w-[94%] overflow-hidden rounded-[30px] border border-[#dfe9e2] bg-white/78 p-5 shadow-[0_18px_42px_rgba(22,49,38,0.08)] backdrop-blur-md">
        <div className="absolute inset-0 bg-white/18" />
        <div className="absolute bottom-0 left-0 top-0 w-[23.05%] overflow-hidden">
          <img
            src="/images/buddy-background.png"
            alt=""
            className="h-full w-full object-cover object-left-bottom opacity-70"
          />
        </div>

        <div className="relative z-10 grid gap-0 overflow-hidden rounded-[24px] lg:grid-cols-[0.9fr_1fr_1fr_1fr]">
          <div className="flex min-h-[150px] items-center bg-white/72 p-5 backdrop-blur-md">
            <p className="whitespace-pre-line text-lg font-black leading-7 text-[#1f5c45]">
              {"심혈관 건강을 관리하면\n이런 변화가\n쌓일 수 있어요."}
            </p>
          </div>
          {[
            {
              icon: <HeartPulse size={24} />,
              title: "심혈관 위험도 감소",
              text: "위험 신호를 빠르게 파악해\n관리 방향을 잡을 수 있어요.",
            },
            {
              icon: <Trophy size={24} />,
              title: "심혈관 나이 개선",
              text: "혈관 건강 상태를 확인하고\n더 젊은 지표를 목표로 관리해요.",
            },
            {
              icon: <Sparkles size={24} />,
              title: "주요 건강 지표 개선",
              text: "혈압, 혈당, 콜레스테롤 변화를\n꾸준히 확인할 수 있어요.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="min-h-[150px] border-t border-[#dfe9e2] bg-transparent p-5 transition hover:bg-white/24 lg:border-l lg:border-t-0 lg:pl-8"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#eaf7ee] text-[#2E7D5B]">
                {item.icon}
              </span>
              <p className="mt-4 text-base font-black leading-6 text-[#163126]">
                {item.title}
              </p>
              <p className="mt-3 whitespace-pre-line text-xs font-semibold leading-6 text-[#5F6F67]">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 mt-8 grid gap-5 lg:grid-cols-[0.9fr_1fr_1fr_1fr]">
        <div className="min-w-0 lg:pt-7">
          <h4 className="whitespace-pre-line break-keep text-2xl font-black leading-tight text-[#163126]">
            <span className="text-[#1f5c45]">MyHealthBuddy</span>가
            <br />
            도와드려요
          </h4>
          <p className="mt-4 whitespace-pre-line text-sm font-semibold leading-7 text-[#5F6F67]">
            {"건강검진 데이터를 기반으로\n심혈관 건강을 함께 관리해요."}
          </p>
        </div>
        {[
          {
            icon: <BarChart3 size={26} />,
            title: section.mainTitle,
            text: section.mainDesc,
          },
          {
            icon: <ClipboardCheck size={26} />,
            title: section.subTitle,
            text: section.subDesc,
          },
          {
            icon: <Trophy size={26} />,
            title: "맞춤형 관리",
            text: "나에게 맞는 목표와\n챌린지로 꾸준히 관리해요.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-[26px] border border-[#dfe9e2] bg-white/82 p-6 shadow-[0_14px_34px_rgba(22,49,38,0.06)] backdrop-blur-md transition hover:-translate-y-1 hover:border-[#46B96A]/35"
          >
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#eaf7ee] text-[#2E7D5B]">
              {item.icon}
            </div>
            <p className="text-lg font-black text-[#163126]">{item.title}</p>
            <p className="mt-3 whitespace-pre-line text-sm font-semibold leading-7 text-[#5F6F67]">
              {item.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function StackShowcase({ section }: ShowcaseSectionProps) {
  return (
    <div className="grid gap-10 lg:grid-cols-[0.72fr_1.1fr] lg:items-center xl:gap-14">
      <div>
        <SectionIntro section={section} />
        <div className="mt-7 rounded-[26px] border border-[#dfe9e2] bg-white p-5 shadow-[0_12px_30px_rgba(22,49,38,0.05)]">
          <p className="text-sm font-black text-[#1f5c45]">
            예시 리포트 데이터
          </p>
          <p className="mt-2 whitespace-pre-line text-sm font-semibold leading-7 text-[#5F6F67]">
            {
              "아래 내용은 랜딩 페이지에서 보여주는 샘플 결과예요.\n실제 분석은 입력한 건강 정보에 따라 달라집니다."
            }
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-4xl rounded-[26px] border border-[#dfe9e2] bg-white p-4 shadow-[0_18px_50px_rgba(22,49,38,0.07)]">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
          <div className="rounded-[22px] border border-[#cfe9d7] bg-[#eef8f1] p-5">
            <p className="text-sm font-black text-[#1f5c45]">심혈관 위험도</p>
            <p className="mt-3 text-4xl font-black text-[#1f7a5b]">8.9%</p>
          </div>

          <div className="flex items-center justify-center rounded-[22px] border border-[#cfe9d7] bg-white p-4">
            <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full border-[8px] border-[#74c8a0] bg-white text-center">
              <p className="text-[11px] font-black tracking-[0.28em] text-[#9aa8a0]">
                RISK
              </p>
              <p className="mt-1 text-xl font-black text-[#1f7a5b]">낮음</p>
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-[20px] border border-[#dfe9e2] bg-white px-4 py-4">
          <p className="text-sm font-black text-[#64756c]">위험도 스펙트럼</p>
          <div className="relative mt-5 h-3 overflow-hidden rounded-full bg-[linear-gradient(90deg,#2ba66d_0%,#2ba66d_33%,#f2a72d_33%,#f2a72d_66%,#e95b5b_66%,#e95b5b_100%)]">
            <span className="absolute left-[8.9%] top-1/2 h-7 w-px -translate-y-1/2 bg-[#163126]" />
          </div>
          <div className="mt-3 grid grid-cols-3 text-center text-xs font-black">
            <span className="text-[#2ba66d]">낮음</span>
            <span className="text-[#c98918]">중간</span>
            <span className="text-[#d85656]">높음</span>
          </div>
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-[20px] border border-[#f2dcdc] bg-[#fff8f8] p-4 text-center">
            <p className="text-sm font-black text-[#163126]/45">실제 나이</p>
            <p className="mt-1 text-2xl font-black text-[#163126]">27세</p>
            <div className="mx-auto mt-3 flex h-24 w-24 items-center justify-center rounded-[26px] bg-[#f35f5f] text-2xl font-black text-white">
              24세
            </div>
            <p className="mt-3 text-sm font-black text-[#163126]">심혈관 나이</p>
            <span className="mt-3 inline-flex rounded-full bg-[#dff5e7] px-3 py-1 text-xs font-black text-[#2E7D5B]">
              실제보다 3세 젊음
            </span>
          </div>

          <div className="rounded-[20px] border border-[#dfe9e2] bg-white p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-lg font-black text-[#163126]">주요 위험 요인</p>
              <span className="rounded-full bg-[#eaf7ee] px-3 py-1 text-xs font-black text-[#2E7D5B]">
                주의 필요
              </span>
            </div>
            {["고혈압", "콜레스테롤 관리 필요", "체중 관리 필요"].map(
              (item, index) => (
                <div
                  key={item}
                  className="mb-3 flex items-center gap-3 text-sm font-bold text-[#163126]/72 last:mb-0"
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${
                      index === 0
                        ? "bg-[#fff0e7] text-[#d8614d]"
                        : "bg-[#eaf7ee] text-[#2E7D5B]"
                    }`}
                  >
                    !
                  </span>
                  {item}
                </div>
              )
            )}
          </div>
        </div>

        <div className="mt-3 rounded-[20px] border border-[#cfe9d7] bg-[#eef8f1] px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-[#2E7D5B]" />
            <p className="text-sm font-black text-[#163126]">AI 평가</p>
          </div>
        </div>

        <div className="mt-3 rounded-[20px] border border-[#dfe9e2] bg-white p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy size={19} className="text-[#2E7D5B]" />
              <p className="text-lg font-black text-[#163126]">
                AI 추천 챌린지
              </p>
            </div>
          </div>
          <div className="flex min-h-[92px] items-center justify-center rounded-[18px] border border-[#dfe9e2] bg-[#fbfdfb]">
            <LockKeyhole size={28} className="text-[#9aa8a0]" />
          </div>
        </div>
      </div>
    </div>
  );
}

function DietShowcase({ section }: ShowcaseSectionProps) {
  return (
    <div className="grid gap-10 lg:grid-cols-[1.08fr_0.7fr] lg:items-center xl:gap-14">
      <div className="mx-auto w-full max-w-3xl rounded-[26px] border border-[#dfe9e2] bg-white p-4 shadow-[0_18px_50px_rgba(22,49,38,0.07)] lg:order-1">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#2E7D5B]">
              diet result
            </p>
            <h4 className="mt-2 text-2xl font-black text-[#163126]">
              오늘의 식단 분석 결과
            </h4>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#ecf9f1] px-3 py-1.5 text-xs font-black text-[#2E7D5B]">
            <Sparkles size={14} />
            무료 분석
          </span>
        </div>

        <div className="grid gap-3 lg:grid-cols-[0.9fr_1fr]">
          <div className="overflow-hidden rounded-[22px] border border-[#dfe9e2] bg-[#f9fcfa]">
            <img
              src="/images/salad-bowl-preview.png"
              alt="그릴 치킨 샐러드 볼"
              className="h-[210px] w-full object-cover"
            />
            <div className="flex flex-wrap gap-1.5 p-3">
              {["그릴 치킨", "옥수수", "아보카도", "토마토", "상추"].map(
                (item) => (
                  <span
                    key={item}
                    className="rounded-full border border-[#dfe9e2] bg-white px-2.5 py-1 text-[11px] font-bold text-[#5F6F67]"
                  >
                    {item}
                  </span>
                )
              )}
            </div>
          </div>

          <div className="rounded-[22px] border border-[#dfe9e2] bg-[#f9fcfa] p-4">
            <p className="text-sm font-black text-[#2E7D5B]">분석 요약</p>
            <h5 className="mt-2 text-2xl font-black text-[#163126]">
              그릴 치킨 샐러드 볼
            </h5>

            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-20 min-w-[80px] shrink-0 flex-col items-center justify-center rounded-[20px] border border-[#2E7D5B]/10 bg-[#ecf9f1] px-3 text-center">
                <p className="text-sm font-black text-[#2E7D5B]">무료 분석</p>
                <p className="mt-1 text-[11px] font-bold text-[#163126]/55">
                  요약 제공
                </p>
              </div>
              <p className="rounded-[18px] bg-white px-3 py-3 text-sm font-semibold leading-6 text-[#5F6F67]">
                영양적으로 균형 잡힌 식사입니다.
                <br />
                다음 식사에는 통곡물이나 퀴노아를 추가해보세요.
              </p>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <MiniStat title="예상 칼로리" value="450 kcal" />
              <MiniStat title="나트륨 수준" value="낮음" />
              <MiniStat title="비타민" value="-" />
              <MiniStat title="무기질" value="-" />
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-[22px] border border-[#cfe9d7] bg-[#eef8f1] p-4">
          <div className="mb-3 flex items-center gap-2">
            <HeartPulse size={17} className="text-[#2E7D5B]" />
            <p className="text-sm font-black text-[#163126]">탄단지 비율</p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              ["탄수화물", "30%", "bg-[#7EDAA0]"],
              ["단백질", "40%", "bg-[#2E7D5B]"],
              ["지방", "30%", "bg-[#C6E377]"],
            ].map(([label, value, color]) => (
              <div key={label} className="rounded-[16px] bg-white p-3">
                <div className="mb-2 flex items-center justify-between text-xs font-black">
                  <span className="text-[#5F6F67]">{label}</span>
                  <span className="text-[#163126]">{value}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#eef3ef]">
                  <div
                    className={`h-full rounded-full ${color}`}
                    style={{ width: value }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="lg:order-2">
        <SectionIntro section={section} />
        <div className="relative mt-10 hidden min-h-[260px] items-end justify-center sm:flex">
          <div className="absolute bottom-0 h-20 w-72 rounded-[50%] bg-[#dcefd8]" />
          <img
            src="/images/buddy-camera.png"
            alt=""
            className="relative z-10 h-[240px] w-[240px] object-contain drop-shadow-[0_18px_28px_rgba(22,49,38,0.12)]"
          />
        </div>
      </div>
    </div>
  );
}

const challengePreviewDays = [
  null,
  null,
  null,
  null,
  null,
  { day: 1, stickers: ["🥗", "💧"], streak: false },
  { day: 2, stickers: ["🚶"], streak: true },
  { day: 3, stickers: ["🥗", "💧"], streak: true },
  { day: 4, stickers: ["🥗", "💧", "🚶"], streak: true, today: true },
  { day: 5, stickers: ["💧", "🧘"], streak: true },
  { day: 6, stickers: ["🥗"], streak: true },
  { day: 7, stickers: ["🚶", "💧"], streak: true },
  { day: 8, stickers: ["🥗", "💧"], streak: true },
  { day: 9, stickers: ["🥗", "🚶"], streak: true },
  { day: 10, stickers: ["💧"], streak: true },
  { day: 11, stickers: ["🥗", "🧘"], streak: true },
  { day: 12, stickers: ["💧", "🚶"], streak: true },
  { day: 13, stickers: ["🥗", "💧"], streak: true },
  { day: 14, stickers: ["🚶"], streak: true },
  { day: 15, stickers: ["🥗", "💧", "🧘"], streak: true },
  { day: 16, stickers: ["🚶", "💧"], streak: true },
  { day: 17, stickers: ["🥗"], streak: true },
  { day: 18, stickers: ["💧", "🧘"], streak: true },
  { day: 19, stickers: ["🥗", "🚶"], streak: true },
  { day: 20, stickers: ["💧"], streak: true },
  { day: 21, stickers: ["🥗", "💧"], streak: true },
  { day: 22, stickers: ["🚶", "🧘"], streak: true },
  { day: 23, stickers: ["🥗", "💧"], streak: true },
  { day: 24, stickers: ["💧"], streak: true },
  { day: 25, stickers: ["🥗", "🚶"], streak: true },
  { day: 26, stickers: ["💧", "🧘"], streak: true },
  { day: 27, stickers: ["🥗"], streak: true },
  { day: 28, stickers: ["🚶", "💧"], streak: true },
  { day: 29, stickers: ["🥗", "💧"], streak: true },
  { day: 30, stickers: ["🧘", "🚶"], streak: true },
  { day: 31, stickers: ["🥗", "💧"], streak: true },
] as const;

function BuddyShowcase({ section }: ShowcaseSectionProps) {
  return (
    <div className="grid gap-10 lg:grid-cols-[0.72fr_0.95fr] lg:items-center xl:gap-14">
      <div>
        <SectionIntro section={section} />
        <div className="relative mt-10 hidden min-h-[260px] items-end justify-center sm:flex">
          <div className="absolute bottom-0 h-20 w-72 rounded-[50%] bg-[#dcefd8]" />
          <img
            src="/images/buddy-review.png"
            alt=""
            className="relative z-10 h-[240px] w-[240px] object-contain drop-shadow-[0_18px_28px_rgba(22,49,38,0.12)]"
          />
        </div>
      </div>

      <div className="mx-auto w-full max-w-[680px] rounded-[24px] border border-[#dfe9e2] bg-white p-4 shadow-[0_18px_50px_rgba(22,49,38,0.07)]">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ClipboardCheck size={20} className="text-[#2E7D5B]" />
              <p className="text-sm font-black text-[#1f5c45]">챌린지 기록</p>
            </div>
            <h4 className="mt-2 text-2xl font-black text-[#163126]">
              2026년 5월
            </h4>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              ["bg-[#eaf7ee] text-[#2E7D5B]", "당일 인증"],
              ["bg-[#fff7eb] text-[#d87916]", "연속 달성"],
            ].map(([className, label]) => (
              <span
                key={label}
                className={`rounded-full px-2.5 py-1 text-[11px] font-black ${className}`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-black text-[#81908a]">
          {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-7 gap-1.5">
          {challengePreviewDays.map((cell, index) =>
            cell ? (
              <div
                key={cell.day}
                className={`min-h-[52px] rounded-[12px] border p-1.5 transition hover:-translate-y-0.5 hover:shadow-[0_10px_20px_rgba(22,49,38,0.08)] ${
                  "today" in cell && cell.today
                    ? "border-[#46B96A] bg-[#f2fbf5]"
                    : "border-[#d7ecd9] bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black ${
                      "today" in cell && cell.today
                        ? "bg-[#163126] text-white"
                        : "text-[#5F6F67]"
                    }`}
                  >
                    {cell.day}
                  </span>
                  {cell.streak ? (
                    <span className="text-xs leading-none">🔥</span>
                  ) : null}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {cell.stickers.map((sticker) => (
                    <span
                      key={`${cell.day}-${sticker}`}
                      className="flex h-5 w-5 items-center justify-center rounded-full bg-[#eaf7ee] text-xs"
                    >
                      {sticker}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div
                key={`blank-${index}`}
                className="min-h-[52px] rounded-[12px] border border-transparent"
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}

function FeaturePill({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="group flex min-h-[112px] items-center gap-4 rounded-[22px] border border-[#dfe9e2] bg-white px-5 py-4 shadow-[0_12px_28px_rgba(22,49,38,0.05)] transition hover:-translate-y-0.5 hover:border-[#46B96A]/35">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#eaf7ee] text-[#2E7D5B]">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-base font-black text-[#163126]">{title}</p>
        <p className="mt-2 whitespace-pre-line text-sm font-semibold leading-6 text-[#5F6F67]">
          {text}
        </p>
      </div>
      <ArrowRight
        size={18}
        className="ml-auto shrink-0 text-[#46B96A] opacity-70"
      />
    </div>
  );
}

function InfoTile({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="min-h-[250px] rounded-[26px] border border-[#dfe9e2] bg-white p-6 shadow-[0_14px_34px_rgba(22,49,38,0.06)] transition hover:-translate-y-1 hover:border-[#46B96A]/35">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf7ee] text-[#2E7D5B]">
        {icon}
      </div>
      <h5 className="text-xl font-black leading-tight text-[#163126]">
        {title}
      </h5>
      <p className="mt-4 whitespace-pre-line text-sm font-semibold leading-7 text-[#5F6F67]">
        {text}
      </p>
      <button className="mt-5 flex h-8 w-8 items-center justify-center rounded-full bg-[#46B96A] text-white">
        <ArrowRight size={15} />
      </button>
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

function ArrivalBackground() {
  return (
    <>
      <div className="absolute inset-0 rounded-[42px] bg-[linear-gradient(135deg,#eef8ef_0%,#f8fcf8_100%)]" />
      <img
        src="/images/buddy-background.png"
        alt=""
        className="absolute inset-0 h-full w-full rounded-[42px] object-cover opacity-70"
      />
    </>
  );
}
