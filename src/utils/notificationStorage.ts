const NOTIFICATION_KEY = "notification-settings";

export type NotificationConfig = {
  challengeAlert: boolean;
  friendCheerAlert: boolean;
};

const defaults: NotificationConfig = {
  challengeAlert: true,
  friendCheerAlert: true,
};

export const notificationStorage = {
  get(): NotificationConfig {
    if (typeof window === "undefined") return defaults;
    try {
      const raw = localStorage.getItem(NOTIFICATION_KEY);
      if (!raw) return defaults;
      return { ...defaults, ...JSON.parse(raw) };
    } catch {
      return defaults;
    }
  },

  set(config: NotificationConfig): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(config));
  },

  isChallengeAlertOn(): boolean {
    return this.get().challengeAlert;
  },

  isFriendAlertOn(): boolean {
    return this.get().friendCheerAlert;
  },
};
