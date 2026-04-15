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

export const guestAnalysisStorage = {
  setTaskId(taskId: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem(TASK_ID_KEY, taskId);
  },

  getTaskId(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TASK_ID_KEY);
  },

  clearTaskId() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TASK_ID_KEY);
  },

  setResult(result: unknown) {
    if (typeof window === "undefined") return;
    localStorage.setItem(RESULT_KEY, JSON.stringify(result));
  },

  getResult<T = unknown>(): T | null {
    if (typeof window === "undefined") return null;

    const raw = localStorage.getItem(RESULT_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  clearResult() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(RESULT_KEY);
  },

  setPendingFlow(flow: GuestPendingFlow) {
    if (typeof window === "undefined") return;
    localStorage.setItem(PENDING_FLOW_KEY, JSON.stringify(flow));
  },

  getPendingFlow<T = GuestPendingFlow>(): T | null {
    if (typeof window === "undefined") return null;

    const raw = localStorage.getItem(PENDING_FLOW_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  clearPendingFlow() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(PENDING_FLOW_KEY);
  },

  setPostLoginRedirect(path: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem(POST_LOGIN_REDIRECT_KEY, path);
  },

  getPostLoginRedirect(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(POST_LOGIN_REDIRECT_KEY);
  },

  clearPostLoginRedirect() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
  },

  setMigrationNeeded(value: boolean) {
    if (typeof window === "undefined") return;
    localStorage.setItem(MIGRATION_NEEDED_KEY, value ? "true" : "false");
  },

  isMigrationNeeded(): boolean {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(MIGRATION_NEEDED_KEY) === "true";
  },

  clearMigrationNeeded() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(MIGRATION_NEEDED_KEY);
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