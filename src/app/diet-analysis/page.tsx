"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import AppShell from "@/src/components/AppShell";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Coins,
  Crown,
  ImagePlus,
  Loader2,
  ShieldCheck,
  Sparkles,
  Star,
  UploadCloud,
  Utensils,
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
    showHint(message, "error");
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
      setErrorMessage("음식이 보이는 사진을 업로드해주세요.");
      triggerDropError("이미지 파일만 붙여넣을 수 있어요.");
      return;
    }

    const file = imageItem.getAsFile();
    if (!file) {
      setErrorMessage("음식이 보이는 사진을 업로드해주세요.");
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
      const message = "음식이 보이는 사진을 업로드해주세요.";
      setErrorMessage(message);
      triggerDropError(message);
      return;
    }

    try {
      setLoadingMode(mode);
      setErrorMessage("");

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
      const message =
        mode === "premium"
          ? "프리미엄 식단 분석 요청에 실패했어요."
          : "무료 식단 분석 요청에 실패했어요.";
      setErrorMessage(message);
      triggerDropError(message);
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
      <section className="mx-auto w-full max-w-7xl">
        <div className="rounded-[24px] border border-[#163126]/8 bg-white/88 p-5 shadow-[0_18px_50px_rgba(46,125,91,0.06)] backdrop-blur-xl md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#2E7D5B]">
            diet analysis
          </p>

          <h1 className="mt-3 text-4xl font-black leading-tight text-[#163126] md:text-6xl">
            식단 분석
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#163126]/65 md:text-base">
            음식 사진을 업로드하고 영양 비율, 나트륨 수준, 식단 피드백을 확인해보세요.
          </p>

          <div className="mt-7 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_360px]">
            <motion.div
              layout
              className="relative overflow-hidden rounded-[22px] border border-[#dfeee2] bg-[linear-gradient(180deg,#fbfefb_0%,#ffffff_100%)] p-5 shadow-[0_14px_36px_rgba(46,125,91,0.06)] md:p-6"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.gif"
                className="hidden"
                onChange={handleFileChange}
              />

              <div className="grid gap-6 md:grid-cols-[210px_minmax(0,1fr)] md:items-stretch">
                {!hasImage && (
                  <aside className="hidden md:flex md:flex-col md:justify-center">
                    <div className="rounded-[28px] border border-[#dcefe0] bg-white/92 px-5 py-4 text-center text-sm font-bold leading-6 text-[#163126]/72 shadow-[0_12px_28px_rgba(46,125,91,0.08)]">
                      오늘 뭐 드셨나요?
                      <br />
                      사진만 올려주면
                      <br />
                      분석해드릴게요!
                    </div>
                    <img
                      src="/images/buddy-camera.png"
                      alt=""
                      className="mx-auto mt-4 h-44 w-44 object-contain"
                    />

                    <div className="mt-5 space-y-2 rounded-[22px] bg-[#eef9f2] px-4 py-4 text-center text-xs font-bold leading-5 text-[#2E7D5B]">
                      <p>
                        밝은 곳에서 찍으면
                        <br />
                        정확도가 올라가요.
                      </p>
                      <p className="text-[#163126]/50">
                        음식이 화면 중앙에
                        <br />
                        보이게 촬영해주세요.
                      </p>
                    </div>
                  </aside>
                )}

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
                  className={`relative min-h-[520px] rounded-[28px] border p-6 outline-none transition-all duration-300 md:min-h-[640px] ${
                    hasUploadError
                      ? "border-[#ef9a9a] bg-[#fff5f5] shadow-[0_18px_40px_rgba(239,68,68,0.08)]"
                      : "border-[#bfe3c7] bg-white"
                  } ${hasImage ? "md:col-span-2" : ""}`}
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
                            className="h-[360px] w-full object-cover"
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
                        className="flex h-full min-h-[460px] flex-col items-center justify-center text-center md:min-h-[588px] md:-translate-y-8"
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
                          className={`flex h-24 w-24 items-center justify-center rounded-full shadow-[0_12px_30px_rgba(46,125,91,0.08)] ${
                            hasUploadError
                              ? "bg-[#fff1f1] text-[#d95c5c]"
                              : "bg-[#eef9f2] text-[#2E7D5B]"
                          }`}
                        >
                          {isDragActive ? (
                            <ImagePlus size={38} />
                          ) : (
                            <Camera size={36} />
                          )}
                        </motion.div>

                        <p className="mt-6 max-w-[560px] text-2xl font-black leading-tight text-[#163126] md:text-[28px]">
                          {isDragActive ? (
                            "여기에 사진을 놓아주세요"
                          ) : (
                            <>
                              여기에 사진을 드래그하거나
                              <br />
                              클릭해서 업로드해주세요
                            </>
                          )}
                        </p>

                        <p className="mt-3 text-sm leading-6 text-[#163126]/55">
                          지원 형식: JPEG, PNG, WebP, GIF · 최대 20MB
                          <br />
                          드래그 앤 드롭 또는 복사 붙여넣기도 가능해요.
                        </p>

                        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={handleOpenFilePicker}
                            className="inline-flex min-w-[220px] items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#20a447] px-8 py-4 text-sm font-black text-white shadow-[0_14px_30px_rgba(46,125,91,0.16)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#18893a] hover:shadow-lg active:scale-95"
                          >
                            <UploadCloud size={16} className="shrink-0" />
                            사진 업로드하기
                          </button>

                          <div className="rounded-xl border border-[#163126]/10 bg-white px-4 py-3 text-sm font-bold text-[#163126]/60">
                            Ctrl + V 붙여넣기 가능
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {uploadHint ? (
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

                  <AnimatePresence>
                    {errorMessage ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.98 }}
                        transition={{ duration: 0.18 }}
                        className="mt-5 rounded-[18px] border border-[#ef9a9a] bg-[#fff5f5] px-4 py-4 text-left shadow-[0_12px_28px_rgba(239,68,68,0.08)]"
                      >
                        <div className="flex gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#d95c5c]">
                            <AlertTriangle size={20} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-black text-[#b84242]">
                              이미지를 확인해주세요
                            </p>
                            <p className="mt-1 text-sm font-semibold leading-6 text-[#d95c5c]">
                              {errorMessage}
                            </p>
                            <p className="mt-1 text-xs font-semibold leading-5 text-[#b84242]/70">
                              음식이 화면에 잘 보이고, 지원 형식과 용량 조건을 만족하는 사진을 올려주세요.
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </motion.div>
              </div>
            </motion.div>

            <div className="space-y-4">
              <motion.button
                type="button"
                onClick={() => handleStartAnalysis("free")}
                disabled={!hasImage || hasUploadError || loadingMode !== null}
                animate={
                  cardsReadyPulse && hasImage && !hasUploadError
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
                whileHover={!hasImage || hasUploadError || loadingMode ? {} : { y: -2 }}
                whileTap={!hasImage || hasUploadError || loadingMode ? {} : { scale: 0.995 }}
                transition={{ duration: 0.55 }}
                className="block w-full rounded-[22px] border border-[#9ed7aa] bg-[#fbfffc] p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-[0_18px_40px_rgba(46,125,91,0.12)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#e9f8ed] text-[#2E9C45]">
                    {loadingMode === "free" ? (
                      <Loader2 size={23} className="animate-spin" />
                    ) : (
                      <Camera size={23} />
                    )}
                  </div>
                  <span className="rounded-full bg-[#e8f7df] px-3 py-1 text-xs font-black text-[#5d9d1e]">
                    추천
                  </span>
                </div>

                <p className="mt-4 text-2xl font-black text-[#163126]">
                  무료 식단 분석
                </p>
                <p className="mt-2 text-sm leading-6 text-[#163126]/60">
                  기본 영양 정보를 간단하게 확인해보세요.
                </p>

                <ul className="mt-5 space-y-3 text-sm font-bold text-[#163126]/70">
                  {["기본 영양소 분석", "나트륨 수준 체크", "간단한 식단 피드백 제공"].map(
                    (item) => (
                      <li key={item} className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-[#2E9C45]" />
                        {item}
                      </li>
                    )
                  )}
                </ul>

                <div className="mt-5 flex h-12 items-center justify-center rounded-xl bg-[#20a447] text-sm font-black text-white">
                  무료로 시작하기
                </div>
              </motion.button>

              <motion.button
                type="button"
                onClick={() => handleStartAnalysis("premium")}
                disabled={!hasImage || hasUploadError || loadingMode !== null}
                animate={
                  cardsReadyPulse && hasImage && !hasUploadError
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
                whileHover={!hasImage || hasUploadError || loadingMode ? {} : { y: -2 }}
                whileTap={!hasImage || hasUploadError || loadingMode ? {} : { scale: 0.995 }}
                transition={{ duration: 0.55, delay: 0.05 }}
                className="block w-full rounded-[22px] border border-[#f2c778] bg-[#fffdf8] p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:bg-[#fffaf0] hover:shadow-[0_18px_40px_rgba(201,137,24,0.12)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#fff3d8] text-[#f0a11a]">
                    {loadingMode === "premium" ? (
                      <Loader2 size={23} className="animate-spin" />
                    ) : (
                      <Star size={24} fill="currentColor" />
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#fff1d2] px-3 py-1 text-xs font-black text-[#c67800]">
                    <Crown size={13} />
                    인기
                  </span>
                </div>

                <p className="mt-4 text-2xl font-black text-[#163126]">
                  프리미엄 식단 분석
                </p>
                <p className="mt-2 text-sm leading-6 text-[#163126]/60">
                  더 자세하고 개인화된 분석을 받아보세요.
                </p>

                <ul className="mt-5 space-y-3 text-sm font-bold text-[#163126]/70">
                  {[
                    "상세 영양 분석 리포트",
                    "식단 개선 가이드 및 체크",
                    "다음 끼니 제안까지 맞춤 추천",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-[#f0a11a]" />
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="mt-5 flex h-12 items-center justify-center gap-2 rounded-xl bg-[#f1a21d] text-sm font-black text-white">
                  프리미엄 분석하기
                  <span className="rounded-full bg-white/24 px-2 py-1 text-[11px]">
                    300포인트 사용
                  </span>
                </div>
              </motion.button>
            </div>
          </div>

          <section className="mt-6 rounded-[22px] border border-[#dfeee2] bg-white px-5 py-5 shadow-[0_12px_30px_rgba(46,125,91,0.05)]">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0">
                <h2 className="text-lg font-black text-[#163126]">
                  사진 한 장으로 이런 분석을 받아요!
                </h2>
                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  <FeatureCard
                    icon={<Utensils size={24} />}
                    title="영양 비율 분석"
                    text="탄수화물, 단백질, 지방 비율을 한눈에"
                  />
                  <FeatureCard
                    icon={<ShieldCheck size={24} />}
                    title="나트륨 수준 체크"
                    text="짜게 먹었는지 미리 확인"
                  />
                  <FeatureCard
                    icon={<ClipboardCheck size={24} />}
                    title="건강 점수 제공"
                    text="종합 점수와 식단 방향 확인"
                  />
                  <FeatureCard
                    icon={<Sparkles size={24} />}
                    title="다음 식단 추천"
                    text="부족한 영양소 기반 추천"
                  />
                </div>
              </div>

              <div className="flex shrink-0 items-end gap-3 rounded-[24px] bg-[#f1fbef] px-5 py-4">
                <div className="text-sm font-black leading-6 text-[#2E7D5B]">
                  건강한 식습관,
                  <br />
                  함께 만들어가요!
                </div>
                <img
                  src="/images/buddy-review.png"
                  alt=""
                  className="h-24 w-24 object-contain"
                />
              </div>
            </div>
          </section>

          <div className="mt-4 rounded-xl border border-[#dfeee2] bg-[#fbfefb] px-5 py-4 text-sm font-bold text-[#163126]/62">
            <span className="mr-2 text-[#f0a11a]">TIP</span>
            더 정확한 분석을 위해 음식이 잘 보이도록 밝은 곳에서 촬영해주세요.
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function FeatureCard({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[16px] border border-[#e0ece2] bg-white px-4 py-4">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#ecf9ef] text-[#2E9C45]">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black text-[#163126]">{title}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-[#163126]/52">
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}
