import type { Challenge } from "@/src/lib/challenge-data";

export function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function getYesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function getChallengeCounts(challenges: Challenge[]) {
  return {
    all: challenges.length,
    in_progress: challenges.filter((c) => c.status === "in_progress").length,
    done: challenges.filter((c) => c.status === "done").length,
    locked: challenges.filter((c) => c.status === "locked").length,
  };
}

export function getTodayChecklistFromChallenges(challenges: Challenge[]) {
  return challenges
    .filter((c) => c.status === "in_progress")
    .slice(0, 4)
    .map((c) => {
      const todayIndex = Math.max(c.currentDay - 1, 0);
      const todayDone = c.logs[todayIndex] === true;

      return {
        id: c.id,
        label: c.title,
        done: todayDone,
      };
    });
}

export function getRecommendedChallenges(challenges: Challenge[]) {
  return challenges.filter((c) => c.recommended);
}