const TASK_ID_KEY = "guest_analysis_task_id";
const RESULT_KEY = "guest_analysis_result";

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

  clearAll() {
    this.clearTaskId();
    this.clearResult();
  },
};