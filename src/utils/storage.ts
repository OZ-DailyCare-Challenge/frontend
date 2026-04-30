export type UserInfo = {
  id?: number;
  email?: string;
  name?: string;
  nickname?: string;
  picture?: string;
  profile_image?: string;
  role?: string;
  gender?: string;
  age?: number;
  birth_year?: number;
  height?: number;
  weight?: number;
  current_point?: number;
  created_at?: string;
};

export type AccessLevel = "guest" | "member_profile_only" | "member_done";

export type UserAccessSnapshot = {
  hasHealthRecord: boolean;
  hasHealthAnalysis: boolean;
  accessLevel: AccessLevel;
};

const LOCAL_KEYS = {
  user: "user",
  accessToken: "access_token",
  refreshToken: "refresh_token",
  postLoginRedirectPath: "post_login_redirect_path",
  healthFlow: "health_flow",
  accessSnapshot: "user_access_snapshot",

  // guest analysis
  guestAnalysisResult: "guest_analysis_result",
  guestAnalysisTaskId: "guest_analysis_task_id",
  guestAnalysisPendingFlow: "guest_analysis_pending_flow",
  guestPostLoginRedirect: "guest_post_login_redirect",
  guestMigrationNeeded: "guest_migration_needed",
  guestHealthMigrationPayload: "guest-health-migration-payload",
} as const;

const SESSION_KEYS = {
  guestProfile: "guest-profile",
  healthAnalysisResult: "health-analysis-result",
  dietAnalysisResult: "diet-analysis-result",
  healthAiMissions: "health-ai-missions",
  healthFlowComplete: "health-flow-complete",
  healthAnalysisTask: "health-analysis-task",
} as const;

function removeLocalKeys(keys: string[]) {
  if (typeof window === "undefined") return;
  keys.forEach((key) => localStorage.removeItem(key));
}

function removeSessionKeys(keys: string[]) {
  if (typeof window === "undefined") return;
  keys.forEach((key) => sessionStorage.removeItem(key));
}

function removeLocalKeysByPrefix(prefix: string) {
  if (typeof window === "undefined") return;

  Object.keys(localStorage)
    .filter((key) => key.startsWith(prefix))
    .forEach((key) => localStorage.removeItem(key));
}

export const storage = {
  getUser(): UserInfo | null {
    if (typeof window === "undefined") return null;

    const raw = localStorage.getItem(LOCAL_KEYS.user);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw) as UserInfo;

      if (!parsed.profile_image && parsed.picture) {
        return {
          ...parsed,
          profile_image: parsed.picture,
        };
      }

      return parsed;
    } catch (error) {
      console.error("user 파싱 실패:", error);
      return null;
    }
  },

  setUser(user: UserInfo) {
    if (typeof window === "undefined") return;

    const prevUser = this.getUser() ?? {};

    const normalizedUser: UserInfo = {
      ...prevUser,
      ...user,
      profile_image:
        user.profile_image ??
        user.picture ??
        prevUser.profile_image ??
        prevUser.picture ??
        "",
    };

    localStorage.setItem(LOCAL_KEYS.user, JSON.stringify(normalizedUser));
  },

  clearUser() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(LOCAL_KEYS.user);
  },

  getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(LOCAL_KEYS.accessToken);
  },

  setAccessToken(token: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem(LOCAL_KEYS.accessToken, token);
  },

  removeAccessToken() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(LOCAL_KEYS.accessToken);
  },

  clearAccessToken() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(LOCAL_KEYS.accessToken);
  },

  getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(LOCAL_KEYS.refreshToken);
  },

  setRefreshToken(token: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem(LOCAL_KEYS.refreshToken, token);
  },

  removeRefreshToken() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(LOCAL_KEYS.refreshToken);
  },

  clearRefreshToken() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(LOCAL_KEYS.refreshToken);
  },

  getPostLoginRedirectPath(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(LOCAL_KEYS.postLoginRedirectPath);
  },

  setPostLoginRedirectPath(path: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem(LOCAL_KEYS.postLoginRedirectPath, path);
  },

  clearPostLoginRedirectPath() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(LOCAL_KEYS.postLoginRedirectPath);
  },

  getGuestProfile(): UserInfo | null {
    if (typeof window === "undefined") return null;

    const raw = sessionStorage.getItem(SESSION_KEYS.guestProfile);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw) as UserInfo;

      if (!parsed.profile_image && parsed.picture) {
        return {
          ...parsed,
          profile_image: parsed.picture,
        };
      }

      return parsed;
    } catch (error) {
      console.error("guest-profile 파싱 실패:", error);
      return null;
    }
  },

  setGuestProfile(user: UserInfo) {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(SESSION_KEYS.guestProfile, JSON.stringify(user));
  },

  clearGuestProfile() {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem(SESSION_KEYS.guestProfile);
  },

  getAccessSnapshot(): UserAccessSnapshot | null {
    if (typeof window === "undefined") return null;

    const raw = localStorage.getItem(LOCAL_KEYS.accessSnapshot);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as UserAccessSnapshot;
    } catch (error) {
      console.error("user_access_snapshot 파싱 실패:", error);
      return null;
    }
  },

  setAccessSnapshot(snapshot: UserAccessSnapshot) {
    if (typeof window === "undefined") return;
    localStorage.setItem(LOCAL_KEYS.accessSnapshot, JSON.stringify(snapshot));
  },

  clearAccessSnapshot() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(LOCAL_KEYS.accessSnapshot);
  },

  clearHealthFlow() {
    if (typeof window === "undefined") return;

    removeLocalKeys([LOCAL_KEYS.healthFlow]);

    removeSessionKeys([
      SESSION_KEYS.healthFlowComplete,
      SESSION_KEYS.healthAnalysisTask,
      SESSION_KEYS.healthAnalysisResult,
      SESSION_KEYS.healthAiMissions,
    ]);
  },

  clearGuestFlow() {
    if (typeof window === "undefined") return;

    removeSessionKeys([
      SESSION_KEYS.guestProfile,
      SESSION_KEYS.healthAnalysisResult,
      SESSION_KEYS.dietAnalysisResult,
      SESSION_KEYS.healthAiMissions,
      SESSION_KEYS.healthFlowComplete,
      SESSION_KEYS.healthAnalysisTask,
    ]);

    removeLocalKeys([
      LOCAL_KEYS.guestAnalysisResult,
      LOCAL_KEYS.guestAnalysisTaskId,
      LOCAL_KEYS.guestAnalysisPendingFlow,
      LOCAL_KEYS.guestPostLoginRedirect,
      LOCAL_KEYS.guestMigrationNeeded,
      LOCAL_KEYS.guestHealthMigrationPayload,
    ]);
  },

  clearAnalysisCache() {
    if (typeof window === "undefined") return;

    removeSessionKeys([
      SESSION_KEYS.healthAnalysisTask,
      SESSION_KEYS.healthAnalysisResult,
      SESSION_KEYS.healthAiMissions,
      SESSION_KEYS.healthFlowComplete,
    ]);

    removeLocalKeys([
      LOCAL_KEYS.guestAnalysisResult,
      LOCAL_KEYS.guestAnalysisTaskId,
    ]);
  },

  clearAll() {
    if (typeof window === "undefined") return;

    removeLocalKeys([
      LOCAL_KEYS.user,
      LOCAL_KEYS.accessToken,
      LOCAL_KEYS.refreshToken,
      LOCAL_KEYS.postLoginRedirectPath,
      LOCAL_KEYS.healthFlow,
      LOCAL_KEYS.accessSnapshot,
      LOCAL_KEYS.guestAnalysisResult,
      LOCAL_KEYS.guestAnalysisTaskId,
      LOCAL_KEYS.guestAnalysisPendingFlow,
      LOCAL_KEYS.guestPostLoginRedirect,
      LOCAL_KEYS.guestMigrationNeeded,
      LOCAL_KEYS.guestHealthMigrationPayload,
    ]);

    removeSessionKeys([
      SESSION_KEYS.guestProfile,
      SESSION_KEYS.healthAnalysisResult,
      SESSION_KEYS.dietAnalysisResult,
      SESSION_KEYS.healthAiMissions,
      SESSION_KEYS.healthFlowComplete,
      SESSION_KEYS.healthAnalysisTask,
    ]);
  },

  logout() {
    if (typeof window === "undefined") return;

    removeLocalKeys([
      LOCAL_KEYS.accessToken,
      LOCAL_KEYS.refreshToken,
      LOCAL_KEYS.user,
      LOCAL_KEYS.postLoginRedirectPath,
      LOCAL_KEYS.healthFlow,
      LOCAL_KEYS.accessSnapshot,
      LOCAL_KEYS.guestAnalysisResult,
      LOCAL_KEYS.guestAnalysisTaskId,
      LOCAL_KEYS.guestAnalysisPendingFlow,
      LOCAL_KEYS.guestPostLoginRedirect,
      LOCAL_KEYS.guestMigrationNeeded,
      LOCAL_KEYS.guestHealthMigrationPayload,
    ]);

    removeSessionKeys([
      SESSION_KEYS.guestProfile,
      SESSION_KEYS.healthAnalysisResult,
      SESSION_KEYS.dietAnalysisResult,
      SESSION_KEYS.healthAiMissions,
      SESSION_KEYS.healthFlowComplete,
      SESSION_KEYS.healthAnalysisTask,
    ]);
    removeLocalKeysByPrefix("challenge-list-cache:");
  },
};
