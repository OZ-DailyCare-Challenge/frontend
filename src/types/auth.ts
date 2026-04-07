export interface User {
  id: number;
  email: string;
  provider: string;
  provider_id: string;
  nickname: string;
  role: string;
  character_stage: number;
  current_point: number;
}

export interface LoginResponse {
  is_new_user: boolean;
  access_token: string;
  user: User;
}