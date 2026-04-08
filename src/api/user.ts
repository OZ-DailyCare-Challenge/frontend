import apiClient from "./client";
import { ENDPOINTS } from "./endpoints";

export interface DashboardResponse {
  nickname?: string;
  score?: number;
  steps?: number;
  systolic_bp?: number;
  diastolic_bp?: number;
  fasting_glucose?: number;
  cholesterol?: number;
  challenge_progress?: number;
  streak_days?: number;
  [key: string]: unknown;
}

export interface InitializeUserProfileRequest {
  nickname: string;
  gender: "M" | "F";
  birth_year: number;
}

export interface UpdateUserProfileRequest {
  nickname: string;
  birth_year: number;
  profile_image?: string | null;
}

export const getDashboard = async (): Promise<DashboardResponse> => {
  const response = await apiClient.get(ENDPOINTS.USERS.DASHBOARD);
  return response.data;
};

export const initializeUserProfile = async (
  data: InitializeUserProfileRequest
) => {
  const response = await apiClient.put("/api/v1/users/profile/initial", data);
  return response.data;
};

export const updateUserProfile = async (data: UpdateUserProfileRequest) => {
  const response = await apiClient.patch("/api/v1/users/profile", data);
  return response.data;
};