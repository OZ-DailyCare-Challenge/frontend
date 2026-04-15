import axios from "axios";
import type {
  MealAnalysisMode,
  MealAnalysisStatusResponse,
  RequestMealAnalysisResponse,
} from "@/src/types/meals";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function requestMealAnalysis(
  imageFile: File,
  mode: MealAnalysisMode
) {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL 환경 변수가 설정되지 않았어요.");
  }

  const formData = new FormData();
  formData.append("image", imageFile);
  formData.append("risk_factors", "");

  const path =
    mode === "premium"
      ? "/api/v1/ai/meals/paid"
      : "/api/v1/ai/meals/free";

  const response = await axios.post<RequestMealAnalysisResponse>(
    `${API_BASE_URL}${path}`,
    formData,
    {
      withCredentials: true,
    }
  );

  return response.data;
}

export async function getMealAnalysisResult(taskId: string) {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL 환경 변수가 설정되지 않았어요.");
  }

  const response = await axios.get<MealAnalysisStatusResponse>(
    `${API_BASE_URL}/api/v1/ai/tasks/${taskId}`,
    {
      withCredentials: true,
    }
  );

  return response.data;
}