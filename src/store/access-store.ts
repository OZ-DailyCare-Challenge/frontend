"use client";

import { create } from "zustand";
import { getHealthRecords } from "@/src/api/health";
import { getAnalysisHistory } from "@/src/api/analysis";
import {
  storage,
  type UserInfo,
  type UserAccessSnapshot,
} from "@/src/utils/storage";
import {
  clearHealthFlowComplete,
  markHealthFlowComplete,
  syncHealthFlowComplete,
} from "@/src/utils/health-flow";

export type AccessLevel =
  | "guest"
  | "member_profile_only"
  | "member_done";

type ApplyLoginPayload = {
  accessToken: string;
  refreshToken?: string | null;
  user?: UserInfo | null;
  hasHealthRecord?: boolean | null;
  hasHealthAnalysis?: boolean | null;
};

type AccessStore = {
  hydrated: boolean;
  accessLevel: AccessLevel;
  isGuestSession: boolean;
  displayName: string;
  profileImage: string;
  user: UserInfo | null;
  hasHealthRecord: boolean;
  hasHealthAnalysis: boolean;

  initialize: () => Promise<void>;
  setGuestSession: (guestUser?: UserInfo | null) => void;
  applyLogin: (payload: ApplyLoginPayload) => Promise<void>;
  syncAccessFromServer: () => Promise<void>;
  markAnalysisComplete: (user?: UserInfo | null) => void;
  setMemberProfileOnly: (user?: UserInfo | null) => void;
  clearClientSession: () => void;
};

function buildAccessLevel(
  hasHealthRecord: boolean,
  hasHealthAnalysis: boolean
): AccessLevel {
  if (hasHealthRecord && hasHealthAnalysis) {
    return "member_done";
  }

  return "member_profile_only";
}

function normalizeProfile(user: UserInfo | null) {
  return {
    displayName: user?.nickname || user?.name || "버디",
    profileImage: user?.profile_image || user?.picture || "",
  };
}

function extractHasHealthRecord(recordsRes: unknown): boolean {
  if (Array.isArray(recordsRes)) return recordsRes.length > 0;

  if (
    recordsRes &&
    typeof recordsRes === "object" &&
    Array.isArray((recordsRes as { records?: unknown[] }).records)
  ) {
    return ((recordsRes as { records?: unknown[] }).records?.length ?? 0) > 0;
  }

  return false;
}

function extractHasHealthAnalysis(analysisRes: unknown): boolean {
  if (
    analysisRes &&
    typeof analysisRes === "object" &&
    Array.isArray((analysisRes as { items?: unknown[] }).items)
  ) {
    return ((analysisRes as { items?: unknown[] }).items?.length ?? 0) > 0;
  }

  return false;
}

function saveAccessSnapshot(snapshot: UserAccessSnapshot) {
  storage.setAccessSnapshot(snapshot);
}

function applyHealthFlowBySnapshot(snapshot: {
  hasHealthRecord: boolean;
  hasHealthAnalysis: boolean;
}) {
  const completed = syncHealthFlowComplete({
    hasHealthRecord: snapshot.hasHealthRecord,
    hasAnalysisHistory: snapshot.hasHealthAnalysis,
  });

  if (!completed) {
    clearHealthFlowComplete();
  }
}

export const useAccessStore = create<AccessStore>((set, get) => ({
  hydrated: false,
  accessLevel: "guest",
  isGuestSession: false,
  displayName: "버디",
  profileImage: "",
  user: null,
  hasHealthRecord: false,
  hasHealthAnalysis: false,

  initialize: async () => {
    const token = storage.getAccessToken();

    if (!token) {
      const guestUser = storage.getGuestProfile();
      const guestProfile = normalizeProfile(guestUser);

      set({
        hydrated: true,
        accessLevel: "guest",
        isGuestSession: true,
        displayName: guestProfile.displayName,
        profileImage: guestProfile.profileImage,
        user: null,
        hasHealthRecord: false,
        hasHealthAnalysis: false,
      });
      return;
    }

    const storedUser = storage.getUser();
    const profile = normalizeProfile(storedUser);
    const snapshot = storage.getAccessSnapshot();

    if (snapshot) {
      applyHealthFlowBySnapshot(snapshot);

      set({
        hydrated: true,
        accessLevel: buildAccessLevel(
          snapshot.hasHealthRecord,
          snapshot.hasHealthAnalysis
        ),
        isGuestSession: false,
        displayName: profile.displayName,
        profileImage: profile.profileImage,
        user: storedUser,
        hasHealthRecord: snapshot.hasHealthRecord,
        hasHealthAnalysis: snapshot.hasHealthAnalysis,
      });

      void get().syncAccessFromServer();
      return;
    }

    set({
      hydrated: true,
      accessLevel: "member_profile_only",
      isGuestSession: false,
      displayName: profile.displayName,
      profileImage: profile.profileImage,
      user: storedUser,
      hasHealthRecord: false,
      hasHealthAnalysis: false,
    });

    await get().syncAccessFromServer();
  },

  setGuestSession: (guestUser) => {
    if (guestUser) {
      storage.setGuestProfile(guestUser);
    }

    const resolvedGuest = guestUser ?? storage.getGuestProfile();
    const profile = normalizeProfile(resolvedGuest ?? null);

    clearHealthFlowComplete();

    set({
      hydrated: true,
      accessLevel: "guest",
      isGuestSession: true,
      displayName: profile.displayName,
      profileImage: profile.profileImage,
      user: null,
      hasHealthRecord: false,
      hasHealthAnalysis: false,
    });
  },

  applyLogin: async ({
    accessToken,
    refreshToken,
    user,
    hasHealthAnalysis,
    hasHealthRecord,
  }) => {
    storage.setAccessToken(accessToken);

    if (refreshToken) {
      storage.setRefreshToken(refreshToken);
    }

    if (user) {
      storage.setUser(user);
    }

    const resolvedUser = user ?? storage.getUser();
    const profile = normalizeProfile(resolvedUser ?? null);

    if (
      typeof hasHealthRecord === "boolean" &&
      typeof hasHealthAnalysis === "boolean"
    ) {
      const snapshot: UserAccessSnapshot = {
        hasHealthRecord,
        hasHealthAnalysis,
        accessLevel: buildAccessLevel(hasHealthRecord, hasHealthAnalysis),
      };

      saveAccessSnapshot(snapshot);
      applyHealthFlowBySnapshot(snapshot);

      set({
        hydrated: true,
        accessLevel: snapshot.accessLevel as AccessLevel,
        isGuestSession: false,
        displayName: profile.displayName,
        profileImage: profile.profileImage,
        user: resolvedUser,
        hasHealthRecord,
        hasHealthAnalysis,
      });

      return;
    }

    clearHealthFlowComplete();

    set({
      hydrated: true,
      accessLevel: "member_profile_only",
      isGuestSession: false,
      displayName: profile.displayName,
      profileImage: profile.profileImage,
      user: resolvedUser,
      hasHealthRecord: false,
      hasHealthAnalysis: false,
    });

    await get().syncAccessFromServer();
  },

  syncAccessFromServer: async () => {
    const token = storage.getAccessToken();

    if (!token) {
      get().setGuestSession();
      return;
    }

    try {
      const [recordsRes, analysisRes] = await Promise.all([
        getHealthRecords().catch(() => []),
        getAnalysisHistory().catch(() => ({ items: [] })),
      ]);

      const hasHealthRecord = extractHasHealthRecord(recordsRes);
      const hasHealthAnalysis = extractHasHealthAnalysis(analysisRes);

      const snapshot: UserAccessSnapshot = {
        hasHealthRecord,
        hasHealthAnalysis,
        accessLevel: buildAccessLevel(hasHealthRecord, hasHealthAnalysis),
      };

      saveAccessSnapshot(snapshot);
      applyHealthFlowBySnapshot(snapshot);

      const storedUser = storage.getUser();
      const profile = normalizeProfile(storedUser);

      set({
        hydrated: true,
        accessLevel: snapshot.accessLevel as AccessLevel,
        isGuestSession: false,
        displayName: profile.displayName,
        profileImage: profile.profileImage,
        user: storedUser,
        hasHealthRecord,
        hasHealthAnalysis,
      });
    } catch (error) {
      console.error("접근 상태 동기화 실패:", error);

      const storedUser = storage.getUser();
      const profile = normalizeProfile(storedUser);

      clearHealthFlowComplete();

      set({
        hydrated: true,
        accessLevel: "member_profile_only",
        isGuestSession: false,
        displayName: profile.displayName,
        profileImage: profile.profileImage,
        user: storedUser,
        hasHealthRecord: false,
        hasHealthAnalysis: false,
      });
    }
  },

  markAnalysisComplete: (user) => {
    if (user) {
      storage.setUser(user);
    }

    const resolvedUser = user ?? storage.getUser();
    const profile = normalizeProfile(resolvedUser ?? null);

    const snapshot: UserAccessSnapshot = {
      hasHealthRecord: true,
      hasHealthAnalysis: true,
      accessLevel: "member_done",
    };

    saveAccessSnapshot(snapshot);
    markHealthFlowComplete();

    set({
      hydrated: true,
      accessLevel: "member_done",
      isGuestSession: false,
      displayName: profile.displayName,
      profileImage: profile.profileImage,
      user: resolvedUser,
      hasHealthRecord: true,
      hasHealthAnalysis: true,
    });
  },

  setMemberProfileOnly: (user) => {
    if (user) {
      storage.setUser(user);
    }

    const resolvedUser = user ?? storage.getUser();
    const profile = normalizeProfile(resolvedUser ?? null);

    const snapshot: UserAccessSnapshot = {
      hasHealthRecord: false,
      hasHealthAnalysis: false,
      accessLevel: "member_profile_only",
    };

    saveAccessSnapshot(snapshot);
    clearHealthFlowComplete();

    set({
      hydrated: true,
      accessLevel: "member_profile_only",
      isGuestSession: false,
      displayName: profile.displayName,
      profileImage: profile.profileImage,
      user: resolvedUser,
      hasHealthRecord: false,
      hasHealthAnalysis: false,
    });
  },

  clearClientSession: () => {
    storage.logout();
    clearHealthFlowComplete();

    set({
      hydrated: true,
      accessLevel: "guest",
      isGuestSession: false,
      displayName: "버디",
      profileImage: "",
      user: null,
      hasHealthRecord: false,
      hasHealthAnalysis: false,
    });
  },
}));