import apiClient from "./client";

export interface CreateHealthRecordRequest {
  systolic_bp: number;
  diastolic_bp: number;
  total_cholesterol: number;
  glucose: number;
  height: number;
  weight: number;
  smoke_yn: boolean;
  alcohol_yn: boolean;
  exercise_yn: boolean;
}

export interface CreateHealthRecordResponse {
  record_id?: number | string;
  id?: number | string;
  data?: {
    record_id?: number | string;
    id?: number | string;
  };
}

export interface RequestHealthAnalysisResponse {
  task_id?: string;
  id?: string;
  status?: string;
  data?: {
    task_id?: string;
    id?: string;
    status?: string;
  };
}

export interface AnalysisMission {
  title: string;
  action: string;
  reason: string;
}

export interface HealthAnalysisResultData {
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
    missions?: AnalysisMission[];
    encouragement?: string;
  };
}

export interface HealthAnalysisResultResponse {
  status?: string;
  data?: HealthAnalysisResultData;
  error?: string;

  // 백엔드가 data 래핑 없이 바로 내려주는 경우도 대응
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
    missions?: AnalysisMission[];
    encouragement?: string;
  };
}

export const createHealthRecord = async (
  data: CreateHealthRecordRequest
): Promise<CreateHealthRecordResponse> => {
  const response = await apiClient.post("/api/v1/health/records", data);
  return response.data;
};

export const requestHealthAnalysis = async (
  recordId: string | number
): Promise<RequestHealthAnalysisResponse> => {
  const response = await apiClient.post(`/api/v1/health/analysis/${recordId}`);
  return response.data;
};

export const getHealthAnalysisResult = async (
  taskId: string | number
): Promise<HealthAnalysisResultResponse> => {
  const response = await apiClient.get(`/api/v1/health/analysis/${taskId}`);
  return response.data;
};