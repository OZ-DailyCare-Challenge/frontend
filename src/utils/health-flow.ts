import { storage } from "@/src/utils/storage";

const HEALTH_FLOW_COMPLETE_KEY = "health-flow-complete";

export function isHealthFlowComplete() {
  if (typeof window === "undefined") return false;

  const sessionComplete =
    sessionStorage.getItem(HEALTH_FLOW_COMPLETE_KEY) === "true";

  if (sessionComplete) {
    return true;
  }

  const snapshot = storage.getAccessSnapshot();
  return snapshot?.hasHealthRecord === true && snapshot?.hasHealthAnalysis === true;
}

export function markHealthFlowComplete() {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(HEALTH_FLOW_COMPLETE_KEY, "true");
}

export function clearHealthFlowComplete() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(HEALTH_FLOW_COMPLETE_KEY);
}

export function clearHealthFlowSession() {
  if (typeof window === "undefined") return;

  sessionStorage.removeItem(HEALTH_FLOW_COMPLETE_KEY);
  sessionStorage.removeItem("health-analysis-task");
  sessionStorage.removeItem("health-analysis-result");
  sessionStorage.removeItem("health-ai-missions");
}

export function syncHealthFlowComplete(options: {
  hasHealthRecord: boolean;
  hasAnalysisHistory: boolean;
}) {
  const { hasHealthRecord, hasAnalysisHistory } = options;

  if (hasHealthRecord && hasAnalysisHistory) {
    markHealthFlowComplete();
    return true;
  }

  clearHealthFlowComplete();
  return false;
}