import { storage } from "@/src/utils/storage";

export function resetClientAuthState(): void {
  storage.clearUser();
  storage.clearAccessToken();
  storage.clearRefreshToken();
  storage.clearAccessSnapshot();
  storage.clearHealthFlow();
  storage.clearGuestFlow();

  localStorage.removeItem("myhealthbuddy-challenge-store");
  Object.keys(localStorage)
    .filter((key) => key.startsWith("challenge-list-cache:"))
    .forEach((key) => localStorage.removeItem(key));
  sessionStorage.removeItem("health-ai-missions");
}
