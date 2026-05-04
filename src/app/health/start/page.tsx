import { Suspense } from "react";
import HealthStartClient from "./HealthStartClient";

export const dynamic = "force-dynamic";

export default function HealthStartPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-white text-[#163126]">
          <div className="flex min-h-screen items-center justify-center px-4">
            <div className="rounded-[24px] border border-[#163126]/8 bg-white/80 px-6 py-5 text-sm font-medium text-[#163126]/65 shadow-[0_14px_36px_rgba(22,49,38,0.06)]">
              페이지를 불러오는 중이에요...
            </div>
          </div>
        </main>
      }
    >
      <HealthStartClient />
    </Suspense>
  );
}
