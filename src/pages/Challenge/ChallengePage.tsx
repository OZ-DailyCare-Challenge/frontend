import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import { storage } from "../../utils/storage";
import "./ChallengePage.css";

type ChallengeStatus = "in_progress" | "completed" | "locked" | "available";
type ChallengeTab = "all" | "in_progress" | "completed" | "locked";

type ChallengeItem = {
  id: number;
  category: "식습관" | "운동" | "생활습관";
  title: string;
  description: string;
  expectedEffect: string;
  verificationType: string;
  targetRisk: string;
  durationDays: number;
  requiredDays?: number | null;
  status: ChallengeStatus;
  progressDays?: number;
};

const challengeList: ChallengeItem[] = [
  {
    id: 1,
    category: "식습관",
    title: "저염식",
    description: "오늘 하루 나트륨 2,000mg 이하로 섭취해보세요.",
    expectedEffect: "7일 지속 시 수축기 혈압 3mmHg 감소",
    verificationType: "체크리스트 (Y/N)",
    targetRisk: "고혈압",
    durationDays: 7,
    requiredDays: 5,
    status: "in_progress",
    progressDays: 3,
  },
  {
    id: 2,
    category: "식습관",
    title: "포화지방 줄이기",
    description: "삼겹살, 버터 대신 생선과 견과류로 바꿔보세요.",
    expectedEffect: "꾸준히 실천하면 나쁜 콜레스테롤 수치 개선",
    verificationType: "체크리스트 (Y/N)",
    targetRisk: "고콜레스테롤",
    durationDays: 7,
    requiredDays: 5,
    status: "available",
  },
  {
    id: 3,
    category: "식습관",
    title: "당류 줄이기",
    description: "음료수, 과자 대신 과일로 당 섭취를 줄여보세요.",
    expectedEffect: "꾸준히 실천하면 공복혈당 수치 안정화",
    verificationType: "체크리스트 (Y/N)",
    targetRisk: "고혈당",
    durationDays: 7,
    requiredDays: 5,
    status: "available",
  },
  {
    id: 4,
    category: "식습관",
    title: "야식 금지",
    description: "저녁 9시 이후에는 아무것도 먹지 않아보세요.",
    expectedEffect: "체중 감소 및 BMI 개선",
    verificationType: "체크리스트 (Y/N)",
    targetRisk: "과체중",
    durationDays: 7,
    requiredDays: 5,
    status: "available",
  },
  {
    id: 5,
    category: "운동",
    title: "유산소 운동 20분",
    description: "빠르게 걷기, 자전거, 러닝 20분 움직여보세요.",
    expectedEffect: "7일 지속 시 혈압 감소 및 BMI 개선",
    verificationType: "체크리스트 (Y/N)",
    targetRisk: "고혈압, 과체중",
    durationDays: 7,
    requiredDays: 5,
    status: "in_progress",
    progressDays: 2,
  },
  {
    id: 6,
    category: "운동",
    title: "걷기 7,000보",
    description: "만보기 앱으로 오늘 7,000보를 채워보세요.",
    expectedEffect: "꾸준히 실천하면 콜레스테롤 수치 개선",
    verificationType: "체크리스트 (Y/N)",
    targetRisk: "고콜레스테롤",
    durationDays: 7,
    requiredDays: 5,
    status: "completed",
    progressDays: 5,
  },
  {
    id: 7,
    category: "운동",
    title: "식후 15분 걷기",
    description: "밥 먹고 15분만 천천히 걸어보세요.",
    expectedEffect: "꾸준히 실천하면 식후 혈당 스파이크 완화",
    verificationType: "체크리스트 (Y/N)",
    targetRisk: "고혈당",
    durationDays: 7,
    requiredDays: 5,
    status: "available",
  },
  {
    id: 8,
    category: "생활습관",
    title: "물 2L 마시기",
    description: "하루 8잔의 물로 혈액 순환을 도와주세요.",
    expectedEffect: "충분한 수분 섭취 시 심혈관 건강 개선",
    verificationType: "체크리스트 (Y/N)",
    targetRisk: "공통",
    durationDays: 7,
    requiredDays: 5,
    status: "available",
  },
  {
    id: 9,
    category: "생활습관",
    title: "금연 (단계별)",
    description: "오늘 피운 담배 개비 수를 입력해주세요.",
    expectedEffect: "완전 금연 시 심혈관 위험도 감소",
    verificationType: "수치 입력",
    targetRisk: "흡연자",
    durationDays: 30,
    requiredDays: null,
    status: "locked",
  },
  {
    id: 10,
    category: "생활습관",
    title: "금주 (단계별)",
    description: "이번 주 음주 횟수를 기록해주세요.",
    expectedEffect: "완전 금주 시 혈압 및 심혈관 위험도 개선",
    verificationType: "수치 입력",
    targetRisk: "음주자",
    durationDays: 30,
    requiredDays: null,
    status: "locked",
  },
];

const tabMeta: Record<ChallengeTab, { label: string; icon: string }> = {
  all: { label: "전체", icon: "🌙" },
  in_progress: { label: "진행중", icon: "🏃" },
  completed: { label: "완료", icon: "🏁" },
  locked: { label: "잠금", icon: "🔒" },
};

function getStatusLabel(challenge: ChallengeItem) {
  switch (challenge.status) {
    case "in_progress":
      return "진행중";
    case "completed":
      return "완료";
    case "locked":
      return "잠금";
    default:
      return "시작 가능";
  }
}

function getFilteredChallenges(
  challenges: ChallengeItem[],
  activeTab: ChallengeTab
) {
  if (activeTab === "all") return challenges;
  return challenges.filter((challenge) => challenge.status === activeTab);
}

export default function ChallengePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ChallengeTab>("all");

  useEffect(() => {
    if (!storage.isLoggedIn()) {
      navigate("/login");
      return;
    }

    if (!storage.hasHealthInput()) {
      navigate("/health-input");
      return;
    }

    if (!storage.hasAnalysisResult()) {
      navigate("/result");
      return;
    }
  }, [navigate]);

  const nickname = storage.getDisplayName();

  const counts = useMemo(() => {
    const inProgress = challengeList.filter(
      (challenge) => challenge.status === "in_progress"
    ).length;
    const completed = challengeList.filter(
      (challenge) => challenge.status === "completed"
    ).length;
    const locked = challengeList.filter(
      (challenge) => challenge.status === "locked"
    ).length;

    return {
      all: challengeList.length,
      in_progress: inProgress,
      completed,
      locked,
    };
  }, []);

  const visibleChallenges = useMemo(() => {
    return getFilteredChallenges(challengeList, activeTab);
  }, [activeTab]);

  const totalCount = challengeList.length;
  const completedCount = counts.completed;
  const overallProgress =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <Layout>
      <div className="challenge-page">
        <section className="challenge-topbar">
          <div className="challenge-heading">
            <p className="challenge-badge">🎯 추천 챌린지</p>
            <h1 className="challenge-title">{nickname}님을 위한 건강 챌린지</h1>
            <p className="challenge-subtitle">
              건강 분석 결과를 바탕으로 실천 가능한 루틴을 시작해보세요.
            </p>
          </div>

          <button
            className="challenge-top-action"
            onClick={() => navigate("/dashboard")}
          >
            대시보드 보기
          </button>
        </section>

        <section className="challenge-summary-card">
          <div className="challenge-summary-header">
            <div>
              <p className="challenge-summary-eyebrow">챌린지 현황</p>
              <h2 className="challenge-summary-title">
                이번 주 챌린지 진행률
              </h2>
            </div>

            <div className="challenge-summary-percent">{overallProgress}%</div>
          </div>

          <div className="challenge-progress-bar">
            <div
              className="challenge-progress-fill"
              style={{ width: `${overallProgress}%` }}
            />
          </div>

          <p className="challenge-summary-desc">
            완료된 챌린지를 쌓아 건강 습관을 만들어보세요.
          </p>
        </section>

        <section className="challenge-tab-grid">
          {(Object.keys(tabMeta) as ChallengeTab[]).map((tabKey) => (
            <button
              key={tabKey}
              type="button"
              className={`challenge-tab-card ${
                activeTab === tabKey ? "active" : ""
              }`}
              onClick={() => setActiveTab(tabKey)}
            >
              <div className="challenge-tab-icon">{tabMeta[tabKey].icon}</div>
              <div className="challenge-tab-label">{tabMeta[tabKey].label}</div>
              <div className="challenge-tab-count">
                {
                  (counts as {
                    all: number;
                    in_progress: number;
                    completed: number;
                    locked: number;
                  })[tabKey]
                }
              </div>
            </button>
          ))}
        </section>

        <section className="challenge-card-grid">
          {visibleChallenges.map((challenge) => {
            const isLocked = challenge.status === "locked";
            const isInProgress = challenge.status === "in_progress";
            const isCompleted = challenge.status === "completed";

            return (
              <article
                className={`challenge-card ${challenge.status}`}
                key={challenge.id}
              >
                <div className="challenge-card-top">
                  <span className="challenge-card-category">
                    {challenge.category}
                  </span>
                  <span className={`challenge-card-status ${challenge.status}`}>
                    {getStatusLabel(challenge)}
                  </span>
                </div>

                <h3 className="challenge-card-title">{challenge.title}</h3>
                <p className="challenge-card-description">
                  {challenge.description}
                </p>

                <div className="challenge-card-meta">
                  <div className="challenge-card-meta-item">
                    <span className="challenge-card-meta-label">대상</span>
                    <span className="challenge-card-meta-value">
                      {challenge.targetRisk}
                    </span>
                  </div>

                  <div className="challenge-card-meta-item">
                    <span className="challenge-card-meta-label">수행 기간</span>
                    <span className="challenge-card-meta-value">
                      {challenge.durationDays}일
                    </span>
                  </div>

                  <div className="challenge-card-meta-item">
                    <span className="challenge-card-meta-label">인증 방식</span>
                    <span className="challenge-card-meta-value">
                      {challenge.verificationType}
                    </span>
                  </div>

                  <div className="challenge-card-meta-item full">
                    <span className="challenge-card-meta-label">기대 효과</span>
                    <span className="challenge-card-meta-value">
                      {challenge.expectedEffect}
                    </span>
                  </div>
                </div>

                {challenge.requiredDays ? (
                  <p className="challenge-card-period-info">
                    {challenge.durationDays}일 중 {challenge.requiredDays}일 이상
                    인증
                  </p>
                ) : (
                  <p className="challenge-card-period-info">
                    장기 습관 형성용 단계별 챌린지
                  </p>
                )}

                {isInProgress && (
                  <div className="challenge-mini-progress">
                    <div className="challenge-mini-progress-header">
                      <span>진행 현황</span>
                      <span>
                        {challenge.progressDays ?? 0}/
                        {challenge.requiredDays ?? challenge.durationDays}
                      </span>
                    </div>
                    <div className="challenge-mini-progress-bar">
                      <div
                        className="challenge-mini-progress-fill"
                        style={{
                          width: `${
                            challenge.requiredDays
                              ? Math.min(
                                  ((challenge.progressDays ?? 0) /
                                    challenge.requiredDays) *
                                    100,
                                  100
                                )
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="challenge-card-actions">
                  {isLocked ? (
                    <button
                      type="button"
                      className="challenge-action-btn locked"
                      disabled
                    >
                      잠금 상태
                    </button>
                  ) : isCompleted ? (
                    <button
                      type="button"
                      className="challenge-action-btn completed"
                    >
                      완료됨
                    </button>
                  ) : isInProgress ? (
                    <button
                      type="button"
                      className="challenge-action-btn progress"
                    >
                      이어서 하기
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="challenge-action-btn start"
                    >
                      시작하기
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </Layout>
  );
}