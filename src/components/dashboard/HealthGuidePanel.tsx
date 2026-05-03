"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  RotateCcw,
  HeartPulse,
  Play,
  Timer,
  Volume2,
  VolumeX,
  Wind,
  X,
} from "lucide-react";

const buddyTips = [
  {
    category: "혈압 관리",
    title: "짠 음식은 한 번만 덜어내기",
    description:
      "국물은 절반만 먹고, 젓갈이나 장아찌는 양을 줄이면 나트륨 조절에 도움이 돼요.",
    accent: "bg-[#fff0f0] text-[#d24c4c]",
  },
  {
    category: "식단",
    title: "접시의 절반은 채소로 채우기",
    description:
      "탄수화물만 줄이기보다 채소, 단백질, 통곡물을 함께 구성하면 포만감이 오래가요.",
    accent: "bg-[#eef9f2] text-[#2E7D5B]",
  },
  {
    category: "운동",
    title: "식후 10분 걷기부터 시작하기",
    description:
      "긴 운동이 부담스럽다면 식후 가벼운 걷기만으로도 혈당과 컨디션 관리에 도움이 돼요.",
    accent: "bg-[#eafaf6] text-[#0f9f86]",
  },
  {
    category: "스트레스",
    title: "숨을 길게 내쉬는 1분 호흡",
    description:
      "4초 들이마시고 6초 내쉬는 호흡을 반복하면 긴장을 낮추는 데 도움이 될 수 있어요.",
    accent: "bg-[#fff7e8] text-[#c87916]",
  },
  {
    category: "생활 습관",
    title: "잠들기 1시간 전 화면 줄이기",
    description:
      "수면 전 스마트폰 사용을 줄이면 수면 리듬이 안정되고 다음 날 피로감이 줄어들 수 있어요.",
    accent: "bg-[#f1efff] text-[#6f5bd8]",
  },
];

type AssessmentKind = "pss" | "ftnd" | "audit";

type AssessmentQuestion = {
  id: number;
  question: string;
  reverse?: boolean;
  options: {
    value: number;
    label: string;
  }[];
};

type AssessmentRange = {
  label: string;
  range: string;
  min: number;
  max: number;
  color: string;
  bg: string;
  description: string;
};

type AssessmentConfig = {
  kind: AssessmentKind;
  code: string;
  title: string;
  subtitle: string;
  cardTitle: string;
  cardDescription: string;
  buttonLabel: string;
  scoreLabel: string;
  maxScore: number;
  questions: AssessmentQuestion[];
  ranges: AssessmentRange[];
  introTitle: string;
  intro: string[];
  recommendation: string;
};

const pssOptions = [
  { value: 0, label: "전혀 없음" },
  { value: 1, label: "거의 없음" },
  { value: 2, label: "가끔" },
  { value: 3, label: "자주" },
  { value: 4, label: "매우 자주" },
];

const pssQuestions = [
  "예상치 못한 일 때문에 당황한 적이 있었나요?",
  "중요한 일을 통제할 수 없다고 느낀 적이 있었나요?",
  "초조하거나 스트레스를 받는다고 느낀 적이 있었나요?",
  "개인적인 문제를 잘 처리할 수 있다고 느낀 적이 있었나요?",
  "일이 원하는 방향으로 잘 진행된다고 느낀 적이 있었나요?",
  "처리해야 할 일이 너무 많다고 느낀 적이 있었나요?",
  "짜증 나는 일을 잘 조절할 수 있다고 느낀 적이 있었나요?",
  "모든 일이 잘 통제되고 있다고 느낀 적이 있었나요?",
  "통제할 수 없는 일 때문에 화가 난 적이 있었나요?",
  "어려운 일이 너무 많이 쌓여 극복할 수 없다고 느낀 적이 있었나요?",
].map((question, index) => ({
  id: index,
  question,
  reverse: [3, 4, 6, 7].includes(index),
  options: pssOptions,
}));

const ftndQuestions: AssessmentQuestion[] = [
  {
    id: 0,
    question: "아침에 일어난 뒤 얼마 만에 첫 담배를 피우나요?",
    options: [
      { value: 3, label: "5분 이내" },
      { value: 2, label: "6~30분" },
      { value: 1, label: "31~60분" },
      { value: 0, label: "60분 이후" },
    ],
  },
  {
    id: 1,
    question: "금연 구역에서 흡연을 참기 어렵나요?",
    options: [
      { value: 1, label: "예" },
      { value: 0, label: "아니오" },
    ],
  },
  {
    id: 2,
    question: "하루 중 포기하기 가장 어려운 담배는 무엇인가요?",
    options: [
      { value: 1, label: "아침 첫 담배" },
      { value: 0, label: "그 외" },
    ],
  },
  {
    id: 3,
    question: "하루에 보통 담배를 몇 개비 피우나요?",
    options: [
      { value: 0, label: "10개비 이하" },
      { value: 1, label: "11~20개비" },
      { value: 2, label: "21~30개비" },
      { value: 3, label: "31개비 이상" },
    ],
  },
  {
    id: 4,
    question: "아침에 일어난 직후 다른 시간보다 더 자주 피우나요?",
    options: [
      { value: 1, label: "예" },
      { value: 0, label: "아니오" },
    ],
  },
  {
    id: 5,
    question: "몸이 아파 누워 있어도 담배를 피우나요?",
    options: [
      { value: 1, label: "예" },
      { value: 0, label: "아니오" },
    ],
  },
];

const auditFrequencyOptions = [
  { value: 0, label: "전혀 없음" },
  { value: 1, label: "월 1회 이하" },
  { value: 2, label: "월 2~4회" },
  { value: 3, label: "주 2~3회" },
  { value: 4, label: "주 4회 이상" },
];

const auditOccasionOptions = [
  { value: 0, label: "1~2잔" },
  { value: 1, label: "3~4잔" },
  { value: 2, label: "5~6잔" },
  { value: 3, label: "7~9잔" },
  { value: 4, label: "10잔 이상" },
];

const auditCommonOptions = [
  { value: 0, label: "전혀 없음" },
  { value: 1, label: "월 1회 미만" },
  { value: 2, label: "월 1회" },
  { value: 3, label: "주 1회" },
  { value: 4, label: "거의 매일" },
];

const auditHarmOptions = [
  { value: 0, label: "없음" },
  { value: 2, label: "있지만 지난 1년 전" },
  { value: 4, label: "지난 1년 내 있음" },
];

const auditQuestions: AssessmentQuestion[] = [
  {
    id: 0,
    question: "술을 얼마나 자주 마시나요?",
    options: auditFrequencyOptions,
  },
  {
    id: 1,
    question: "술을 마시는 날에는 보통 몇 잔을 마시나요?",
    options: auditOccasionOptions,
  },
  {
    id: 2,
    question: "한 번에 6잔 이상 마시는 경우가 얼마나 자주 있나요?",
    options: auditCommonOptions,
  },
  {
    id: 3,
    question: "술을 마시기 시작하면 멈출 수 없었던 적이 얼마나 자주 있나요?",
    options: auditCommonOptions,
  },
  {
    id: 4,
    question: "음주 때문에 해야 할 일을 못 한 적이 얼마나 자주 있나요?",
    options: auditCommonOptions,
  },
  {
    id: 5,
    question: "과음 후 아침에 다시 술이 필요했던 적이 얼마나 자주 있나요?",
    options: auditCommonOptions,
  },
  {
    id: 6,
    question: "음주 후 죄책감이나 후회를 느낀 적이 얼마나 자주 있나요?",
    options: auditCommonOptions,
  },
  {
    id: 7,
    question: "음주 후 전날 일을 기억하지 못한 적이 얼마나 자주 있나요?",
    options: auditCommonOptions,
  },
  {
    id: 8,
    question: "음주로 본인이나 다른 사람이 다친 적이 있나요?",
    options: auditHarmOptions,
  },
  {
    id: 9,
    question: "주변 사람이 술을 줄이라고 걱정하거나 권한 적이 있나요?",
    options: auditHarmOptions,
  },
];

const assessmentConfigs: Record<AssessmentKind, AssessmentConfig> = {
  pss: {
    kind: "pss",
    code: "PSS-10",
    title: "스트레스 수준 자가 체크",
    subtitle: "최근 한 달 동안 얼마나 자주 느꼈는지 선택해주세요.",
    cardTitle: "스트레스 체크",
    cardDescription:
      "PSS 문항으로 최근 한 달의 스트레스 체감 수준을 확인해보세요.",
    buttonLabel: "스트레스 체크하기",
    scoreLabel: "나의 PSS 점수",
    maxScore: 40,
    questions: pssQuestions,
    ranges: [
      {
        label: "낮음",
        range: "0-13점",
        min: 0,
        max: 13,
        color: "text-[#2E7D5B]",
        bg: "bg-[#eef9f2]",
        description: "현재 스트레스 체감 수준은 비교적 낮은 편이에요.",
      },
      {
        label: "보통",
        range: "14-26점",
        min: 14,
        max: 26,
        color: "text-[#c87916]",
        bg: "bg-[#fff7e8]",
        description: "일상적인 스트레스가 누적되고 있을 수 있어요.",
      },
      {
        label: "높음",
        range: "27-40점",
        min: 27,
        max: 40,
        color: "text-[#d24c4c]",
        bg: "bg-[#fff0f0]",
        description: "스트레스 체감 수준이 높은 편이라 휴식과 점검이 필요해요.",
      },
    ],
    introTitle: "PSS란?",
    intro: [
      "PSS는 Perceived Stress Scale의 약자로, 최근 한 달 동안 스트레스를 얼마나 자주 체감했는지 확인하는 자가 점검 설문이에요.",
      "각 문항은 0~4점으로 계산되고, 총점은 0~40점이에요. 점수가 높을수록 스트레스를 더 많이 느끼는 상태로 해석합니다.",
      "4, 5, 7, 8번처럼 긍정적인 문항은 역채점돼요. 그래서 모든 문항을 같은 답으로 선택해도 단순히 0점이 되지는 않을 수 있어요.",
    ],
    recommendation:
      "결과가 높게 나왔다면 오늘은 짧은 호흡, 산책, 수면 루틴처럼 바로 실행 가능한 행동부터 줄여보세요. 불편감이 지속되면 전문가 상담을 권장해요.",
  },
  ftnd: {
    kind: "ftnd",
    code: "FTND",
    title: "니코틴 의존도 체크",
    subtitle: "현재 흡연 패턴에 가장 가까운 답을 선택해주세요.",
    cardTitle: "니코틴 의존도",
    cardDescription:
      "FTND 문항으로 흡연 습관과 니코틴 의존 정도를 확인해보세요.",
    buttonLabel: "흡연 의존도 체크하기",
    scoreLabel: "나의 FTND 점수",
    maxScore: 10,
    questions: ftndQuestions,
    ranges: [
      {
        label: "낮음",
        range: "0-3점",
        min: 0,
        max: 3,
        color: "text-[#2E7D5B]",
        bg: "bg-[#eef9f2]",
        description: "니코틴 의존도는 비교적 낮은 편으로 볼 수 있어요.",
      },
      {
        label: "보통",
        range: "4-6점",
        min: 4,
        max: 6,
        color: "text-[#c87916]",
        bg: "bg-[#fff7e8]",
        description: "니코틴 의존이 습관과 연결되어 있을 수 있어요.",
      },
      {
        label: "높음",
        range: "7-10점",
        min: 7,
        max: 10,
        color: "text-[#d24c4c]",
        bg: "bg-[#fff0f0]",
        description: "니코틴 의존도가 높은 편이라 금연 계획과 도움이 필요할 수 있어요.",
      },
    ],
    introTitle: "FTND란?",
    intro: [
      "FTND는 Fagerstrom Test for Nicotine Dependence의 약자로, 담배 사용과 니코틴 의존 정도를 간단히 확인하는 6문항 자가 점검 도구예요.",
      "총점은 0~10점이며 점수가 높을수록 니코틴 의존도가 높은 편으로 해석합니다.",
      "자가 점검 결과일 뿐 진단은 아니며, 금연이 어렵거나 금단 증상이 크다면 전문가 도움을 받는 것이 좋아요.",
    ],
    recommendation:
      "점수가 높다면 흡연 시간대와 유발 상황을 먼저 기록해보세요. 금연 시도 전에는 니코틴 대체요법이나 상담 지원을 함께 고려할 수 있어요.",
  },
  audit: {
    kind: "audit",
    code: "AUDIT",
    title: "알코올 사용 위험도 체크",
    subtitle: "최근 1년 동안의 음주 경험에 가장 가까운 답을 선택해주세요.",
    cardTitle: "알코올 사용 위험도",
    cardDescription:
      "AUDIT 문항으로 음주 습관과 위험 신호를 자가 점검해보세요.",
    buttonLabel: "음주 습관 체크하기",
    scoreLabel: "나의 AUDIT 점수",
    maxScore: 40,
    questions: auditQuestions,
    ranges: [
      {
        label: "낮은 위험",
        range: "0-7점",
        min: 0,
        max: 7,
        color: "text-[#2E7D5B]",
        bg: "bg-[#eef9f2]",
        description: "현재 응답 기준으로는 낮은 위험 음주 범위에 가까워요.",
      },
      {
        label: "위험 음주",
        range: "8-15점",
        min: 8,
        max: 15,
        color: "text-[#c87916]",
        bg: "bg-[#fff7e8]",
        description: "음주량이나 빈도를 줄이는 것이 도움이 될 수 있어요.",
      },
      {
        label: "유해 음주",
        range: "16-19점",
        min: 16,
        max: 19,
        color: "text-[#d06a2b]",
        bg: "bg-[#fff2e8]",
        description: "음주로 인한 건강 또는 생활 영향이 나타날 수 있는 구간이에요.",
      },
      {
        label: "의존 가능성",
        range: "20-40점",
        min: 20,
        max: 40,
        color: "text-[#d24c4c]",
        bg: "bg-[#fff0f0]",
        description: "알코올 의존 가능성이 있어 전문적인 평가를 권장해요.",
      },
    ],
    introTitle: "AUDIT란?",
    intro: [
      "AUDIT는 Alcohol Use Disorders Identification Test의 약자로, WHO에서 개발한 알코올 사용 위험도 선별 도구예요.",
      "10문항으로 구성되어 있고 총점은 0~40점이에요. 점수가 높을수록 위험 음주, 유해 음주, 의존 가능성이 커질 수 있습니다.",
      "이 결과는 진단이 아니라 자가 점검용 참고 지표예요. 걱정되는 결과가 나오면 의료진이나 상담 기관의 평가를 권장해요.",
    ],
    recommendation:
      "점수가 높다면 음주 빈도와 음주량을 먼저 줄이는 목표를 정해보세요. 기억 단절, 부상, 주변의 걱정이 있었다면 전문 상담을 권장해요.",
  },
};

function getAssessmentLevel(config: AssessmentConfig, score: number) {
  return (
    config.ranges.find((range) => score >= range.min && score <= range.max) ??
    config.ranges[config.ranges.length - 1]
  );
}

export default function HealthGuidePanel({
  isOpen,
  onToggle,
}: {
  isOpen: boolean;
  onToggle: () => void;
}) {
  const [activeAssessment, setActiveAssessment] =
    useState<AssessmentKind | null>(null);
  const [activeTipIndex, setActiveTipIndex] = useState(0);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [meditationOpen, setMeditationOpen] = useState(false);
  const [relationOpen, setRelationOpen] = useState(false);

  useEffect(() => {
    const syncVisibility = () => {
      setIsPageVisible(document.visibilityState === "visible");
    };

    syncVisibility();
    document.addEventListener("visibilitychange", syncVisibility);

    return () => {
      document.removeEventListener("visibilitychange", syncVisibility);
    };
  }, []);

  useEffect(() => {
    if (!isOpen || !isPageVisible) return;

    const timer = window.setInterval(() => {
      setActiveTipIndex((prev) => (prev + 1) % buddyTips.length);
    }, 10000);

    return () => window.clearInterval(timer);
  }, [isOpen, isPageVisible]);

  const activeTip = buddyTips[activeTipIndex];
  const moveTip = (direction: number) => {
    setActiveTipIndex((prev) => {
      return (prev + direction + buddyTips.length) % buddyTips.length;
    });
  };

  return (
    <>
      <aside className="min-w-0 min-[1800px]:sticky min-[1800px]:top-28 min-[1800px]:self-start">
        {!isOpen ? (
          <button
            type="button"
            onClick={onToggle}
            className="flex min-h-[260px] w-full flex-col items-center justify-center gap-3 rounded-[28px] border border-[#163126]/8 bg-white/85 px-3 py-5 text-[#2E7D5B] shadow-[0_18px_50px_rgba(46,125,91,0.06)] transition hover:bg-[#f8fbf8]"
            aria-label="심혈관 건강 가이드 열기"
            aria-expanded={false}
          >
            <HeartPulse size={20} />
            <span className="vertical-rl text-sm font-bold [writing-mode:vertical-rl]">
              심혈관 건강 가이드
            </span>
            <ChevronLeft size={18} />
          </button>
        ) : (
        <section className="min-w-0 overflow-hidden rounded-[28px] border border-[#163126]/8 bg-white/85 shadow-[0_18px_50px_rgba(46,125,91,0.06)]">
          <button
            type="button"
            onClick={onToggle}
            className="flex w-full items-center justify-between gap-3 px-5 py-5 text-left transition hover:bg-[#f8fbf8]"
            aria-expanded={isOpen}
          >
            <div className="flex items-center gap-2">
              <HeartPulse size={18} className="text-[#2E7D5B]" />
              <h2 className="text-base font-bold text-[#163126]">
                심혈관 건강 가이드
              </h2>
            </div>
            <ChevronRight
              size={18}
              className="text-[#163126]/35 transition-transform"
            />
          </button>

          <div className="border-t border-[#163126]/8 p-5">
            <div className="grid min-w-0 gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr))] min-[1800px]:grid-cols-1">
              <GuideSection id="buddy-tip-section" title="버디의 팁">
                <motion.div
                  key={activeTip.category}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.18}
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -50) moveTip(1);
                    if (info.offset.x > 50) moveTip(-1);
                  }}
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.24 }}
                  className="cursor-grab rounded-[22px] border border-[#163126]/8 bg-white p-4 active:cursor-grabbing"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${activeTip.accent}`}
                    >
                      {activeTip.category}
                    </span>
                    <span className="text-xs font-semibold text-[#163126]/38">
                      {activeTipIndex + 1}/{buddyTips.length}
                    </span>
                  </div>

                  <p className="mt-4 text-sm font-bold leading-6 text-[#163126]">
                    {activeTip.title}
                  </p>
                  <p className="mt-2 min-h-[60px] text-sm leading-6 text-[#163126]/62">
                    {activeTip.description}
                  </p>

                  <div className="mt-4 flex gap-1.5">
                    {buddyTips.map((tip, index) => (
                      <button
                        key={tip.category}
                        type="button"
                        onClick={() => setActiveTipIndex(index)}
                        className={`h-2 rounded-full transition-all ${
                          index === activeTipIndex
                            ? "w-6 bg-[#2E7D5B]"
                            : "w-2 bg-[#d8e6dd]"
                        }`}
                        aria-label={`${tip.category} 팁 보기`}
                      />
                    ))}
                  </div>
                </motion.div>
              </GuideSection>

              <GuideSection id="self-check-section" title="자가 체크">
                <div className="flex items-start justify-between gap-4">
                  <p className="min-w-0 flex-1 text-sm text-[#163126]/65">
                    스트레스, 니코틴, 음주 위험도를 간단히 점검해보세요.
                  </p>
                  <img
                    src="/images/buddy-check.png"
                    alt=""
                    className="h-24 w-24 shrink-0 object-contain"
                  />
                </div>

                <div className="mt-5 grid gap-3">
                  {(["pss", "ftnd", "audit"] as AssessmentKind[]).map((kind) => {
                    const config = assessmentConfigs[kind];

                    return (
                      <button
                        key={kind}
                        type="button"
                        onClick={() => setActiveAssessment(kind)}
                        className="rounded-[18px] border border-[#163126]/8 bg-white px-4 py-3 text-left transition hover:border-[#2E7D5B]/30 hover:bg-[#f7fbf8]"
                      >
                        <span className="text-sm font-bold text-[#163126]">
                          {config.buttonLabel}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-[#163126]/55">
                          {config.cardDescription}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </GuideSection>

              <GuideSection id="stress-care-section" title="스트레스 관리">
                <p className="text-sm text-[#163126]/58">
                  몸과 마음이 편안해지는 짧은 루틴을 골라보세요.
                </p>

                <button
                  type="button"
                  onClick={() => setMeditationOpen(true)}
                  className="mt-5 flex w-full items-center justify-between gap-3 rounded-[22px] border border-[#163126]/8 bg-white px-4 py-3 text-left transition hover:border-[#2E7D5B]/30 hover:bg-[#f7fbf8]"
                >
                  <span className="flex min-w-0 items-start gap-2">
                    <Wind size={17} className="mt-0.5 shrink-0 text-[#2E7D5B]" />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-[#163126]">
                        명상하기
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-[#163126]/52">
                        버디와 함께 호흡을 가볍게 정리해보세요.
                      </span>
                    </span>
                  </span>
                  <img
                    src="/images/buddy-sit.png"
                    alt=""
                    className="h-16 w-16 shrink-0 object-contain"
                  />
                </button>
              </GuideSection>

              <div className="min-w-0 overflow-hidden rounded-[24px] border border-dashed border-[#163126]/12 bg-[#f3f7f4]">
                <button
                  type="button"
                  onClick={() => setRelationOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
                  aria-expanded={relationOpen}
                >
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-[#2E7D5B]">
                      심혈관 건강과의 연결
                    </h3>
                    <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-bold text-[#163126]/45">
                      안내
                    </span>
                  </div>
                  <ChevronRight
                    size={17}
                    className={`shrink-0 text-[#2E7D5B] transition-transform ${
                      relationOpen ? "rotate-90" : ""
                    }`}
                  />
                </button>

                {relationOpen && (
                  <div className="border-t border-dashed border-[#163126]/10 px-4 pb-4 pt-4">
                    <p className="text-sm leading-6 text-[#163126]/62">
                      혈압이 높거나 흡연, 과음, 운동 부족이 이어지면 혈관에
                      부담이 쌓일 수 있어요. 스트레스와 수면 습관도 혈압과
                      심박 변화에 영향을 주기 때문에 함께 관리하는 것이 좋아요.
                    </p>

                    <div className="mt-4 space-y-3">
                      <HealthGuideRelation
                        title="버디의 팁"
                        description="혈압, 식단, 운동처럼 매일 바꿀 수 있는 습관을 작게 제안해요."
                      />
                      <HealthGuideRelation
                        title="자가 체크"
                        description="스트레스, 흡연, 음주처럼 심혈관 부담과 연결될 수 있는 요인을 확인해요."
                      />
                      <HealthGuideRelation
                        title="스트레스 관리"
                        description="긴장을 낮추고 호흡을 정리해 심박과 혈압 부담을 줄이는 데 도움을 줘요."
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
        )}
      </aside>

      <AssessmentCheckModal
        kind={activeAssessment}
        onClose={() => setActiveAssessment(null)}
      />

      <MeditationModal
        open={meditationOpen}
        onClose={() => setMeditationOpen(false)}
      />
    </>
  );
}

function HealthGuideRelation({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 border-t border-[#163126]/8 pt-3 first:border-t-0 first:pt-0">
      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2E7D5B]/55" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-[#163126]">{title}</p>
        <p className="mt-1 text-xs leading-5 text-[#163126]/55">
          {description}
        </p>
      </div>
    </div>
  );
}

function GuideSection({
  id,
  title,
  className = "",
  children,
}: {
  id?: string;
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      id={id}
      className={`scroll-mt-24 min-w-0 rounded-[24px] bg-[#f8fbf8] p-4 ${className}`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-[#2E7D5B]">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function AssessmentCheckModal({
  kind,
  onClose,
}: {
  kind: AssessmentKind | null;
  onClose: () => void;
}) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResult, setShowResult] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const config = kind ? assessmentConfigs[kind] : null;

  const questions = config?.questions ?? [];
  const answeredCount = Object.keys(answers).length;
  const isComplete = answeredCount === questions.length;

  const score = useMemo(() => {
    return questions.reduce((total, item) => {
      const answer = answers[item.id];
      if (answer === undefined) return total;
      return total + (item.reverse ? 4 - answer : answer);
    }, 0);
  }, [answers, questions]);

  if (!config) return null;

  const level = getAssessmentLevel(config, score);

  const handleClose = () => {
    setAnswers({});
    setShowResult(false);
    setShowIntro(false);
    onClose();
  };

  const handleReset = () => {
    setAnswers({});
    setShowResult(false);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#163126]/30 px-4 py-6 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={handleClose} aria-hidden="true" />

      <section className="relative z-10 flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-[#163126]/10 bg-white shadow-[0_28px_90px_rgba(22,49,38,0.24)]">
        <div className="flex items-start justify-between gap-4 border-b border-[#163126]/8 px-5 py-5">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2E7D5B]">
              {config.code}
            </p>
            <h2 className="mt-1 text-lg font-bold text-[#163126]">
              {config.title}
            </h2>
            <p className="mt-1 text-sm text-[#163126]/55">
              {config.subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#163126]/10 text-[#163126] transition hover:bg-[#f6faf7]"
            aria-label={`${config.title} 닫기`}
          >
            <X size={18} />
          </button>
        </div>

        {!showResult ? (
          <>
            <div className="flex-1 overflow-auto px-5 py-5">
              <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl bg-[#f8fbf8] px-4 py-3">
                <span className="text-sm font-semibold text-[#163126]">
                  응답 진행률
                </span>
                <span className="text-sm font-bold text-[#2E7D5B]">
                  {answeredCount}/{questions.length}
                </span>
              </div>

              <div className="space-y-4">
                {questions.map((item, index) => (
                  <div
                    key={item.id}
                    className="rounded-[22px] border border-[#163126]/8 bg-[#fbfdfb] p-4"
                  >
                    <p className="text-sm font-bold leading-6 text-[#163126]">
                      {index + 1}. {item.question}
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-[repeat(auto-fit,minmax(96px,1fr))]">
                      {item.options.map((option) => {
                        const active = answers[item.id] === option.value;

                        return (
                          <button
                            key={`${item.id}-${option.value}`}
                            type="button"
                            onClick={() =>
                              setAnswers((prev) => ({
                                ...prev,
                                [item.id]: option.value,
                              }))
                            }
                            className={`min-h-11 rounded-2xl border px-2 text-xs font-semibold transition ${
                              active
                                ? "border-[#2E7D5B] bg-[#2E7D5B] text-white shadow-[0_10px_22px_rgba(46,125,91,0.16)]"
                                : "border-[#163126]/10 bg-white text-[#163126]/70 hover:border-[#2E7D5B]/40"
                            }`}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-[#163126]/8 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setShowIntro(true)}
                className="text-left text-xs font-bold text-[#2E7D5B] underline-offset-4 hover:underline"
              >
                {config.introTitle}
              </button>

              <p className="text-xs leading-5 text-[#163126]/50 sm:text-right">
                이 결과는 진단이 아닌 자가 점검용 참고 지표예요.
              </p>

              <button
                type="button"
                disabled={!isComplete}
                onClick={() => setShowResult(true)}
                className="rounded-full bg-[#07955f] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#08794f] disabled:cursor-not-allowed disabled:bg-[#9fb8aa]"
              >
                결과 보기
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex-1 overflow-auto px-5 py-6">
              <div className={`rounded-[26px] ${level.bg} px-5 py-6 text-center`}>
                <p className="text-sm font-semibold text-[#163126]/55">
                  {config.scoreLabel}
                </p>
                <div className="mt-3 flex items-end justify-center gap-2">
                  <span className={`text-6xl font-black ${level.color}`}>
                    {score}
                  </span>
                  <span className="pb-2 text-lg font-bold text-[#163126]/55">
                    / {config.maxScore}
                  </span>
                </div>
                <p className={`mt-4 text-xl font-black ${level.color}`}>
                  {level.label}
                </p>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#163126]/68">
                  {level.description}
                </p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-[repeat(auto-fit,minmax(120px,1fr))]">
                {config.ranges.map((range) => (
                  <ResultRange
                    key={range.label}
                    label={range.label}
                    range={range.range}
                    active={score >= range.min && score <= range.max}
                  />
                ))}
              </div>

              <div className="mt-5 rounded-[22px] border border-[#163126]/8 bg-white px-4 py-4">
                <p className="text-sm font-bold text-[#163126]">추천 행동</p>
                <p className="mt-2 text-sm leading-6 text-[#163126]/62">
                  {config.recommendation}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-[#163126]/8 px-5 py-4">
              <button
                type="button"
                onClick={() => setShowIntro(true)}
                className="mr-auto text-sm font-bold text-[#2E7D5B] underline-offset-4 hover:underline"
              >
                {config.introTitle}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-2 rounded-full border border-[#163126]/10 px-5 py-3 text-sm font-semibold text-[#163126] transition hover:bg-[#f6faf7]"
              >
                <RotateCcw size={16} />
                다시 하기
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-full bg-[#163126] px-5 py-3 text-sm font-bold text-white"
              >
                닫기
              </button>
            </div>
          </>
        )}
      </section>

      {showIntro && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#163126]/28 px-4 py-6 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={() => setShowIntro(false)}
            aria-hidden="true"
          />

          <section className="relative z-10 w-full max-w-md overflow-hidden rounded-[26px] border border-[#163126]/10 bg-white shadow-[0_24px_70px_rgba(22,49,38,0.22)]">
            <div className="flex items-center justify-between gap-4 border-b border-[#163126]/8 px-5 py-4">
              <h3 className="text-base font-bold text-[#163126]">
                {config.introTitle}
              </h3>
              <button
                type="button"
                onClick={() => setShowIntro(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#163126]/10 text-[#163126] transition hover:bg-[#f6faf7]"
                aria-label={`${config.introTitle} 닫기`}
              >
                <X size={17} />
              </button>
            </div>

            <div className="space-y-4 px-5 py-5 text-sm leading-6 text-[#163126]/68">
              {config.intro.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <div className="flex justify-end border-t border-[#163126]/8 px-5 py-4">
              <button
                type="button"
                onClick={() => setShowIntro(false)}
                className="rounded-full bg-[#163126] px-5 py-3 text-sm font-bold text-white"
              >
                확인
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function ResultRange({
  label,
  range,
  active,
}: {
  label: string;
  range: string;
  active: boolean;
}) {
  return (
    <div
      className={`rounded-[18px] border px-4 py-3 text-center ${
        active
          ? "border-[#2E7D5B] bg-[#eef9f2]"
          : "border-[#163126]/8 bg-[#fbfdfb]"
      }`}
    >
      <p
        className={`text-sm font-bold ${
          active ? "text-[#2E7D5B]" : "text-[#163126]/50"
        }`}
      >
        {label}
      </p>
      <p className="mt-1 text-xs font-semibold text-[#163126]/48">{range}</p>
    </div>
  );
}

function MeditationModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const breathingSteps = [
    {
      key: "inhale",
      label: "들이마시기",
      message: "코로 천천히 숨을 들이마셔요.",
      duration: 4,
    },
    {
      key: "hold",
      label: "머무르기",
      message: "잠깐 숨을 머금고 있어요.",
      duration: 2,
    },
    {
      key: "exhale",
      label: "내쉬기",
      message: "입으로 길게 숨을 내쉬어요.",
      duration: 6,
    },
  ];
  const readyBreathingStep = {
    key: "ready",
    label: "준비",
    message: "편한 자세로 앉아볼까요?",
    duration: 2,
  };
  const [durationMinutes, setDurationMinutes] = useState(5);
  const [remainingSeconds, setRemainingSeconds] = useState(5 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [musicVolume, setMusicVolume] = useState(0.55);
  const [breathingState, setBreathingState] = useState({
    index: -1,
    remaining: readyBreathingStep.duration,
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopMusic = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.volume = musicVolume;
    }
    setIsMusicPlaying(false);
  };

  const startMusic = () => {
    if (isMusicPlaying) return;

    if (!audioRef.current) {
      audioRef.current = new Audio("/audio/buddy-music.mp3");
      audioRef.current.loop = true;
    }

    audioRef.current.volume = musicVolume;
    audioRef.current
      .play()
      .then(() => setIsMusicPlaying(true))
      .catch(() => setIsMusicPlaying(false));
  };

  useEffect(() => {
    if (audioRef.current && isMusicPlaying) {
      audioRef.current.volume = musicVolume;
    }
  }, [isMusicPlaying, musicVolume]);

  useEffect(() => {
    if (!open) return;

    setRemainingSeconds(durationMinutes * 60);
    setIsRunning(false);
    setIsCompleted(false);
    setBreathingState({
      index: -1,
      remaining: readyBreathingStep.duration,
    });
  }, [durationMinutes, open]);

  useEffect(() => {
    if (!open || !isRunning) return;

    const timer = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          setIsRunning(false);
          setIsCompleted(true);
          stopMusic();
          return 0;
        }

        if (audioRef.current && isMusicPlaying && prev <= 6) {
          audioRef.current.volume = Math.max(0.04, ((prev - 1) / 5) * musicVolume);
        }

        setBreathingState((state) => {
          if (state.remaining > 1) {
            return {
              ...state,
              remaining: state.remaining - 1,
            };
          }

          const nextIndex =
            state.index === -1 ? 0 : (state.index + 1) % breathingSteps.length;

          return {
            index: nextIndex,
            remaining: breathingSteps[nextIndex].duration,
          };
        });
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isRunning, open]);

  useEffect(() => {
    if (!open) stopMusic();

    return () => {
      stopMusic();
    };
  }, [open]);

  if (!open) return null;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(
    seconds
  ).padStart(2, "0")}`;

  const handleDurationChange = (value: string) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return;

    const nextMinutes = Math.min(Math.max(numeric, 1), 60);
    setDurationMinutes(nextMinutes);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsCompleted(false);
    setBreathingState({
      index: -1,
      remaining: readyBreathingStep.duration,
    });
    setRemainingSeconds(durationMinutes * 60);
  };

  const handleClose = () => {
    stopMusic();
    setIsRunning(false);
    setIsCompleted(false);
    setBreathingState({
      index: -1,
      remaining: readyBreathingStep.duration,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#163126]/30 px-4 py-6 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={handleClose} aria-hidden="true" />

      <section className="relative z-10 w-full max-w-2xl overflow-hidden rounded-[30px] border border-[#163126]/10 bg-white shadow-[0_28px_90px_rgba(22,49,38,0.24)]">
        <div className="flex items-start justify-between gap-4 border-b border-[#163126]/8 px-5 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2E7D5B]">
              calm buddy
            </p>
            <h2 className="mt-1 text-lg font-bold text-[#163126]">
              버디와 명상하기
            </h2>
            <p className="mt-1 text-sm text-[#163126]/55">
              시간을 정하고 천천히 호흡에 집중해보세요.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#163126]/10 text-[#163126] transition hover:bg-[#f6faf7]"
            aria-label="명상 닫기"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-6 px-5 py-6 md:grid-cols-[minmax(0,1fr)_220px] md:items-center">
          <div className="relative flex min-h-[280px] items-center justify-center overflow-hidden rounded-[28px] bg-[linear-gradient(180deg,#eff9f3_0%,#fdfbf4_100%)]">
            <div className="absolute left-8 top-8 h-16 w-16 rounded-full bg-white/65 blur-sm" />
            <div className="absolute bottom-10 right-10 h-24 w-24 rounded-full bg-[#c8ead6]/45 blur-md" />
            <div className="absolute top-5 left-1/2 z-20 w-[min(280px,88%)] -translate-x-1/2 rounded-[24px] border border-white/70 bg-white/80 px-4 py-3 text-center text-sm font-bold leading-6 text-[#163126] shadow-[0_16px_32px_rgba(22,49,38,0.10)] backdrop-blur-md">
              {isCompleted
                ? "명상이 끝났어요. 천천히 눈을 떠볼까요?"
                : isRunning
                ? "천천히 호흡에 집중해볼게요."
                : "시작 버튼을 누르면 버디가 호흡을 안내해줄게요."}
              <span className="absolute bottom-[-9px] left-1/2 h-5 w-5 -translate-x-1/2 rotate-45 rounded-[4px] border-r border-b border-white/70 bg-white/80" />
            </div>

            <motion.img
              src="/images/buddy-sit.png"
              alt=""
              className="relative z-10 mt-14 h-52 w-52 object-contain drop-shadow-[0_18px_28px_rgba(22,49,38,0.16)]"
              animate={{ y: [0, -14, 0] }}
              transition={{
                duration: 3.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>

          <div className="space-y-4">
            <label className="block rounded-[22px] border border-[#163126]/8 bg-[#fbfdfb] px-4 py-4">
              <span className="flex items-center gap-2 text-sm font-bold text-[#163126]">
                <Timer size={16} className="text-[#2E7D5B]" />
                명상 시간
              </span>
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={durationMinutes}
                  disabled={isRunning}
                  onChange={(event) => handleDurationChange(event.target.value)}
                  className="h-11 min-w-0 flex-1 rounded-2xl border border-[#163126]/10 bg-white px-3 text-sm font-semibold text-[#163126] outline-none focus:border-[#2E7D5B]/50 disabled:bg-[#f4f6f4]"
                />
                <span className="text-xs font-semibold text-[#163126]/48">
                  분
                </span>
              </div>
            </label>

            <div className="rounded-[26px] bg-[#f8fbf8] px-5 py-5 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2E7D5B]">
                stopwatch
              </p>
              <p className="mt-2 text-5xl font-black text-[#163126]">
                {formattedTime}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  if (isCompleted) {
                    setRemainingSeconds(durationMinutes * 60);
                    setBreathingState({
                      index: -1,
                      remaining: readyBreathingStep.duration,
                    });
                    setIsCompleted(false);
                    setIsRunning(true);
                    return;
                  }

                  setIsRunning((prev) => !prev);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#07955f] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#08794f]"
              >
                {isRunning ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}
                {isCompleted ? "다시 시작" : isRunning ? "일시정지" : "시작"}
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#163126]/10 px-4 py-3 text-sm font-semibold text-[#163126] transition hover:bg-[#f6faf7]"
              >
                <RotateCcw size={16} />
                초기화
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                if (isMusicPlaying) {
                  stopMusic();
                  return;
                }

                startMusic();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#163126]/8 bg-white px-4 py-3 text-sm font-semibold text-[#163126] transition hover:border-[#2E7D5B]/30 hover:bg-[#f7fbf8]"
            >
              {isMusicPlaying ? (
                <VolumeX size={17} className="text-[#2E7D5B]" />
              ) : (
                <Volume2 size={17} className="text-[#2E7D5B]" />
              )}
              {isMusicPlaying ? "음악 끄기" : "잔잔한 음악 재생"}
            </button>

            <label className="block rounded-[22px] border border-[#163126]/8 bg-white px-4 py-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="text-sm font-bold text-[#163126]">음량</span>
                <span className="text-xs font-semibold text-[#2E7D5B]">
                  {Math.round(musicVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={musicVolume}
                onChange={(event) => {
                  const nextVolume = Number(event.target.value);
                  setMusicVolume(nextVolume);
                  if (audioRef.current) {
                    audioRef.current.volume = nextVolume;
                  }
                }}
                className="h-2 w-full cursor-pointer accent-[#2E7D5B]"
              />
            </label>

            <div className="rounded-[22px] border border-dashed border-[#163126]/12 bg-[#f8fbf8] px-4 py-4">
              <div className="flex items-center gap-2 text-base font-black text-[#163126]">
                <VolumeX size={18} className="text-[#2E7D5B]" />
                음성 가이드
              </div>
              <p className="mt-2 text-xs font-medium leading-5 text-[#163126]/50">
                버디 목소리와 함께하는 명상은 추후 업데이트 때 만나요.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
