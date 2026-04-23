import { storage } from "@/src/utils/storage";

export type AnalysisHistoryItem = {
  id: number;
  record_id: number;
  trigger_type: string;
  cvd_risk_percent: number;
  cvd_age: number;
  risk_level: string;
  top_risk_factors: string[];
  ai_evaluation: string;
  ai_alert: string;
  ai_missions: string[];
  ai_encouragement: string;
  created_at: string;
};

export type AnalysisHistoryResponse = {
  items: AnalysisHistoryItem[];
  total: number;
};

export type Mission = {
  title?: string;
  action?: string;
  reason?: string;
};

export type AnalysisResultResponse = {
  status?: string;
  data?: {
    status?: string;
    ml1_predict?: {
      risk_percent?: number;
      heart_age?: number;
      risk_grade?: string;
      character_stage?: number;
      top_risk_factors?: string[];
    };
    ml1_comment?: {
      evaluation?: string;
      alert?: string | null;
      missions?: Mission[];
      encouragement?: string;
    };
  };
  error?: string | null;
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

async function parseErrorResponse(response: Response, defaultMessage: string) {
  const errorText = await response.text().catch(() => "");
  throw new Error(`${defaultMessage}: ${response.status} ${errorText}`);
}

/**
 * 게스트 분석 결과 → 회원 계정 이전 (재분석 없이 즉시 반환)
 * POST /api/v1/health/analysis/migrate-guest
 */
export async function migrateGuestAnalysis(guestTaskId: string, recordId: number) {
  const response = await fetch(
    `${getApiBaseUrl()}/api/v1/health/analysis/migrate-guest`,
    {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ guest_task_id: guestTaskId, record_id: recordId }),
    }
  );

  if (!response.ok) {
    await parseErrorResponse(response, "게스트 분석 결과 이전 실패");
  }

  return response.json();
}

/**
 * 로그인 사용자 건강 분석 요청
 * POST /api/v1/health/analysis/{record_id}
 */
export async function requestUserHealthAnalysis(recordId: number) {
  const response = await fetch(
    `${getApiBaseUrl()}/api/v1/health/analysis/${recordId}`,
    {
      method: "POST",
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    await parseErrorResponse(response, "로그인 사용자 분석 실패");
  }

  return response.json();
}

/**
 * 분석 상태 즉시 확인
 * GET /api/v1/health/analysis/{task_id}
 */
export async function getAnalysisStatus(taskId: string) {
  const response = await fetch(
    `${getApiBaseUrl()}/api/v1/health/analysis/${taskId}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    await parseErrorResponse(response, "분석 상태 조회 실패");
  }

  return response.json();
}

/**
 * 분석 결과 조회(롱 폴링)
 * GET /api/v1/health/analysis/{task_id}/wait
 */
export async function getAnalysisResult(
  taskId: string
): Promise<AnalysisResultResponse> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/v1/health/analysis/${taskId}/wait`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    await parseErrorResponse(response, "분석 결과 조회 실패");
  }

  return response.json();
}

/**
 * 내 예측 결과 목록 조회
 * GET /api/v1/health/analysis/history
 */
export async function getAnalysisHistory(): Promise<AnalysisHistoryResponse> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/v1/health/analysis/history`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    await parseErrorResponse(response, "분석 히스토리 조회 실패");
  }

  return response.json();
}

/**
 * 특정 건강검진 기록의 예측 결과 목록 조회
 * GET /api/v1/health/analysis/records/{record_id}/result
 */
export async function getAnalysisResultsByRecord(
  recordId: number
): Promise<AnalysisHistoryResponse> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/v1/health/analysis/records/${recordId}/result`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    await parseErrorResponse(response, "기록별 분석 결과 조회 실패");
  }

  return response.json();
}

export async function getAnalysisResultByRecordId(
  recordId: number
): Promise<AnalysisResultResponse> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/v1/health/analysis/records/${recordId}/result`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    await parseErrorResponse(response, "기록별 분석 결과 조회 실패");
  }

  return response.json();
}