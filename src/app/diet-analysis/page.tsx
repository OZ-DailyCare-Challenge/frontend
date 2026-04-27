"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import AppShell from "@/src/components/AppShell";
import {
  Camera,
  Coins,
  ImagePlus,
  Loader2,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import type {
  MealAnalysisMode,
  RequestMealAnalysisResponse,
} from "@/src/types/meals";
import { requestMealAnalysis } from "@/src/api/meals";

type PendingMealAnalysis = {
  taskId: string;
  mode: MealAnalysisMode;
  image: string;
};

const MAX_IMAGE_SIZE_MB = 20;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

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

function isSupportedImage(file: File) {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "image/webp",
    "image/gif",
  ];

  return allowedTypes.includes(file.type);
}

function isValidImageSize(file: File) {
  return file.size <= MAX_IMAGE_SIZE_BYTES;
}

export default function DietAnalysisPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dragDepthRef = useRef(0);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loadingMode, setLoadingMode] = useState<MealAnalysisMode | null>(null);

  const [isDragActive, setIsDragActive] = useState(false);
  const [dropErrorActive, setDropErrorActive] = useState(false);
  const [cardsReadyPulse, setCardsReadyPulse] = useState(false);

  const [uploadHint, setUploadHint] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [hintType, setHintType] = useState<"success" | "error" | "info">(
    "info"
  );

  const hasImage = useMemo(
    () => Boolean(selectedFile && previewUrl),
    [selectedFile, previewUrl]
  );
  const hasUploadError = Boolean(errorMessage);

  useEffect(() => {
    if (!uploadHint) return;

    const timer = window.setTimeout(() => {
      setUploadHint("");
    }, 2200);

    return () => window.clearTimeout(timer);
  }, [uploadHint]);

  useEffect(() => {
    if (!dropErrorActive) return;

    const timer = window.setTimeout(() => {
      setDropErrorActive(false);
    }, 520);

    return () => window.clearTimeout(timer);
  }, [dropErrorActive]);

  useEffect(() => {
    if (!cardsReadyPulse) return;

    const timer = window.setTimeout(() => {
      setCardsReadyPulse(false);
    }, 900);

    return () => window.clearTimeout(timer);
  }, [cardsReadyPulse]);

  const showHint = (message: string, type: "success" | "error" | "info") => {
    setHintType(type);
    setUploadHint(message);
  };

  const triggerDropError = (message: string) => {
    setDropErrorActive(true);
  };

  const applyFile = async (file: File) => {
    if (!isSupportedImage(file)) {
      setErrorMessage(
        "지원하지 않는 이미지 형식이에요. JPEG, PNG, WebP, GIF 이미지를 업로드해주세요."
      );
      triggerDropError("지원하지 않는 이미지 형식이에요.");
      return;
    }

    if (!isValidImageSize(file)) {
      setErrorMessage("이미지 크기는 최대 20MB까지 업로드할 수 있어요.");
      triggerDropError("이미지 크기는 최대 20MB까지 업로드할 수 있어요.");
      return;
    }

    try {
      setErrorMessage("");
      const dataUrl = await readFileAsDataUrl(file);
      setSelectedFile(file);
      setPreviewUrl(dataUrl);
      setCardsReadyPulse(true);
      showHint("이미지를 불러왔어요.", "success");
    } catch (error) {
      console.error("식단 이미지 미리보기 생성 실패:", error);
      setErrorMessage("음식이 보이는 사진을 업로드해주세요.");
      triggerDropError("이미지를 불러오지 못했어요.");
    }
  };

  const handleOpenFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await applyFile(file);
    e.target.value = "";
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    dragDepthRef.current += 1;
    setIsDragActive(true);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    dragDepthRef.current -= 1;

    if (dragDepthRef.current <= 0) {
      dragDepthRef.current = 0;
      setIsDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    dragDepthRef.current = 0;
    setIsDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    await applyFile(file);
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find((item) => item.type.startsWith("image/"));

    if (!imageItem) {
      triggerDropError("이미지 파일만 붙여넣을 수 있어요.");
      return;
    }

    const file = imageItem.getAsFile();
    if (!file) {
      triggerDropError("이미지를 불러오지 못했어요.");
      return;
    }

    e.preventDefault();
    await applyFile(file);
    setCardsReadyPulse(true);
    showHint("붙여넣은 이미지를 불러왔어요.", "success");
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
      setErrorMessage("음식이 보이는 사진을 업로드해주세요.");
      return;
    }

    try {
      setLoadingMode(mode);

      const response: RequestMealAnalysisResponse = await requestMealAnalysis(
        selectedFile,
        mode
      );

      const responseWithOptionalResult =
        response as RequestMealAnalysisResponse & {
          result?: {
            task_id?: string;
          };
        };

      const taskId: string | undefined =
        responseWithOptionalResult.task_id ??
        responseWithOptionalResult.result?.task_id;

      if (!taskId) {
        console.error("식단 분석 응답:", response);
        throw new Error("식단 분석 task_id를 찾을 수 없어요.");
      }

      savePendingAndMove(taskId, mode, previewUrl);
    } catch (error) {
      console.error("식단 분석 요청 실패:", error);
      showHint(
        mode === "premium"
          ? "프리미엄 식단 분석 요청에 실패했어요."
          : "무료 식단 분석 요청에 실패했어요.",
        "error"
      );
    } finally {
      setLoadingMode(null);
    }
  };

  const hintStyle =
    hintType === "error"
      ? "bg-[#d95c5c] text-white"
      : hintType === "success"
      ? "bg-[#163126] text-white"
      : "bg-[#345e4a] text-white";

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
            <motion.div
              layout
              className="rounded-[28px] border border-[#163126]/8 bg-[#fbfcfb] p-6"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.gif"
                className="hidden"
                onChange={handleFileChange}
              />

              <motion.div
                tabIndex={0}
                onPaste={handlePaste}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                animate={
                  dropErrorActive
                    ? {
                        x: [0, -8, 8, -6, 6, -3, 3, 0],
                        borderColor: "rgba(217,92,92,0.55)",
                        backgroundColor: "rgba(255,242,242,1)",
                        scale: 1,
                      }
                    : isDragActive
                    ? {
                        x: 0,
                        scale: 1.01,
                        borderColor: "rgba(46,125,91,0.35)",
                        backgroundColor: "rgba(238,249,242,0.95)",
                      }
                    : {
                        x: 0,
                        scale: 1,
                        borderColor: "rgba(22,49,38,0.14)",
                        backgroundColor: "rgba(255,255,255,1)",
                      }
                }
                transition={{
                  duration: dropErrorActive ? 0.42 : 0.18,
                  ease: "easeOut",
                }}
                className={`relative rounded-[28px] border p-6 outline-none transition-all duration-300 ${
                  hasUploadError
                    ? "border-[#ef9a9a] bg-[#fff5f5] shadow-[0_18px_40px_rgba(239,68,68,0.08)]"
                    : "border-[#163126]/8 bg-white"
                }`}
              >
                <AnimatePresence>
                  {isDragActive && !dropErrorActive ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="pointer-events-none absolute inset-0 rounded-[24px] bg-[radial-gradient(circle_at_center,rgba(126,232,167,0.16),rgba(126,232,167,0.04)_55%,transparent_80%)]"
                    />
                  ) : null}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  {hasImage ? (
                    <motion.div
                      key="preview"
                      initial={{ opacity: 0, y: 12, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.98 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div
                        className={`overflow-hidden rounded-[22px] border ${
                          hasUploadError
                            ? "border-[#ef9a9a]"
                            : "border-[#dce9df]"
                        } bg-[#f5faf7]`}
                      >
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
                          className="inline-flex items-center gap-2 rounded-full border border-[#163126]/10 bg-white px-4 py-3 text-sm font-semibold text-[#163126] transition hover:bg-[#f7faf8]"
                        >
                          <UploadCloud size={16} />
                          사진 다시 선택하기
                        </button>

                        <p className="text-sm text-[#163126]/58">
                          {selectedFile?.name}
                        </p>
                      </div>

                      <p className="mt-4 text-sm leading-6 text-[#2E7D5B]/90">
                        다른 이미지를 드래그해서 바꾸거나, 캡처한 이미지를 붙여넣을 수도 있어요.
                        <br />
                        JPEG, PNG, WebP, GIF · 최대 20MB
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                      className="flex min-h-[380px] flex-col items-center justify-center text-center"
                    >
                      <motion.div
                        animate={
                          isDragActive
                            ? { scale: 1.08, y: -4 }
                            : dropErrorActive
                            ? { scale: 1.03 }
                            : { scale: 1, y: 0 }
                        }
                        transition={{ duration: 0.2 }}
                        className="flex h-24 w-24 items-center justify-center rounded-full bg-[#eef9f2] text-[#2E7D5B] shadow-[0_12px_30px_rgba(46,125,91,0.08)]"
                      >
                        {isDragActive ? (
                          <ImagePlus size={38} />
                        ) : (
                          <Camera size={36} />
                        )}
                      </motion.div>

                      <p className="mt-6 text-2xl font-bold text-[#163126] md:text-[34px]">
                        {isDragActive
                          ? "여기에 사진을 놓아주세요"
                          : "오늘의 식단을 업로드해주세요"}
                      </p>

                      <p className="mt-3 text-sm leading-6 text-[#163126]/55 md:text-base">
                        지원 형식: JPEG, PNG, WebP, GIF · 최대 20MB
                        <br />
                        드래그 앤 드롭 또는 복사 붙여넣기도 가능해요.
                      </p>

                      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={handleOpenFilePicker}
                          className="inline-flex min-w-[190px] items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#163126] px-8 py-4 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(22,49,38,0.12)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1d4232] hover:shadow-lg active:scale-95"
                        >
                          <UploadCloud size={16} className="shrink-0" />
                          사진 업로드하기
                        </button>

                        <div className="rounded-full border border-[#163126]/10 bg-white px-4 py-3 text-sm font-medium text-[#163126]/70">
                          Ctrl + V 붙여넣기 가능
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {uploadHint && hintType !== "error" ? (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      className={`absolute left-1/2 top-5 -translate-x-1/2 rounded-full px-4 py-2 text-xs font-semibold shadow-[0_12px_24px_rgba(22,49,38,0.16)] ${hintStyle}`}
                    >
                      {uploadHint}
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                {errorMessage && (
                  <p className="mt-3 text-xs font-semibold text-[#e05252]">
                    {errorMessage}
                  </p>
                )}
              </motion.div>
            </motion.div>

            <div className="space-y-5">
              <motion.button
                type="button"
                onClick={() => handleStartAnalysis("free")}
                disabled={!hasImage || loadingMode !== null}
                animate={
                  cardsReadyPulse && hasImage
                    ? {
                        scale: [1, 1.02, 1],
                        boxShadow: [
                          "0 0 0 rgba(46,125,91,0)",
                          "0 18px 36px rgba(46,125,91,0.10)",
                          "0 0 0 rgba(46,125,91,0)",
                        ],
                      }
                    : {}
                }
                whileHover={!hasImage || loadingMode ? {} : { y: -2 }}
                whileTap={!hasImage || loadingMode ? {} : { scale: 0.995 }}
                transition={{ duration: 0.55 }}
                className="block w-full rounded-[28px] border border-[#163126]/8 bg-white/70 p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-[0_18px_40px_rgba(46,125,91,0.12)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none"
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
              </motion.button>

              <motion.button
                type="button"
                onClick={() => handleStartAnalysis("premium")}
                disabled={!hasImage || loadingMode !== null}
                animate={
                  cardsReadyPulse && hasImage
                    ? {
                        scale: [1, 1.02, 1],
                        boxShadow: [
                          "0 0 0 rgba(198,120,0,0)",
                          "0 18px 36px rgba(198,120,0,0.10)",
                          "0 0 0 rgba(198,120,0,0)",
                        ],
                      }
                    : {}
                }
                whileHover={!hasImage || loadingMode ? {} : { y: -2 }}
                whileTap={!hasImage || loadingMode ? {} : { scale: 0.995 }}
                transition={{ duration: 0.55, delay: 0.05 }}
                className="block w-full rounded-[28px] border border-[#163126]/8 bg-white/70 p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:bg-[#FFFDF8] hover:shadow-[0_18px_40px_rgba(201,137,24,0.12)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none"
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
              </motion.button>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
