import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { initialChallenges, type Challenge } from "@/src/lib/challenge-data";

type ChallengeStore = {
  challenges: Challenge[];
  streak: number;
  hydrated: boolean;
  startChallenge: (id: number) => void;
  restartChallenge: (id: number) => void;
  submitCheck: (id: number, value: boolean) => void;
  submitNumber: (id: number, value: number) => void;
  submitPhoto: (id: number) => void;
  resetChallenges: () => void;
  setHydrated: (value: boolean) => void;
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function calcTotalStreak(challenges: Challenge[]) {
  return challenges.reduce((acc, challenge) => {
    const successCount = challenge.logs.filter((v) => v === true).length;
    return acc + successCount;
  }, 0);
}

function writeLog(challenge: Challenge, success: boolean): Challenge {
  if (challenge.lastSubmittedDate === todayKey()) return challenge;

  const currentIndex = challenge.logs.findIndex((v) => v === null);
  if (currentIndex === -1) return challenge;

  const nextLogs = [...challenge.logs];
  nextLogs[currentIndex] = success;

  const successCount = nextLogs.filter((v) => v === true).length;
  const filledCount = nextLogs.filter((v) => v !== null).length;
  const isDone = successCount >= challenge.completionWindow;

  return {
    ...challenge,
    logs: nextLogs,
    currentDay: Math.min(filledCount + 1, challenge.durationDays),
    status: isDone ? "done" : "in_progress",
    lastSubmittedDate: todayKey(),
  };
}

function safeStorage() {
  if (typeof window === "undefined") {
    return {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
    };
  }

  return localStorage;
}

export const useChallengeStore = create<ChallengeStore>()(
  persist(
    (set) => ({
      challenges: initialChallenges,
      streak: calcTotalStreak(initialChallenges),
      hydrated: false,

      setHydrated: (value: boolean) => set({ hydrated: value }),

      resetChallenges: () =>
        set({
          challenges: initialChallenges,
          streak: calcTotalStreak(initialChallenges),
        }),

      startChallenge: (id: number) =>
        set((state) => {
          const updatedChallenges: Challenge[] = state.challenges.map(
            (challenge) =>
              challenge.id === id && challenge.status === "locked"
                ? {
                    ...challenge,
                    status: "in_progress" as const,
                  }
                : challenge
          );

          return {
            challenges: updatedChallenges,
            streak: calcTotalStreak(updatedChallenges),
          };
        }),

      restartChallenge: (id: number) =>
        set((state) => {
          const updatedChallenges: Challenge[] = state.challenges.map(
            (challenge) =>
              challenge.id === id && challenge.status === "done"
                ? {
                    ...challenge,
                    logs: Array<boolean | null>(challenge.durationDays).fill(
                      null
                    ),
                    currentDay: 1,
                    status: "in_progress" as const,
                    lastSubmittedDate: null,
                  }
                : challenge
          );

          return {
            challenges: updatedChallenges,
            streak: calcTotalStreak(updatedChallenges),
          };
        }),

      submitCheck: (id: number, value: boolean) =>
        set((state) => {
          const updatedChallenges: Challenge[] = state.challenges.map(
            (challenge) =>
              challenge.id === id ? writeLog(challenge, value) : challenge
          );

          return {
            challenges: updatedChallenges,
            streak: calcTotalStreak(updatedChallenges),
          };
        }),

      submitNumber: (id: number, value: number) =>
        set((state) => {
          const success = value === 0;

          const updatedChallenges: Challenge[] = state.challenges.map(
            (challenge) =>
              challenge.id === id ? writeLog(challenge, success) : challenge
          );

          return {
            challenges: updatedChallenges,
            streak: calcTotalStreak(updatedChallenges),
          };
        }),

      submitPhoto: (id: number) =>
        set((state) => {
          const updatedChallenges: Challenge[] = state.challenges.map(
            (challenge) =>
              challenge.id === id ? writeLog(challenge, true) : challenge
          );

          return {
            challenges: updatedChallenges,
            streak: calcTotalStreak(updatedChallenges),
          };
        }),
    }),
    {
      name: "myhealthbuddy-challenge-store",
      storage: createJSONStorage(safeStorage),
      partialize: (state) => ({
        challenges: state.challenges,
        streak: state.streak,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);