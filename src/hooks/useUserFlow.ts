"use client";

import { useEffect, useState } from "react";
import { storage } from "@/src/utils/storage";
import { getDashboard } from "@/src/api/user";
import { getHealthRecords } from "@/src/api/health";

type UserFlowState = {
  isLoggedIn: boolean;
  hasInitialProfile: boolean;
  hasHealthRecord: boolean;
  hasAnalysisResult: boolean;
  isLoading: boolean;
};

export function useUserFlow() {
  const [state, setState] = useState<UserFlowState>({
    isLoggedIn: false,
    hasInitialProfile: false,
    hasHealthRecord: false,
    hasAnalysisResult: false,
    isLoading: true,
  });

  useEffect(() => {
    const init = async () => {
      const token = storage.getAccessToken();

      if (!token) {
        setState({
          isLoggedIn: false,
          hasInitialProfile: false,
          hasHealthRecord: false,
          hasAnalysisResult: false,
          isLoading: false,
        });
        return;
      }

      try {
        const dashboard = await getDashboard();
        const records = await getHealthRecords();

        setState({
          isLoggedIn: true,
          hasInitialProfile: Boolean(
            dashboard?.nickname && dashboard?.gender && dashboard?.birth_year
          ),
          hasHealthRecord: Array.isArray(records) && records.length > 0,
          hasAnalysisResult: Boolean(dashboard?.risk_score || dashboard?.health_score),
          isLoading: false,
        });
      } catch (error) {
        console.error("유저 플로우 상태 조회 실패:", error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
        }));
      }
    };

    init();
  }, []);

  return state;
}