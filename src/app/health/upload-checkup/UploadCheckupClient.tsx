"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Camera,
  Clipboard,
  RefreshCcw,
  Upload,
  X,
} from "lucide-react";
import {
  normalizeCheckupOcrResult,
  requestCheckupOcr,
} from "@/src/api/checkup";

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export default function UploadCheckupClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const mode = searchParams.get("mode") ?? "first";
  const isReanalyze = mode === "reanalyze";

  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [hasUploaded, setHasUploaded] = useState(false);

  const buddyImageSrc = "/images/buddy-camera.png";

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    const handlePaste = async (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            await handleFileSelect(file);
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  const pageText = useMemo(() => {
    if (isReanalyze) {
      return {
        title: "건강검진표로 다시 분석하기",
        desc: "새 건강검진표 이미지를 업로드하면 주요 수치를 자동으로 추출해 다시 분석할 수 있도록 입력 화면에 채워드릴게요.",
        guideTitle: "새 검진표로 다시 확인해볼까요?",
        guideDesc:
          "사진이 선명할수록 수치를 더 정확하게 읽을 수 있어요. 업로드 후에는 자동 입력된 값을 꼭 한 번 확인해주세요.",
      };
    }

    return {
      title: "건강검진표 업로드",
      desc: "건강검진표 이미지를 업로드하면 주요 수치를 자동으로 추출해 입력 화면에 채워드릴게요.",
      guideTitle: "Buddy가 이미지를 분석하고 입력값을 채워드려요",
      guideDesc:
        "혈압, 혈당, 콜레스테롤, 키, 체중 같은 주요 정보를 자동으로 읽어와서 입력을 더 빠르게 할 수 있어요.",
    };
  }, [isReanalyze]);

  const validateFile = (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "JPEG, PNG, WebP, GIF 파일만 업로드할 수 있어요.";
    }

    if (file.size > MAX_FILE_SIZE) {
      return "파일 크기는 최대 20MB까지 업로드할 수 있어요.";
    }

    return "";
  };

  const handleFileSelect = async (file: File) => {
    const validationError = validateFile(file);

    if (validationError) {
      setError(validationError);
      setErrorMessage("");
      setStatusMessage("");
      return;
    }

    setError("");
    setErrorMessage("");
    setStatusMessage("");
    setSelectedFile(file);
    setHasUploaded(true);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const nextPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(nextPreviewUrl);
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);

    const file = event.dataTransfer.files?.[0];
    if (!file) return;

    await handleFileSelect(file);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
  };

  const handleChooseFile = () => {
    inputRef.current?.click();
  };

  const clearSelectedFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(null);
    setPreviewUrl("");
    setError("");
    setErrorMessage("");
    setStatusMessage("");
    setHasUploaded(false);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || loading) return;

    try {
      setLoading(true);
      setError("");
      setErrorMessage("");
      setStatusMessage("건강검진표를 분석하고 있어요...");

      const data = await requestCheckupOcr(selectedFile);
      const normalized = normalizeCheckupOcrResult(data);

      sessionStorage.setItem("ocr-result", JSON.stringify(normalized));
      sessionStorage.setItem(
        "ocr-upload-meta",
        JSON.stringify({
          sourceMode: isReanalyze ? "reanalyze" : "first",
          fileName: selectedFile.name,
          uploadedAt: new Date().toISOString(),
        })
      );

      setStatusMessage("수치를 추출했어요. 입력 화면으로 이동할게요.");

      window.setTimeout(() => {
        router.push("/input?mode=ocr");
      }, 500);
    } catch (_err) {
      setErrorMessage(
        "이미지를 업로드할 수 없어요. 지원 형식을 확인해주세요."
      );
      setStatusMessage("");
    } finally {
      setLoading(false);
    }
  };

  const handleGoInputDirectly = () => {
    router.push(isReanalyze ? "/input?mode=edit" : "/input?mode=first");
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#F7FBF8_0%,#EEF7F0_100%)] text-[#163126]">
      <header className="flex items-center justify-between px-4 py-5 sm:px-6 md:px-10">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-sm font-semibold text-[#163126]"
        >
          <span className="h-2.5 w-2.5 rounded-full bg-[#7EE8A7]" />
          MyHealthBuddy
        </button>

        <div className="rounded-full border border-[#163126]/10 bg-white/70 px-4 py-2 text-xs font-medium text-[#163126]/70 backdrop-blur-md md:text-sm">
          OCR 업로드
        </div>
      </header>

      <section className="w-full px-4 pb-16 pt-2 sm:px-6 md:px-8">
        <div className="mt-10 flex justify-center">
          <div className="grid w-full max-w-6xl items-start gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="hidden lg:flex lg:justify-end">
              <div className="mt-8 flex items-end gap-4">
                <div className="relative mt-4 w-[240px] rounded-[24px] border border-white/40 bg-white/72 px-5 py-5 shadow-[0_14px_40px_rgba(22,49,38,0.08)] backdrop-blur-xl">
                  <p className="text-sm font-medium text-[#2E7D5B]">
                    buddy guide
                  </p>

                  <p className="mt-2 text-[17px] font-bold leading-[1.45] text-[#163126] whitespace-normal break-keep">
                    Buddy가 이미지를 분석하고 입력값을 채워드려요
                  </p>

                  <p className="mt-3 text-sm leading-7 text-[#163126]/68 whitespace-normal break-keep">
                    혈압, 혈당, 콜레스테롤, 키, 체중 같은 주요 정보를 자동으로 읽어와서 입력을 더 빠르게 할 수 있어요.
                  </p>

                  <div className="absolute right-[-8px] top-8 h-4 w-4 rotate-45 border-r border-t border-white/40 bg-white/72" />
                </div>

                <div className="flex h-[236px] w-[236px] shrink-0 items-end justify-center">
                  <img
                    src="/images/buddy-camera.png"
                    alt="검진표 업로드를 안내하는 버디"
                    className="h-[226px] w-[226px] object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.08)]"
                  />
                </div>
              </div>
            </aside>

            <div className="lg:hidden">
              <div className="mx-auto mb-6 flex max-w-3xl items-start gap-3 rounded-[24px] border border-white/40 bg-white/68 p-4 shadow-[0_14px_40px_rgba(22,49,38,0.06)] backdrop-blur-xl">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-[#2E7D5B]">
                    buddy guide
                  </p>
                  <p className="mt-1 text-base font-bold leading-[1.5] text-[#163126] whitespace-normal break-keep">
                    {pageText.guideTitle}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[#163126]/68 whitespace-normal break-keep">
                    {pageText.guideDesc}
                  </p>
                </div>

                <div className="flex h-[96px] w-[96px] shrink-0 items-end justify-center">
                  <Image
                    src={buddyImageSrc}
                    alt="카메라를 들고 검진표 업로드를 안내하는 버디"
                    width={88}
                    height={88}
                    className="h-[88px] w-[88px] object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.08)]"
                    priority
                  />
                </div>
              </div>
            </div>

            <div className="w-full">
              <section className="mx-auto w-full max-w-4xl rounded-[28px] border border-white/40 bg-white/55 p-5 shadow-[0_18px_50px_rgba(46,125,91,0.08)] backdrop-blur-xl sm:p-6 md:rounded-[40px] md:p-8 lg:p-10">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#2E7D5B]">
                    OCR CHECKUP UPLOAD
                  </p>

                  <h1 className="mt-3 text-3xl font-bold leading-tight text-[#163126] md:text-5xl">
                    {pageText.title}
                  </h1>

                  <p className="mt-4 max-w-3xl text-sm leading-7 text-[#163126]/68 md:text-base">
                    {pageText.desc}
                  </p>
                </div>

                <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                  <div className="rounded-[28px] border border-[#163126]/8 bg-white/72 p-5 md:p-6">
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      className={`relative rounded-3xl border-2 p-6 text-center transition md:p-8 ${
                        errorMessage
                          ? "border-red-400 bg-red-50"
                          : dragActive
                          ? "border-[#6DBA7B] bg-[#F2FBF4]"
                          : "border-[#E5EFE8] bg-[#F8FCF9]"
                      }`}
                    >
                      <input
                        ref={inputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            void handleFileSelect(file);
                          }
                        }}
                      />

                      {!selectedFile ? (
                        <div className="flex min-h-[290px] flex-col items-center justify-center">
                          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#E8F5EA] text-[#2E7D5B]">
                            <Camera size={34} />
                          </div>

                          <h2 className="mt-8 text-2xl font-bold text-[#163126] md:text-[40px] md:leading-tight">
                            이미지를
                            <br />
                            업로드해주세요
                          </h2>

                          <p className="mt-4 text-sm leading-7 text-[#163126]/52 md:text-base">
                            지원 형식: JPEG, PNG, WebP, GIF · 최대 20MB
                            <br />
                            드래그 앤 드롭 또는 복사 붙여넣기도 가능해요.
                          </p>

                          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                            <button
                              type="button"
                              onClick={handleChooseFile}
                              className="inline-flex min-w-[190px] items-center justify-center gap-2 rounded-full bg-[#163126] px-8 py-4 text-sm font-semibold text-white whitespace-nowrap transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1d4232] hover:shadow-lg active:scale-95"
                            >
                              <Upload size={16} className="shrink-0" />
                              사진 업로드하기
                            </button>

                            <div className="inline-flex items-center gap-2 rounded-full border border-[#163126]/10 bg-white px-5 py-3 text-sm font-semibold text-[#163126]/60">
                              <Clipboard size={15} />
                              Ctrl + V 붙여넣기 가능
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-left">
                          <div className="mb-4 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-[#163126]">
                                선택한 파일
                              </p>
                              <p className="mt-1 truncate text-sm text-[#163126]/58">
                                {selectedFile.name}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={clearSelectedFile}
                              disabled={loading}
                              className="inline-flex items-center gap-1 rounded-full border border-[#163126]/10 bg-white px-3 py-2 text-sm font-semibold text-[#163126] transition hover:bg-[#f7faf8] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <X size={14} />
                              제거
                            </button>
                          </div>

                          <div className="relative overflow-hidden rounded-[20px] border border-[#163126]/8 bg-white">
                            {previewUrl ? (
                              <div className="relative aspect-[4/3] w-full">
                                <Image
                                  src={previewUrl}
                                  alt="업로드한 건강검진표 미리보기"
                                  fill
                                  className="object-contain"
                                  unoptimized
                                />
                              </div>
                            ) : (
                              <div className="flex h-[260px] items-center justify-center text-sm text-[#163126]/50">
                                미리보기를 불러오고 있어요...
                              </div>
                            )}
                          </div>

                          <div className="mt-5 flex flex-wrap gap-3">
                            <button
                              type="button"
                              onClick={handleChooseFile}
                              disabled={loading}
                              className="inline-flex items-center gap-2 rounded-full border border-[#163126]/10 bg-white px-5 py-3 text-sm font-semibold text-[#163126] transition hover:bg-[#f7faf8] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <RefreshCcw size={15} />
                              다른 파일 선택
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {error ? (
                      <p className="mt-4 text-sm font-medium text-[#d8614d]">
                        {error}
                      </p>
                    ) : null}

                    {errorMessage && (
                      <p className="mt-3 text-sm text-red-500">
                        {errorMessage}
                      </p>
                    )}

                    {statusMessage ? (
                      <p className="mt-4 text-sm font-medium text-[#2E7D5B]">
                        {statusMessage}
                      </p>
                    ) : null}

                    {selectedFile ? (
                      <button
                        type="button"
                        onClick={handleUpload}
                        disabled={loading}
                        className="mt-6 w-full rounded-2xl bg-[#163126] py-4 text-lg font-bold text-white shadow-md transition hover:bg-[#1d4232] hover:shadow-lg hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-[#163126]/35 disabled:hover:translate-y-0 disabled:hover:shadow-md"
                      >
                        {loading ? "분석 중..." : "OCR로 수치 추출"}
                      </button>
                    ) : null}
                  </div>

                  <div className="grid gap-4">
                    <div className="rounded-[24px] border border-[#163126]/8 bg-white/70 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(46,125,91,0.12)]">
                      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E8F5EA] text-[#2E7D5B]">
                        <Camera size={20} />
                      </div>
                      <p className="text-2xl font-bold text-[#163126]">
                        수치 자동 추출
                      </p>
                      <p className="mt-3 text-sm leading-7 text-[#163126]/62">
                        이미지에서 키, 몸무게, 혈압, 혈당, 총 콜레스테롤 같은 주요
                        수치를 빠르게 읽어와요.
                      </p>
                      <span className="mt-4 inline-flex rounded-full bg-[#EAF6EC] px-3 py-1 text-xs font-semibold text-[#63A775]">
                        OCR 자동 인식
                      </span>
                    </div>

                    <div
                      className={`rounded-[24px] border border-[#163126]/8 bg-white/70 p-5 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(46,125,91,0.12)] ${
                        hasUploaded
                          ? "ring-2 ring-[#FFD89C] shadow-lg animate-pulse"
                          : ""
                      }`}
                    >
                      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF4E6] text-[#C98918]">
                        <Upload size={20} />
                      </div>
                      <p className="text-2xl font-bold text-[#163126]">
                        업로드 전 확인
                      </p>
                      <p className="mt-3 text-sm leading-7 text-[#163126]/62">
                        글자가 선명하고 잘리지 않은 이미지를 올려주세요. 추출
                        후에는 자동 입력된 값을 직접 확인하고 수정할 수 있어요.
                      </p>
                      <span className="mt-4 inline-flex rounded-full bg-[#FFF3DF] px-3 py-1 text-xs font-semibold text-[#C98918]">
                        최종 검토 필요
                      </span>
                    </div>
                  </div>
                </div>

              </section>

              <div className="mx-auto mt-8 flex w-full max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-start">
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      isReanalyze
                        ? "/health/start?mode=reanalyze"
                        : "/health/start?mode=first"
                    )
                  }
                  className="rounded-full border border-[#163126]/10 bg-white px-8 py-4 text-sm font-semibold text-[#163126] transition hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_12px_28px_rgba(22,49,38,0.08)]"
                >
                  이전
                </button>

                <button
                  type="button"
                  onClick={handleGoInputDirectly}
                  className="rounded-full border border-[#163126]/10 bg-white px-8 py-4 text-sm font-semibold text-[#2E7D5B] transition hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_12px_28px_rgba(22,49,38,0.08)]"
                >
                  직접 입력하기
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
