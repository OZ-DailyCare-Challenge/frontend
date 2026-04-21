"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  requestGuestHealthAnalysis,
  createHealthRecord,
  getHealthRecords,
  patchHealthRecord,
} from "@/src/api/health";
import { createInitialProfile, updateUserProfile } from "@/src/api/user";
import { requestUserHealthAnalysis } from "@/src/api/analysis";
import { guestAnalysisStorage } from "@/src/utils/guestAnalysisStorage";
import { storage } from "@/src/utils/storage";

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

const isValidTwoToFourDigits = (value: string) =>
  /^\d{2,4}$/.test(value.trim());

export default function InputPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const progress = ((step + 1) / totalSteps) * 100;

  const guideMessage = useMemo(() => {
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
        title: "생활습관도 함께 볼게요",
        desc: "흡연, 음주, 운동 습관은 중요한 건강 신호예요.",
      };
    }
    return {
      eyebrow: "buddy guide",
      title: "이제 확인만 하면 돼요",
      desc: "입력한 내용을 확인하고 건강 분석을 시작해요.",
    };
  }, [step]);

  const isBasicValid = Boolean(
    form.nickname.trim() &&
      form.gender &&
      form.birthYear.trim() &&
      form.height.trim() &&
      form.weight.trim()
  );

  const isHealthValid = Boolean(
    isValidTwoToFourDigits(form.systolic) &&
      isValidTwoToFourDigits(form.diastolic) &&
      isValidTwoToFourDigits(form.fastingGlucose) &&
      isValidTwoToFourDigits(form.totalCholesterol)
  );

  const isHabitValid = Boolean(
    form.smoking &&
      form.drinking &&
      form.exercise &&
      (form.smoking === "아니오" || form.smokingDetail.trim()) &&
      (form.drinking === "아니오" || form.drinkingDetail.trim()) &&
      (form.exercise === "아니오" || form.exerciseDetail.trim())
  );

  const isAllValid = isBasicValid && isHealthValid && isHabitValid;

  const canGoNext =
    (step === 0 && isBasicValid) ||
    (step === 1 && isHealthValid) ||
    (step === 2 && isHabitValid) ||
    step === 3;

  const updateField = <K extends keyof FormState>(
    key: K,
    value: FormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
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
    const genderForGuest: "M" | "F" = form.gender === "남성" ? "M" : "F";

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
        gender: genderForGuest,
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

  const extractRecordId = (res: any): number | null => {
    const value =
      res?.record_id ??
      res?.id ??
      res?.data?.record_id ??
      res?.data?.id ??
      null;

    return typeof value === "number" ? value : null;
  };

  const handleAnalyze = async () => {
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

      sessionStorage.removeItem("health-analysis-task");
      sessionStorage.removeItem("health-analysis-result");

      if (!token) {
        const guestNickname = form.nickname.trim();
        const guestBirthYear = Number(form.birthYear);

        sessionStorage.setItem(
          "guest-profile",
          JSON.stringify({
            nickname: guestNickname,
            birthYear: guestBirthYear,
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

        if (result.task_id) {
          guestAnalysisStorage.setTaskId(result.task_id);
        }

        if (result.result) {
          guestAnalysisStorage.setResult(result.result);
        }

        router.push("/analyzing");
        return;
      }

      try {
        await createInitialProfile({
          nickname: form.nickname.trim(),
          gender: genderForUser,
          birth_year: birthYear,
        });
      } catch (error: any) {
        const status = error?.response?.status ?? error?.status ?? null;

        if (status === 409) {
          try {
            await updateUserProfile({
              nickname: form.nickname.trim(),
              birth_year: birthYear,
            });
          } catch (patchError) {
            console.warn("프로필 업데이트 실패 (분석은 계속 진행):", patchError);
          }
        } else {
          throw error;
        }
      }

      const recordsBeforeSave = await getHealthRecords();
      const latestRecordBeforeSave =
        Array.isArray(recordsBeforeSave) && recordsBeforeSave.length > 0
          ? recordsBeforeSave[0]
          : null;

      let savedRecordId: number | null = null;

      if (latestRecordBeforeSave?.record_id) {
        await patchHealthRecord(latestRecordBeforeSave.record_id, healthPayload);
        savedRecordId = latestRecordBeforeSave.record_id;
      } else {
        const createdRecord = await createHealthRecord(healthPayload);
        savedRecordId = extractRecordId(createdRecord);

        if (!savedRecordId) {
          const recordsAfterCreate = await getHealthRecords();
          const newestRecord =
            Array.isArray(recordsAfterCreate) && recordsAfterCreate.length > 0
              ? recordsAfterCreate[0]
              : null;

          savedRecordId = extractRecordId(newestRecord);
        }
      }

      if (!savedRecordId) {
        throw new Error("건강 기록 저장 후 record_id를 찾을 수 없습니다.");
      }

      const analysisResult = await requestUserHealthAnalysis(savedRecordId);

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

      sessionStorage.setItem("health-flow-complete", "true");

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
    <main className="min-h-screen overflow-x-hidden bg-white text-[#163126]">
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
          <div className="grid w-full max-w-5xl items-start gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
            <aside className="hidden lg:flex lg:justify-end">
              <div className="mt-6 flex items-start gap-4">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[32px] border border-white/40 bg-[radial-gradient(circle_at_35%_30%,rgba(255,255,255,0.55),rgba(255,255,255,0.12)),linear-gradient(180deg,#c8f7d8,#9ee5b7)] text-4xl shadow-[0_16px_40px_rgba(131,182,149,0.12)]">
                  🐹
                </div>

                <div className="relative mt-3 max-w-[180px] rounded-[24px] border border-white/40 bg-white/72 px-4 py-4 shadow-[0_14px_40px_rgba(22,49,38,0.08)] backdrop-blur-xl">
                  <p className="text-sm font-medium text-[#2E7D5B]">
                    {guideMessage.eyebrow}
                  </p>
                  <p className="mt-2 text-lg font-bold leading-snug text-[#163126]">
                    {guideMessage.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#163126]/68">
                    {guideMessage.desc}
                  </p>
                  <div className="absolute left-[-8px] top-8 h-4 w-4 rotate-45 border-b border-l border-white/40 bg-white/72" />
                </div>
              </div>
            </aside>

            <div className="lg:hidden">
              <div className="mx-auto mb-6 flex max-w-3xl items-start gap-3 rounded-[24px] border border-white/40 bg-white/68 p-4 shadow-[0_14px_40px_rgba(22,49,38,0.06)] backdrop-blur-xl">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] border border-white/40 bg-[radial-gradient(circle_at_35%_30%,rgba(255,255,255,0.55),rgba(255,255,255,0.12)),linear-gradient(180deg,#c8f7d8,#9ee5b7)] text-2xl">
                  🐹
                </div>
                <div>
                  <p className="text-xs font-medium text-[#2E7D5B]">
                    {guideMessage.eyebrow}
                  </p>
                  <p className="mt-1 text-base font-bold leading-snug text-[#163126]">
                    {guideMessage.title}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[#163126]/68">
                    {guideMessage.desc}
                  </p>
                </div>
              </div>
            </div>

            <div className="w-full">
              <section className="mx-auto w-full max-w-3xl rounded-[28px] border border-white/40 bg-white/55 p-5 shadow-[0_18px_50px_rgba(46,125,91,0.08)] backdrop-blur-xl sm:p-6 md:rounded-[40px] md:p-8 lg:p-10">
                {step === 0 && (
                  <div>
                    <StepHeader
                      eyebrow="basic info"
                      title="기본 정보 입력"
                      desc="최근 건강검진 수치와 생활습관 정보를 입력하면 결과를 분석해드려요."
                    />

                    <div className="grid gap-5 md:grid-cols-2">
                      <InputField
                        label="닉네임"
                        placeholder="사용하실 닉네임을 입력해주세요"
                        value={form.nickname}
                        onChange={(v) => updateField("nickname", v)}
                      />

                      <SelectField
                        label="성별"
                        value={form.gender}
                        onChange={(v) => updateField("gender", v as Gender)}
                        options={["여성", "남성"]}
                        placeholder="선택해주세요"
                      />

                      <InputField
                        label="출생연도"
                        placeholder="예: 1996"
                        value={form.birthYear}
                        onChange={(v) => updateField("birthYear", v)}
                        type="number"
                      />

                      <InputField
                        label="신장(cm)"
                        placeholder="예: 170"
                        value={form.height}
                        onChange={(v) => updateField("height", v)}
                        type="number"
                      />

                      <InputField
                        label="체중(kg)"
                        placeholder="예: 60"
                        value={form.weight}
                        onChange={(v) => updateField("weight", v)}
                        type="number"
                      />
                    </div>
                  </div>
                )}

                {step === 1 && (
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
                        type="number"
                      />

                      <InputField
                        label="이완기 혈압(mmHg)"
                        placeholder="예: 80"
                        value={form.diastolic}
                        onChange={(v) => updateField("diastolic", v)}
                        type="number"
                      />

                      <InputField
                        label="공복 혈당(mg/dL)"
                        placeholder="예: 95"
                        value={form.fastingGlucose}
                        onChange={(v) => updateField("fastingGlucose", v)}
                        type="number"
                      />

                      <InputField
                        label="총 콜레스테롤(mg/dL)"
                        placeholder="예: 180"
                        value={form.totalCholesterol}
                        onChange={(v) => updateField("totalCholesterol", v)}
                        type="number"
                      />
                    </div>
                  </div>
                )}

                {step === 2 && (
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
                          if (v === "아니오") updateField("smokingDetail", "");
                        }}
                        detailValue={form.smokingDetail}
                        detailPlaceholder="흡연 빈도 선택"
                        detailOptions={[
                          "하루 3개비 이하",
                          "하루 4-10개비",
                          "하루 10개비 이상",
                        ]}
                        onDetailChange={(v) => updateField("smokingDetail", v)}
                      />

                      <HabitBlock
                        title="음주 여부"
                        value={form.drinking}
                        onChange={(v) => {
                          updateField("drinking", v as YesNo);
                          if (v === "아니오") updateField("drinkingDetail", "");
                        }}
                        detailValue={form.drinkingDetail}
                        detailPlaceholder="음주 빈도 선택"
                        detailOptions={["주 1회", "주 2~3회", "주 4회 이상"]}
                        onDetailChange={(v) => updateField("drinkingDetail", v)}
                      />

                      <HabitBlock
                        title="운동 여부"
                        value={form.exercise}
                        onChange={(v) => {
                          updateField("exercise", v as YesNo);
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
                        onDetailChange={(v) => updateField("exerciseDetail", v)}
                      />
                    </div>
                  </div>
                )}

                {step === 3 && (
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

              <div className="mx-auto mt-8 flex w-full max-w-3xl flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  onClick={handlePrev}
                  disabled={step === 0}
                  className="w-full rounded-full border border-[#163126]/10 bg-white/72 px-6 py-3 text-sm font-semibold text-[#163126] transition disabled:cursor-not-allowed disabled:opacity-35 sm:w-auto"
                >
                  이전
                </button>

                {step < totalSteps - 1 ? (
                  <button
                    onClick={handleNext}
                    disabled={!canGoNext}
                    className="w-full rounded-full bg-[#163126] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#1d4232] disabled:cursor-not-allowed disabled:bg-[#163126]/25 sm:w-auto"
                  >
                    다음
                  </button>
                ) : (
                  <button
                    onClick={handleAnalyze}
                    disabled={!isAllValid || submitting}
                    className="w-full rounded-full bg-[#163126] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#1d4232] disabled:cursor-not-allowed disabled:bg-[#163126]/25 sm:w-auto"
                  >
                    {submitting ? "분석 요청 중..." : "건강 분석하기"}
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
      <h1 className="mt-3 text-2xl font-bold leading-tight sm:text-3xl md:text-4xl lg:text-5xl">
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
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
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
        className="h-12 w-full rounded-xl border border-white/40 bg-white/76 px-4 text-sm text-[#163126] outline-none backdrop-blur-md placeholder:text-[#163126]/35 focus:border-[#7EE8A7] sm:h-[52px] md:h-14 md:rounded-2xl md:px-5"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-[#163126]/82">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-xl border border-white/40 bg-white/76 px-4 text-sm text-[#163126] outline-none backdrop-blur-md focus:border-[#7EE8A7] sm:h-[52px] md:h-14 md:rounded-2xl md:px-5"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function YesNoToggle({
  value,
  onChange,
}: {
  value: YesNo;
  onChange: (v: YesNo) => void;
}) {
  return (
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
                : "border border-white/40 bg-white/76 text-[#163126]/70"
            }`}
          >
            {item}
          </button>
        );
      })}
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
}: {
  title: string;
  value: YesNo;
  onChange: (v: YesNo) => void;
  detailValue: string;
  detailPlaceholder: string;
  detailOptions: string[];
  onDetailChange: (v: string) => void;
}) {
  return (
    <div className="rounded-[24px] border border-white/40 bg-white/48 p-4 backdrop-blur-xl md:rounded-[28px] md:p-5">
      <p className="mb-3 text-sm font-medium text-[#163126]/85">{title}</p>
      <YesNoToggle value={value} onChange={onChange} />

      {value === "예" && (
        <div className="mt-4">
          <SelectField
            label="세부 정보"
            value={detailValue}
            onChange={onDetailChange}
            options={detailOptions}
            placeholder={detailPlaceholder}
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