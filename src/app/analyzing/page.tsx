"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import AppShell from "@/src/components/AppShell";
import ECGLoader from "@/src/components/ECGLoader";
import HamsterScene from "@/src/components/three/HamsterScene";
import { getGuestHealthAnalysisResult } from "@/src/api/health";
import {
  getAnalysisHistory,
  getAnalysisResult,
  getAnalysisResultByRecordId,
  type AnalysisResultResponse,
} from "@/src/api/analysis";
import { guestAnalysisStorage } from "@/src/utils/guestAnalysisStorage";
import { storage } from "@/src/utils/storage";
import { analysisStorage } from "@/src/utils/analysisStorage";
import { markHealthFlowComplete } from "@/src/utils/health-flow";
import { useAccessStore } from "@/src/store/access-store";

const messages = [
  "건강검진 수치를 읽고 있어요",
  "생활습관 정보를 정리하고 있어요",
  "버디 맞춤 리포트를 작성하고 있어요",
];

function isSuccessResult(result: AnalysisResultResponse | null | undefined) {
  const status = String(result?.status ?? result?.data?.status ?? "").toUpperCase();

  return (
    status === "SUCCESS" ||
    status === "COMPLETED" ||
    status === "DONE" ||
    !!result?.data?.ml1_predict
  );
}

function isPendingResult(result: AnalysisResultResponse | null | undefined) {
  const status = String(result?.status ?? result?.data?.status ?? "").toUpperCase();

  return (
    status === "" ||
    status === "PENDING" ||
    status === "PROCESSING" ||
    status === "RUNNING" ||
    status === "STARTED"
  );
}

export default function AnalyzingPage() {
  const router = useRouter();

  const [started, setStarted] = useState(false);
  const [pulling, setPulling] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  const mountedRef = useRef(false);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef(false);
  const finishedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    const startTimer = setTimeout(() => {
      if (!mountedRef.current) return;

      setPulling(true);

      const pullTimer = setTimeout(() => {
        if (!mountedRef.current) return;
        setPulling(false);
        setStarted(true);
      }, 650);

      retryTimeoutRef.current = pullTimer;
    }, 800);

    const messageTimer = setInterval(() => {
      if (!mountedRef.current) return;
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 1300);

    return () => {
      mountedRef.current = false;
      clearTimeout(startTimer);
      clearInterval(messageTimer);

      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const clearRetryTimer = () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };

    const scheduleRetry = (delay = 2500) => {
      clearRetryTimer();

      retryTimeoutRef.current = setTimeout(() => {
        if (!mountedRef.current || cancelled || finishedRef.current) return;
        void poll();
      }, delay);
    };

    const moveToInput = () => {
      finishedRef.current = true;
      clearRetryTimer();
      router.replace("/input");
    };

    const saveAndMoveToResult = (result: AnalysisResultResponse) => {
      const isLoggedIn = Boolean(storage.getAccessToken());

      if (isLoggedIn) {
        analysisStorage.setResult(result);
        analysisStorage.clearTaskStore();
        useAccessStore.getState().markAnalysisComplete();
        markHealthFlowComplete();
      } else {
        guestAnalysisStorage.setResult(result);
        // task_id는 유지 — 로그인 후 migrate-guest API로 DB 저장에 사용
      }

      finishedRef.current = true;
      clearRetryTimer();
      router.replace("/result");
    };

    const tryResolveLoggedInResult = async () => {
      const storedTask = analysisStorage.getTaskStore();

      if (storedTask?.recordId) {
        const recordResult = await getAnalysisResultByRecordId(storedTask.recordId);

        if (isSuccessResult(recordResult)) {
          saveAndMoveToResult(recordResult);
          return { resolved: true, shouldPoll: false };
        }

        if (isPendingResult(recordResult)) {
          return { resolved: false, shouldPoll: true };
        }
      }

      const history = await getAnalysisHistory();
      const latest = history?.items?.[0];

      if (!latest?.record_id) {
        moveToInput();
        return { resolved: true, shouldPoll: false };
      }

      const latestResult = await getAnalysisResultByRecordId(latest.record_id);

      if (isSuccessResult(latestResult)) {
        saveAndMoveToResult(latestResult);
        return { resolved: true, shouldPoll: false };
      }

      if (isPendingResult(latestResult)) {
        analysisStorage.setTaskStore({
          taskId: storedTask?.taskId,
          recordId: latest.record_id,
        });

        return { resolved: false, shouldPoll: true };
      }

      return { resolved: false, shouldPoll: true };
    };

    const poll = async () => {
      if (
        cancelled ||
        !mountedRef.current ||
        finishedRef.current ||
        inFlightRef.current
      ) {
        return;
      }

      const token = storage.getAccessToken();
      const isGuest = !token;

      inFlightRef.current = true;

      try {
        if (!isGuest) {
          const resolved = await tryResolveLoggedInResult();

          if (resolved.resolved || !resolved.shouldPoll) {
            return;
          }
        }

        const storedTask = analysisStorage.getTaskStore();
        const taskId = isGuest
          ? guestAnalysisStorage.getTaskId()
          : storedTask?.taskId;
        const recordId = isGuest ? undefined : storedTask?.recordId;

        if (!taskId && !recordId) {
          moveToInput();
          return;
        }

        const result = isGuest
          ? await getGuestHealthAnalysisResult(taskId as string)
          : taskId
          ? await getAnalysisResult(taskId)
          : await getAnalysisResultByRecordId(recordId as number);

        if (cancelled || !mountedRef.current || finishedRef.current) return;

        if ((result as any)?.error) {
          console.error("건강 분석 API 에러:", (result as any).error);
          setErrorMessage("분석 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.");
          scheduleRetry(3000);
          return;
        }

        if (isSuccessResult(result)) {
          setErrorMessage("");
          saveAndMoveToResult(result);
          return;
        }

        if (isPendingResult(result)) {
          setErrorMessage("");
          scheduleRetry(2500);
          return;
        }

        setErrorMessage("분석 상태를 다시 확인하고 있어요.");
        scheduleRetry(3000);
      } catch (error) {
        console.error("건강 분석 polling 실패:", error);

        if (cancelled || !mountedRef.current || finishedRef.current) return;

        setErrorMessage(
          "결과를 다시 확인하고 있어요. 네트워크 상태에 따라 조금 더 걸릴 수 있어요."
        );
        scheduleRetry(3500);
      } finally {
        inFlightRef.current = false;
      }
    };

    void poll();

    return () => {
      cancelled = true;
      clearRetryTimer();
      inFlightRef.current = false;
    };
  }, [router]);

  const currentMessage = useMemo(() => messages[messageIndex], [messageIndex]);

  return (
    <AppShell>
      <main className="min-h-[calc(100vh-120px)] overflow-hidden">
        <div className="mx-auto flex min-h-[calc(100vh-160px)] w-full max-w-6xl items-center justify-center px-4 py-6 sm:px-6">
          <motion.section
            initial={{ opacity: 0, y: 18, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45 }}
            className="relative w-full overflow-hidden rounded-[34px] border border-white/40 bg-white/58 px-5 py-8 shadow-[0_18px_50px_rgba(46,125,91,0.08)] backdrop-blur-xl sm:px-8 sm:py-10 md:px-10"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(126,232,167,0.10),transparent_24%)]" />

            <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_1fr]">
              <div className="order-2 text-center lg:order-1 lg:text-left">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#2E7D5B]">
                  analyzing
                </p>

                <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
                  버디가 건강검진 정보를
                  <br />
                  분석하고 있어요
                </h1>

                <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#163126]/68 lg:mx-0 md:text-base">
                  입력한 건강검진 수치와 생활습관 정보를 정리해서
                  맞춤 건강 리포트를 준비하고 있어요.
                </p>

                <div className="mt-7 min-h-[32px]">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={currentMessage}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                      className="text-sm font-medium text-[#2E7D5B] md:text-base"
                    >
                      {currentMessage}
                    </motion.p>
                  </AnimatePresence>
                </div>

                <ECGLoader />

                {errorMessage ? (
                  <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-7 text-amber-700">
                    {errorMessage}
                  </div>
                ) : (
                  <p className="mt-6 text-xs text-[#163126]/52 md:text-sm">
                    잠시만 기다려주세요. 곧 건강 분석 결과를 보여드릴게요.
                  </p>
                )}
              </div>

              <div className="order-1 flex items-center justify-center lg:order-2">
                <div className="relative h-[470px] w-full max-w-[450px]">
                  <div className="absolute left-1/2 top-0 h-[280px] w-[280px] -translate-x-1/2 rounded-[42px] bg-[linear-gradient(180deg,#ffffff_0%,#f4f7f5_60%,#eef2f0_100%)] shadow-[0_28px_70px_rgba(22,49,38,0.10)]">
                    <div className="absolute inset-[14px] rounded-[34px] border border-[#163126]/7 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.92),rgba(248,250,249,0.78)_42%,rgba(236,242,239,0.98)_100%)]" />
                    <div className="absolute inset-[22px] rounded-[28px] opacity-35 [background-image:radial-gradient(rgba(22,49,38,0.10)_0.6px,transparent_0.6px)] [background-size:8px_8px]" />

                    <div className="absolute left-1/2 top-1/2 h-[172px] w-[172px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_35%_30%,rgba(255,255,255,0.98),rgba(255,255,255,0.65)_34%,rgba(208,214,211,0.95)_65%,rgba(255,255,255,0.98)_100%)] shadow-[inset_0_0_28px_rgba(255,255,255,0.8),0_12px_30px_rgba(22,49,38,0.08)]">
                      <motion.div
                        animate={started ? { rotate: 360 } : { rotate: 0 }}
                        transition={
                          started
                            ? {
                                rotate: {
                                  duration: 2.2,
                                  repeat: Infinity,
                                  ease: "linear",
                                },
                              }
                            : { duration: 0.2 }
                        }
                        className="absolute inset-[12px] rounded-full border border-[#163126]/8 bg-[conic-gradient(from_0deg,#fdfdfd,#d9dedd,#9ea4a1,#f7f8f7,#b6bbb8,#fcfcfc)]"
                      >
                        <div className="absolute inset-0 rounded-full opacity-55 [background:conic-gradient(from_0deg,transparent_0_18deg,rgba(0,0,0,0.52)_18deg_36deg,transparent_36deg_72deg,rgba(0,0,0,0.40)_72deg_100deg,transparent_100deg_145deg,rgba(0,0,0,0.30)_145deg_170deg,transparent_170deg_230deg,rgba(0,0,0,0.24)_230deg_258deg,transparent_258deg_300deg,rgba(0,0,0,0.38)_300deg_326deg,transparent_326deg_360deg)]" />
                      </motion.div>

                      <div className="absolute left-1/2 top-1/2 h-[32px] w-[32px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#163126]/15 bg-[radial-gradient(circle_at_30%_30%,#6b6f6d,#252928)] shadow-[0_0_10px_rgba(0,0,0,0.18)]" />
                    </div>
                  </div>

                  <motion.div
                    animate={{ height: pulling ? 136 : 104 }}
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                    className="absolute left-1/2 top-[280px] w-[3px] -translate-x-1/2 rounded-full bg-[#2f332f]"
                  />

                  <motion.div
                    animate={{ y: pulling ? 30 : 0 }}
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                    className="absolute left-1/2 top-[382px] h-[38px] w-[38px] -translate-x-1/2 rounded-full border border-[#163126]/10 bg-white shadow-[0_10px_24px_rgba(22,49,38,0.12)]"
                  />

                  <motion.div
                    animate={{
                      y: pulling ? 26 : started ? [0, -5, 0] : 0,
                      x: pulling ? -8 : 0,
                    }}
                    transition={
                      started && !pulling
                        ? {
                            duration: 1.8,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }
                        : {
                            duration: 0.35,
                            ease: "easeInOut",
                          }
                    }
                    className="absolute bottom-0 left-1/2 flex -translate-x-1/2 flex-col items-center"
                  >
                    <motion.div
                      animate={{ rotate: pulling ? -16 : 0 }}
                      transition={{ duration: 0.35 }}
                      className="mb-1 text-xs text-[#163126]/40"
                    >
                      ─╮
                    </motion.div>

                    <div className="h-[150px] w-[150px] overflow-hidden rounded-full bg-[radial-gradient(circle_at_35%_30%,#fffaf0,#edf7ef)] shadow-[0_18px_40px_rgba(22,49,38,0.10)]">
                      <HamsterScene lookTarget={null} jumpTrigger={0} />
                    </div>

                    <motion.div
                      animate={{ y: [0, -3, 0] }}
                      transition={{
                        duration: 2.2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="mt-4 rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#2E7D5B] shadow-[0_10px_22px_rgba(22,49,38,0.08)]"
                    >
                      {started ? "건강 정보를 분석 중이에요 💚" : "분석 준비 중..."}
                    </motion.div>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.section>
        </div>
      </main>
    </AppShell>
  );
}