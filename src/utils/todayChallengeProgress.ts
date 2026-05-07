const TODAY_CHALLENGE_PROGRESS_KEY = "hamster-today-certified-challenges";
export const TODAY_CHALLENGE_PROGRESS_EVENT =
  "today-challenge-progress-change";

type TodayChallengeProgress = {
  date: string;
  userChallengeIds: number[];
};

function canUseSessionStorage() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function readProgress(): TodayChallengeProgress {
  const today = getTodayKey();

  if (!canUseSessionStorage()) {
    return { date: today, userChallengeIds: [] };
  }

  try {
    const raw = window.sessionStorage.getItem(TODAY_CHALLENGE_PROGRESS_KEY);
    const parsed = raw ? (JSON.parse(raw) as TodayChallengeProgress) : null;

    if (!parsed || parsed.date !== today || !Array.isArray(parsed.userChallengeIds)) {
      return { date: today, userChallengeIds: [] };
    }

    return {
      date: today,
      userChallengeIds: parsed.userChallengeIds.filter((id) => Number.isFinite(id)),
    };
  } catch {
    window.sessionStorage.removeItem(TODAY_CHALLENGE_PROGRESS_KEY);
    return { date: today, userChallengeIds: [] };
  }
}

function writeProgress(progress: TodayChallengeProgress) {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.setItem(
    TODAY_CHALLENGE_PROGRESS_KEY,
    JSON.stringify(progress)
  );
}

export const todayChallengeProgress = {
  getIds() {
    return new Set(readProgress().userChallengeIds);
  },

  markCertified(userChallengeId: number) {
    if (!Number.isFinite(userChallengeId)) return;

    const progress = readProgress();
    const ids = new Set(progress.userChallengeIds);
    ids.add(userChallengeId);
    writeProgress({
      date: progress.date,
      userChallengeIds: [...ids],
    });
    window.dispatchEvent(new CustomEvent(TODAY_CHALLENGE_PROGRESS_EVENT));
  },
};
