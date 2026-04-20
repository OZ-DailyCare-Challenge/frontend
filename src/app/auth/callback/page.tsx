"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginWithGoogle } from "@/src/api/auth";
import { storage } from "@/src/utils/storage";
import { getDashboard, createInitialProfile, updateUserProfile } from "@/src/api/user";
import { createHealthRecord } from "@/src/api/health";
import { requestUserHealthAnalysis, getAnalysisResult } from "@/src/api/analysis";
import { analysisStorage } from "@/src/utils/analysisStorage";
import { guestAnalysisStorage, type GuestPendingFlow } from "@/src/utils/guestAnalysisStorage";

function extractRecordId(res: any): number | null {
  const value = res?.record_id ?? res?.id ?? res?.data?.record_id ?? res?.data?.id ?? null;
  return typeof value === "number" ? value : null;
}

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");

      if (!code) {
        router.push("/login");
        return;
      }

      try {
        const result = await loginWithGoogle(code);

        if (result.access_token) {
          storage.setAccessToken(result.access_token);
        }
        if (result.user) {
          storage.setUser(result.user);
        }

        const pendingFlow = guestAnalysisStorage.getPendingFlow<GuestPendingFlow>();
        const shouldMigrate = guestAnalysisStorage.isMigrationNeeded();
        const redirectPath = guestAnalysisStorage.getPostLoginRedirect() || "/dashboard";

        if (pendingFlow && shouldMigrate) {
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
                await updateUserProfile({ nickname: pendingFlow.nickname, birth_year: pendingFlow.birthYear });
              } else {
                throw error;
              }
            }

            const createdRecord = await createHealthRecord(pendingFlow.healthPayload);
            const savedRecordId = extractRecordId(createdRecord);
            if (!savedRecordId) throw new Error("record_id를 찾을 수 없습니다.");

            const analysisResponse = await requestUserHealthAnalysis(savedRecordId);
            const taskId = analysisResponse?.task_id ?? analysisResponse?.id ?? analysisResponse?.data?.task_id ?? null;
            if (!taskId) throw new Error("task_id를 찾을 수 없습니다.");

            sessionStorage.setItem("health-analysis-task", JSON.stringify({ taskId, recordId: savedRecordId }));

            const finalResult = await getAnalysisResult(taskId);
            analysisStorage.setResult(finalResult);
            sessionStorage.setItem("health-analysis-result", JSON.stringify(finalResult));
            sessionStorage.setItem("health-flow-complete", "true");

            guestAnalysisStorage.clearAll();
            sessionStorage.removeItem("guest-profile");

            router.push(redirectPath);
            return;
          } catch (error) {
            console.error("게스트 분석 데이터 회원 전환 실패:", error);
          }
        }

        try {
          await getDashboard();
          router.push(result.is_new_user ? "/input" : "/dashboard");
        } catch {
          router.push("/input");
        }
      } catch (error) {
        console.error("로그인 처리 실패:", error);
        router.push("/login");
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-gray-500">로그인 처리 중...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">로그인 처리 중...</p>
      </div>
    }>
      <AuthCallbackInner />
    </Suspense>
  );
}
