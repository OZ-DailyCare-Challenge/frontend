import { storage } from "@/src/utils/storage";
import { clearHealthFlowSession } from "@/src/utils/health-flow";

export function resetClientAuthState() {
  storage.clearUser?.();
  storage.removeAccessToken?.();
  storage.removeRefreshToken?.();
  storage.clearHealthFlow?.();

  clearHealthFlowSession();

  localStorage.removeItem("myhealthbuddy-challenge-store");
  sessionStorage.removeItem("health-ai-missions");
}