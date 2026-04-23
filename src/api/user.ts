import { storage } from "@/src/utils/storage";
import { analysisStorage } from "@/src/utils/analysisStorage";
import { guestAnalysisStorage } from "@/src/utils/guestAnalysisStorage";

/* =========================
   타입 정의
========================= */

export type InitialProfilePayload = {
  gender: "M" | "F";
  birth_year: number;
  nickname: string;
};

export type UpdateUserProfilePayload = {
  nickname: string;
  birth_year: number;
  profile_image?: string;
};

export type WithdrawPayload = {
  reason: string;
};

export type UserProfileResponse = {
  id?: number;
  email?: string;
  nickname?: string;
  name?: string;
  profile_image?: string;
  role?: string;
  gender?: string;
  age?: number | string;
  birth_year?: number;
  birthYear?: number;
  height?: number;
  weight?: number;
  current_point?: number;
  character_stage?: string | number;
  created_at?: string;
  withdrawal_pending?: boolean;
  withdrawal_deadline?: string;
  [key: string]: unknown;
};

/* =========================
   공통 유틸
========================= */

function getApiBaseUrl(): string {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!apiBaseUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL이 설정되지 않았습니다.");
  }

  return apiBaseUrl.replace(/\/$/, "");
}

function getAuthHeaders(withJson = true): HeadersInit {
  const accessToken = storage.getAccessToken();

  if (!accessToken) {
    throw new Error("액세스 토큰이 없습니다.");
  }

  return withJson
    ? {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      }
    : {
        Authorization: `Bearer ${accessToken}`,
      };
}

async function parseErrorResponse(
  response: Response,
  defaultMessage: string
): Promise<never> {
  const errorText = await response.text().catch(() => "");
  throw new Error(`${defaultMessage}: ${response.status} ${errorText}`);
}

async function parseJsonOrThrow<T>(
  response: Response,
  defaultMessage: string
): Promise<T> {
  if (!response.ok) {
    await parseErrorResponse(response, defaultMessage);
  }

  const json = await response.json().catch(() => null);
  return (json?.data ?? json ?? null) as T;
}

/* =========================
   API
========================= */

/**
 * 대시보드 조회
 */
export async function getDashboard(): Promise<UserProfileResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/users/dashboard`, {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  return parseJsonOrThrow<UserProfileResponse>(response, "대시보드 조회 실패");
}

/**
 * 초기 프로필 생성
 */
export async function createInitialProfile(
  payload: InitialProfilePayload
): Promise<UserProfileResponse> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/v1/users/profile/initial`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    }
  );

  return parseJsonOrThrow<UserProfileResponse>(response, "초기 프로필 저장 실패");
}

/**
 * 프로필 수정
 */
export async function updateUserProfile(
  payload: UpdateUserProfilePayload
): Promise<UserProfileResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/users/profile`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  return parseJsonOrThrow<UserProfileResponse>(response, "프로필 수정 실패");
}

/**
 * 회원 탈퇴 (7일 후 삭제 예약)
 */
export async function withdrawUser(
  reason = ""
): Promise<{ message?: string } | null> {
  const payload: WithdrawPayload = { reason };

  const response = await fetch(`${getApiBaseUrl()}/api/v1/users/withdraw`, {
    method: "DELETE",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    await parseErrorResponse(response, "회원 탈퇴 실패");
  }

  const json = await response.json().catch(() => null);
  return (json?.data ?? json ?? null) as { message?: string } | null;
}

/**
 * 로그아웃 (프론트 상태 초기화)
 */
export async function logoutUser(): Promise<void> {
  storage.logout();

  // 공용 clear 함수 기반 정리
  storage.clearGuestFlow();
  storage.clearAnalysisCache();

  // 유틸별 캐시도 명시적으로 정리
  analysisStorage.clearAll();
  guestAnalysisStorage.clearAll();

  // 이관 관련 잔여 키 정리
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("guest-health-migration-payload");
    sessionStorage.removeItem("guest-health-migration-done");
    localStorage.removeItem("guest-health-migration-payload");
  }
}