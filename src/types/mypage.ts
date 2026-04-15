export type UserProfile = {
  id?: number;
  email: string;
  nickname: string;
  profile_image?: string;
  role?: string;
  gender?: string;
  age?: number;
  birth_year?: number;
  height?: number;
  weight?: number;
  current_point?: number;
  created_at?: string;
};

export type UpdateUserProfilePayload = {
  nickname: string;
  profile_image?: string;
  birth_year: number;
};

export type HealthRecord = {
  record_id: number;
  systolic_bp: number;
  diastolic_bp: number;
  total_cholesterol: number;
  glucose: number;
  smoke_yn: boolean;
  alcohol_yn: boolean;
  exercise_yn: boolean;
  height?: number;
  weight?: number;
};

export type UpdateHealthRecordPayload = {
  systolic_bp: number;
  diastolic_bp: number;
  total_cholesterol: number;
  glucose: number;
  smoke_yn: boolean;
  alcohol_yn: boolean;
  exercise_yn: boolean;
  height?: number;
  weight?: number;
};

export type NotificationSettings = {
  challengeAlert: boolean;
  friendCheerAlert: boolean;
};

export type WithdrawReason =
  | ""
  | "service_not_useful"
  | "missing_features"
  | "using_other_service"
  | "other";

export type WithdrawPayload = {
  reason: WithdrawReason;
  detail?: string;
};