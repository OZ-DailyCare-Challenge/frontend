const TASK_ID_KEY = "guest_analysis_task_id";
const RESULT_KEY = "guest_analysis_result";
const PENDING_FLOW_KEY = "guest_analysis_pending_flow";
const POST_LOGIN_REDIRECT_KEY = "guest_post_login_redirect";
const MIGRATION_NEEDED_KEY = "guest_migration_needed";

export type GuestStoredHealthPayload = {
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

export type GuestStoredAnalysisPayload = {
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

export type GuestPendingFlow = {
  nickname: string;
  birthYear: number;
  gender: "M" | "F";
  healthPayload: GuestStoredHealthPayload;
  guestAnalysisPayload: GuestStoredAnalysisPayload;
};

function safeLocalSet(key: string, value: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, value);
}

function safeLocalGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(key);
}

function safeLocalRemove(key: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(key);
}

export const guestAnalysisStorage = {
  setTaskId(taskId: string) {
    safeLocalSet(TASK_ID_KEY, taskId);
  },

  getTaskId(): string | null {
    return safeLocalGet(TASK_ID_KEY);
  },

  clearTaskId() {
    safeLocalRemove(TASK_ID_KEY);
  },

  setResult(result: unknown) {
    safeLocalSet(RESULT_KEY, JSON.stringify(result));
  },

  getResult<T = unknown>(): T | null {
    const raw = safeLocalGet(RESULT_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as T;
    } catch (error) {
      console.error("guest_analysis_result 파싱 실패:", error);
      return null;
    }
  },

  clearResult() {
    safeLocalRemove(RESULT_KEY);
  },

  setPendingFlow(flow: GuestPendingFlow) {
    safeLocalSet(PENDING_FLOW_KEY, JSON.stringify(flow));
  },

  getPendingFlow<T = GuestPendingFlow>(): T | null {
    const raw = safeLocalGet(PENDING_FLOW_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as T;
    } catch (error) {
      console.error("guest_analysis_pending_flow 파싱 실패:", error);
      return null;
    }
  },

  clearPendingFlow() {
    safeLocalRemove(PENDING_FLOW_KEY);
  },

  setPostLoginRedirect(path: string) {
    safeLocalSet(POST_LOGIN_REDIRECT_KEY, path);
  },

  getPostLoginRedirect(): string | null {
    return safeLocalGet(POST_LOGIN_REDIRECT_KEY);
  },

  clearPostLoginRedirect() {
    safeLocalRemove(POST_LOGIN_REDIRECT_KEY);
  },

  setMigrationNeeded(value: boolean) {
    safeLocalSet(MIGRATION_NEEDED_KEY, value ? "true" : "false");
  },

  isMigrationNeeded(): boolean {
    return safeLocalGet(MIGRATION_NEEDED_KEY) === "true";
  },

  clearMigrationNeeded() {
    safeLocalRemove(MIGRATION_NEEDED_KEY);
  },

  clearGuestFlowMeta() {
    this.clearPendingFlow();
    this.clearPostLoginRedirect();
    this.clearMigrationNeeded();
  },

  clearAll() {
    this.clearTaskId();
    this.clearResult();
    this.clearGuestFlowMeta();
  },
};