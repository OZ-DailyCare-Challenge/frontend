import { storage } from "@/src/utils/storage";

export type CreateHealthRecordRequest = {
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

export type HealthRecord = {
  record_id: number;
  systolic_bp: number;
  diastolic_bp: number;
  total_cholesterol: number;
  glucose: number;
  smoke_yn: boolean;
  alcohol_yn: boolean;
  exercise_yn: boolean;
  height?: number;
  weight?: number;
  created_at?: string;
};

export type UpdateHealthRecordPayload = {
  systolic_bp: number;
  diastolic_bp: number;
  total_cholesterol: number;
  glucose: number;
  smoke_yn: boolean;
  alcohol_yn: boolean;
  exercise_yn: boolean;
  height?: number;
  weight?: number;
};

export type GuestAnalysisPayload = {
  birth_date: string;
  gender: "M" | "F";
  height: number;
  weight: number;
  systolic_bp: number;
  diastolic_bp: number;
  total_cholesterol: number;
  glucose: number;
  smoke_yn: boolean;
  alcohol_yn: boolean;
  exercise_yn: boolean;
};

export type GuestHealthAnalysisResult = {
  status?: string;
  error?: string;
  message?: string;
  data?: Record<string, unknown>;
  [key: string]: unknown;
};

function getApiBaseUrl() {
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

  if (withJson) {
    return {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

async function parseErrorResponse(
  response: globalThis.Response,
  defaultMessage: string
): Promise<string> {
  const errorText = await response.text().catch(() => "");
  return `${defaultMessage}: ${response.status} ${errorText}`;
}

export async function createHealthRecord(
  payload: CreateHealthRecordRequest
): Promise<HealthRecord | Record<string, unknown>> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/health/records`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response, "건강 기록 생성 실패"));
  }

  return response.json();
}

export async function getHealthRecords(): Promise<
  HealthRecord[] | { records: HealthRecord[] }
> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/health/records`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(
      await parseErrorResponse(response, "건강 기록 목록 조회 실패")
    );
  }

  return response.json();
}

export async function getHealthRecordById(
  recordId: number
): Promise<HealthRecord> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/v1/health/records/${recordId}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(
      await parseErrorResponse(response, "건강 기록 상세 조회 실패")
    );
  }

  return response.json();
}

export async function patchHealthRecord(
  recordId: number,
  payload: UpdateHealthRecordPayload
): Promise<HealthRecord> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/v1/health/records/${recordId}`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response, "건강 기록 수정 실패"));
  }

  return response.json();
}

export async function deleteHealthRecord(
  recordId: number
): Promise<{ message?: string } | null> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/v1/health/records/${recordId}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(false),
    }
  );

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response, "건강 기록 삭제 실패"));
  }

  return response.json().catch(() => null);
}

export async function requestGuestHealthAnalysis(
  payload: GuestAnalysisPayload
) {
  const response = await fetch(
    `${getApiBaseUrl()}/api/v1/health/analysis/guest`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    throw new Error(
      await parseErrorResponse(response, "게스트 건강 분석 요청 실패")
    );
  }

  return response.json();
}

export async function getGuestHealthAnalysisResult(
  taskId: string
): Promise<GuestHealthAnalysisResult> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/v1/health/analysis/${taskId}/wait`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      await parseErrorResponse(response, "게스트 건강 분석 결과 조회 실패")
    );
  }

  return response.json();
}