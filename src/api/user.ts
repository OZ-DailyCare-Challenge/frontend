import api from "./axios";
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

export const getDashboard = async () => {
  const response = await api.get<DashboardResponse>(ENDPOINTS.USERS.DASHBOARD);
  return response.data;
};