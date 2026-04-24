"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  requestGuestHealthAnalysis,
  createHealthRecord,
  getHealthRecords,
  patchHealthRecord,
} from "@/src/api/health";
import {
  createInitialProfile,
  updateUserProfile,
  getDashboard,
  type UserProfileResponse,
} from "@/src/api/user";
import { requestUserHealthAnalysis } from "@/src/api/analysis";
import { guestAnalysisStorage } from "@/src/utils/guestAnalysisStorage";
import { analysisStorage } from "@/src/utils/analysisStorage";
import { storage } from "@/src/utils/storage";
import { clearHealthFlowComplete } from "@/src/utils/health-flow";
import { normalizeCheckupOcrResult } from "@/src/api/checkup";

type Gender = "" | "여성" | "남성";
type YesNo = "" | "예" | "아니오";

type FormState = {
  nickname: string;
  gender: Gender;
  birthYear: string;
  height: string;
  weight: string;

  systolic: string;
  diastolic: string;
  fastingGlucose: string;
  totalCholesterol: string;

  smoking: YesNo;
  smokingDetail: string;
  drinking: YesNo;
  drinkingDetail: string;
  exercise: YesNo;
  exerciseDetail: string;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;
type FieldTouched = Partial<Record<keyof FormState, boolean>>;

type DashboardResponse = UserProfileResponse & {
  height?: number | string;
  weight?: number | string;
  systolic_bp?: number | string;
  diastolic_bp?: number | string;
  total_cholesterol?: number | string;
  glucose?: number | string;
  smoke_yn?: boolean;
  alcohol_yn?: boolean;
  exercise_yn?: boolean;
};

type HealthRecordResponse = {
  record_id?: number;
  id?: number;
  user_id?: number;
  systolic_bp?: number;
  diastolic_bp?: number;
  total_cholesterol?: number;
  glucose?: number;
  height?: number;
  weight?: number;
  bmi?: number;
  smoke_yn?: boolean;
  alcohol_yn?: boolean;
  exercise_yn?: boolean;
  created_at?: string;
};

type DashboardProfile = {
  gender?: string;
  birth_year?: number | string;
  birthYear?: number | string;
};

const GUEST_MIGRATION_KEY = "guest-health-migration-payload";

const initialForm: FormState = {
  nickname: "",
  gender: "",
  birthYear: "",
  height: "",
  weight: "",

  systolic: "",
  diastolic: "",
  fastingGlucose: "",
  totalCholesterol: "",

  smoking: "",
  smokingDetail: "",
  drinking: "",
  drinkingDetail: "",
  exercise: "",
  exerciseDetail: "",
};

const totalSteps = 4;
const currentYear = new Date().getFullYear();

const RANGE = {
  birthYear: { min: 1900, max: currentYear },
  height: { min: 100, max: 250 },
  weight: { min: 20, max: 300 },
  systolic: { min: 60, max: 260 },
  diastolic: { min: 30, max: 180 },
  fastingGlucose: { min: 40, max: 500 },
  totalCholesterol: { min: 80, max: 500 },
};

const isValidTwoToFourDigits = (value: string) =>
  /^\d{2,4}$/.test(value.trim());

function parseNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function isInRange(value: string, min: number, max: number) {
  const parsed = parseNumber(value);
  if (parsed == null) return false;
  return parsed >= min && parsed <= max;
}

function toDisplayGender(value?: string | null): Gender {
  if (!value) return "";
  if (value === "M" || value === "남" || value === "남성") return "남성";
  if (value === "F" || value === "여" || value === "여성") return "여성";
  return "";
}

function toDisplayYesNo(value?: boolean | null): YesNo {
  if (value === true) return "예";
  if (value === false) return "아니오";
  return "";
}

function toDisplayNumber(value?: number | string | null) {
  if (value == null) return "";
  return String(value);
}

function toRoundedNumber(value?: number | string | null) {
  if (value == null) return "";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "";
  return String(Math.round(num));
}

function extractHealthRecords(raw: unknown): HealthRecordResponse[] {
  const data = raw as
    | HealthRecordResponse[]
    | { records?: HealthRecordResponse[]; data?: { records?: HealthRecordResponse[] } }
    | null;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.records)) return data.records;
  if (Array.isArray(data?.data?.records)) return data.data.records;
  return [];
}

function extractRecordId(res: any): number | null {
  const value =
    res?.record_id ??
    res?.id ??
    res?.data?.record_id ??
    res?.data?.id ??
    null;

  if (typeof value === "number") return value;
  if (typeof value === "string" && !Number.isNaN(Number(value))) {
    return Number(value);
  }

  return null;
}

function extractStatusFromError(error: any): number | null {
  const matchedStatus = error?.message?.match(/:\s(\d{3})\s/);

  return (
    error?.response?.status ??
    error?.status ??
    (matchedStatus ? Number(matchedStatus[1]) : null)
  );
}

export default function InputClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const mode = searchParams.get("mode") ?? "first";
  const isEditMode = mode === "edit";
  const isNewMode = mode === "new";
  const isFirstMode = mode === "first";
  const isOcrMode = mode === "ocr";

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [prefilling, setPrefilling] = useState(true);
  const [touched, setTouched] = useState<FieldTouched>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [ocrPrefilled, setOcrPrefilled] = useState(false);

  const [latestRecordId, setLatestRecordId] = useState<number | null>(null);

  const progress = ((step + 1) / totalSteps) * 100;

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      if (isOcrMode) {
        try {
          const stored = sessionStorage.getItem("ocr-result");

          if (stored) {
            const parsedRaw = JSON.parse(stored);
            const parsed = normalizeCheckupOcrResult(parsedRaw);

            if (!cancelled) {
              setForm((prev) => ({
                ...prev,
                birthYear: toDisplayNumber(parsed.birth_year) || prev.birthYear,
                gender: toDisplayGender(parsed.gender) || prev.gender,
                height: toDisplayNumber(parsed.height) || prev.height,
                weight: toDisplayNumber(parsed.weight) || prev.weight,
                systolic: toRoundedNumber(parsed.systolic_bp) || prev.systolic,
                diastolic: toRoundedNumber(parsed.diastolic_bp) || prev.diastolic,
                fastingGlucose: toRoundedNumber(parsed.glucose) || prev.fastingGlucose,
                totalCholesterol: toRoundedNumber(parsed.total_cholesterol) || prev.totalCholesterol,
              }));
              setOcrPrefilled(true);
            }

            sessionStorage.removeItem("ocr-result");
          }
        } catch (error) {
          console.error("OCR 결과 파싱 실패:", error);
        } finally {
          if (!cancelled) {
            setLatestRecordId(null);
            setPrefilling(false);
          }
        }
        return;
      }

      const token = storage.getAccessToken();

      if (isNewMode) {
        if (!cancelled) {
          setForm(initialForm);
          setLatestRecordId(null);
          setPrefilling(false);
          setOcrPrefilled(false);
        }
        return;
      }

      if (!token) {
        if (!cancelled) setPrefilling(false);
        return;
      }

      try {
        const [dashboardRes, recordsRes] = await Promise.all([
          getDashboard().catch((error) => {
            console.warn("dashboard 조회 실패:", error);
            return null;
          }),
          getHealthRecords().catch((error) => {
            console.warn("건강기록 조회 실패:", error);
            return [];
          }),
        ]);

        if (cancelled) return;

        const dashboard = (dashboardRes ?? null) as DashboardResponse | null;
        const records = extractHealthRecords(recordsRes);
        const latestRecord = records.length > 0 ? records[0] : null;

        if (isEditMode || isFirstMode) {
          setForm((prev) => ({
            ...prev,
            nickname: dashboard?.nickname ?? prev.nickname,
            gender: toDisplayGender(dashboard?.gender) || prev.gender,
            birthYear:
              toDisplayNumber(dashboard?.birth_year ?? dashboard?.birthYear) ||
              prev.birthYear,

            height:
              toDisplayNumber(latestRecord?.height ?? dashboard?.height) || "",
            weight:
              toDisplayNumber(latestRecord?.weight ?? dashboard?.weight) || "",
            systolic:
              toDisplayNumber(
                latestRecord?.systolic_bp ?? dashboard?.systolic_bp
              ) || "",
            diastolic:
              toDisplayNumber(
                latestRecord?.diastolic_bp ?? dashboard?.diastolic_bp
              ) || "",
            fastingGlucose:
              toDisplayNumber(latestRecord?.glucose ?? dashboard?.glucose) || "",
            totalCholesterol:
              toDisplayNumber(
                latestRecord?.total_cholesterol ?? dashboard?.total_cholesterol
              ) || "",

            smoking: toDisplayYesNo(
              latestRecord?.smoke_yn ?? dashboard?.smoke_yn
            ),
            smokingDetail: "",
            drinking: toDisplayYesNo(
              latestRecord?.alcohol_yn ?? dashboard?.alcohol_yn
            ),
            drinkingDetail: "",
            exercise: toDisplayYesNo(
              latestRecord?.exercise_yn ?? dashboard?.exercise_yn
            ),
            exerciseDetail: "",
          }));

          setLatestRecordId(latestRecord?.record_id ?? latestRecord?.id ?? null);
          setOcrPrefilled(false);
        }
      } catch (error) {
        console.warn("input 초기값 불러오기 실패:", error);
      } finally {
        if (!cancelled) setPrefilling(false);
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [isEditMode, isFirstMode, isNewMode, isOcrMode]);

  const guideMessage = useMemo(() => {
    if (ocrPrefilled && step === 0) {
      return {
        eyebrow: "buddy guide",
        title: "검진표에서 읽은 값이에요",
        desc: "자동으로 채워진 값이 맞는지 한 번 확인해보면 좋아요.",
      };
    }

    if (step === 0) {
      return {
        eyebrow: "buddy guide",
        title: "기본 정보부터 시작해요",
        desc: "먼저 간단한 정보를 알려주면 좋아요.",
      };
    }
    if (step === 1) {
      return {
        eyebrow: "buddy guide",
        title: "건강검진 수치를 입력해요",
        desc: "핵심 수치를 입력하면 분석 정확도가 높아져요.",
      };
    }
    if (step === 2) {
      return {
        eyebrow: "buddy guide",
        title: "생활습관을 체크해볼게요",
        desc: "흡연, 음주, 운동 습관은 건강 상태를 이해하는 데 중요한 정보예요.",
      };
    }
    return {
      eyebrow: "buddy guide",
      title: "이제 입력 내용을 확인해요",
      desc: "입력한 정보를 한 번 더 확인하고 건강 분석을 시작해요.",
    };
  }, [ocrPrefilled, step]);

  const guideVisual = useMemo(() => {
    if (step === 3) {
      return {
        imageSrc: "/images/buddy-review.png",
        imageAlt: "입력 내용을 확인하는 버디",
      };
    }

    return {
      imageSrc: "/images/buddy-input.png",
      imageAlt: "입력을 안내하는 버디",
    };
  }, [step]);

  const errors = useMemo<FieldErrors>(() => {
    const nextErrors: FieldErrors = {};

    if (!form.nickname.trim()) {
      nextErrors.nickname = "닉네임을 입력해주세요.";
    }

    if (!form.gender) {
      nextErrors.gender = "성별을 선택해주세요.";
    }

    if (!form.birthYear.trim()) {
      nextErrors.birthYear = "출생연도를 입력해주세요.";
    } else if (!/^\d{4}$/.test(form.birthYear.trim())) {
      nextErrors.birthYear = "출생연도는 4자리 숫자로 입력해주세요.";
    } else if (
      !isInRange(form.birthYear, RANGE.birthYear.min, RANGE.birthYear.max)
    ) {
      nextErrors.birthYear = `출생연도는 ${RANGE.birthYear.min}년부터 ${RANGE.birthYear.max}년 사이로 입력해주세요.`;
    }

    if (!form.height.trim()) {
      nextErrors.height = "신장을 입력해주세요.";
    } else if (!isValidTwoToFourDigits(form.height)) {
      nextErrors.height = "신장은 숫자로 입력해주세요.";
    } else if (!isInRange(form.height, RANGE.height.min, RANGE.height.max)) {
      nextErrors.height = `신장은 ${RANGE.height.min}cm부터 ${RANGE.height.max}cm 사이로 입력해주세요.`;
    }

    if (!form.weight.trim()) {
      nextErrors.weight = "체중을 입력해주세요.";
    } else if (!isValidTwoToFourDigits(form.weight)) {
      nextErrors.weight = "체중은 숫자로 입력해주세요.";
    } else if (!isInRange(form.weight, RANGE.weight.min, RANGE.weight.max)) {
      nextErrors.weight = `체중은 ${RANGE.weight.min}kg부터 ${RANGE.weight.max}kg 사이로 입력해주세요.`;
    }

    if (!form.systolic.trim()) {
      nextErrors.systolic = "수축기 혈압을 입력해주세요.";
    } else if (!isValidTwoToFourDigits(form.systolic)) {
      nextErrors.systolic = "수축기 혈압은 숫자로 입력해주세요.";
    } else if (
      !isInRange(form.systolic, RANGE.systolic.min, RANGE.systolic.max)
    ) {
      nextErrors.systolic = `수축기 혈압은 ${RANGE.systolic.min}부터 ${RANGE.systolic.max} 사이로 입력해주세요.`;
    }

    if (!form.diastolic.trim()) {
      nextErrors.diastolic = "이완기 혈압을 입력해주세요.";
    } else if (!isValidTwoToFourDigits(form.diastolic)) {
      nextErrors.diastolic = "이완기 혈압은 숫자로 입력해주세요.";
    } else if (
      !isInRange(form.diastolic, RANGE.diastolic.min, RANGE.diastolic.max)
    ) {
      nextErrors.diastolic = `이완기 혈압은 ${RANGE.diastolic.min}부터 ${RANGE.diastolic.max} 사이로 입력해주세요.`;
    }

    if (!form.fastingGlucose.trim()) {
      nextErrors.fastingGlucose = "공복 혈당을 입력해주세요.";
    } else if (!isValidTwoToFourDigits(form.fastingGlucose)) {
      nextErrors.fastingGlucose = "공복 혈당은 숫자로 입력해주세요.";
    } else if (
      !isInRange(
        form.fastingGlucose,
        RANGE.fastingGlucose.min,
        RANGE.fastingGlucose.max
      )
    ) {
      nextErrors.fastingGlucose = `공복 혈당은 ${RANGE.fastingGlucose.min}부터 ${RANGE.fastingGlucose.max} 사이로 입력해주세요.`;
    }

    if (!form.totalCholesterol.trim()) {
      nextErrors.totalCholesterol = "총 콜레스테롤을 입력해주세요.";
    } else if (!isValidTwoToFourDigits(form.totalCholesterol)) {
      nextErrors.totalCholesterol = "총 콜레스테롤은 숫자로 입력해주세요.";
    } else if (
      !isInRange(
        form.totalCholesterol,
        RANGE.totalCholesterol.min,
        RANGE.totalCholesterol.max
      )
    ) {
      nextErrors.totalCholesterol = `총 콜레스테롤은 ${RANGE.totalCholesterol.min}부터 ${RANGE.totalCholesterol.max} 사이로 입력해주세요.`;
    }

    if (!form.smoking) {
      nextErrors.smoking = "흡연 여부를 선택해주세요.";
    } else if (form.smoking === "예" && !form.smokingDetail.trim()) {
      nextErrors.smokingDetail = "흡연 빈도를 선택해주세요.";
    }

    if (!form.drinking) {
      nextErrors.drinking = "음주 여부를 선택해주세요.";
    } else if (form.drinking === "예" && !form.drinkingDetail.trim()) {
      nextErrors.drinkingDetail = "음주 빈도를 선택해주세요.";
    }

    if (!form.exercise) {
      nextErrors.exercise = "운동 여부를 선택해주세요.";
    } else if (form.exercise === "예" && !form.exerciseDetail.trim()) {
      nextErrors.exerciseDetail = "운동 빈도를 선택해주세요.";
    }

    return nextErrors;
  }, [form]);

  const visibleError = (field: keyof FormState) =>
    touched[field] || submitAttempted ? errors[field] : undefined;

  const isBasicValid =
    !errors.nickname &&
    !errors.gender &&
    !errors.birthYear &&
    !errors.height &&
    !errors.weight;

  const isHealthValid =
    !errors.systolic &&
    !errors.diastolic &&
    !errors.fastingGlucose &&
    !errors.totalCholesterol;

  const isHabitValid =
    !errors.smoking &&
    !errors.smokingDetail &&
    !errors.drinking &&
    !errors.drinkingDetail &&
    !errors.exercise &&
    !errors.exerciseDetail;

  const isAllValid = isBasicValid && isHealthValid && isHabitValid;

  const canGoNext =
    (step === 0 && isBasicValid) ||
    (step === 1 && isHealthValid) ||
    (step === 2 && isHabitValid) ||
    step === 3;

  const submitLabel = submitting
    ? isEditMode || isOcrMode
      ? "다시 분석 요청 중..."
      : "분석 요청 중..."
    : isEditMode || isOcrMode
    ? "다시 분석하기"
    : "건강 분석하기";

  const updateField = <K extends keyof FormState>(
    key: K,
    value: FormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const touchFields = (keys: (keyof FormState)[]) => {
    setTouched((prev) => {
      const next = { ...prev };
      keys.forEach((key) => {
        next[key] = true;
      });
      return next;
    });
  };

  const handleNext = () => {
    if (step === 0) {
      touchFields(["nickname", "gender", "birthYear", "height", "weight"]);
    }

    if (step === 1) {
      touchFields([
        "systolic",
        "diastolic",
        "fastingGlucose",
        "totalCholesterol",
      ]);
    }

    if (step === 2) {
      touchFields([
        "smoking",
        "smokingDetail",
        "drinking",
        "drinkingDetail",
        "exercise",
        "exerciseDetail",
      ]);
    }

    if (step < totalSteps - 1 && canGoNext) {
      setStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep((prev) => prev - 1);
    }
  };

  const buildCommonPayload = () => {
    const genderForUser: "M" | "F" = form.gender === "남성" ? "M" : "F";

    return {
      genderForUser,
      birthYear: Number(form.birthYear),
      healthPayload: {
        systolic_bp: Number(form.systolic),
        diastolic_bp: Number(form.diastolic),
        total_cholesterol: Number(form.totalCholesterol),
        glucose: Number(form.fastingGlucose),
        height: Number(form.height),
        weight: Number(form.weight),
        smoke_yn: form.smoking === "예",
        alcohol_yn: form.drinking === "예",
        exercise_yn: form.exercise === "예",
      },
      guestAnalysisPayload: {
        birth_date: `${form.birthYear}-01-01`,
        gender: genderForUser,
        height: Number(form.height),
        weight: Number(form.weight),
        systolic_bp: Number(form.systolic),
        diastolic_bp: Number(form.diastolic),
        total_cholesterol: Number(form.totalCholesterol),
        glucose: Number(form.fastingGlucose),
        smoke_yn: form.smoking === "예",
        alcohol_yn: form.drinking === "예",
        exercise_yn: form.exercise === "예",
      },
    };
  };

  const saveUserProfileSafely = async (payload: {
    nickname: string;
    gender: "M" | "F";
    birth_year: number;
  }) => {
    const dashboard = (await getDashboard().catch(() => null)) as
      | DashboardProfile
      | null;

    const hasInitialProfile =
      dashboard?.gender !== undefined &&
      dashboard?.gender !== null &&
      dashboard?.gender !== "";

    if (!hasInitialProfile) {
      try {
        await createInitialProfile(payload);
        return;
      } catch (error: any) {
        const status = extractStatusFromError(error);

        if (status === 409) {
          await updateUserProfile({
            nickname: payload.nickname,
            birth_year: payload.birth_year,
          });
          return;
        }

        throw error;
      }
    }

    await updateUserProfile({
      nickname: payload.nickname,
      birth_year: payload.birth_year,
    });
  };

  const handleAnalyze = async () => {
    setSubmitAttempted(true);
    touchFields([
      "nickname",
      "gender",
      "birthYear",
      "height",
      "weight",
      "systolic",
      "diastolic",
      "fastingGlucose",
      "totalCholesterol",
      "smoking",
      "smokingDetail",
      "drinking",
      "drinkingDetail",
      "exercise",
      "exerciseDetail",
    ]);

    if (!isAllValid || submitting) return;

    try {
      setSubmitting(true);

      const token = storage.getAccessToken();
      const {
        genderForUser,
        birthYear,
        healthPayload,
        guestAnalysisPayload,
      } = buildCommonPayload();

      clearHealthFlowComplete();
      analysisStorage.clearAll();
      storage.clearAnalysisCache();

      if (!token) {
        const guestNickname = form.nickname.trim();
        const guestBirthYear = Number(form.birthYear);

        sessionStorage.setItem(
          GUEST_MIGRATION_KEY,
          JSON.stringify({
            nickname: guestNickname,
            gender: genderForUser,
            birthYear,
            healthPayload,
          })
        );

        sessionStorage.setItem(
          "guest-profile",
          JSON.stringify({
            nickname: guestNickname,
            birthYear: guestBirthYear,
            birth_year: guestBirthYear,
          })
        );

        guestAnalysisStorage.setPendingFlow({
          nickname: guestNickname,
          birthYear: guestBirthYear,
          gender: genderForUser,
          healthPayload,
          guestAnalysisPayload,
        });

        const result = await requestGuestHealthAnalysis(guestAnalysisPayload);

        guestAnalysisStorage.clearTaskId();
        guestAnalysisStorage.clearResult();

        if (result?.task_id) {
          guestAnalysisStorage.setTaskId(result.task_id);
        }

        if (result?.result) {
          guestAnalysisStorage.setResult(result.result);
        }

        router.push("/analyzing");
        return;
      }

      await saveUserProfileSafely({
        nickname: form.nickname.trim(),
        gender: genderForUser,
        birth_year: birthYear,
      });

      let savedRecordId = latestRecordId;

      if (latestRecordId) {
        await patchHealthRecord(latestRecordId, healthPayload);
      } else {
        const createdRecord = await createHealthRecord(healthPayload);
        savedRecordId = extractRecordId(createdRecord);

        if (!savedRecordId) {
          const recordsAfterCreate = extractHealthRecords(await getHealthRecords());
          const newestRecord =
            recordsAfterCreate.length > 0 ? recordsAfterCreate[0] : null;

          savedRecordId = newestRecord?.record_id ?? newestRecord?.id ?? null;
        }
      }

      if (!savedRecordId) {
        throw new Error("건강 기록 저장 후 record_id를 찾을 수 없습니다.");
      }

      const analysisResult = await requestUserHealthAnalysis(savedRecordId);

      if (analysisResult?.status === "success") {
        analysisStorage.setResult(analysisResult);
        sessionStorage.setItem(
          "health-analysis-result",
          JSON.stringify(analysisResult)
        );
        sessionStorage.setItem("health-flow-complete", "true");
        router.push("/result");
        return;
      }

      const taskId =
        analysisResult?.task_id ??
        analysisResult?.id ??
        analysisResult?.data?.task_id;

      if (!taskId) {
        throw new Error("분석 task_id를 찾을 수 없습니다.");
      }

      sessionStorage.setItem(
        "health-analysis-task",
        JSON.stringify({
          taskId,
          recordId: savedRecordId,
        })
      );

      router.push("/analyzing");
    } catch (error) {
      console.error("건강 분석 요청 실패:", error);
      alert(
        error instanceof Error
          ? error.message
          : "건강 분석 요청에 실패했습니다."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#F7FBF8_0%,#EEF7F0_100%)] text-[#163126]">
      <header className="flex items-center justify-between px-4 py-5 sm:px-6 md:px-10">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-sm font-semibold text-[#163126]"
        >
          <span className="h-2.5 w-2.5 rounded-full bg-[#7EE8A7]" />
          MyHealthBuddy
        </button>

        <div className="rounded-full border border-[#163126]/10 bg-white/70 px-4 py-2 text-xs font-medium text-[#163126]/70 backdrop-blur-md md:text-sm">
          {step + 1} / {totalSteps}
        </div>
      </header>

      <section className="w-full px-4 pb-16 pt-2 sm:px-6 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 h-3 overflow-hidden rounded-full bg-[#163126]/8">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#7EE8A7,#B7F3C9)] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="mt-10 flex justify-center">
          <div className="grid w-full max-w-5xl items-start gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="hidden lg:flex lg:justify-end">
              <div className="mt-8 flex items-end gap-4">
                <div className="relative mt-4 w-[240px] rounded-[24px] border border-white/40 bg-white/72 px-5 py-5 shadow-[0_14px_40px_rgba(22,49,38,0.08)] backdrop-blur-xl">
                  <p className="text-sm font-medium text-[#2E7D5B]">
                    {guideMessage.eyebrow}
                  </p>
                  <p className="mt-2 text-[17px] font-bold leading-[1.45] text-[#163126] whitespace-normal break-keep">
                    {guideMessage.title}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[#163126]/68 whitespace-normal break-keep">
                    {guideMessage.desc}
                  </p>
                  <div className="absolute right-[-8px] top-8 h-4 w-4 rotate-45 border-r border-t border-white/40 bg-white/72" />
                </div>

                <div className="flex h-[190px] w-[190px] shrink-0 items-end justify-center">
                  <img
                    src={guideVisual.imageSrc}
                    alt={guideVisual.imageAlt}
                    className="h-[180px] w-[180px] object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.08)]"
                  />
                </div>
              </div>
            </aside>

            <div className="lg:hidden">
              <div className="mx-auto mb-6 flex max-w-3xl items-start gap-3 rounded-[24px] border border-white/40 bg-white/68 p-4 shadow-[0_14px_40px_rgba(22,49,38,0.06)] backdrop-blur-xl">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-[#2E7D5B]">
                    {guideMessage.eyebrow}
                  </p>
                  <p className="mt-1 text-base font-bold leading-[1.5] text-[#163126] whitespace-normal break-keep">
                    {guideMessage.title}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[#163126]/68 whitespace-normal break-keep">
                    {guideMessage.desc}
                  </p>
                </div>

                <div className="flex h-[96px] w-[96px] shrink-0 items-end justify-center">
                  <img
                    src={guideVisual.imageSrc}
                    alt={guideVisual.imageAlt}
                    className="h-[88px] w-[88px] object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.08)]"
                  />
                </div>
              </div>
            </div>

            <div className="w-full">
              <section className="mx-auto w-full max-w-4xl rounded-[28px] border border-white/40 bg-white/55 p-5 shadow-[0_18px_50px_rgba(46,125,91,0.08)] backdrop-blur-xl sm:p-6 md:rounded-[40px] md:p-8 lg:p-10">
                {prefilling ? (
                  <div className="flex min-h-[360px] items-center justify-center">
                    <p className="text-sm text-[#163126]/55">
                      기존 입력 정보를 불러오는 중이에요...
                    </p>
                  </div>
                ) : null}

                {!prefilling && step === 0 && (
                  <div>
                    <StepHeader
                      eyebrow="basic info"
                      title="기본 정보 입력"
                      desc={
                        ocrPrefilled
                          ? "건강검진표에서 읽은 값을 바탕으로 일부 항목이 자동으로 채워졌어요. 맞는지 확인하고 수정해주세요."
                          : "최근 건강검진 수치와 생활습관 정보를 입력하면 결과를 분석해드려요."
                      }
                    />

                    <div className="mb-5 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            `/health/upload-checkup?mode=${
                              isEditMode ? "reanalyze" : "first"
                            }`
                          )
                        }
                        className="rounded-full border border-[#163126]/10 bg-white px-4 py-2 text-sm font-semibold text-[#163126] transition hover:bg-[#f7faf8]"
                      >
                        건강검진표 업로드로 자동 입력
                      </button>

                      {ocrPrefilled ? (
                        <span className="inline-flex items-center rounded-full bg-[#EAF6EC] px-4 py-2 text-sm font-semibold text-[#2E7D5B]">
                          검진표 기반 자동 입력됨
                        </span>
                      ) : null}
                    </div>

                    <p className="mb-5 text-xs leading-6 text-[#163126]/45 md:text-sm">
                      키와 몸무게는 소수점 없이 입력해주세요. 소수점 값은 반올림해서 입력하면 돼요.
                    </p>

                    <div className="grid gap-5 md:grid-cols-2">
                      <InputField
                        label="닉네임"
                        placeholder="사용하실 닉네임을 입력해주세요"
                        value={form.nickname}
                        onChange={(v) => updateField("nickname", v)}
                        onBlur={() =>
                          setTouched((prev) => ({ ...prev, nickname: true }))
                        }
                        error={visibleError("nickname")}
                      />

                      <SelectField
                        label="성별"
                        value={form.gender}
                        onChange={(v) => {
                          updateField("gender", v as Gender);
                          setTouched((prev) => ({ ...prev, gender: true }));
                        }}
                        options={["여성", "남성"]}
                        placeholder="선택해주세요"
                        error={visibleError("gender")}
                      />

                      <InputField
                        label="출생연도"
                        placeholder="예: 1996"
                        value={form.birthYear}
                        onChange={(v) => updateField("birthYear", v)}
                        onBlur={() =>
                          setTouched((prev) => ({ ...prev, birthYear: true }))
                        }
                        type="number"
                        error={visibleError("birthYear")}
                      />

                      <InputField
                        label="신장(cm)"
                        placeholder="예: 170"
                        value={form.height}
                        onChange={(v) => updateField("height", v)}
                        onBlur={() =>
                          setTouched((prev) => ({ ...prev, height: true }))
                        }
                        type="number"
                        error={visibleError("height")}
                      />

                      <InputField
                        label="체중(kg)"
                        placeholder="예: 60"
                        value={form.weight}
                        onChange={(v) => updateField("weight", v)}
                        onBlur={() =>
                          setTouched((prev) => ({ ...prev, weight: true }))
                        }
                        type="number"
                        error={visibleError("weight")}
                      />
                    </div>
                  </div>
                )}

                {!prefilling && step === 1 && (
                  <div>
                    <StepHeader
                      eyebrow="health metrics"
                      title="건강검진 수치 입력"
                      desc="복잡한 항목은 빼고, 핵심 수치만 먼저 입력해볼게요."
                    />

                    <div className="grid gap-5 md:grid-cols-2">
                      <InputField
                        label="수축기 혈압(mmHg)"
                        placeholder="예: 120"
                        value={form.systolic}
                        onChange={(v) => updateField("systolic", v)}
                        onBlur={() =>
                          setTouched((prev) => ({ ...prev, systolic: true }))
                        }
                        type="number"
                        error={visibleError("systolic")}
                      />

                      <InputField
                        label="이완기 혈압(mmHg)"
                        placeholder="예: 80"
                        value={form.diastolic}
                        onChange={(v) => updateField("diastolic", v)}
                        onBlur={() =>
                          setTouched((prev) => ({ ...prev, diastolic: true }))
                        }
                        type="number"
                        error={visibleError("diastolic")}
                      />

                      <InputField
                        label="공복 혈당(mg/dL)"
                        placeholder="예: 95"
                        value={form.fastingGlucose}
                        onChange={(v) => updateField("fastingGlucose", v)}
                        onBlur={() =>
                          setTouched((prev) => ({
                            ...prev,
                            fastingGlucose: true,
                          }))
                        }
                        type="number"
                        error={visibleError("fastingGlucose")}
                      />

                      <InputField
                        label="총 콜레스테롤(mg/dL)"
                        placeholder="예: 180"
                        value={form.totalCholesterol}
                        onChange={(v) => updateField("totalCholesterol", v)}
                        onBlur={() =>
                          setTouched((prev) => ({
                            ...prev,
                            totalCholesterol: true,
                          }))
                        }
                        type="number"
                        error={visibleError("totalCholesterol")}
                      />
                    </div>
                  </div>
                )}

                {!prefilling && step === 2 && (
                  <div>
                    <StepHeader
                      eyebrow="lifestyle"
                      title="생활습관 정보 입력"
                      desc="예 항목을 선택하면 추가 질문이 열려요."
                    />

                    <div className="grid gap-6">
                      <HabitBlock
                        title="흡연 여부"
                        value={form.smoking}
                        onChange={(v) => {
                          updateField("smoking", v as YesNo);
                          setTouched((prev) => ({ ...prev, smoking: true }));
                          if (v === "아니오") updateField("smokingDetail", "");
                        }}
                        detailValue={form.smokingDetail}
                        detailPlaceholder="흡연 빈도 선택"
                        detailOptions={[
                          "하루 3개비 이하",
                          "하루 4-10개비",
                          "하루 10개비 이상",
                        ]}
                        onDetailChange={(v) => {
                          updateField("smokingDetail", v);
                          setTouched((prev) => ({
                            ...prev,
                            smokingDetail: true,
                          }));
                        }}
                        error={visibleError("smoking")}
                        detailError={visibleError("smokingDetail")}
                      />

                      <HabitBlock
                        title="음주 여부"
                        value={form.drinking}
                        onChange={(v) => {
                          updateField("drinking", v as YesNo);
                          setTouched((prev) => ({ ...prev, drinking: true }));
                          if (v === "아니오") updateField("drinkingDetail", "");
                        }}
                        detailValue={form.drinkingDetail}
                        detailPlaceholder="음주 빈도 선택"
                        detailOptions={["주 1회", "주 2~3회", "주 4회 이상"]}
                        onDetailChange={(v) => {
                          updateField("drinkingDetail", v);
                          setTouched((prev) => ({
                            ...prev,
                            drinkingDetail: true,
                          }));
                        }}
                        error={visibleError("drinking")}
                        detailError={visibleError("drinkingDetail")}
                      />

                      <HabitBlock
                        title="운동 여부"
                        value={form.exercise}
                        onChange={(v) => {
                          updateField("exercise", v as YesNo);
                          setTouched((prev) => ({ ...prev, exercise: true }));
                          if (v === "아니오") updateField("exerciseDetail", "");
                        }}
                        detailValue={form.exerciseDetail}
                        detailPlaceholder="운동 빈도 선택"
                        detailOptions={[
                          "가끔",
                          "주 1~2회",
                          "주 3~4회",
                          "주 5회 이상",
                        ]}
                        onDetailChange={(v) => {
                          updateField("exerciseDetail", v);
                          setTouched((prev) => ({
                            ...prev,
                            exerciseDetail: true,
                          }));
                        }}
                        error={visibleError("exercise")}
                        detailError={visibleError("exerciseDetail")}
                      />
                    </div>
                  </div>
                )}

                {!prefilling && step === 3 && (
                  <div>
                    <StepHeader
                      eyebrow="review"
                      title="입력 내용을 확인해주세요"
                      desc="모든 항목이 입력되면 건강 분석하기 버튼이 활성화돼요."
                    />

                    <div className="grid gap-4">
                      <ReviewCard
                        title="기본 정보"
                        items={[
                          ["닉네임", form.nickname],
                          ["성별", form.gender],
                          ["출생연도", form.birthYear],
                          ["신장", `${form.height} cm`],
                          ["체중", `${form.weight} kg`],
                        ]}
                      />

                      <ReviewCard
                        title="건강검진 수치"
                        items={[
                          ["수축기 혈압", `${form.systolic} mmHg`],
                          ["이완기 혈압", `${form.diastolic} mmHg`],
                          ["공복 혈당", `${form.fastingGlucose} mg/dL`],
                          ["총 콜레스테롤", `${form.totalCholesterol} mg/dL`],
                        ]}
                      />

                      <ReviewCard
                        title="생활습관"
                        items={[
                          ["흡연 여부", form.smoking],
                          [
                            "흡연 빈도",
                            form.smoking === "예" ? form.smokingDetail : "-",
                          ],
                          ["음주 여부", form.drinking],
                          [
                            "음주 빈도",
                            form.drinking === "예" ? form.drinkingDetail : "-",
                          ],
                          ["운동 여부", form.exercise],
                          [
                            "운동 빈도",
                            form.exercise === "예" ? form.exerciseDetail : "-",
                          ],
                        ]}
                      />
                    </div>
                  </div>
                )}
              </section>

              <div className="mx-auto mt-8 flex w-full max-w-4xl flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  onClick={handlePrev}
                  disabled={step === 0 || prefilling}
                  className="w-full rounded-full border border-[#163126]/10 bg-white/72 px-6 py-3 text-sm font-semibold text-[#163126] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-35 sm:w-auto"
                >
                  이전
                </button>

                {step < totalSteps - 1 ? (
                  <button
                    onClick={handleNext}
                    disabled={!canGoNext || prefilling}
                    className="w-full rounded-full bg-[#163126] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#1d4232] disabled:cursor-not-allowed disabled:bg-[#163126]/25 sm:w-auto"
                  >
                    다음
                  </button>
                ) : (
                  <button
                    onClick={handleAnalyze}
                    disabled={!isAllValid || submitting || prefilling}
                    className="w-full rounded-full bg-[#163126] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#1d4232] disabled:cursor-not-allowed disabled:bg-[#163126]/25 sm:w-auto"
                  >
                    {submitLabel}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function StepHeader({
  eyebrow,
  title,
  desc,
}: {
  eyebrow: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="mb-9 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#2E7D5B]">
        {eyebrow}
      </p>
      <h1 className="mt-3 text-2xl font-bold leading-tight text-[#163126] sm:text-3xl md:text-4xl lg:text-5xl">
        {title}
      </h1>
      <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-[#163126]/68 md:text-base md:leading-7">
        {desc}
      </p>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  type = "text",
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder: string;
  type?: string;
  error?: string;
}) {
  const isNumberField = type === "number";

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-[#163126]/82">
        {label}
      </span>
      <input
        type={isNumberField ? "text" : type}
        inputMode={isNumberField ? "numeric" : undefined}
        value={value}
        onBlur={onBlur}
        onChange={(e) => {
          if (isNumberField) {
            const onlyNumber = e.target.value.replace(/\D/g, "");
            if (onlyNumber.length <= 4) {
              onChange(onlyNumber);
            }
            return;
          }

          onChange(e.target.value);
        }}
        placeholder={placeholder}
        className={`h-12 w-full rounded-2xl border bg-white/76 px-4 text-sm text-[#163126] outline-none backdrop-blur-md placeholder:text-[#163126]/35 sm:h-[52px] md:h-14 md:px-5 ${
          error
            ? "border-[#e58b8b] focus:border-[#d8614d]"
            : "border-white/40 focus:border-[#7EE8A7]"
        }`}
      />
      {error ? (
        <p className="mt-2 text-xs leading-5 text-[#d8614d]">{error}</p>
      ) : null}
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-[#163126]/82">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-12 w-full rounded-2xl border bg-white/76 px-4 text-sm text-[#163126] outline-none backdrop-blur-md sm:h-[52px] md:h-14 md:px-5 ${
          error
            ? "border-[#e58b8b] focus:border-[#d8614d]"
            : "border-white/40 focus:border-[#7EE8A7]"
        }`}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
      {error ? (
        <p className="mt-2 text-xs leading-5 text-[#d8614d]">{error}</p>
      ) : null}
    </label>
  );
}

function YesNoToggle({
  value,
  onChange,
  error,
}: {
  value: YesNo;
  onChange: (v: YesNo) => void;
  error?: string;
}) {
  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {(["예", "아니오"] as const).map((item) => {
          const active = value === item;
          return (
            <button
              key={item}
              type="button"
              onClick={() => onChange(item)}
              className={`rounded-2xl px-5 py-3 text-sm font-semibold transition ${
                active
                  ? "bg-[#163126] text-white shadow-[0_12px_24px_rgba(22,49,38,0.12)]"
                  : error
                  ? "border border-[#e58b8b] bg-white/76 text-[#163126]/70"
                  : "border border-white/40 bg-white/76 text-[#163126]/70"
              }`}
            >
              {item}
            </button>
          );
        })}
      </div>

      {error ? (
        <p className="mt-2 text-xs leading-5 text-[#d8614d]">{error}</p>
      ) : null}
    </div>
  );
}

function HabitBlock({
  title,
  value,
  onChange,
  detailValue,
  detailPlaceholder,
  detailOptions,
  onDetailChange,
  error,
  detailError,
}: {
  title: string;
  value: YesNo;
  onChange: (v: YesNo) => void;
  detailValue: string;
  detailPlaceholder: string;
  detailOptions: string[];
  onDetailChange: (v: string) => void;
  error?: string;
  detailError?: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/40 bg-white/48 p-4 backdrop-blur-xl md:rounded-[28px] md:p-5">
      <p className="mb-3 text-sm font-medium text-[#163126]/85">{title}</p>
      <YesNoToggle value={value} onChange={onChange} error={error} />

      {value === "예" && (
        <div className="mt-4">
          <SelectField
            label="세부 정보"
            value={detailValue}
            onChange={onDetailChange}
            options={detailOptions}
            placeholder={detailPlaceholder}
            error={detailError}
          />
        </div>
      )}
    </div>
  );
}

function ReviewCard({
  title,
  items,
}: {
  title: string;
  items: [string, string][];
}) {
  return (
    <div className="rounded-[24px] border border-white/40 bg-white/48 p-4 backdrop-blur-xl md:rounded-[28px] md:p-5">
      <h3 className="text-lg font-bold text-[#163126]">{title}</h3>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {items.map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-white/30 bg-white/60 px-4 py-3"
          >
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#2E7D5B]">
              {label}
            </p>
            <p className="mt-1 text-sm font-semibold text-[#163126]">
              {value || "-"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}