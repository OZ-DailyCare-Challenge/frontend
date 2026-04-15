"use client";

import { useEffect, useState } from "react";
import AppShell from "@/src/components/AppShell";
import DietResultScreen from "@/src/components/DietResultScreen";
import { normalizeMealResult } from "@/src/utils/mealResult";
import type { StoredDietResult } from "@/src/types/meals";

export default function DietAnalysisResultPage() {
  const [data, setData] = useState<StoredDietResult | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("diet-analysis-result");
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored) as StoredDietResult;

      setData({
        mode: parsed.mode,
        image: parsed.image,
        result: normalizeMealResult(parsed.result),
      });
    } catch (error) {
      console.error("식단 분석 결과 파싱 실패:", error);
      setData(null);
    }
  }, []);

  return (
    <AppShell>
      {data ? (
        <DietResultScreen
          mode={data.mode}
          image={data.image}
          result={data.result}
        />
      ) : (
        <div className="mx-auto flex min-h-[60vh] w-full max-w-4xl items-center justify-center rounded-[28px] border border-[#163126]/8 bg-white/80 px-6 py-12 text-center text-[#163126]/60">
          식단 분석 결과가 없어요. 먼저 이미지를 업로드해주세요.
        </div>
      )}
    </AppShell>
  );
}