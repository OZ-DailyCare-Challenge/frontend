export type CheckupOcrResult = {
  birth_year?: number | string;
  gender?: string;
  height?: number | string;
  weight?: number | string;
  systolic_bp?: number | string;
  diastolic_bp?: number | string;
  glucose?: number | string;
  total_cholesterol?: number | string;
  is_valid?: boolean;
  confidence?: string;
  note?: string;
};

export type CheckupOcrUsage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  estimated_cost?: number;
};

export type CheckupOcrApiResponse = {
  result?: CheckupOcrResult;
  usage?: CheckupOcrUsage;
};

export type CheckupOcrErrorResponse = {
  detail?: string;
};