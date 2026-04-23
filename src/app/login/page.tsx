"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useGoogleLogin } from "@react-oauth/google";

import Header from "@/src/components/Header";
import { loginWithGoogle } from "@/src/api/auth";
import {
  createHealthRecord,
  getHealthRecords,
  patchHealthRecord,
} from "@/src/api/health";
import { requestUserHealthAnalysis, migrateGuestAnalysis } from "@/src/api/analysis";
import {
  createInitialProfile,
  updateUserProfile,
  getDashboard,
  // cancelWithdraw, // 백엔드 API 생기면 주석 해제
} from "@/src/api/user";
import { storage } from "@/src/utils/storage";
import { guestAnalysisStorage } from "@/src/utils/guestAnalysisStorage";
import { analysisStorage } from "@/src/utils/analysisStorage";
import {
  clearHealthFlowComplete,
  markHealthFlowComplete,
} from "@/src/utils/health-flow";
import { useAccessStore } from "@/src/store/access-store";

type GuestMigrationPayload = {
  nickname: string;
  gender: "M" | "F";
  birthYear: number;
  healthPayload: {
    systolic_bp: number;
    diastolic_bp: number;
    total_cholesterol: number;
    glucose: number;
    height: number;
    weight: number;
    smoke_yn: boolean;
    alcohol_yn: boolean;
    exercise_yn: boolean;
  };
};

type WithdrawPendingState = {
  deadline: string;
};

type LoginResponseWithWithdraw = {
  access_token: string;
  refresh_token?: string | null;
  user?: any;
  withdrawal_pending?: boolean;
  withdrawal_deadline?: string;
};

type HealthRecordItem = {
  record_id?: number;
  id?: number;
};

type DashboardProfile = {
  gender?: string;
  birth_year?: number | string;
  birthYear?: number | string;
};

const GUEST_MIGRATION_KEY = "guest-health-migration-payload";
const GUEST_MIGRATION_DONE_KEY = "guest-health-migration-done";

function extractRecordId(res: any): number | null {
  const value =
    res?.record_id ??
    res?.id ??
    res?.data?.record_id ??
    res?.data?.id ??
    null;

  if (typeof value === "number") return value;
  if (typeof value === "string" && !Number.isNaN(Number(value))) {
    return Number(value);
  }

  return null;
}

function extractHealthRecords(raw: unknown): HealthRecordItem[] {
  const data = raw as
    | HealthRecordItem[]
    | { records?: HealthRecordItem[]; data?: { records?: HealthRecordItem[] } }
    | null;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.records)) return data.records;
  if (Array.isArray(data?.data?.records)) return data.data.records;
  return [];
}

function parseGuestMigrationPayload(): GuestMigrationPayload | null {
  try {
    const raw = sessionStorage.getItem(GUEST_MIGRATION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as GuestMigrationPayload;

    if (
      !parsed?.nickname ||
      !parsed?.gender ||
      !parsed?.birthYear ||
      !parsed?.healthPayload
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function clearGuestMigrationState() {
  sessionStorage.removeItem(GUEST_MIGRATION_KEY);
  sessionStorage.removeItem(GUEST_MIGRATION_DONE_KEY);
  sessionStorage.removeItem("guest-profile");

  analysisStorage.clearAll();
  guestAnalysisStorage.clearAll();
  storage.clearGuestFlow();
  storage.clearPostLoginRedirectPath();

  if (typeof window !== "undefined") {
    localStorage.removeItem("guest-health-migration-payload");
  }
}

function formatDeadline(deadline?: string) {
  if (!deadline) return "-";

  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return deadline;

  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function extractStatusFromError(error: any): number | null {
  const matchedStatus = error?.message?.match(/:\s(\d{3})\s/);

  return (
    error?.response?.status ??
    error?.status ??
    (matchedStatus ? Number(matchedStatus[1]) : null)
  );
}

export default function LoginPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [withdrawActionLoading, setWithdrawActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [withdrawPending, setWithdrawPending] =
    useState<WithdrawPendingState | null>(null);
  const [pendingLoginResult, setPendingLoginResult] =
    useState<LoginResponseWithWithdraw | null>(null);

  useEffect(() => {
    const token = storage.getAccessToken();

    if (!token) {
      storage.clearUser();
      storage.removeRefreshToken();
      storage.clearAccessSnapshot();
      clearHealthFlowComplete();
      analysisStorage.clearAll();
      sessionStorage.removeItem("health-ai-missions");
    }
  }, []);

  const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI;

  const migrateGuestDataToMember = async () => {
    const guestPayload = parseGuestMigrationPayload();
    const guestResult = guestAnalysisStorage.getResult();
    const alreadyMigrated = sessionStorage.getItem(GUEST_MIGRATION_DONE_KEY);

    if (!guestPayload || alreadyMigrated === "true") {
      return false;
    }

    sessionStorage.setItem(GUEST_MIGRATION_DONE_KEY, "true");

    try {
      const dashboard = (await getDashboard().catch(() => null)) as
        | DashboardProfile
        | null;

      const hasInitialProfile =
        dashboard?.gender !== undefined &&
        dashboard?.gender !== null &&
        dashboard?.gender !== "";

      if (!hasInitialProfile) {
        try {
          await createInitialProfile({
            nickname: guestPayload.nickname,
            gender: guestPayload.gender,
            birth_year: guestPayload.birthYear,
          });
        } catch (error: any) {
          const status = extractStatusFromError(error);

          if (status === 409) {
            await updateUserProfile({
              nickname: guestPayload.nickname,
              birth_year: guestPayload.birthYear,
            });
          } else {
            throw error;
          }
        }
      } else {
        await updateUserProfile({
          nickname: guestPayload.nickname,
          birth_year: guestPayload.birthYear,
        });
      }

      const existingRecordsRaw = await getHealthRecords();
      const existingRecords = extractHealthRecords(existingRecordsRaw);
      const latestRecord = existingRecords.length > 0 ? existingRecords[0] : null;

      let recordId: number | null = null;

      if (latestRecord?.record_id || latestRecord?.id) {
        const latestRecordId = latestRecord.record_id ?? latestRecord.id ?? null;

        if (latestRecordId) {
          try {
            await patchHealthRecord(latestRecordId, guestPayload.healthPayload);
          } catch (error) {
            console.warn(
              "기존 건강기록 patch 실패, 기존 record_id로 계속 진행:",
              error
            );
          }

          recordId = latestRecordId;
        }
      } else {
        const created = await createHealthRecord(guestPayload.healthPayload);
        recordId = extractRecordId(created);
      }

      if (!recordId) {
        const recordsAfterCreateRaw = await getHealthRecords();
        const recordsAfterCreate = extractHealthRecords(recordsAfterCreateRaw);
        const newestRecord =
          recordsAfterCreate.length > 0 ? recordsAfterCreate[0] : null;

        recordId = newestRecord?.record_id ?? newestRecord?.id ?? null;
      }

      if (!recordId) {
        throw new Error("회원 건강기록 저장에 실패했어요.");
      }

      const guestTaskId = guestAnalysisStorage.getTaskId();
      let migrateSuccess = false;

      if (guestTaskId) {
        // task_id로 migrate-guest API → DB 저장 + 결과 반환
        try {
          const migratedResult = await migrateGuestAnalysis(guestTaskId, recordId);
          if (migratedResult?.status === "success") {
            analysisStorage.setResult(migratedResult);
            migrateSuccess = true;
          }
        } catch {
          migrateSuccess = false;
        }
      }

      // migrate 실패 또는 task_id 없을 때 → localStorage 결과 사용
      if (!migrateSuccess && guestResult) {
        analysisStorage.setResult(guestResult);
        migrateSuccess = true;
      }

      if (!migrateSuccess) {
        const analysisRequest = await requestUserHealthAnalysis(recordId);

        if (analysisRequest?.status === "success") {
          analysisStorage.setResult(analysisRequest);
        } else {
          const taskId =
            analysisRequest?.task_id ??
            analysisRequest?.id ??
            analysisRequest?.data?.task_id;

          if (taskId) {
            analysisStorage.setTaskStore({ taskId, recordId });
          }
        }
      }

      markHealthFlowComplete();
      useAccessStore.getState().markAnalysisComplete();

      clearGuestMigrationState();
      return true;
    } catch (error) {
      sessionStorage.removeItem(GUEST_MIGRATION_DONE_KEY);
      throw error;
    }
  };

  const finalizeLoginFlow = async (result: LoginResponseWithWithdraw) => {
    const previousUser = storage.getUser();
    const nextUserEmail = result.user?.email ?? null;
    const prevUserEmail = previousUser?.email ?? null;

    const isDifferentUser =
      Boolean(prevUserEmail) &&
      Boolean(nextUserEmail) &&
      prevUserEmail !== nextUserEmail;

    analysisStorage.clearAll();
    storage.clearAnalysisCache();
    sessionStorage.removeItem("health-analysis-task");
    sessionStorage.removeItem("health-analysis-result");

    if (isDifferentUser) {
      storage.clearHealthFlow();
      storage.clearGuestFlow();
      storage.clearAccessSnapshot();
      clearHealthFlowComplete();
      sessionStorage.removeItem("health-ai-missions");
      sessionStorage.removeItem(GUEST_MIGRATION_KEY);
      sessionStorage.removeItem(GUEST_MIGRATION_DONE_KEY);
      sessionStorage.removeItem("guest-profile");
      guestAnalysisStorage.clearAll();
    }

    await useAccessStore.getState().applyLogin({
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
      user: result.user,
    });

    const migrated = await migrateGuestDataToMember();
    await useAccessStore.getState().syncAccessFromServer();

    const redirectPath = storage.getPostLoginRedirectPath();
    storage.clearPostLoginRedirectPath();

    if (redirectPath) {
      router.push(redirectPath);
      return;
    }

    if (migrated) {
      router.push("/result");
      return;
    }

    const accessLevel = useAccessStore.getState().accessLevel;

    if (accessLevel === "member_done") {
      markHealthFlowComplete();
      router.push("/dashboard");
      return;
    }

    router.push("/input");
  };

  /*
  const handleCancelWithdrawConfirm = async () => {
    if (!pendingLoginResult) return;

    try {
      setWithdrawActionLoading(true);
      setErrorMessage("");

      await cancelWithdraw();

      setWithdrawPending(null);
      const loginResult = pendingLoginResult;
      setPendingLoginResult(null);

      await finalizeLoginFlow(loginResult);
    } catch (error) {
      console.error("회원탈퇴 취소 실패:", error);
      setErrorMessage("계정 복구 처리 중 문제가 발생했어요.");
    } finally {
      setWithdrawActionLoading(false);
    }
  };
  */

  const handleWithdrawLater = async () => {
    if (!pendingLoginResult) {
      setWithdrawPending(null);
      return;
    }

    try {
      setWithdrawActionLoading(true);
      setErrorMessage("");

      setWithdrawPending(null);
      const loginResult = pendingLoginResult;
      setPendingLoginResult(null);

      await finalizeLoginFlow(loginResult);
    } catch (error) {
      console.error("로그인 후 이동 처리 실패:", error);
      setErrorMessage("로그인 후 이동 중 문제가 발생했어요.");
    } finally {
      setWithdrawActionLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    flow: "auth-code",
    redirect_uri: redirectUri,
    onSuccess: async (codeResponse) => {
      try {
        setLoading(true);
        setErrorMessage("");

        const result = (await loginWithGoogle(
          codeResponse.code
        )) as LoginResponseWithWithdraw;

        if (result.withdrawal_pending) {
          setPendingLoginResult(result);
          setWithdrawPending({
            deadline: result.withdrawal_deadline ?? "",
          });
          return;
        }

        await finalizeLoginFlow(result);
      } catch (error) {
        console.error(error);
        setErrorMessage("구글 로그인 중 문제가 발생했어요.");
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
    if (loading || withdrawActionLoading) return;

    if (!redirectUri) {
      setErrorMessage("구글 리다이렉트 주소가 설정되지 않았어요.");
      return;
    }

    googleLogin();
  };

  return (
    <>
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
                  disabled={loading || withdrawActionLoading}
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

                  <span>{loading ? "로그인 중..." : "Google로 계속하기"}</span>
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

      {withdrawPending ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-[440px] rounded-[28px] border border-white/50 bg-white p-6 shadow-[0_24px_60px_rgba(22,49,38,0.16)]">
            <h3 className="text-xl font-bold text-[#163126]">
              회원탈퇴가 예약된 계정이에요
            </h3>

            <p className="mt-4 text-sm leading-7 text-[#5c7268]">
              7일 이내에 다시 로그인하면 계정을 계속 사용할 수 있어요.
              <br />
              기존 건강 데이터와 분석 결과도 그대로 유지돼요.
            </p>

            <p className="mt-3 text-xs text-[#8ba097]">
              삭제 예정일: {formatDeadline(withdrawPending.deadline)}
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleWithdrawLater}
                disabled={withdrawActionLoading}
                className="flex-1 rounded-2xl bg-[#4C9A5F] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#438953] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {withdrawActionLoading ? "처리 중..." : "계속 로그인하기"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setWithdrawPending(null);
                  setPendingLoginResult(null);
                }}
                disabled={withdrawActionLoading}
                className="flex-1 rounded-2xl border border-[#163126]/12 bg-white px-4 py-3 text-sm font-semibold text-[#163126] transition hover:bg-[#f7faf8] disabled:cursor-not-allowed disabled:opacity-70"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}