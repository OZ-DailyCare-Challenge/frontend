import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getHealthAnalysisResult } from "../../api/health";
import { storage } from "../../utils/storage";
import wheelStandImage from "../../assets/wheel-stand.png";
import wheelRotorImage from "../../assets/wheel-rotor.png";
import hamsterImage from "../../assets/hamster-side.png";
import "./AnalysisLoadingPage.css";

const loadingMessages = [
  "건강 데이터를 정리하고 있어요",
  "생활습관 정보를 반영하고 있어요",
  "심혈관 위험 요인을 분석하고 있어요",
  "맞춤 건강 리포트를 준비하고 있어요",
];

export default function AnalysisLoadingPage() {
  const navigate = useNavigate();
  const taskId = storage.getAnalysisTaskId();

  const [progress, setProgress] = useState(8);
  const [messageIndex, setMessageIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const pollingRef = useRef<number | null>(null);
  const progressRef = useRef<number | null>(null);

  useEffect(() => {
    if (!taskId) {
      navigate("/health-input", { replace: true });
      return;
    }

    const stopTimers = () => {
      if (progressRef.current) {
        window.clearInterval(progressRef.current);
      }
      if (pollingRef.current) {
        window.clearInterval(pollingRef.current);
      }
    };

    const checkAnalysisResult = async () => {
      try {
        const result = await getHealthAnalysisResult(taskId);

        const hasResultData =
          result?.ml1_predict ||
          result?.ml1_comment ||
          (result?.data && (result.data.ml1_predict || result.data.ml1_comment));

        const isReady =
          result?.status === "SUCCESS" ||
          result?.status === "success" ||
          result?.status === "completed" ||
          !!hasResultData;

        if (isReady) {
          stopTimers();
          setProgress(100);

          setTimeout(() => {
            navigate("/result", { replace: true });
          }, 500);
        }
      } catch (error: any) {
        const detail =
          error?.response?.data?.detail ||
          error?.response?.data?.error ||
          "분석 결과를 불러오는 중 문제가 발생했습니다.";

        setErrorMessage(detail);
        stopTimers();
      }
    };

    progressRef.current = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 92) return prev;
        if (prev < 30) return prev + 8;
        if (prev < 60) return prev + 5;
        if (prev < 85) return prev + 3;
        return prev + 1;
      });
    }, 700);

    const messageTimer = window.setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 1800);

    checkAnalysisResult();

    pollingRef.current = window.setInterval(() => {
      checkAnalysisResult();
    }, 2000);

    return () => {
      stopTimers();
      window.clearInterval(messageTimer);
    };
  }, [navigate, taskId]);

  return (
    <div className="analysis-loading-page">
      <div className="analysis-loading-inner">
        <div className="analysis-loading-brand">MyHealthBuddy</div>

        <div className="analysis-loading-scene">
          <img
            src={wheelStandImage}
            alt="햄스터 쳇바퀴 받침대"
            className="analysis-wheel-stand"
          />

          <div className="analysis-wheel-rotor-wrap">
            <img
              src={wheelRotorImage}
              alt="회전하는 쳇바퀴"
              className="analysis-wheel-rotor"
            />
          </div>

          <div className="analysis-hamster-wrap">
            <div className="analysis-hamster-shadow" />
            <img
              src={hamsterImage}
              alt="햄스터"
              className="analysis-hamster"
            />
          </div>
        </div>


        <p className="analysis-loading-title">
          입력한 건강 데이터를 분석하고 있어요
        </p>

        <p className="analysis-loading-subtitle">
          {errorMessage || loadingMessages[messageIndex]}
        </p>

        <div className="analysis-progress-bar">
          <div
            className="analysis-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="analysis-progress-text">
          {errorMessage ? "분석 중단" : `분석 중... (${progress}%)`}
        </p>
      </div>
    </div>
  );
}