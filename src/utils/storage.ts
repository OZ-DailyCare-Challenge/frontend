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
  guestAnalysisResult: "guest_analysis_result",
  guestAnalysisTaskId: "guest_analysis_task_id",
} as const;

const SESSION_KEYS = {
  guestProfile: "guest-profile",
  healthAnalysisResult: "health-analysis-result",
  dietAnalysisResult: "diet-analysis-result",
  healthAiMissions: "health-ai-missions",
  healthFlowComplete: "health-flow-complete",
  healthAnalysisTask: "health-analysis-task",
} as const;

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

    localStorage.removeItem(LOCAL_KEYS.healthFlow);
    sessionStorage.removeItem(SESSION_KEYS.healthFlowComplete);
    sessionStorage.removeItem(SESSION_KEYS.healthAnalysisTask);
    sessionStorage.removeItem(SESSION_KEYS.healthAnalysisResult);
    sessionStorage.removeItem(SESSION_KEYS.healthAiMissions);
  },

  clearGuestFlow() {
    if (typeof window === "undefined") return;

    sessionStorage.removeItem(SESSION_KEYS.guestProfile);
    sessionStorage.removeItem(SESSION_KEYS.healthAnalysisResult);
    sessionStorage.removeItem(SESSION_KEYS.dietAnalysisResult);
    sessionStorage.removeItem(SESSION_KEYS.healthAiMissions);
    sessionStorage.removeItem(SESSION_KEYS.healthFlowComplete);
    sessionStorage.removeItem(SESSION_KEYS.healthAnalysisTask);

    localStorage.removeItem(LOCAL_KEYS.guestAnalysisResult);
    localStorage.removeItem(LOCAL_KEYS.guestAnalysisTaskId);
  },

  clearAll() {
    if (typeof window === "undefined") return;

    localStorage.removeItem(LOCAL_KEYS.user);
    localStorage.removeItem(LOCAL_KEYS.accessToken);
    localStorage.removeItem(LOCAL_KEYS.refreshToken);
    localStorage.removeItem(LOCAL_KEYS.postLoginRedirectPath);
    localStorage.removeItem(LOCAL_KEYS.healthFlow);
    localStorage.removeItem(LOCAL_KEYS.accessSnapshot);
    localStorage.removeItem(LOCAL_KEYS.guestAnalysisResult);
    localStorage.removeItem(LOCAL_KEYS.guestAnalysisTaskId);

    sessionStorage.removeItem(SESSION_KEYS.guestProfile);
    sessionStorage.removeItem(SESSION_KEYS.healthAnalysisResult);
    sessionStorage.removeItem(SESSION_KEYS.dietAnalysisResult);
    sessionStorage.removeItem(SESSION_KEYS.healthAiMissions);
    sessionStorage.removeItem(SESSION_KEYS.healthFlowComplete);
    sessionStorage.removeItem(SESSION_KEYS.healthAnalysisTask);
  },

  logout() {
    if (typeof window === "undefined") return;

    localStorage.removeItem(LOCAL_KEYS.accessToken);
    localStorage.removeItem(LOCAL_KEYS.refreshToken);
    localStorage.removeItem(LOCAL_KEYS.user);
    localStorage.removeItem(LOCAL_KEYS.postLoginRedirectPath);
    localStorage.removeItem(LOCAL_KEYS.healthFlow);
    localStorage.removeItem(LOCAL_KEYS.accessSnapshot);
    localStorage.removeItem(LOCAL_KEYS.guestAnalysisResult);
    localStorage.removeItem(LOCAL_KEYS.guestAnalysisTaskId);

    sessionStorage.removeItem(SESSION_KEYS.guestProfile);
    sessionStorage.removeItem(SESSION_KEYS.healthAnalysisResult);
    sessionStorage.removeItem(SESSION_KEYS.dietAnalysisResult);
    sessionStorage.removeItem(SESSION_KEYS.healthAiMissions);
    sessionStorage.removeItem(SESSION_KEYS.healthFlowComplete);
    sessionStorage.removeItem(SESSION_KEYS.healthAnalysisTask);
  },
};