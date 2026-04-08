import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import { getHealthAnalysisResult } from "../../api/health";
import { storage } from "../../utils/storage";
import "./ResultPage.css";

type Mission = {
  title: string;
  action: string;
  reason: string;
};

type AnalysisResultData = {
  ml1_predict?: {
    risk_percent?: number;
    heart_age?: number;
    risk_grade?: string;
    character_stage?: number;
    top_risk_factors?: string[];
  };
  ml1_comment?: {
    evaluation?: string;
    alert?: string | null;
    missions?: Mission[];
    encouragement?: string;
  };
};

type AnalysisApiResponse = {
  status?: string;
  data?: AnalysisResultData;
  error?: string;
} & AnalysisResultData;

const defaultChallenges = [
  {
    title: "하루 30분 걷기",
    description: "혈압 관리에 도움이 되는 가벼운 유산소 운동",
  },
  {
    title: "저염식 실천하기",
    description: "나트륨 섭취를 줄여 혈압 상승 위험 낮추기",
  },
  {
    title: "주 3회 규칙 운동",
    description: "심혈관 건강 개선을 위한 기본 습관 만들기",
  },
];

export default function ResultPage() {
  const navigate = useNavigate();

  const data = storage.getHealthData();
  const isLoggedIn = storage.isLoggedIn();
  const taskId = storage.getAnalysisTaskId();

  const [isLoading, setIsLoading] = useState(true);
  const [analysisError, setAnalysisError] = useState("");
  const [analysisData, setAnalysisData] = useState<AnalysisResultData | null>(null);

  const nickname = data?.nickname || "Buddy";

  useEffect(() => {
    const fetchAnalysisResult = async () => {
      if (!taskId) {
        setAnalysisError("분석 결과 정보가 없습니다.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setAnalysisError("");

        const result: AnalysisApiResponse = await getHealthAnalysisResult(taskId);

        if (result?.status === "pending") {
          navigate("/analysis-loading");
          return;
        }

        // 백엔드가 { status, data } 형태일 수도 있고
        // 바로 { ml1_predict, ml1_comment } 형태일 수도 있어서 둘 다 대응
        const actualData =
          result?.data && (result.data.ml1_predict || result.data.ml1_comment)
            ? result.data
            : result;

        if (actualData?.ml1_predict || actualData?.ml1_comment) {
          setAnalysisData(actualData);
        } else {
          setAnalysisError(result?.error || "분석 결과를 불러오지 못했습니다.");
        }
      } catch (error: any) {
        console.error("분석 결과 조회 실패:", error);
        setAnalysisError(
          error?.response?.data?.detail ||
            error?.response?.data?.error ||
            "분석 결과를 불러오지 못했습니다."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalysisResult();
  }, [navigate, taskId]);

  const riskGrade = analysisData?.ml1_predict?.risk_grade || "-";
  const heartAge =
    typeof analysisData?.ml1_predict?.heart_age === "number"
      ? `${analysisData.ml1_predict.heart_age}세`
      : "-";
  const riskPercent =
    typeof analysisData?.ml1_predict?.risk_percent === "number"
      ? `${analysisData.ml1_predict.risk_percent}%`
      : "-";

  const topRiskFactors =
    analysisData?.ml1_predict?.top_risk_factors &&
    analysisData.ml1_predict.top_risk_factors.length > 0
      ? analysisData.ml1_predict.top_risk_factors
      : ["분석된 주요 위험 요인이 없습니다."];

  const aiComment = [
    analysisData?.ml1_comment?.evaluation,
    analysisData?.ml1_comment?.alert,
    analysisData?.ml1_comment?.encouragement,
  ]
    .filter(Boolean)
    .join(" ") || "AI 건강 코멘트를 준비 중입니다.";

  const missionChallenges =
    analysisData?.ml1_comment?.missions &&
    analysisData.ml1_comment.missions.length > 0
      ? analysisData.ml1_comment.missions.map((mission) => ({
          title: mission.title,
          description: `${mission.action} · ${mission.reason}`,
        }))
      : defaultChallenges;

  const riskClassName =
    riskGrade === "높음" ? "high" : riskGrade === "낮음" ? "low" : "medium";

  const handleChallengeClick = () => {
    if (!isLoggedIn) {
      storage.setPostLoginRedirectPath("/challenge");
      navigate("/login");
      return;
    }

    navigate("/challenge");
  };

  return (
    <Layout>
      <div className="result-page">
        <section className="result-topbar">
          <div className="result-heading">
            <p className="result-badge">🫀 AI 건강 분석 결과</p>
            <h1 className="result-title">{nickname} 님의 심혈관 건강 리포트</h1>
            <p className="result-subtitle">
              건강검진 수치와 생활습관 정보를 바탕으로 분석한 결과예요.
            </p>
          </div>

          <div className={`result-level-pill ${riskClassName}`}>
            심혈관 위험도 {riskGrade}
          </div>
        </section>

        {isLoading && (
          <section className="result-card">
            <p className="result-card-desc">AI 분석 결과를 불러오는 중입니다...</p>
          </section>
        )}

        {!isLoading && analysisError && (
          <section className="result-card">
            <p className="result-card-desc">{analysisError}</p>
          </section>
        )}

        <section className="result-summary-grid">
          <div className="result-summary-card">
            <p className="result-summary-label">심혈관 위험도</p>
            <h3 className={`result-summary-value ${riskClassName}`}>
              {riskGrade}
            </h3>
            <p className="result-summary-sub">AI 분석 결과 기준</p>
          </div>

          <div className="result-summary-card">
            <p className="result-summary-label">심혈관 나이</p>
            <h3 className="result-summary-value">{heartAge}</h3>
            <p className="result-summary-sub">실제 나이 대비 추정</p>
          </div>

          <div className="result-summary-card">
            <p className="result-summary-label">위험도 퍼센트</p>
            <h3 className="result-summary-value">{riskPercent}</h3>
            <p className="result-summary-sub">AI 예측 위험 확률</p>
          </div>
        </section>

        <section className="result-main-grid">
          <div className="result-card">
            <div className="result-card-header">
              <h2 className="result-card-title">주요 위험 요인</h2>
            </div>

            <ul className="result-risk-list">
              {topRiskFactors.map((factor, index) => (
                <li className="result-risk-item" key={index}>
                  <span className="result-risk-dot" />
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="result-card">
            <div className="result-card-header">
              <h2 className="result-card-title">AI 종합 코멘트</h2>
            </div>

            <p className="result-ai-comment">
              {aiComment || "AI 종합 코멘트를 불러오는 중입니다."}
            </p>
          </div>
        </section>

        <section className="result-card">
          <div className="result-card-header challenge-header-row">
            <div>
              <p className="result-section-eyebrow">추천 루틴</p>
              <h2 className="result-card-title">추천 챌린지</h2>
            </div>

            <button
              className="result-primary-btn"
              onClick={handleChallengeClick}
            >
              {isLoggedIn ? "챌린지 시작하기" : "로그인하고 챌린지 보기"}
            </button>
          </div>

          <p className="result-card-desc">
            챌린지를 통해 건강 습관을 만들어보세요.
          </p>

          <div className="result-challenge-grid">
            {missionChallenges.map((challenge, index) => (
              <div className="result-challenge-card" key={index}>
                {!isLoggedIn && <div className="result-challenge-lock">🔒</div>}

                <h3 className="result-challenge-title">{challenge.title}</h3>
                <p className="result-challenge-desc">{challenge.description}</p>

                <button
                  className="result-outline-btn"
                  onClick={handleChallengeClick}
                >
                  {isLoggedIn ? "챌린지 시작" : "로그인하고 보기"}
                </button>
              </div>
            ))}
          </div>
        </section>

        <p className="result-warning">
          입력한 건강 데이터는 참고용 분석 결과이며 실제 진단을 대체하지 않습니다.
        </p>
      </div>
    </Layout>
  );
}