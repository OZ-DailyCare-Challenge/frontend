export type HealthMission = {
  title?: string;
  action?: string;
  reason?: string;
};

export type ChallengeCard = {
  id: string;
  category: string;
  title: string;
  description: string;
  durationText: string;
  successText: string;
  status: "progress" | "done" | "locked";
  aiRecommended?: boolean;
  source?: "base" | "ai";
};

function normalize(text: string) {
  return text.replace(/\s+/g, "").toLowerCase();
}

function detectCategory(title: string, action: string) {
  const joined = `${title} ${action}`;

  if (
    joined.includes("걷기") ||
    joined.includes("운동") ||
    joined.includes("유산소") ||
    joined.includes("달리기") ||
    joined.includes("보")
  ) {
    return "운동";
  }

  return "식습관";
}

export function mapHealthMissionsToChallengeCards(
  missions: HealthMission[]
): ChallengeCard[] {
  return missions.map((mission, index) => {
    const title = mission.title?.trim() || `AI 추천 미션 ${index + 1}`;
    const action = mission.action?.trim() || "건강한 습관을 실천해보세요.";
    const reason = mission.reason?.trim() || "건강 관리를 위해 추천되는 미션입니다.";

    return {
      id: `ai-mission-${index}-${normalize(title)}`,
      category: detectCategory(title, action),
      title,
      description: action,
      durationText: "7일 챌린지",
      successText: "0/7 성공",
      status: "progress",
      aiRecommended: true,
      source: "ai",
    };
  });
}

export function mergeAiChallenges(
  baseChallenges: ChallengeCard[],
  aiChallenges: ChallengeCard[]
): ChallengeCard[] {
  const usedBaseIds = new Set<string>();
  const merged: ChallengeCard[] = [];

  for (const ai of aiChallenges) {
    const aiTitle = normalize(ai.title);

    const matchedBase = baseChallenges.find((base) => {
      const baseTitle = normalize(base.title);
      return (
        baseTitle.includes(aiTitle) ||
        aiTitle.includes(baseTitle) ||
        (aiTitle.includes("저염") && baseTitle.includes("저염")) ||
        (aiTitle.includes("금주") && baseTitle.includes("금주")) ||
        (aiTitle.includes("포화지방") && baseTitle.includes("포화지방"))
      );
    });

    if (matchedBase) {
      merged.push({
        ...matchedBase,
        aiRecommended: true,
        source: "base",
      });
      usedBaseIds.add(matchedBase.id);
    } else {
      merged.push(ai);
    }
  }

  const remainingBase = baseChallenges.filter((item) => !usedBaseIds.has(item.id));

  return [...merged, ...remainingBase];
}