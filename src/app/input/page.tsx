import { Suspense } from "react";
import InputClient from "./InputClient";

export const dynamic = "force-dynamic";

export default function InputPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#F7FBF8_0%,#EEF7F0_100%)] text-[#163126]">
          <div className="flex min-h-screen items-center justify-center px-4">
            <div className="rounded-[24px] border border-[#163126]/8 bg-white/80 px-6 py-5 text-sm font-medium text-[#163126]/65 shadow-[0_14px_36px_rgba(22,49,38,0.06)]">
              입력 페이지를 불러오는 중이에요...
            </div>
          </div>
        </main>
      }
    >
      <InputClient />
    </Suspense>
  );
}