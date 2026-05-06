import { storage } from "@/src/utils/storage";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://54.180.116.239";

type ExerciseTaskResponse = {
  task_id: string;
  status: string;
  message?: string;
};

type TaskStatusResponse = {
  task_id: string;
  status: string;
  result: {
    status?: string;
    data?: Record<string, unknown>;
    [key: string]: unknown;
  } | null;
  error?: string | null;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function requestExerciseVerification(
  file: File
): Promise<ExerciseTaskResponse> {
  const formData = new FormData();
  formData.append("image", file);

  const accessToken = storage.getAccessToken();
  if (!accessToken) {
    throw new Error("액세스 토큰이 없습니다.");
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/ai/exercise`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`운동 인증 요청 실패: ${response.status} ${errorText}`);
  }

  return response.json();
}

export async function getAiTaskStatus(
  taskId: string
): Promise<TaskStatusResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/ai/tasks/${taskId}`, {
    method: "GET",
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`AI 태스크 조회 실패: ${response.status} ${errorText}`);
  }

  return response.json();
}

export async function waitExerciseVerificationCompletion(
  taskId: string,
  maxAttempts = 20,
  intervalMs = 2000
): Promise<TaskStatusResponse> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const result = await getAiTaskStatus(taskId);
    const status = String(result?.status ?? "").toUpperCase();

    if (result?.error) {
      throw new Error(String(result.error));
    }

    if (
      status === "SUCCESS" ||
      status === "COMPLETED" ||
      status === "DONE" ||
      result?.result
    ) {
      return result;
    }

    if (status !== "PENDING" && status !== "PROCESSING" && status !== "") {
      throw new Error(`알 수 없는 인증 상태입니다: ${result.status}`);
    }

    await sleep(intervalMs);
  }

  throw new Error("운동 인증 처리 시간이 초과되었어요. 잠시 후 다시 시도해주세요.");
}
