import { storage } from "@/src/utils/storage";

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
  height?: number;
  weight?: number;
  current_point?: number;
  character_stage?: string | number;
  created_at?: string;
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

  return apiBaseUrl;
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
  });

  if (!response.ok) {
    await parseErrorResponse(response, "대시보드 조회 실패");
  }

  return response.json();
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

  if (!response.ok) {
    await parseErrorResponse(response, "초기 프로필 저장 실패");
  }

  return response.json();
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

  if (!response.ok) {
    await parseErrorResponse(response, "프로필 수정 실패");
  }

  return response.json();
}

/**
 * 회원 탈퇴
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

  return response.json().catch(() => null);
}

/**
 * 로그아웃 (프론트 상태 초기화)
 */
export function logoutUser(): void {
  storage.logout();
}