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

export const storage = {
  getUser(): UserInfo | null {
    if (typeof window === "undefined") return null;

    const raw = localStorage.getItem("user");
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

    localStorage.setItem("user", JSON.stringify(normalizedUser));
  },

  clearUser() {
    if (typeof window === "undefined") return;
    localStorage.removeItem("user");
  },

  getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("access_token");
  },

  setAccessToken(token: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem("access_token", token);
  },

  removeAccessToken() {
    if (typeof window === "undefined") return;
    localStorage.removeItem("access_token");
  },

  clearAccessToken() {
    if (typeof window === "undefined") return;
    localStorage.removeItem("access_token");
  },

  getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("refresh_token");
  },

  setRefreshToken(token: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem("refresh_token", token);
  },

  removeRefreshToken() {
    if (typeof window === "undefined") return;
    localStorage.removeItem("refresh_token");
  },

  clearRefreshToken() {
    if (typeof window === "undefined") return;
    localStorage.removeItem("refresh_token");
  },

  getPostLoginRedirectPath(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("post_login_redirect_path");
  },

  setPostLoginRedirectPath(path: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem("post_login_redirect_path", path);
  },

  clearPostLoginRedirectPath() {
    if (typeof window === "undefined") return;
    localStorage.removeItem("post_login_redirect_path");
  },

  clearHealthFlow() {
    if (typeof window === "undefined") return;
    localStorage.removeItem("health_flow");
  },

  clearGuestFlow() {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem("guest-profile");
    sessionStorage.removeItem("health-analysis-result");
    sessionStorage.removeItem("diet-analysis-result");
    sessionStorage.removeItem("health-ai-missions");
    sessionStorage.removeItem("guest_analysis_result");
    sessionStorage.removeItem("guest_analysis_task_id");
  },

  clearAll() {
    if (typeof window === "undefined") return;

    localStorage.removeItem("user");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("post_login_redirect_path");
    localStorage.removeItem("health_flow");

    sessionStorage.removeItem("guest-profile");
    sessionStorage.removeItem("health-analysis-result");
    sessionStorage.removeItem("diet-analysis-result");
    sessionStorage.removeItem("health-ai-missions");
    sessionStorage.removeItem("guest_analysis_result");
    sessionStorage.removeItem("guest_analysis_task_id");
    sessionStorage.removeItem("health-flow-complete");
    sessionStorage.removeItem("health-analysis-task");
  },

  logout() {
    if (typeof window === "undefined") return;

    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    localStorage.removeItem("post_login_redirect_path");
    localStorage.removeItem("health_flow");

    sessionStorage.removeItem("guest-profile");
    sessionStorage.removeItem("health-analysis-result");
    sessionStorage.removeItem("diet-analysis-result");
    sessionStorage.removeItem("health-ai-missions");
    sessionStorage.removeItem("guest_analysis_result");
    sessionStorage.removeItem("guest_analysis_task_id");
    sessionStorage.removeItem("health-flow-complete");
    sessionStorage.removeItem("health-analysis-task");
  },
};