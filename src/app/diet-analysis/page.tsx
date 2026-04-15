"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/src/components/AppShell";
import { Camera, Coins, Loader2, Sparkles, UploadCloud } from "lucide-react";
import type { MealAnalysisMode } from "@/src/types/meals";
import { requestMealAnalysis } from "@/src/api/meals";

type RequestMealAnalysisResponse = {
  task_id?: string;
  data?: {
    task_id?: string;
  };
  result?: {
    task_id?: string;
  };
};

type PendingMealAnalysis = {
  taskId: string;
  mode: MealAnalysisMode;
  image: string;
};

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("이미지 미리보기를 불러오지 못했어요."));
      }
    };

    reader.onerror = () => {
      reject(new Error("이미지 파일을 읽는 중 문제가 발생했어요."));
    };

    reader.readAsDataURL(file);
  });
}

export default function DietAnalysisPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loadingMode, setLoadingMode] = useState<MealAnalysisMode | null>(null);

  const hasImage = useMemo(() => Boolean(selectedFile && previewUrl), [selectedFile, previewUrl]);

  const handleOpenFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      alert("JPG, PNG 파일만 업로드할 수 있어요.");
      e.target.value = "";
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setSelectedFile(file);
      setPreviewUrl(dataUrl);
    } catch (error) {
      console.error("식단 이미지 미리보기 생성 실패:", error);
      alert("이미지를 불러오지 못했어요.");
    } finally {
      e.target.value = "";
    }
  };

  const savePendingAndMove = (
    taskId: string,
    mode: MealAnalysisMode,
    image: string
  ) => {
    const pending: PendingMealAnalysis = {
      taskId,
      mode,
      image,
    };

    sessionStorage.setItem("diet-analysis-pending", JSON.stringify(pending));
    router.push("/diet-analysis/analyzing");
  };

  const handleStartAnalysis = async (mode: MealAnalysisMode) => {
    if (!selectedFile || !previewUrl) {
      alert("먼저 식단 사진을 업로드해주세요.");
      return;
    }

    try {
      setLoadingMode(mode);

      const response: RequestMealAnalysisResponse =
        await requestMealAnalysis(selectedFile, mode);

      const taskId: string | undefined =
        response.task_id ??
        response.data?.task_id ??
        response.result?.task_id;

      if (!taskId) {
        console.error("식단 분석 응답:", response);
        throw new Error("식단 분석 task_id를 찾을 수 없어요.");
      }

      savePendingAndMove(taskId, mode, previewUrl);
    } catch (error) {
      console.error("식단 분석 요청 실패:", error);
      alert(
        mode === "premium"
          ? "프리미엄 식단 분석 요청에 실패했어요."
          : "무료 식단 분석 요청에 실패했어요."
      );
    } finally {
      setLoadingMode(null);
    }
  };

  return (
    <AppShell>
      <section className="mx-auto w-full max-w-6xl">
        <div className="rounded-[32px] border border-[#163126]/8 bg-white/82 p-6 shadow-[0_18px_50px_rgba(46,125,91,0.06)] backdrop-blur-xl md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#2E7D5B]">
            diet analysis
          </p>

          <h1 className="mt-3 text-3xl font-bold leading-tight text-[#163126] md:text-6xl">
            식단 분석
          </h1>

          <p className="mt-5 max-w-2xl text-sm leading-7 text-[#163126]/65 md:text-base">
            음식 사진을 업로드하고 영양 비율, 나트륨 수준, 식단 피드백을 확인해보세요.
          </p>

          <div className="mt-8 grid gap-6 xl:grid-cols-[1.05fr_1fr]">
            <div className="rounded-[28px] border border-[#163126]/8 bg-[#fbfcfb] p-6">
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png"
                className="hidden"
                onChange={handleFileChange}
              />

              <div className="rounded-[24px] border border-dashed border-[#163126]/14 bg-white p-6">
                {hasImage ? (
                  <div>
                    <div className="overflow-hidden rounded-[20px] border border-[#163126]/8">
                      <img
                        src={previewUrl}
                        alt="업로드한 식단 미리보기"
                        className="h-[320px] w-full object-cover"
                      />
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={handleOpenFilePicker}
                        className="inline-flex items-center gap-2 rounded-full border border-[#163126]/10 bg-white px-4 py-3 text-sm font-semibold text-[#163126]"
                      >
                        <UploadCloud size={16} />
                        사진 다시 선택하기
                      </button>

                      <p className="text-sm text-[#163126]/58">
                        {selectedFile?.name}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#eef9f2] text-[#2E7D5B]">
                      <Camera size={34} />
                    </div>

                    <p className="mt-6 text-2xl font-bold text-[#163126]">
                      오늘의 식단을 업로드해주세요
                    </p>
                    <p className="mt-2 text-sm text-[#163126]/55">
                      지원 형식: JPG, PNG
                    </p>

                    <button
                      type="button"
                      onClick={handleOpenFilePicker}
                      className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#163126] px-6 py-3 text-sm font-semibold text-white"
                    >
                      <UploadCloud size={16} />
                      사진 업로드하기
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-5">
              <button
                type="button"
                onClick={() => handleStartAnalysis("free")}
                disabled={!hasImage || loadingMode !== null}
                className="block w-full rounded-[28px] border border-[#163126]/8 bg-[#f9fcfa] p-6 text-left transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eef9f2] text-[#2E7D5B]">
                  {loadingMode === "free" ? (
                    <Loader2 size={22} className="animate-spin" />
                  ) : (
                    <Camera size={22} />
                  )}
                </div>

                <p className="mt-4 text-2xl font-bold text-[#163126]">
                  무료 식단 분석
                </p>
                <p className="mt-2 text-sm leading-6 text-[#163126]/60">
                  음식 구성과 영양 비율을 빠르게 확인할 수 있어요.
                </p>

                <div className="mt-5 inline-flex rounded-full bg-[#ecf9f1] px-3 py-1.5 text-xs font-semibold text-[#2E7D5B]">
                  포인트 차감 없음
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleStartAnalysis("premium")}
                disabled={!hasImage || loadingMode !== null}
                className="block w-full rounded-[28px] border border-[#163126]/8 bg-[#f9fcfa] p-6 text-left transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fff6e8] text-[#c67800]">
                  {loadingMode === "premium" ? (
                    <Loader2 size={22} className="animate-spin" />
                  ) : (
                    <Sparkles size={22} />
                  )}
                </div>

                <p className="mt-4 text-2xl font-bold text-[#163126]">
                  프리미엄 식단 분석
                </p>
                <p className="mt-2 text-sm leading-6 text-[#163126]/60">
                  더 자세한 피드백과 추천 음식, 다음 끼니 제안까지 확인할 수 있어요.
                </p>

                <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#fff6e8] px-3 py-1.5 text-xs font-semibold text-[#c67800]">
                  <Coins size={14} />
                  300포인트 사용
                </div>
              </button>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}