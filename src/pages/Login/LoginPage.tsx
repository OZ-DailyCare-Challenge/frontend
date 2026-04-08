import "./LoginPage.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { loginWithGoogle } from "../../api/auth";
import { getDashboard } from "../../api/user";
import { storage } from "../../utils/storage";

const LoginPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const googleLogin = useGoogleLogin({
    flow: "auth-code",
    onSuccess: async (codeResponse) => {
      try {
        setLoading(true);
        setErrorMessage("");

        const previousUser = storage.getUser();
        const result = await loginWithGoogle(codeResponse.code);

        const isDifferentUser =
          previousUser?.email && result.user?.email
            ? previousUser.email !== result.user.email
            : false;

        if (isDifferentUser) {
          storage.clearHealthFlow();
          storage.clearPostLoginRedirectPath();
        }

        storage.setAccessToken(result.access_token);
        storage.setUser(result.user);

        const redirectPath = storage.getPostLoginRedirectPath();

        if (redirectPath) {
          storage.clearPostLoginRedirectPath();
          navigate(redirectPath);
          return;
        }

        try {
          await getDashboard();
          navigate("/dashboard");
          return;
        } catch (dashboardError: any) {
          console.log("dashboard 미존재 또는 최초 사용자:", dashboardError);
        }

        navigate("/health-input");
      } catch (error) {
        console.error("Google login failed:", error);
        setErrorMessage("로그인에 실패했습니다. 다시 시도해주세요.");
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setErrorMessage("구글 로그인에 실패했습니다.");
    },
  });

  return (
    <div className="login-page">
      <div className="login-shell">
        <div className="login-left">
          <div className="brand-badge">MyHealthBuddy</div>
          <h1 className="login-main-title">
            건강 관리를
            <br />
            조금 더 쉽고
            <br />
            꾸준하게
          </h1>
          <p className="login-description">
            건강검진 분석 결과를 바탕으로
            <br />
            챌린지, 기록, 맞춤형 피드백을 한곳에서 관리해보세요.
            <br />
            작은 습관이 쌓여 더 건강한 일상을 만들 수 있어요💚
          </p>

          <div className="feature-list">
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <span>건강 분석 결과 저장</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <span>챌린지 기반 건강 습관 관리</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <span>나만의 건강 버디와 함께 지속 관리</span>
            </div>
          </div>
        </div>

        <div className="login-right">
          <div className="login-card">
            <div className="card-top">
              <div className="card-logo">💚</div>
              <h2 className="card-title">로그인</h2>
              <p className="card-subtitle">
                구글 계정으로 로그인하고 챌린지를 시작해보세요
              </p>
            </div>

            <button
              className="temp-login-button"
              onClick={() => googleLogin()}
              disabled={loading}
            >
              {loading ? "로그인 중..." : "Google로 계속하기"}
            </button>

            {errorMessage && (
              <p className="login-error-text">{errorMessage}</p>
            )}

            <p className="login-footer-text">
              계속하면 MyHealthBuddy의 서비스 이용약관 및 개인정보 처리방침에
              동의한 것으로 간주됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;