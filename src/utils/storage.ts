import type { User } from "../types/auth";

const ACCESS_TOKEN_KEY = "accessToken";
const USER_KEY = "user";
const HEALTH_DATA_KEY = "healthData";
const HEALTH_RECORD_ID_KEY = "latestHealthRecordId";
const ANALYSIS_TASK_ID_KEY = "latestHealthAnalysisTaskId";
const POST_LOGIN_REDIRECT_KEY = "postLoginRedirectPath";

export type HealthData = {
  nickname?: string;
  birth_year?: number | string;
  gender?: string;
  height?: number | string;
  weight?: number | string;
  systolic?: number | string;
  diastolic?: number | string;
  glucose?: number | string;
  cholesterol?: number | string;
  smoking?: boolean | null;
  drinking?: boolean | null;
  exercise?: boolean | null;
  smokingFrequency?: string | null;
  drinkingFrequency?: string | null;
  exerciseFrequency?: string | null;
};

export const storage = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),

  setAccessToken: (token: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },

  removeAccessToken: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  },

  getUser: (): User | null => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  setUser: (user: User) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  removeUser: () => {
    localStorage.removeItem(USER_KEY);
  },

  getHealthData: (): HealthData | null => {
    const raw = localStorage.getItem(HEALTH_DATA_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  setHealthData: (data: HealthData) => {
    localStorage.setItem(HEALTH_DATA_KEY, JSON.stringify(data));
  },

  removeHealthData: () => {
    localStorage.removeItem(HEALTH_DATA_KEY);
  },

  getHealthRecordId: () => localStorage.getItem(HEALTH_RECORD_ID_KEY),

  setHealthRecordId: (recordId: string | number) => {
    localStorage.setItem(HEALTH_RECORD_ID_KEY, String(recordId));
  },

  removeHealthRecordId: () => {
    localStorage.removeItem(HEALTH_RECORD_ID_KEY);
  },

  getAnalysisTaskId: () => localStorage.getItem(ANALYSIS_TASK_ID_KEY),

  setAnalysisTaskId: (taskId: string | number) => {
    localStorage.setItem(ANALYSIS_TASK_ID_KEY, String(taskId));
  },

  removeAnalysisTaskId: () => {
    localStorage.removeItem(ANALYSIS_TASK_ID_KEY);
  },

  getPostLoginRedirectPath: () =>
    localStorage.getItem(POST_LOGIN_REDIRECT_KEY),

  setPostLoginRedirectPath: (path: string) => {
    localStorage.setItem(POST_LOGIN_REDIRECT_KEY, path);
  },

  clearPostLoginRedirectPath: () => {
    localStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
  },

  isLoggedIn: () => {
    return !!localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  hasHealthInput: () => {
    return !!localStorage.getItem(HEALTH_DATA_KEY);
  },

  hasAnalysisResult: () => {
    return !!localStorage.getItem(ANALYSIS_TASK_ID_KEY);
  },

  getDisplayName: () => {
    const user = storage.getUser();
    const healthData = storage.getHealthData();

    return user?.nickname || user?.name || healthData?.nickname || "회원";
  },

  clearAuth: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
  },

  clearHealthFlow: () => {
    localStorage.removeItem(HEALTH_DATA_KEY);
    localStorage.removeItem(HEALTH_RECORD_ID_KEY);
    localStorage.removeItem(ANALYSIS_TASK_ID_KEY);
  },
};