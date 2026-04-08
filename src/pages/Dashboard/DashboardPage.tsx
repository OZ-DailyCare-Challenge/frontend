import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import "./DashboardPage.css";
import { getDashboard, type DashboardResponse } from "../../api/user";
import { storage } from "../../utils/storage";

type HealthData = {
  nickname?: string;
  systolic?: number | string;
  diastolic?: number | string;
  glucose?: number | string;
  cholesterol?: number | string;
};

export default function DashboardPage() {
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const savedHealthData: HealthData | null = useMemo(() => {
    return storage.getHealthData();
  }, []);

  const savedUser = useMemo(() => storage.getUser(), []);

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

  const nickname =
    savedHealthData?.nickname ||
    savedUser?.nickname ||
    dashboardData?.nickname ||
    storage.getDisplayName();

  useEffect(() => {
    if (
      !storage.isLoggedIn() ||
      !storage.hasHealthInput() ||
      !storage.hasAnalysisResult()
    ) {
      return;
    }

    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const result = await getDashboard();
        setDashboardData(result);
        console.log("dashboard api success:", result);
      } catch (err) {
        console.error(err);
        setError("대시보드 데이터를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const score = Number(dashboardData?.score ?? 72);
  const steps = Number(dashboardData?.steps ?? 6240);
  const challengeProgress = Number(dashboardData?.challenge_progress ?? 75);
  const streakDays = Number(dashboardData?.streak_days ?? 14);

  const systolicBP = Number(
    dashboardData?.systolic_bp ?? savedHealthData?.systolic ?? 118
  );
  const diastolicBP = Number(
    dashboardData?.diastolic_bp ?? savedHealthData?.diastolic ?? 76
  );
  const fastingGlucose = Number(
    dashboardData?.fasting_glucose ?? savedHealthData?.glucose ?? 98
  );
  const cholesterol = Number(
    dashboardData?.cholesterol ?? savedHealthData?.cholesterol ?? 215
  );

  return (
    <Layout>
      <div className="dashboard-page">
        <section className="dashboard-topbar">
          <div className="dashboard-greeting">
            <p className="dashboard-greeting-badge">🐹 Buddy와 함께하는 오늘의 건강</p>
            <h1 className="dashboard-title">안녕하세요, {nickname}님 👋</h1>
            <p className="dashboard-subtitle">
              오늘도 심혈관 건강을 위한 작은 습관을 시작해볼까요?
            </p>
          </div>

          <div className="dashboard-topbar-right">
            <div className="dashboard-streak-badge">🔥 {streakDays}일 연속 달성 중</div>
          </div>
        </section>

        {loading && <p className="dashboard-api-message">불러오는 중...</p>}
        {error && <p className="dashboard-api-message error">{error}</p>}

        <section className="dashboard-hero-card">
          <div className="dashboard-hero-left">
            <div className="dashboard-buddy-avatar">🐹</div>

            <div className="dashboard-hero-text">
              <div className="dashboard-score-row">
                <span className="dashboard-score-number">{score}</span>
                <span className="dashboard-score-label">점 · 오늘의 건강 점수</span>
              </div>

              <div className="dashboard-progress-bar">
                <div
                  className="dashboard-progress-fill"
                  style={{ width: `${Math.min(score, 100)}%` }}
                />
              </div>

              <div className="dashboard-status-inline">
                <span>혈압 정상</span>
                <span>혈당 정상</span>
                <span>걸음 {steps.toLocaleString()}보</span>
              </div>
            </div>
          </div>

          <div className="dashboard-hero-right">
            <div className="dashboard-target-box">
              <p className="dashboard-target-title">목표까지</p>
              <p className="dashboard-target-value">
                {Math.max(8000 - steps, 0).toLocaleString()}보 남았어요!
              </p>
            </div>

            <button className="dashboard-side-action">🥗 식단 기록하기</button>
          </div>
        </section>

        <section className="dashboard-metrics-grid">
          <div className="dashboard-metric-card">
            <p className="dashboard-metric-label">혈압</p>
            <h3 className="dashboard-metric-value">
              {systolicBP} / {diastolicBP} mmHg
            </h3>
            <p className="dashboard-metric-status good">정상</p>
          </div>

          <div className="dashboard-metric-card">
            <p className="dashboard-metric-label">공복 혈당</p>
            <h3 className="dashboard-metric-value">{fastingGlucose} mg/dL</h3>
            <p className="dashboard-metric-status good">정상</p>
          </div>

          <div className="dashboard-metric-card">
            <p className="dashboard-metric-label">콜레스테롤</p>
            <h3 className="dashboard-metric-value">{cholesterol} mg/dL</h3>
            <p className="dashboard-metric-status warning">주의</p>
          </div>

          <div className="dashboard-metric-card">
            <p className="dashboard-metric-label">걸음 수</p>
            <h3 className="dashboard-metric-value">{steps.toLocaleString()} 보</h3>
            <p className="dashboard-metric-status progress">
              목표 {Math.min(Math.round((steps / 8000) * 100), 100)}%
            </p>
          </div>
        </section>

        <section className="dashboard-challenge-card">
          <div className="dashboard-section-header">
            <div>
              <p className="dashboard-section-eyebrow">✅ 오늘의 챌린지</p>
              <h2 className="dashboard-section-title">오늘 해야 할 건강 루틴</h2>
            </div>

            <div className="dashboard-section-pill">
              {Math.round(challengeProgress / 25)} / 4 완료
            </div>
          </div>

          <div className="dashboard-challenge-progress">
            <div
              className="dashboard-challenge-progress-fill"
              style={{ width: `${Math.min(challengeProgress, 100)}%` }}
            />
          </div>

          <p className="dashboard-challenge-progress-text">
            {challengeProgress}% 달성
          </p>

          <div className="dashboard-challenge-grid">
            <div className="dashboard-challenge-item">
              <div className="dashboard-challenge-icon">🚭</div>
              <div className="dashboard-challenge-content">
                <p className="dashboard-challenge-title">담배 안 피웠나요?</p>
              </div>
              <div className="dashboard-challenge-check done" />
            </div>

            <div className="dashboard-challenge-item">
              <div className="dashboard-challenge-icon">🚶</div>
              <div className="dashboard-challenge-content">
                <p className="dashboard-challenge-title">30분 걸었나요?</p>
              </div>
              <div className="dashboard-challenge-check done" />
            </div>

            <div className="dashboard-challenge-item">
              <div className="dashboard-challenge-icon">💧</div>
              <div className="dashboard-challenge-content">
                <p className="dashboard-challenge-title">물 8잔 마셨나요?</p>
              </div>
              <div className="dashboard-challenge-check done" />
            </div>

            <div className="dashboard-challenge-item">
              <div className="dashboard-challenge-icon">🥗</div>
              <div className="dashboard-challenge-content">
                <p className="dashboard-challenge-title">채소 먹었나요?</p>
              </div>
              <div className="dashboard-challenge-check" />
            </div>
          </div>
        </section>

        <section className="dashboard-bottom-grid">
          <div className="dashboard-social-card">
            <div className="dashboard-card-header-inline">
              <h3 className="dashboard-card-title">친구 챌린지 피드</h3>
              <button className="dashboard-outline-btn">응원하기</button>
            </div>

            <div className="dashboard-friend-list">
              <div className="dashboard-friend-item">
                <div className="dashboard-friend-avatar">영</div>
                <div className="dashboard-friend-text">
                  <strong>영현</strong>
                  <span>XX 챌린지 30일 연속 달성!</span>
                </div>
                <button className="dashboard-outline-btn small">응원하기</button>
              </div>

              <div className="dashboard-friend-item">
                <div className="dashboard-friend-avatar">형</div>
                <div className="dashboard-friend-text">
                  <strong>형석</strong>
                  <span>XX 챌린지 완료!</span>
                </div>
                <button className="dashboard-outline-btn small">응원하기</button>
              </div>

              <div className="dashboard-friend-item">
                <div className="dashboard-friend-avatar">승</div>
                <div className="dashboard-friend-text">
                  <strong>승희</strong>
                  <span>XX 챌린지 완료!</span>
                </div>
                <button className="dashboard-outline-btn small">응원하기</button>
              </div>

              <div className="dashboard-friend-item">
                <div className="dashboard-friend-avatar">소</div>
                <div className="dashboard-friend-text">
                  <strong>소윤</strong>
                  <span>XX 챌린지 완료!</span>
                </div>
                <button className="dashboard-outline-btn small">응원하기</button>
              </div>
            </div>
          </div>

          <div className="dashboard-social-card">
            <div className="dashboard-card-header-inline">
              <h3 className="dashboard-card-title">친구 추가</h3>
            </div>

            <div className="dashboard-search-row">
              <input className="dashboard-search-input" defaultValue="A" />
              <button className="dashboard-search-btn">검색</button>
            </div>

            <div className="dashboard-add-list">
              <div className="dashboard-add-item">
                <div className="dashboard-add-avatar">A</div>
                <span className="dashboard-add-name">Apple</span>
                <button className="dashboard-add-btn">대기</button>
              </div>

              <div className="dashboard-add-item">
                <div className="dashboard-add-avatar">A</div>
                <span className="dashboard-add-name">Amy</span>
                <button className="dashboard-add-btn">대기</button>
              </div>

              <div className="dashboard-add-item">
                <div className="dashboard-add-avatar">A</div>
                <span className="dashboard-add-name">Amily</span>
                <button className="dashboard-add-btn">대기</button>
              </div>
            </div>

            <div className="dashboard-recommend-box">
              <p className="dashboard-recommend-text">
                친구 추천 · 3명의 친구가 같은 챌린지를 진행하고 있습니다.
              </p>

              <div className="dashboard-recommend-grid">
                <div className="dashboard-recommend-item">
                  <div className="dashboard-recommend-avatar">B</div>
                  <strong>Berry</strong>
                  <span>1일차 진행 중</span>
                </div>

                <div className="dashboard-recommend-item">
                  <div className="dashboard-recommend-avatar">C</div>
                  <strong>Christopher</strong>
                  <span>15일차 진행 중</span>
                </div>

                <div className="dashboard-recommend-item">
                  <div className="dashboard-recommend-avatar">S</div>
                  <strong>Sandy</strong>
                  <span>7일차 진행 중</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}