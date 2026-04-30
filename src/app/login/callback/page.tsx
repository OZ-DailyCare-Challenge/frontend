"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { storage } from "@/src/utils/storage";
import {
  getDashboard,
  createInitialProfile,
  updateUserProfile,
} from "@/src/api/user";
import { createHealthRecord } from "@/src/api/health";
import {
  migrateGuestAnalysis,
  requestUserHealthAnalysis,
} from "@/src/api/analysis";
import { analysisStorage } from "@/src/utils/analysisStorage";
import {
  guestAnalysisStorage,
  type GuestPendingFlow,
} from "@/src/utils/guestAnalysisStorage";
import { markHealthFlowComplete } from "@/src/utils/health-flow";
import { useAccessStore } from "@/src/store/access-store";

function extractRecordId(res: any): number | null {
  const value =
    res?.record_id ??
    res?.id ??
    res?.data?.record_id ??
    res?.data?.id ??
    null;

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function extractStatus(error: any): number | null {
  const status = error?.response?.status ?? error?.status ?? null;

  if (typeof status === "number") return status;

  const matchedStatus = error?.message?.match(/:\s*(\d{3})\s/)?.[1];
  return matchedStatus ? Number(matchedStatus) : null;
}

function clearGuestMigrationState() {
  guestAnalysisStorage.clearAll();
  sessionStorage.removeItem("guest-profile");
}

async function fallbackToMemberAnalysis(recordId: number) {
  const analysisResponse = await requestUserHealthAnalysis(recordId);
  const taskId =
    analysisResponse?.task_id ??
    analysisResponse?.id ??
    analysisResponse?.data?.task_id;

  if (analysisResponse?.status === "success") {
    analysisStorage.setResult(analysisResponse);
    sessionStorage.setItem(
      "health-analysis-result",
      JSON.stringify(analysisResponse)
    );
    return;
  }

  if (taskId) {
    analysisStorage.setTaskStore({ taskId, recordId });
    sessionStorage.setItem(
      "health-analysis-task",
      JSON.stringify({ taskId, recordId })
    );
  }
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
      storage.setUser({
        id: userId ? Number(userId) : undefined,
        email: email || undefined,
        name: name || undefined,
        picture: picture || undefined,
      });

      const pendingFlow =
        guestAnalysisStorage.getPendingFlow<GuestPendingFlow>();
      const shouldMigrate = guestAnalysisStorage.isMigrationNeeded();
      const redirectPath =
        guestAnalysisStorage.getPostLoginRedirect() || "/dashboard";

      if (pendingFlow && shouldMigrate) {
        try {
          try {
            await createInitialProfile({
              nickname: pendingFlow.nickname,
              gender: pendingFlow.gender,
              birth_year: pendingFlow.birthYear,
            });
          } catch (error: any) {
            const status = extractStatus(error);

            if (status === 409) {
              await updateUserProfile({
                nickname: pendingFlow.nickname,
                birth_year: pendingFlow.birthYear,
              });
            } else {
              throw error;
            }
          }

          const createdRecord = await createHealthRecord(
            pendingFlow.healthPayload
          );

          const savedRecordId = extractRecordId(createdRecord);

          if (!savedRecordId) {
            console.error("record_id 추출 실패:", createdRecord);
            throw new Error("record_id를 찾을 수 없습니다.");
          }

          const guestTaskId = guestAnalysisStorage.getTaskId();
          let migrateSuccess = false;

          if (guestTaskId) {
            try {
              const migratedResult = await migrateGuestAnalysis(
                guestTaskId,
                savedRecordId
              );

              if (migratedResult?.status === "success") {
                analysisStorage.setResult(migratedResult);
                sessionStorage.setItem(
                  "health-analysis-result",
                  JSON.stringify(migratedResult)
                );
                migrateSuccess = true;
              }
            } catch (error) {
              console.warn(
                "게스트 분석 이관 실패, 회원 재분석으로 fallback:",
                error
              );
            }
          }

          if (!migrateSuccess) {
            if (!guestTaskId) {
              console.warn(
                "guest_task_id 없음: 회원 건강기록 기반 분석으로 fallback합니다."
              );
            }

            await fallbackToMemberAnalysis(savedRecordId);
          }

          markHealthFlowComplete();
          useAccessStore.getState().markAnalysisComplete();
          await useAccessStore.getState().syncAccessFromServer();

          clearGuestMigrationState();
          router.push("/result");
          return;
        } catch (error) {
          console.error("게스트 분석 데이터 회원 전환 실패:", error);
          clearGuestMigrationState();
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
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-gray-500">로그인 처리 중...</p>
    </div>
  );
}

export default function LoginCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-gray-500">로그인 처리 중...</p>
        </div>
      }
    >
      <LoginCallbackInner />
    </Suspense>
  );
}
