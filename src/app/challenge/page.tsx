"use client";

import { Suspense } from "react";
import AppShell from "@/src/components/AppShell";
import ChallengeScreen from "@/src/components/ChallengeScreen";

export default function ChallengePage() {
  return (
    <AppShell>
      <Suspense fallback={null}>
        <ChallengeScreen />
      </Suspense>
    </AppShell>
  );
}
