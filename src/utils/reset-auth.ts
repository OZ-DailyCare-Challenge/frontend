import { storage } from "@/src/utils/storage";

export function resetClientAuthState(): void {
  storage.clearUser();
  storage.clearAccessToken();
  storage.clearRefreshToken();
  storage.clearAccessSnapshot();
  storage.clearHealthFlow();
  storage.clearGuestFlow();

  localStorage.removeItem("myhealthbuddy-challenge-store");
  sessionStorage.removeItem("health-ai-missions");
}