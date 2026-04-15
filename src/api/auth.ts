import api from "./client";

export type LoginResponse = {
  is_new_user?: boolean;
  access_token: string;
  refresh_token?: string;
  user?: {
    id?: number;
    email?: string;
    name?: string;
    picture?: string;
  };
};

export async function loginWithGoogle(code: string): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>(
    "/api/v1/auth/login/google",
    { code }
  );

  return response.data;
}