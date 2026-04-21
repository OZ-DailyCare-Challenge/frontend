import { storage } from "@/src/utils/storage";
import { initialChallenges } from "@/src/lib/challenge-data";

export type Challenge = {
  id: number;
  category: string;
  title: string;
  description: string;
  expected_effect: string;
  verification_method: string;
  target_risk_factors: string;
  duration_days: number;
  required_success_days: number;
};

export type ChallengesResponse = {
  challenges: Challenge[];
};

export type UserChallengeResponse = {
  id: number;
  user_id: number;
  challenge_id: number;
  status: string;
  current_streak: number;
  start_date: string;
  completed_at?: string | null;
};

export type ChallengeLogPayload = {
  verification_type: string;
  input_value: string;
  cv_result_id?: number;
};

export type ChallengeLogResponse = {
  id: number;
  user_challenge_id: number;
  log_date: string;
  verification_type: string;
  input_value: string;
  cv_result_id?: number;
  created_at: string;
};

export type ChallengeMessageResponse = {
  message?: string;
};

export type ChallengesWithFallbackResponse = {
  challenges: Challenge[];
  isFallback: boolean;
};

function getApiBaseUrl() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!apiBaseUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL이 설정되지 않았습니다.");
  }

  return apiBaseUrl;
}

function getAuthHeaders() {
  const accessToken = storage.getAccessToken();

  if (!accessToken) {
    throw new Error("액세스 토큰이 없습니다.");
  }

  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
}

async function parseErrorResponse(
  response: Response,
  defaultMessage: string
): Promise<never> {
  const errorText = await response.text().catch(() => "");
  throw new Error(`${defaultMessage}: ${response.status} ${errorText}`);
}

function isFallbackEligibleError(error: unknown) {
  if (!(error instanceof Error)) return false;

  return (
    error.message.includes("404") ||
    error.message.includes("Failed to fetch") ||
    error.message.includes("NetworkError") ||
    error.message.includes("Load failed")
  );
}

function mapInitialChallengeToApiChallenge(): Challenge[] {
  return initialChallenges.map((item) => ({
    id: item.id,
    category: item.category,
    title: item.title,
    description: item.description,
    expected_effect: item.effect,
    verification_method: item.verification,
    target_risk_factors: item.riskTarget,
    duration_days: item.durationDays,
    required_success_days: item.completionWindow,
  }));
}

/**
 * 챌린지 목록 조회
 * GET /api/v1/challenges
 */
export async function getChallenges(): Promise<ChallengesResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/challenges`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    await parseErrorResponse(response, "챌린지 목록 조회 실패");
  }

  return response.json();
}

/**
 * 챌린지 목록 조회 + fallback
 */
export async function getChallengesWithFallback(): Promise<ChallengesWithFallbackResponse> {
  try {
    const response = await getChallenges();

    if (Array.isArray(response.challenges) && response.challenges.length > 0) {
      return {
        challenges: response.challenges,
        isFallback: false,
      };
    }

    console.warn("챌린지 API 응답이 비어 있어 fallback 데이터를 사용합니다.");

    return {
      challenges: mapInitialChallengeToApiChallenge(),
      isFallback: true,
    };
  } catch (error) {
    console.warn("챌린지 API 호출 실패로 fallback 데이터를 사용합니다.", error);

    return {
      challenges: mapInitialChallengeToApiChallenge(),
      isFallback: true,
    };
  }
}

/**
 * 챌린지 참여 시작
 * POST /api/v1/challenges/{challenge_id}/join?user_id=...
 */
export async function joinChallenge(
  challengeId: number
): Promise<UserChallengeResponse> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/v1/challenges/${challengeId}/join`,
    {
      method: "POST",
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    await parseErrorResponse(response, "챌린지 참여 실패");
  }

  return response.json();
}

/**
 * 챌린지 참여 시작 + fallback
 */
export async function joinChallengeWithFallback(
  challengeId: number
): Promise<{ data: UserChallengeResponse; isFallback: boolean }> {
  try {
    const data = await joinChallenge(challengeId);
    return { data, isFallback: false };
  } catch (error) {
    if (!isFallbackEligibleError(error)) throw error;

    console.warn("챌린지 참여 API 실패로 임시 시작 처리합니다.", error);

    return {
      isFallback: true,
      data: {
        id: Date.now(),
        user_id: 0,
        challenge_id: challengeId,
        status: "active",
        current_streak: 0,
        start_date: new Date().toISOString().slice(0, 10),
        completed_at: null,
      },
    };
  }
}

/**
 * 챌린지 포기
 * PATCH /api/v1/user-challenges/{user_challenge_id}/abandon
 */
export async function abandonChallenge(
  userChallengeId: number
): Promise<ChallengeMessageResponse> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/v1/user-challenges/${userChallengeId}/abandon`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    await parseErrorResponse(response, "챌린지 포기 실패");
  }

  return response.json();
}

/**
 * 챌린지 포기 + fallback
 */
export async function abandonChallengeWithFallback(
  userChallengeId: number
): Promise<{ data: ChallengeMessageResponse; isFallback: boolean }> {
  try {
    const data = await abandonChallenge(userChallengeId);
    return { data, isFallback: false };
  } catch (error) {
    if (!isFallbackEligibleError(error)) throw error;

    console.warn("챌린지 포기 API 실패로 임시 포기 처리합니다.", error);

    return {
      isFallback: true,
      data: {
        message: "임시 포기 처리 완료",
      },
    };
  }
}

/**
 * 챌린지 인증
 * POST /api/v1/user-challenges/{user_challenge_id}/log
 */
export async function logChallenge(
  userChallengeId: number,
  payload: ChallengeLogPayload
): Promise<ChallengeLogResponse> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/v1/user-challenges/${userChallengeId}/log`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    await parseErrorResponse(response, "챌린지 인증 실패");
  }

  return response.json();
}

/**
 * 챌린지 인증 + fallback
 */
export async function logChallengeWithFallback(
  userChallengeId: number,
  payload: ChallengeLogPayload
): Promise<{ data: ChallengeLogResponse; isFallback: boolean }> {
  try {
    const data = await logChallenge(userChallengeId, payload);
    return { data, isFallback: false };
  } catch (error) {
    if (!isFallbackEligibleError(error)) throw error;

    console.warn("챌린지 인증 API 실패로 임시 인증 처리합니다.", error);

    return {
      isFallback: true,
      data: {
        id: Date.now(),
        user_challenge_id: userChallengeId,
        log_date: new Date().toISOString().slice(0, 10),
        verification_type: payload.verification_type,
        input_value: payload.input_value,
        cv_result_id: payload.cv_result_id,
        created_at: new Date().toISOString(),
      },
    };
  }
}