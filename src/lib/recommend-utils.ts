import type { Challenge } from "@/src/lib/challenge-data";

type HealthInput = {
  highBloodPressure?: boolean;
  smoker?: boolean;
  highGlucose?: boolean;
  overweight?: boolean;
};

export function applyChallengeRecommendations(
  challenges: Challenge[],
  input: HealthInput
) {
  return challenges.map((c) => {
    let recommended = false;

    if (input.highBloodPressure && ["저염식", "달리기 20분"].includes(c.title)) {
      recommended = true;
    }

    if (input.smoker && c.title === "금연(단계별)") {
      recommended = true;
    }

    if (input.highGlucose && ["당류 줄이기", "식후 15분 걷기"].includes(c.title)) {
      recommended = true;
    }

    if (input.overweight && c.title === "야식 금지") {
      recommended = true;
    }

    return { ...c, recommended };
  });
}