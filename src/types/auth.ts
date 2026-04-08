export interface User {
  id: number;
  email: string;
  name?: string;
  nickname?: string;
  profile_image?: string | null;
  role?: string;
  gender?: string | null;
  age?: number | null;
  birth_year?: number | null;
  character_stage?: number;
  current_point?: number;
  created_at?: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}