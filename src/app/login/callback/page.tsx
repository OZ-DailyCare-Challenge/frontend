"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

function LoginCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const accessToken = searchParams.get("access_token");
      const isNewUser = searchParams.get("is_new_user") === "true";
      const userId = searchParams.get("user_id");
      const email = searchParams.get("email");
      const name = searchParams.get("name");
      const picture = searchParams.get("picture");

      if (!accessToken) {
        router.push("/login");
        return;
      }

      storage.setAccessToken(accessToken);
      storage.setUser({ id: userId ? Number(userId) : undefined, email: email || undefined, name: name || undefined, picture: picture || undefined });

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
            const status = error?.response?.status ?? error?.status ?? (error?.message?.match(/:\s*(\d{3})\s/)?.[1] ? parseInt(error.message.match(/:\s*(\d{3})\s/)[1]) : null);
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
        router.push(isNewUser ? "/input" : "/dashboard");
      } catch {
        router.push("/input");
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

export default function LoginCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">로그인 처리 중...</p>
      </div>
    }>
      <LoginCallbackInner />
    </Suspense>
  );
}
