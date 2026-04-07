import api from "./axios";
import { ENDPOINTS } from "./endpoints";
import type { LoginResponse } from "../types/auth";

export const loginWithGoogle = async (code: string) => {
  const response = await api.post<LoginResponse>(
    ENDPOINTS.AUTH.GOOGLE_LOGIN,
    { code }
  );

  return response.data;
};

export const refreshAccessToken = async () => {
  const response = await api.get<{ access_token: string }>(
    ENDPOINTS.AUTH.REFRESH
  );

  return response.data;
};