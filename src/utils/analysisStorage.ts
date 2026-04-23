const LOGIN_TASK_KEY = "health-analysis-task";
const LOGIN_RESULT_KEY = "health-analysis-result";

export type LoginAnalysisTaskStore = {
  taskId?: string;
  recordId?: number;
};

function safeSessionSet(key: string, value: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(key, value);
}

function safeSessionGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(key);
}

function safeSessionRemove(key: string) {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(key);
}

export const analysisStorage = {
  setTaskStore(value: LoginAnalysisTaskStore) {
    safeSessionSet(LOGIN_TASK_KEY, JSON.stringify(value));
  },

  getTaskStore(): LoginAnalysisTaskStore | null {
    const raw = safeSessionGet(LOGIN_TASK_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as LoginAnalysisTaskStore;
    } catch (error) {
      console.error("health-analysis-task 파싱 실패:", error);
      return null;
    }
  },

  clearTaskStore() {
    safeSessionRemove(LOGIN_TASK_KEY);
  },

  setResult(result: unknown) {
    safeSessionSet(LOGIN_RESULT_KEY, JSON.stringify(result));
  },

  getResult<T = unknown>(): T | null {
    const raw = safeSessionGet(LOGIN_RESULT_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as T;
    } catch (error) {
      console.error("health-analysis-result 파싱 실패:", error);
      return null;
    }
  },

  clearResult() {
    safeSessionRemove(LOGIN_RESULT_KEY);
  },

  clearAll() {
    this.clearTaskStore();
    this.clearResult();
  },
};