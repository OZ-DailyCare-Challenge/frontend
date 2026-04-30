"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  ChevronLeft,
  HeartPulse,
  LogOut,
  Settings,
  ShieldAlert,
  Sparkles,
  UserRound,
} from "lucide-react";
import {
  getDashboard,
  updateUserProfile,
  withdrawUser,
  logoutUser,
} from "@/src/api/user";
import {
  getAnalysisHistory,
  getAnalysisResultsByRecord,
  type AnalysisHistoryItem,
} from "@/src/api/analysis";
import { getHealthRecords, patchHealthRecord } from "@/src/api/health";
import { storage } from "@/src/utils/storage";
import type {
  HealthRecord,
  NotificationSettings,
  UpdateHealthRecordPayload,
  UpdateUserProfilePayload,
  UserProfile,
  WithdrawReason,
} from "@/src/types/mypage";

type ProfileForm = {
  nickname: string;
  birth_year: string;
  gender: string;
  profile_image: string;
};

type HealthForm = {
  systolic_bp: string;
  diastolic_bp: string;
  total_cholesterol: string;
  glucose: string;
  height: string;
  weight: string;
  smoke_yn: boolean;
  alcohol_yn: boolean;
  exercise_yn: boolean;
};

type MyPageView =
  | "overview"
  | "profile"
  | "health"
  | "analysis"
  | "notifications"
  | "account";

type HealthRecordLike = HealthRecord & {
  id?: number;
  data?: {
    record_id?: number;
    id?: number;
  };
};

function resolveRecordId(
  record: HealthRecordLike | null | undefined
): number | null {
  if (!record) return null;

  const id =
    record.record_id ??
    record.id ??
    record.data?.record_id ??
    record.data?.id;

  return typeof id === "number" && Number.isFinite(id) ? id : null;
}

function normalizeHealthRecord(record: unknown): HealthRecord | null {
  if (!record || typeof record !== "object") return null;

  const source = record as HealthRecordLike;
  const resolvedRecordId = resolveRecordId(source);

  if (!resolvedRecordId) return null;

  return {
    ...source,
    record_id: resolvedRecordId,
  };
}

function formatGender(value?: string) {
  if (!value) return "-";

  const normalized = value.trim().toUpperCase();

  if (normalized === "M" || normalized === "MALE" || value === "남") {
    return "남";
  }

  if (normalized === "F" || normalized === "FEMALE" || value === "여") {
    return "여";
  }

  return value;
}

function formatDateTime(value?: string) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRiskLabel(value?: string) {
  if (!value) return "-";

  const normalized = value.trim().toLowerCase();

  if (normalized.includes("high")) return "높음";
  if (normalized.includes("medium")) return "보통";
  if (normalized.includes("low")) return "낮음";

  return value;
}

export default function MyPageContent() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [healthRecord, setHealthRecord] = useState<HealthRecord | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistoryItem[]>(
    []
  );
  const [selectedAnalysisGroup, setSelectedAnalysisGroup] = useState<
    AnalysisHistoryItem[]
  >([]);
  const [selectedAnalysisRecordId, setSelectedAnalysisRecordId] = useState<
    number | null
  >(null);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<number | null>(
    null
  );

  const [activeView, setActiveView] = useState<MyPageView>("overview");

  const [profileForm, setProfileForm] = useState<ProfileForm>({
    nickname: "",
    birth_year: "",
    gender: "",
    profile_image: "",
  });

  const [healthForm, setHealthForm] = useState<HealthForm>({
    systolic_bp: "",
    diastolic_bp: "",
    total_cholesterol: "",
    glucose: "",
    height: "",
    weight: "",
    smoke_yn: false,
    alcohol_yn: false,
    exercise_yn: false,
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    challengeAlert: true,
    friendCheerAlert: false,
  });

  const [loadingInit, setLoadingInit] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [loadingAnalysisDetail, setLoadingAnalysisDetail] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState<WithdrawReason>("");
  const [withdrawDetail, setWithdrawDetail] = useState("");
  const [loadError, setLoadError] = useState("");
  const analysisDetailRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        setLoadingInit(true);
        setLoadError("");

        const [dashboard, recordsResponse, analysisResponse] = await Promise.all(
          [getDashboard(), getHealthRecords(), getAnalysisHistory()]
        );

        const normalizedProfile: UserProfile = {
          id: typeof dashboard?.id === "number" ? dashboard.id : undefined,
          email: dashboard?.email ?? "",
          nickname: dashboard?.nickname ?? "",
          profile_image: dashboard?.profile_image ?? "",
          role: typeof dashboard?.role === "string" ? dashboard.role : undefined,
          gender:
            typeof dashboard?.gender === "string" ? dashboard.gender : undefined,
          age:
            typeof dashboard?.age === "number"
              ? dashboard.age
              : typeof dashboard?.age === "string"
              ? Number(dashboard.age) || undefined
              : undefined,
          birth_year:
            typeof dashboard?.birth_year === "number"
              ? dashboard.birth_year
              : undefined,
          height:
            typeof dashboard?.height === "number"
              ? dashboard.height
              : undefined,
          weight:
            typeof dashboard?.weight === "number"
              ? dashboard.weight
              : undefined,
          current_point:
            typeof dashboard?.current_point === "number"
              ? dashboard.current_point
              : undefined,
          created_at:
            typeof dashboard?.created_at === "string"
              ? dashboard.created_at
              : undefined,
        };

        const prevStoredUser = storage.getUser?.() ?? {};
        storage.setUser?.({
          ...prevStoredUser,
          ...normalizedProfile,
          nickname: normalizedProfile.nickname ?? prevStoredUser.nickname ?? "",
          email: normalizedProfile.email ?? prevStoredUser.email ?? "",
          profile_image:
            normalizedProfile.profile_image ??
            (prevStoredUser.profile_image || prevStoredUser.picture || ""),
        });

        const rawRecords = Array.isArray(recordsResponse)
          ? recordsResponse
          : Array.isArray((recordsResponse as { records?: unknown[] })?.records)
          ? (recordsResponse as { records: unknown[] }).records
          : [];

        const normalizedRecords = rawRecords
          .map((record) => normalizeHealthRecord(record))
          .filter((record): record is HealthRecord => record !== null);

        const latestRecord: HealthRecord | null =
          normalizedRecords.length > 0 ? normalizedRecords[0] : null;

        setProfile(normalizedProfile);
        setHealthRecord(latestRecord);
        setAnalysisHistory(analysisResponse.items ?? []);

        setProfileForm({
          nickname: normalizedProfile.nickname ?? "",
          birth_year:
            normalizedProfile.birth_year != null
              ? String(normalizedProfile.birth_year)
              : "",
          gender: normalizedProfile.gender ?? "",
          profile_image: normalizedProfile.profile_image ?? "",
        });

        setHealthForm({
          systolic_bp:
            latestRecord?.systolic_bp != null
              ? String(latestRecord.systolic_bp)
              : "",
          diastolic_bp:
            latestRecord?.diastolic_bp != null
              ? String(latestRecord.diastolic_bp)
              : "",
          total_cholesterol:
            latestRecord?.total_cholesterol != null
              ? String(latestRecord.total_cholesterol)
              : "",
          glucose:
            latestRecord?.glucose != null ? String(latestRecord.glucose) : "",
          height:
            latestRecord?.height != null ? String(latestRecord.height) : "",
          weight:
            latestRecord?.weight != null ? String(latestRecord.weight) : "",
          smoke_yn: latestRecord?.smoke_yn ?? false,
          alcohol_yn: latestRecord?.alcohol_yn ?? false,
          exercise_yn: latestRecord?.exercise_yn ?? false,
        });
      } catch (error) {
        console.error("마이페이지 초기 데이터 조회 실패:", error);
        setLoadError("마이페이지 정보를 불러오지 못했어요.");
        setProfile(null);
        setHealthRecord(null);
        setAnalysisHistory([]);
      } finally {
        setLoadingInit(false);
      }
    };

    void init();
  }, []);

  const ageText = useMemo(() => {
    const year = Number(profileForm.birth_year);
    if (!year || year < 1900) return "-";
    const currentYear = new Date().getFullYear();
    return `${currentYear - year}세`;
  }, [profileForm.birth_year]);

  const displayEmail = profile?.email ?? "-";
  const displayPoint =
    typeof profile?.current_point === "number" ? profile.current_point : 0;

  const latestAnalysis = analysisHistory[0] ?? null;
  const selectedAnalysis =
    selectedAnalysisGroup.find((item) => item.id === selectedAnalysisId) ??
    selectedAnalysisGroup[0] ??
    null;
  const missions = useMemo(() => {
    if (!selectedAnalysis?.ai_missions) return [];

    if (Array.isArray(selectedAnalysis.ai_missions)) {
      return selectedAnalysis.ai_missions;
    }

    if (typeof selectedAnalysis.ai_missions === "string") {
      try {
        return JSON.parse(selectedAnalysis.ai_missions);
      } catch {
        return [];
      }
    }

    return [];
  }, [selectedAnalysis]);

  useEffect(() => {
    if (
      activeView !== "analysis" ||
      loadingAnalysisDetail ||
      selectedAnalysisRecordId == null ||
      !selectedAnalysis
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      analysisDetailRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);

    return () => window.clearTimeout(timer);
  }, [
    activeView,
    loadingAnalysisDetail,
    selectedAnalysisRecordId,
    selectedAnalysis,
  ]);

  const handleProfileChange = (key: keyof ProfileForm, value: string) => {
    setProfileForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleHealthChange = (
    key: keyof HealthForm,
    value: string | boolean
  ) => {
    setHealthForm((prev) => ({ ...prev, [key]: value as never }));
  };

  const handleNotificationToggle = (key: keyof NotificationSettings) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const saveProfile = async () => {
    try {
      setLoadingProfile(true);

      const payload: UpdateUserProfilePayload = {
        nickname: profileForm.nickname.trim(),
        profile_image: profileForm.profile_image.trim() || undefined,
        birth_year: Number(profileForm.birth_year),
      };

      const updated = await updateUserProfile(payload);

      const nextStoredUser = {
        ...(storage.getUser?.() ?? {}),
        nickname: updated.nickname ?? profileForm.nickname.trim(),
        birth_year: Number(profileForm.birth_year),
        profile_image:
          updated.profile_image ?? (profileForm.profile_image.trim() || ""),
      };

      storage.setUser?.(nextStoredUser);

      setProfile((prev) => {
        const nextProfile: UserProfile = {
          ...(prev ?? {}),
          id: typeof updated?.id === "number" ? updated.id : prev?.id,
          email: prev?.email ?? updated?.email ?? "",
          nickname: updated?.nickname ?? profileForm.nickname.trim(),
          profile_image:
            updated?.profile_image ??
            profileForm.profile_image.trim() ??
            prev?.profile_image ??
            "",
          role:
            typeof updated?.role === "string" ? updated.role : prev?.role,
          gender:
            prev?.gender ??
            (typeof updated?.gender === "string" ? updated.gender : undefined) ??
            profileForm.gender,
          age:
            typeof updated?.age === "number"
              ? updated.age
              : typeof updated?.age === "string"
              ? Number(updated.age) || prev?.age
              : prev?.age,
          birth_year: Number(profileForm.birth_year) || prev?.birth_year,
          height:
            typeof updated?.height === "number" ? updated.height : prev?.height,
          weight:
            typeof updated?.weight === "number" ? updated.weight : prev?.weight,
          current_point:
            typeof updated?.current_point === "number"
              ? updated.current_point
              : prev?.current_point,
          created_at:
            typeof updated?.created_at === "string"
              ? updated.created_at
              : prev?.created_at,
        };

        return nextProfile;
      });

      alert("프로필 정보가 저장되었어요.");
    } catch (error) {
      console.error("프로필 저장 실패:", error);
      alert("프로필 저장에 실패했어요.");
    } finally {
      setLoadingProfile(false);
    }
  };

  const saveHealthRecord = async () => {
    const recordId = resolveRecordId(healthRecord);

    if (!recordId) {
      console.log("healthRecord before save:", healthRecord);
      alert("수정할 건강 기록이 없어요.");
      return;
    }

    try {
      setLoadingHealth(true);

      const payload: UpdateHealthRecordPayload = {
        systolic_bp: Number(healthForm.systolic_bp),
        diastolic_bp: Number(healthForm.diastolic_bp),
        total_cholesterol: Number(healthForm.total_cholesterol),
        glucose: Number(healthForm.glucose),
        smoke_yn: healthForm.smoke_yn,
        alcohol_yn: healthForm.alcohol_yn,
        exercise_yn: healthForm.exercise_yn,
        height: Number(healthForm.height) || undefined,
        weight: Number(healthForm.weight) || undefined,
      };

      const updatedRaw = await patchHealthRecord(recordId, payload);
      const normalizedUpdated =
        normalizeHealthRecord(updatedRaw) ??
        ({
          ...(updatedRaw as object),
          record_id: recordId,
        } as HealthRecord);

      setHealthRecord(normalizedUpdated);

      setHealthForm({
        systolic_bp:
          normalizedUpdated?.systolic_bp != null
            ? String(normalizedUpdated.systolic_bp)
            : "",
        diastolic_bp:
          normalizedUpdated?.diastolic_bp != null
            ? String(normalizedUpdated.diastolic_bp)
            : "",
        total_cholesterol:
          normalizedUpdated?.total_cholesterol != null
            ? String(normalizedUpdated.total_cholesterol)
            : "",
        glucose:
          normalizedUpdated?.glucose != null
            ? String(normalizedUpdated.glucose)
            : "",
        height:
          normalizedUpdated?.height != null
            ? String(normalizedUpdated.height)
            : "",
        weight:
          normalizedUpdated?.weight != null
            ? String(normalizedUpdated.weight)
            : "",
        smoke_yn: normalizedUpdated?.smoke_yn ?? false,
        alcohol_yn: normalizedUpdated?.alcohol_yn ?? false,
        exercise_yn: normalizedUpdated?.exercise_yn ?? false,
      });

      alert("건강 기록이 수정되었어요.");
    } catch (error) {
      console.error("건강 기록 수정 실패:", error);
      alert("건강 기록 수정에 실패했어요.");
    } finally {
      setLoadingHealth(false);
    }
  };

  const handleOpenAnalysisDetail = async (
    recordId: number,
    analysisId: number
  ) => {
    if (
      selectedAnalysisRecordId === recordId &&
      selectedAnalysisGroup.length > 0
    ) {
      setSelectedAnalysisId(analysisId);
      return;
    }

    try {
      setLoadingAnalysisDetail(true);
      setSelectedAnalysisRecordId(recordId);
      setSelectedAnalysisId(analysisId);

      const response = await getAnalysisResultsByRecord(recordId);
      setSelectedAnalysisGroup(response.items ?? []);
    } catch (error) {
      console.error("분석 상세 결과 조회 실패:", error);
      alert("해당 건강 기록의 분석 결과를 불러오지 못했어요.");
      setSelectedAnalysisGroup([]);
      setSelectedAnalysisRecordId(null);
      setSelectedAnalysisId(null);
    } finally {
      setLoadingAnalysisDetail(false);
    }
  };

  const handleLogout = async () => {
    const ok = window.confirm("로그아웃 하시겠어요?");
    if (!ok) return;

    try {
      await logoutUser();
      alert("로그아웃 되었어요.");
      location.href = "/login";
    } catch (error) {
      console.error("로그아웃 실패:", error);
      alert("로그아웃에 실패했어요.");
    }
  };

  const handleWithdraw = async () => {
    try {
      const reason =
        withdrawReason === "other" ? withdrawDetail.trim() : withdrawReason;

      await withdrawUser(reason);
      await logoutUser();

      localStorage.removeItem("myhealthbuddy-challenge-store");
      sessionStorage.removeItem("health-flow-complete");
      sessionStorage.removeItem("health-analysis-task");
      sessionStorage.removeItem("health-analysis-result");
      sessionStorage.removeItem("health-ai-missions");

      alert("회원 탈퇴가 완료되었어요.");
      setWithdrawOpen(false);

      window.location.replace("/login");
    } catch (error) {
      console.error("회원 탈퇴 실패:", error);
      alert("회원 탈퇴에 실패했어요.");
    }
  };

  const renderOverview = () => {
    return (
      <div className="mx-auto max-w-3xl pt-4 md:pt-8">
        <div className="rounded-[32px] border border-[#163126]/8 bg-white/88 p-4 shadow-[0_22px_60px_rgba(46,125,91,0.06)] md:p-6">
          <button
            type="button"
            onClick={() => setActiveView("profile")}
            className="block w-full rounded-[28px] transition hover:bg-[#f9fcfa]"
          >
            <div className="flex flex-col items-center gap-5 py-2 text-center md:flex-row md:text-left">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-[#eef9f2] text-3xl font-bold text-[#2E7D5B] shadow-[0_12px_28px_rgba(46,125,91,0.08)]">
                {profileForm.profile_image ? (
                  <img
                    src={profileForm.profile_image}
                    alt="프로필 이미지"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  profileForm.nickname?.[0] ?? "B"
                )}
              </div>

              <div className="flex-1">
                <p className="text-3xl font-bold text-[#163126]">
                  {profileForm.nickname || "사용자"}
                </p>
                <p className="mt-2 text-sm text-[#163126]/55">{displayEmail}</p>

                <div className="mt-4 inline-flex rounded-full bg-[#eef9f2] px-4 py-2 text-sm font-semibold text-[#2E7D5B]">
                  보유 포인트 {displayPoint}P
                </div>

                {latestAnalysis && (
                  <div className="mt-3 inline-flex rounded-full bg-[#fff8df] px-4 py-2 text-sm font-semibold text-[#8a6c00]">
                    최근 위험도 {latestAnalysis.cvd_risk_percent}%
                  </div>
                )}
              </div>
            </div>
          </button>

          <div className="mt-8 flex flex-col gap-4">
            <OverviewActionCard
              icon={<UserRound size={18} />}
              title="프로필 설정"
              description="닉네임, 출생연도, 프로필 이미지를 관리해요."
              onClick={() => setActiveView("profile")}
            />
            <OverviewActionCard
              icon={<HeartPulse size={18} />}
              title="건강 데이터 관리"
              description="최근 건강 기록과 생활 습관 정보를 수정해요."
              onClick={() => setActiveView("health")}
            />
            <OverviewActionCard
              icon={<Sparkles size={18} />}
              title="건강 분석 이력"
              description="심혈관 위험도 분석 결과와 AI 피드백을 확인해요."
              onClick={() => setActiveView("analysis")}
            />
            <OverviewActionCard
              icon={<Bell size={18} />}
              title="알림 설정"
              description="챌린지와 친구 활동 알림을 관리해요."
              onClick={() => setActiveView("notifications")}
            />
            <OverviewActionCard
              icon={<Settings size={18} />}
              title="계정 관리"
              description="로그아웃과 회원 탈퇴를 진행할 수 있어요."
              onClick={() => setActiveView("account")}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderDetailHeader = (title: string, description: string) => {
    return (
      <div className="mb-6 flex items-start gap-4">
        <button
          type="button"
          onClick={() => setActiveView("overview")}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#163126]/10 bg-white text-[#163126] transition hover:bg-[#f8fbf8]"
        >
          <ChevronLeft size={18} />
        </button>

        <div>
          <h2 className="text-2xl font-bold text-[#163126]">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-[#163126]/58">
            {description}
          </p>
        </div>
      </div>
    );
  };

  const renderProfileView = () => {
    return (
      <div className="mx-auto max-w-5xl pt-2 md:pt-4">
        {renderDetailHeader(
          "프로필 설정",
          "닉네임, 출생연도, 성별, 프로필 이미지를 관리해요."
        )}

        <SectionCard
          icon={<UserRound size={18} />}
          title="프로필"
          description="기본 정보를 확인하고 수정할 수 있어요."
        >
          {loadingInit ? (
            <LoadingBox text="프로필 정보를 불러오는 중이에요..." />
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <InputField
                  label="닉네임"
                  value={profileForm.nickname}
                  onChange={(value) => handleProfileChange("nickname", value)}
                  placeholder="닉네임 입력"
                />
                <InputField
                  label="출생연도"
                  value={profileForm.birth_year}
                  onChange={(value) => handleProfileChange("birth_year", value)}
                  placeholder="예: 2003"
                  inputMode="numeric"
                />
                <StaticField label="나이" value={ageText} />
                <StaticField
                  label="성별"
                  value={formatGender(profileForm.gender)}
                />
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <span className="mb-2 block text-sm font-semibold text-[#163126]">
                    프로필 이미지
                  </span>

                  <div className="flex items-center gap-4">
                    <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-[#163126]/10 bg-[#eef9f2]">
                      {profileForm.profile_image ? (
                        <img
                          src={profileForm.profile_image}
                          alt="프로필 미리보기"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl font-bold text-[#2E7D5B]">
                          {profileForm.nickname?.[0] ?? "B"}
                        </span>
                      )}
                    </div>

                    <p className="text-sm leading-6 text-[#163126]/55">
                      프로필 이미지는 아래 URL 입력칸에 직접 넣어주세요.
                    </p>
                  </div>
                </div>

                <InputField
                  label="프로필 이미지 URL"
                  value={profileForm.profile_image}
                  onChange={(value) => handleProfileChange("profile_image", value)}
                  placeholder="https://example.com/profile.jpg"
                />
              </div>

              <div className="mt-6 flex justify-end">
                <PrimaryButton
                  onClick={saveProfile}
                  disabled={loadingProfile}
                >
                  {loadingProfile ? "저장 중..." : "프로필 저장"}
                </PrimaryButton>
              </div>
            </>
          )}
        </SectionCard>
      </div>
    );
  };

  const renderHealthView = () => {
    return (
      <div className="mx-auto max-w-5xl pt-2 md:pt-4">
        {renderDetailHeader(
          "건강 데이터 관리",
          "최근 건강 기록과 키, 체중, 생활 습관 정보를 수정해요."
        )}

        <SectionCard
          icon={<HeartPulse size={18} />}
          title="건강 기록"
          description="가장 최근 건강 기록을 기준으로 수정할 수 있어요."
        >
          {loadingInit ? (
            <LoadingBox text="건강 기록을 불러오는 중이에요..." />
          ) : healthRecord ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <InputField
                  label="수축기 혈압"
                  value={healthForm.systolic_bp}
                  onChange={(value) => handleHealthChange("systolic_bp", value)}
                  placeholder="예: 128"
                  inputMode="numeric"
                />
                <InputField
                  label="이완기 혈압"
                  value={healthForm.diastolic_bp}
                  onChange={(value) => handleHealthChange("diastolic_bp", value)}
                  placeholder="예: 84"
                  inputMode="numeric"
                />
                <InputField
                  label="총 콜레스테롤"
                  value={healthForm.total_cholesterol}
                  onChange={(value) =>
                    handleHealthChange("total_cholesterol", value)
                  }
                  placeholder="예: 196"
                  inputMode="numeric"
                />
                <InputField
                  label="공복 혈당"
                  value={healthForm.glucose}
                  onChange={(value) => handleHealthChange("glucose", value)}
                  placeholder="예: 101"
                  inputMode="numeric"
                />
                <InputField
                  label="키 (cm)"
                  value={healthForm.height}
                  onChange={(value) => handleHealthChange("height", value)}
                  placeholder="예: 170"
                  inputMode="numeric"
                />
                <InputField
                  label="체중 (kg)"
                  value={healthForm.weight}
                  onChange={(value) => handleHealthChange("weight", value)}
                  placeholder="예: 60"
                  inputMode="numeric"
                />
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-3">
                <ToggleChoice
                  title="흡연 여부"
                  value={healthForm.smoke_yn}
                  onChange={(value) => handleHealthChange("smoke_yn", value)}
                />
                <ToggleChoice
                  title="음주 여부"
                  value={healthForm.alcohol_yn}
                  onChange={(value) => handleHealthChange("alcohol_yn", value)}
                />
                <ToggleChoice
                  title="운동 여부"
                  value={healthForm.exercise_yn}
                  onChange={(value) => handleHealthChange("exercise_yn", value)}
                />
              </div>

              <div className="mt-6 flex justify-end">
                <PrimaryButton
                  onClick={saveHealthRecord}
                  disabled={loadingHealth}
                >
                  {loadingHealth ? "수정 중..." : "건강 기록 저장"}
                </PrimaryButton>
              </div>
            </>
          ) : (
            <LoadingBox text="저장된 건강 기록이 아직 없어요." />
          )}
        </SectionCard>
      </div>
    );
  };

  const renderAnalysisView = () => {
    return (
      <div className="mx-auto max-w-5xl pt-2 md:pt-4">
        {renderDetailHeader(
          "건강 분석 이력",
          "분석 결과 목록과 record별 상세 결과를 확인할 수 있어요."
        )}

        <SectionCard
          icon={<Sparkles size={18} />}
          title="분석 이력"
          description="최근 순으로 분석 결과가 보여져요."
        >
          {loadingInit ? (
            <LoadingBox text="분석 결과를 불러오는 중이에요..." />
          ) : analysisHistory.length === 0 ? (
            <LoadingBox text="아직 분석 이력이 없어요." />
          ) : (
            <div className="space-y-4">
              {analysisHistory.map((item) => (
                <button
                  key={`${item.id}-${item.record_id}`}
                  type="button"
                  onClick={() =>
                    handleOpenAnalysisDetail(item.record_id, item.id)
                  }
                  className="w-full rounded-[22px] border border-[#163126]/8 bg-[#f9fcfa] p-5 text-left transition hover:border-[#bfe3c9] hover:bg-white"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#eef9f2] px-3 py-1 text-xs font-semibold text-[#2E7D5B]">
                          record #{item.record_id}
                        </span>
                        <span className="rounded-full bg-[#fff8df] px-3 py-1 text-xs font-semibold text-[#8a6c00]">
                          {formatRiskLabel(item.risk_level)}
                        </span>
                      </div>

                      <p className="mt-3 text-lg font-bold text-[#163126]">
                        위험도 {item.cvd_risk_percent}% · 심혈관 나이 {item.cvd_age}
                      </p>

                      <p className="mt-2 text-sm leading-6 text-[#163126]/62">
                        {item.ai_evaluation || "AI 평가 내용이 없어요."}
                      </p>
                    </div>

                    <div className="text-sm text-[#163126]/48">
                      {formatDateTime(item.created_at)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </SectionCard>

        <div ref={analysisDetailRef} className="mt-6">
          <SectionCard
            icon={<Sparkles size={18} />}
            title="선택한 기록 상세"
            description="특정 건강검진 기록의 예측 결과 목록을 확인해요."
          >
            {loadingAnalysisDetail ? (
              <LoadingBox text="상세 결과를 불러오는 중이에요..." />
            ) : selectedAnalysisRecordId == null ? (
              <LoadingBox text="위 목록에서 기록을 선택해주세요." />
            ) : selectedAnalysisGroup.length === 0 ? (
              <LoadingBox text="해당 기록의 상세 결과가 없어요." />
            ) : (
              <div className="space-y-4">
                {selectedAnalysis ? (
                  <div
                    key={`detail-${selectedAnalysis.id}`}
                    className="rounded-[22px] border border-[#163126]/8 bg-[#f9fcfa] p-5"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#eef9f2] px-3 py-1 text-xs font-semibold text-[#2E7D5B]">
                        위험도 {selectedAnalysis.cvd_risk_percent}%
                      </span>
                      <span className="rounded-full bg-[#fff8df] px-3 py-1 text-xs font-semibold text-[#8a6c00]">
                        {formatRiskLabel(selectedAnalysis.risk_level)}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <InfoBox
                        label="심혈관 나이"
                        value={String(selectedAnalysis.cvd_age)}
                      />
                    </div>

                    <div className="mt-4 space-y-4">
                      <TextBlock
                        label="주요 위험 요인"
                        value={
                          selectedAnalysis.top_risk_factors?.length
                            ? selectedAnalysis.top_risk_factors.join(", ")
                            : "-"
                        }
                      />
                      <TextBlock
                        label="AI 평가"
                        value={selectedAnalysis.ai_evaluation || "-"}
                      />
                      <TextBlock
                        label="AI 경고"
                        value={selectedAnalysis.ai_alert || "-"}
                      />
                      <div>
                        <p className="text-sm font-semibold text-[#163126]">
                          AI 미션
                        </p>
                        {missions.length > 0 ? (
                          <div className="mt-2 space-y-2">
                            {missions.map(
                              (mission: any, index: number) => (
                                <div
                                  key={index}
                                  className="rounded-[16px] bg-white px-4 py-3"
                                >
                                  <p className="text-sm font-semibold text-[#163126]">
                                    {mission.title || `AI 추천 챌린지 ${index + 1}`}
                                  </p>

                                  {mission.action && (
                                    <p className="mt-1 text-sm text-[#163126]/60">
                                      {mission.action}
                                    </p>
                                  )}

                                  {mission.reason && (
                                    <p className="mt-2 text-xs text-[#2E7D5B]">
                                      {mission.reason}
                                    </p>
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        ) : (
                          <p className="mt-1 text-sm text-[#163126]/58">-</p>
                        )}
                      </div>
                      <TextBlock
                        label="AI 응원 메시지"
                        value={selectedAnalysis.ai_encouragement || "-"}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    );
  };

  const renderNotificationView = () => {
    return (
      <div className="mx-auto max-w-5xl pt-2 md:pt-4">
        {renderDetailHeader(
          "알림 설정",
          "챌린지 진행과 친구 활동 알림을 설정할 수 있어요."
        )}

        <SectionCard
          icon={<Bell size={18} />}
          title="알림 설정"
          description="원하는 알림만 선택해서 받을 수 있어요."
        >
          <div className="space-y-4">
            <SwitchRow
              title="챌린지 알림"
              description="오늘 해야 할 챌린지와 진행 상황을 알려드려요."
              checked={notifications.challengeAlert}
              onToggle={() => handleNotificationToggle("challengeAlert")}
            />
            <SwitchRow
              title="친구 응원 알림"
              description="친구의 응원, 활동 반응 등을 받아볼 수 있어요."
              checked={notifications.friendCheerAlert}
              onToggle={() => handleNotificationToggle("friendCheerAlert")}
            />
          </div>
        </SectionCard>
      </div>
    );
  };

  const renderAccountView = () => {
    return (
      <div className="mx-auto max-w-5xl pt-2 md:pt-4">
        {renderDetailHeader(
          "계정 관리",
          "로그아웃하거나 계정을 탈퇴할 수 있어요."
        )}

        <SectionCard
          icon={<Settings size={18} />}
          title="계정"
          description="로그아웃 및 회원 탈퇴 관련 작업을 진행해요."
        >
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-full border border-[#163126]/10 bg-white px-5 py-3 text-sm font-semibold text-[#163126] transition hover:bg-[#f7faf8]"
            >
              <LogOut size={16} />
              로그아웃
            </button>

            <button
              onClick={() => setWithdrawOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-[#fdf0f0] px-5 py-3 text-sm font-semibold text-[#c44b4b] transition hover:bg-[#fae3e3]"
            >
              <ShieldAlert size={16} />
              회원 탈퇴
            </button>
          </div>
        </SectionCard>
      </div>
    );
  };

  const renderContent = () => {
    if (loadingInit && activeView === "overview") {
      return (
        <div className="mx-auto max-w-3xl pt-8">
          <LoadingBox text="마이페이지 정보를 불러오는 중이에요..." />
        </div>
      );
    }

    switch (activeView) {
      case "profile":
        return renderProfileView();
      case "health":
        return renderHealthView();
      case "analysis":
        return renderAnalysisView();
      case "notifications":
        return renderNotificationView();
      case "account":
        return renderAccountView();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="space-y-6">
      {loadError && (
        <div className="mx-auto max-w-5xl rounded-[20px] border border-[#e9c2bc] bg-[#fff7f5] px-4 py-4 text-sm text-[#b15447]">
          {loadError}
        </div>
      )}

      {renderContent()}

      {withdrawOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/28 px-4">
          <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-bold text-[#163126]">
                  회원 탈퇴 하시겠습니까?
                </p>
                <p className="mt-2 text-sm leading-6 text-[#163126]/62">
                  탈퇴 사유를 선택해주시면 서비스 개선에 참고할게요.
                </p>
              </div>

              <button
                onClick={() => setWithdrawOpen(false)}
                className="rounded-full px-2 py-1 text-[#163126]/45"
              >
                ×
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <ReasonOption
                label="서비스를 잘 안 쓰게 돼서"
                checked={withdrawReason === "service_not_useful"}
                onClick={() => setWithdrawReason("service_not_useful")}
              />
              <ReasonOption
                label="원하는 기능이 없어서"
                checked={withdrawReason === "missing_features"}
                onClick={() => setWithdrawReason("missing_features")}
              />
              <ReasonOption
                label="다른 건강관리 앱을 쓰게 돼서"
                checked={withdrawReason === "using_other_service"}
                onClick={() => setWithdrawReason("using_other_service")}
              />
              <ReasonOption
                label="기타"
                checked={withdrawReason === "other"}
                onClick={() => setWithdrawReason("other")}
              />
            </div>

            {withdrawReason === "other" && (
              <textarea
                value={withdrawDetail}
                onChange={(e) => setWithdrawDetail(e.target.value)}
                placeholder="탈퇴 사유를 입력해주세요."
                className="mt-4 h-28 w-full rounded-[18px] border border-[#163126]/10 bg-[#f9fcfa] px-4 py-3 text-sm outline-none placeholder:text-[#163126]/35"
              />
            )}

            <p className="mt-4 text-xs leading-5 text-[#163126]/45">
              탈퇴 시 7일 이후 모든 데이터가 영구적으로 삭제됩니다.
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setWithdrawOpen(false)}
                className="rounded-full border border-[#163126]/10 px-4 py-2.5 text-sm font-semibold text-[#163126]"
              >
                취소
              </button>
              <button
                onClick={handleWithdraw}
                className="rounded-full bg-[#163126] px-4 py-2.5 text-sm font-semibold text-white"
              >
                탈퇴하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OverviewActionCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[24px] border border-[#163126]/8 bg-[#f9fcfa] p-5 text-left transition hover:border-[#bfe3c9] hover:bg-white"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eef9f2] text-[#2E7D5B]">
        {icon}
      </div>
      <p className="mt-4 text-base font-bold text-[#163126]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[#163126]/55">{description}</p>
    </button>
  );
}

function SectionCard({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-[#163126]/8 bg-white/88 p-6 shadow-[0_18px_50px_rgba(46,125,91,0.05)] md:p-7">
      <div className="mb-5 flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-[#eef9f2] text-[#2E7D5B]">
          {icon}
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#163126]">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-[#163126]/58">
            {description}
          </p>
        </div>
      </div>
      {children}
    </section>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-[#163126]">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="h-12 w-full rounded-[16px] border border-[#163126]/10 bg-[#f9fcfa] px-4 text-sm text-[#163126] outline-none transition focus:border-[#73d99c] focus:bg-white"
      />
    </label>
  );
}

function StaticField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <span className="mb-2 block text-sm font-semibold text-[#163126]">
        {label}
      </span>
      <div className="flex h-12 items-center rounded-[16px] border border-[#163126]/10 bg-[#f5f7f6] px-4 text-sm text-[#163126]/60">
        {value}
      </div>
    </div>
  );
}

function ToggleChoice({
  title,
  value,
  onChange,
}: {
  title: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="rounded-[20px] border border-[#163126]/8 bg-[#f9fcfa] p-4">
      <p className="text-sm font-semibold text-[#163126]">{title}</p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => onChange(true)}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            value
              ? "bg-[#163126] text-white"
              : "border border-[#163126]/10 bg-white text-[#163126]/65"
          }`}
        >
          예
        </button>
        <button
          onClick={() => onChange(false)}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            !value
              ? "bg-[#163126] text-white"
              : "border border-[#163126]/10 bg-white text-[#163126]/65"
          }`}
        >
          아니오
        </button>
      </div>
    </div>
  );
}

function SwitchRow({
  title,
  description,
  checked,
  onToggle,
}: {
  title: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[20px] border border-[#163126]/8 bg-[#f9fcfa] px-4 py-4">
      <div>
        <p className="text-sm font-semibold text-[#163126]">{title}</p>
        <p className="mt-1 text-sm text-[#163126]/55">{description}</p>
      </div>

      <button
        onClick={onToggle}
        className={`relative h-7 w-12 rounded-full transition ${
          checked ? "bg-[#73d99c]" : "bg-[#d8dfdb]"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

function ReasonOption({
  label,
  checked,
  onClick,
}: {
  label: string;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-[16px] px-3 py-3 text-left text-sm ${
        checked ? "bg-[#eef9f2] text-[#2E7D5B]" : "bg-[#f8fbf8] text-[#163126]"
      }`}
    >
      <span
        className={`h-4 w-4 rounded-full border ${
          checked ? "border-[#2E7D5B] bg-[#2E7D5B]" : "border-[#163126]/20"
        }`}
      />
      {label}
    </button>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-full bg-[#163126] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d4232] disabled:cursor-not-allowed disabled:bg-[#163126]/30"
    >
      {children}
    </button>
  );
}

function LoadingBox({ text }: { text: string }) {
  return (
    <div className="rounded-[20px] border border-[#163126]/8 bg-[#f9fcfa] px-4 py-5 text-sm text-[#163126]/60">
      {text}
    </div>
  );
}

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[18px] border border-[#163126]/8 bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2E7D5B]">
        {label}
      </p>
      <p className="mt-2 text-sm text-[#163126]">{value}</p>
    </div>
  );
}

function TextBlock({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-[#163126]">{label}</p>
      <p className="mt-2 rounded-[18px] bg-white px-4 py-3 text-sm leading-7 text-[#163126]/70">
        {value}
      </p>
    </div>
  );
}
