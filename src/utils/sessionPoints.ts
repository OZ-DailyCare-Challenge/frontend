const SESSION_POINT_KEY = "hamster-session-points";
const SESSION_POINT_EVENTS_KEY = "hamster-session-point-events";

export type SessionPointReason =
  | "challenge_check"
  | "challenge_photo"
  | "diet_premium"
  | "shop_purchase";

export type SessionPointEvent = {
  id: string;
  amount: number;
  reason: SessionPointReason;
  label: string;
  created_at: string;
};

function canUseSessionStorage() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

function readNumber(value: string | null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function readEvents(): SessionPointEvent[] {
  if (!canUseSessionStorage()) return [];

  try {
    const raw = window.sessionStorage.getItem(SESSION_POINT_EVENTS_KEY);
    return raw ? (JSON.parse(raw) as SessionPointEvent[]) : [];
  } catch {
    window.sessionStorage.removeItem(SESSION_POINT_EVENTS_KEY);
    return [];
  }
}

function writeEvents(events: SessionPointEvent[]) {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.setItem(
    SESSION_POINT_EVENTS_KEY,
    JSON.stringify(events.slice(-100))
  );
}

export const sessionPoints = {
  get() {
    if (!canUseSessionStorage()) return 0;
    return readNumber(window.sessionStorage.getItem(SESSION_POINT_KEY));
  },

  has() {
    if (!canUseSessionStorage()) return false;
    return window.sessionStorage.getItem(SESSION_POINT_KEY) !== null;
  },

  initialize(points: number) {
    const normalizedPoints = Number.isFinite(points) ? points : 0;
    if (!this.has() || readEvents().length === 0) {
      this.set(normalizedPoints);
    }
    return this.get();
  },

  set(points: number) {
    if (!canUseSessionStorage()) return;
    window.sessionStorage.setItem(
      SESSION_POINT_KEY,
      String(Number.isFinite(points) ? points : 0)
    );
  },

  add(amount: number, reason: SessionPointReason, label: string) {
    if (!canUseSessionStorage()) return this.get();

    const next = this.get() + amount;
    this.set(next);
    writeEvents([
      ...readEvents(),
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        amount,
        reason,
        label,
        created_at: new Date().toISOString(),
      },
    ]);
    window.dispatchEvent(new CustomEvent("session-points-change", { detail: next }));
    return next;
  },

  getEvents() {
    return readEvents();
  },

  clear() {
    if (!canUseSessionStorage()) return;
    window.sessionStorage.removeItem(SESSION_POINT_KEY);
    window.sessionStorage.removeItem(SESSION_POINT_EVENTS_KEY);
    window.dispatchEvent(new CustomEvent("session-points-change", { detail: 0 }));
  },
};
