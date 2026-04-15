"use client";

import { motion } from "framer-motion";

export default function ECGLoader() {
  return (
    <div className="mt-6 w-full max-w-md lg:max-w-sm">
      <div className="relative h-12 overflow-hidden rounded-2xl border border-[#163126]/8 bg-white/70 px-3 backdrop-blur-sm">
        <svg
          viewBox="0 0 320 48"
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="none"
        >
          <path
            d="M0 24 H34 L44 24 L50 18 L58 34 L68 8 L78 24 H106 L116 24 L122 20 L128 28 L134 24 H170 L180 24 L186 18 L194 34 L204 8 L214 24 H244 L254 24 L260 20 L266 28 L272 24 H320"
            fill="none"
            stroke="rgba(46,125,91,0.18)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <motion.path
            d="M0 24 H34 L44 24 L50 18 L58 34 L68 8 L78 24 H106 L116 24 L122 20 L128 28 L134 24 H170 L180 24 L186 18 L194 34 L204 8 L214 24 H244 L254 24 L260 20 L266 28 L272 24 H320"
            fill="none"
            stroke="#6ED39B"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, pathOffset: 0 }}
            animate={{ pathLength: [0.15, 0.45, 0.8, 1], pathOffset: [0, 0, 0, 0] }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </svg>

        <div className="absolute inset-y-0 left-0 w-14 bg-gradient-to-r from-[#f8fdf8] via-[#f8fdf8]/85 to-transparent" />
        <div className="absolute inset-y-0 right-0 w-14 bg-gradient-to-l from-[#f8fdf8] via-[#f8fdf8]/85 to-transparent" />
      </div>

      <p className="mt-3 text-xs text-[#163126]/52 md:text-sm">
        심전도 파형을 기반으로 건강 정보를 정리하고 있어요.
      </p>
    </div>
  );
}