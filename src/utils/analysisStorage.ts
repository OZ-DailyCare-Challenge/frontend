const LOGIN_TASK_KEY = "health-analysis-task";
const LOGIN_RESULT_KEY = "health-analysis-result";

export type LoginAnalysisTaskStore = {
  taskId?: string;
  recordId?: number;
};

export const analysisStorage = {
  setTaskStore(value: LoginAnalysisTaskStore) {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(LOGIN_TASK_KEY, JSON.stringify(value));
  },

  getTaskStore(): LoginAnalysisTaskStore | null {
    if (typeof window === "undefined") return null;

    const raw = sessionStorage.getItem(LOGIN_TASK_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as LoginAnalysisTaskStore;
    } catch {
      return null;
    }
  },

  clearTaskStore() {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem(LOGIN_TASK_KEY);
  },

  setResult(result: unknown) {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(LOGIN_RESULT_KEY, JSON.stringify(result));
  },

  getResult<T = unknown>(): T | null {
    if (typeof window === "undefined") return null;

    const raw = sessionStorage.getItem(LOGIN_RESULT_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  clearResult() {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem(LOGIN_RESULT_KEY);
  },

  clearAll() {
    this.clearTaskStore();
    this.clearResult();
  },
};