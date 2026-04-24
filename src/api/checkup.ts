import type {
  CheckupOcrApiResponse,
  CheckupOcrErrorResponse,
  CheckupOcrResult,
} from "@/src/types/checkup";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

function getErrorMessage(data: CheckupOcrErrorResponse | null, fallback: string) {
  return data?.detail || fallback;
}

export function normalizeCheckupOcrResult(
  data: CheckupOcrApiResponse | CheckupOcrResult
): CheckupOcrResult {
  if ("result" in data && data.result) {
    return data.result;
  }

  return data as CheckupOcrResult;
}

export async function requestCheckupOcr(
  file: File
): Promise<CheckupOcrApiResponse> {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL이 설정되지 않았어요.");
  }

  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(`${API_BASE_URL}/api/v1/ai/checkup`, {
    method: "POST",
    body: formData,
  });

  let data: CheckupOcrApiResponse | CheckupOcrErrorResponse | null = null;

  try {
    data = (await response.json()) as
      | CheckupOcrApiResponse
      | CheckupOcrErrorResponse;
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data as CheckupOcrErrorResponse, "건강검진표 분석 요청에 실패했어요.")
    );
  }

  return data as CheckupOcrApiResponse;
}