"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useGoogleLogin } from "@react-oauth/google";

import Header from "@/src/components/Header";
import { loginWithGoogle } from "@/src/api/auth";
import {
  getDashboard,
  createInitialProfile,
  updateUserProfile,
} from "@/src/api/user";
import { createHealthRecord } from "@/src/api/health";
import {
  requestUserHealthAnalysis,
  getAnalysisResult,
} from "@/src/api/analysis";
import { storage } from "@/src/utils/storage";
import { analysisStorage } from "@/src/utils/analysisStorage";
import {
  guestAnalysisStorage,
  type GuestPendingFlow,
} from "@/src/utils/guestAnalysisStorage";

function extractRecordId(res: any): number | null {
  const value =
    res?.record_id ??
    res?.id ??
    res?.data?.record_id ??
    res?.data?.id ??
    null;

  return typeof value === "number" ? value : null;
}

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const token = storage.getAccessToken();

    if (!token) {
      storage.clearUser();
      storage.removeRefreshToken();
      sessionStorage.removeItem("health-flow-complete");
      sessionStorage.removeItem("health-analysis-task");
      sessionStorage.removeItem("health-analysis-result");
      sessionStorage.removeItem("health-ai-missions");
    }
  }, []);

  const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI;

  const migrateGuestFlowAfterLogin = async () => {
    const pendingFlow =
      guestAnalysisStorage.getPendingFlow<GuestPendingFlow>();
    const shouldMigrate = guestAnalysisStorage.isMigrationNeeded();
    const redirectPath =
      guestAnalysisStorage.getPostLoginRedirect() || "/dashboard";

    if (!pendingFlow || !shouldMigrate) {
      return { redirectedPath: null as string | null };
    }

    try {
      try {
        await createInitialProfile({
          nickname: pendingFlow.nickname,
          gender: pendingFlow.gender,
          birth_year: pendingFlow.birthYear,
        });
      } catch (error: any) {
        const status = error?.response?.status ?? error?.status ?? null;

        if (status === 409) {
          await updateUserProfile({
            nickname: pendingFlow.nickname,
            birth_year: pendingFlow.birthYear,
          });
        } else {
          throw error;
        }
      }

      const createdRecord = await createHealthRecord(pendingFlow.healthPayload);
      const savedRecordId = extractRecordId(createdRecord);

      if (!savedRecordId) {
        throw new Error("회원 건강 기록 저장 후 record_id를 찾을 수 없습니다.");
      }

      const analysisResponse = await requestUserHealthAnalysis(savedRecordId);

      const taskId =
        analysisResponse?.task_id ??
        analysisResponse?.id ??
        analysisResponse?.data?.task_id ??
        null;

      if (!taskId) {
        throw new Error("회원 분석 task_id를 찾을 수 없습니다.");
      }

      sessionStorage.setItem(
        "health-analysis-task",
        JSON.stringify({
          taskId,
          recordId: savedRecordId,
        })
      );

      const finalResult = await getAnalysisResult(taskId);

      analysisStorage.setResult(finalResult);
      sessionStorage.setItem(
        "health-analysis-result",
        JSON.stringify(finalResult)
      );
      sessionStorage.setItem("health-flow-complete", "true");

      guestAnalysisStorage.clearAll();
      sessionStorage.removeItem("guest-profile");

      return { redirectedPath: redirectPath };
    } catch (error) {
      console.error("게스트 분석 데이터 회원 전환 실패:", error);
      throw error;
    }
  };

  const googleLogin = useGoogleLogin({
    flow: "auth-code",
    redirect_uri: redirectUri,
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
          storage.clearHealthFlow?.();
          sessionStorage.removeItem("health-flow-complete");
          sessionStorage.removeItem("health-analysis-task");
          sessionStorage.removeItem("health-analysis-result");
          sessionStorage.removeItem("health-ai-missions");
          guestAnalysisStorage.clearAll();
          sessionStorage.removeItem("guest-profile");
        }

        if (result.access_token) {
          storage.setAccessToken(result.access_token);
        }

        if (result.refresh_token) {
          storage.setRefreshToken(result.refresh_token);
        }

        if (result.user) {
          storage.setUser(result.user);
        }

        const migrationResult = await migrateGuestFlowAfterLogin();

        if (migrationResult.redirectedPath) {
          router.push(migrationResult.redirectedPath);
          return;
        }

        try {
          await getDashboard();
          router.push("/dashboard");
        } catch {
          router.push("/input");
        }
      } catch (error) {
        console.error(error);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "구글 로그인 중 문제가 발생했어요."
        );
      } finally {
        setLoading(false);
      }
    },
    onError: (errorResponse) => {
      console.error("google login error:", errorResponse);
      setErrorMessage("구글 로그인을 다시 시도해주세요.");
    },
  });

  const handleGoogleLogin = () => {
    if (loading) return;

    if (!redirectUri) {
      setErrorMessage("구글 리다이렉트 주소가 설정되지 않았어요.");
      return;
    }

    googleLogin();
  };

  return (
    <main className="relative min-h-screen overflow-hidden text-[#163126]">
      <Header visible />

      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/skygreen.png')" }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0.34)_100%)]" />

      <div className="pointer-events-none absolute left-[-8%] top-[8%] h-[26vw] w-[26vw] rounded-full bg-white/18 blur-3xl" />
      <div className="pointer-events-none absolute right-[-6%] bottom-[-8%] h-[24vw] w-[24vw] rounded-full bg-[#d9f3df]/28 blur-3xl" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 pt-[88px]">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-[620px]"
        >
          <div className="relative overflow-hidden rounded-[40px] border border-white/40 bg-white/55 px-10 py-12 shadow-[0_24px_60px_rgba(22,49,38,0.10)] backdrop-blur-2xl md:px-14 md:py-14">
            <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.9),transparent)]" />
            <div className="pointer-events-none absolute inset-x-10 top-0 h-24 rounded-full bg-white/18 blur-2xl" />

            <div className="flex flex-col items-center text-center">
              <p className="text-[13px] font-semibold tracking-[0.50em] text-[#7eb696]">
                MyHealthBuddy
              </p>

              <p className="mt-8 text-[17px] leading-8 text-[#70867c]">
                로그인 후 건강 분석 결과와 진행 중인 루틴을
                <br />
                이어서 확인할 수 있어요.
              </p>

              <motion.button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                whileHover={!loading ? { y: -2, scale: 1.01 } : {}}
                whileTap={!loading ? { scale: 0.995 } : {}}
                className="mt-10 flex h-[64px] w-full items-center justify-center gap-3 rounded-[22px] border border-white/50 bg-white/75 px-6 text-[18px] font-medium text-[#274236] shadow-[0_10px_24px_rgba(22,49,38,0.06)] backdrop-blur-xl transition hover:bg-white/90 hover:shadow-[0_14px_30px_rgba(22,49,38,0.10)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white">
                  <svg width="20" height="20" viewBox="0 0 48 48">
                    <path
                      fill="#4285F4"
                      d="M24 9.5c3.94 0 7.45 1.35 10.23 3.99l7.61-7.61C36.89 2.2 30.86 0 24 0 14.82 0 6.7 5.44 2.69 13.3l8.84 6.87C13.73 13.09 18.39 9.5 24 9.5z"
                    />
                    <path
                      fill="#34A853"
                      d="M46.14 24.56c0-1.6-.14-3.14-.4-4.64H24v9.28h12.46c-.54 2.9-2.2 5.36-4.7 7.02l7.2 5.6c4.21-3.88 6.68-9.6 6.68-16.26z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M11.53 28.17a14.52 14.52 0 0 1 0-8.34l-8.84-6.87A24.01 24.01 0 0 0 0 24c0 3.87.93 7.53 2.69 10.7l8.84-6.53z"
                    />
                    <path
                      fill="#EA4335"
                      d="M24 48c6.86 0 12.63-2.26 16.84-6.15l-7.2-5.6c-2 1.35-4.56 2.15-9.64 2.15-5.61 0-10.27-3.59-11.97-8.67l-8.84 6.53C6.7 42.56 14.82 48 24 48z"
                    />
                  </svg>
                </span>

                <span>
                  {loading ? "로그인 및 데이터 저장 중..." : "Google로 계속하기"}
                </span>
              </motion.button>

              {errorMessage ? (
                <p className="mt-4 text-sm text-[#d8614d]">{errorMessage}</p>
              ) : null}

              <p className="mt-8 text-[14px] leading-7 text-[#94a69d]">
                MyHealthBuddy에 가입함으로써 MyHealthBuddy의
                <br />
                이용 약관 및 개인정보처리방침에 동의하게 됩니다.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}