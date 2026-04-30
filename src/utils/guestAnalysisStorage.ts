const TASK_ID_KEY = "guest_analysis_task_id";
const RESULT_KEY = "guest_analysis_result";
const PENDING_FLOW_KEY = "guest_analysis_pending_flow";
const POST_LOGIN_REDIRECT_KEY = "guest_post_login_redirect";
const MIGRATION_NEEDED_KEY = "guest_migration_needed";
const LEGACY_CHALLENGE_STORE_KEY = "myhealthbuddy-challenge-store";

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

function getLegacyGuestState(): Record<string, unknown> | null {
  const raw = safeLocalGet(LEGACY_CHALLENGE_STORE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as { state?: Record<string, unknown> };
    return parsed?.state ?? null;
  } catch {
    return null;
  }
}

function clearLegacyGuestState() {
  const raw = safeLocalGet(LEGACY_CHALLENGE_STORE_KEY);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw) as { state?: Record<string, unknown> };
    if (!parsed?.state) return;

    delete parsed.state.guest_analysis_task_id;
    delete parsed.state.guest_analysis_result;
    delete parsed.state.guest_analysis_pending_flow;
    delete parsed.state.pending_flow;
    delete parsed.state.guest_migration_needed;
    delete parsed.state.guest_post_login_redirect;

    safeLocalSet(LEGACY_CHALLENGE_STORE_KEY, JSON.stringify(parsed));
  } catch {
    // Ignore malformed legacy persisted state.
  }
}

function parseMaybeJson<T>(value: unknown): T | null {
  if (!value) return null;

  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  }

  return value as T;
}

export const guestAnalysisStorage = {
  setTaskId(taskId: string) {
    safeLocalSet(TASK_ID_KEY, taskId);
  },

  getTaskId(): string | null {
    return (
      safeLocalGet(TASK_ID_KEY) ??
      (getLegacyGuestState()?.guest_analysis_task_id as string | undefined) ??
      null
    );
  },

  clearTaskId() {
    safeLocalRemove(TASK_ID_KEY);
  },

  setResult(result: unknown) {
    safeLocalSet(RESULT_KEY, JSON.stringify(result));
  },

  getResult<T = unknown>(): T | null {
    const raw = safeLocalGet(RESULT_KEY);
    if (raw) {
      try {
        return JSON.parse(raw) as T;
      } catch (error) {
        console.error("guest_analysis_result 파싱 실패:", error);
      }
    }

    return parseMaybeJson<T>(getLegacyGuestState()?.guest_analysis_result);
  },

  clearResult() {
    safeLocalRemove(RESULT_KEY);
  },

  setPendingFlow(flow: GuestPendingFlow) {
    safeLocalSet(PENDING_FLOW_KEY, JSON.stringify(flow));
  },

  getPendingFlow<T = GuestPendingFlow>(): T | null {
    const raw = safeLocalGet(PENDING_FLOW_KEY);
    if (raw) {
      try {
        return JSON.parse(raw) as T;
      } catch (error) {
        console.error("guest_analysis_pending_flow 파싱 실패:", error);
      }
    }

    const legacyState = getLegacyGuestState();
    return (
      parseMaybeJson<T>(legacyState?.pending_flow) ??
      parseMaybeJson<T>(legacyState?.guest_analysis_pending_flow)
    );
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
    const officialValue = safeLocalGet(MIGRATION_NEEDED_KEY);
    if (officialValue) return officialValue === "true";

    const legacyState = getLegacyGuestState();
    const legacyValue = legacyState?.guest_migration_needed;

    if (legacyValue === true || legacyValue === "true") return true;

    return Boolean(
      (legacyState?.pending_flow || legacyState?.guest_analysis_pending_flow) &&
        legacyState?.guest_analysis_task_id
    );
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
    clearLegacyGuestState();
  },
};
