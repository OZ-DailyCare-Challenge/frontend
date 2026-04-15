"use client";

import { motion, AnimatePresence } from "framer-motion";
import HamsterScene from "./three/HamsterScene";

type Props = {
  lookTarget: { x: number; y: number } | null;
  jumpTrigger: number;
};

export default function HamsterIntro3D({ lookTarget, jumpTrigger }: Props) {
  const isTracking = !!lookTarget;

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative h-[320px] w-[320px] md:h-[380px] md:w-[380px]">
        {/* 햄스터 뒤 glow */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[240px] w-[240px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.22)_0%,rgba(199,255,220,0.16)_28%,rgba(255,255,255,0.06)_48%,transparent_72%)] blur-2xl md:h-[290px] md:w-[290px]"
          animate={
            isTracking
              ? { opacity: 0.95, scale: 1.08 }
              : { opacity: 0.62, scale: 1 }
          }
          transition={{ duration: 0.28, ease: "easeOut" }}
        />

        {/* 말풍선 */}
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: isTracking ? 1.02 : 1,
            }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="pointer-events-none absolute left-[68%] top-[3%] z-30"
          >
            <motion.div
              className="relative w-[210px] rounded-[24px] border border-white/35 bg-white/54 px-5 py-4 shadow-[0_16px_40px_rgba(22,49,38,0.10)] backdrop-blur-xl md:w-[248px]"
              animate={
                isTracking
                  ? {
                      borderColor: "rgba(255,255,255,0.55)",
                      boxShadow: "0 18px 46px rgba(22,49,38,0.14)",
                    }
                  : {
                      borderColor: "rgba(255,255,255,0.35)",
                      boxShadow: "0 16px 40px rgba(22,49,38,0.10)",
                    }
              }
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <motion.div
                aria-hidden
                className="absolute inset-0 rounded-[24px] bg-[linear-gradient(135deg,rgba(255,255,255,0.34),rgba(255,255,255,0.10))]"
                animate={
                  isTracking
                    ? { opacity: 1 }
                    : { opacity: 0.82 }
                }
                transition={{ duration: 0.22 }}
              />

              <div className="relative z-10">
                <motion.p
                  className="text-sm font-semibold text-[#2E7D5B]"
                  animate={isTracking ? { y: -1 } : { y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  반가워요 🐹
                </motion.p>

                <p className="mt-1 text-sm text-[#2E7D5B] md:text-[15px]">
                  저는 햄스터 buddy예요
                </p>

                <motion.p
                  className="mt-3 text-[18px] font-bold leading-snug text-[#163126] md:text-[19px]"
                  animate={
                    isTracking
                      ? {
                          scale: 1.015,
                          color: "#123324",
                        }
                      : {
                          scale: 1,
                          color: "#163126",
                        }
                  }
                  transition={{ duration: 0.22, ease: "easeOut" }}
                >
                  떠다니는 버블🫧을
                  <br />
                  눌러볼까요?
                </motion.p>
              </div>

              <motion.div
                aria-hidden
                className="absolute bottom-5 -left-2 h-5 w-5 rotate-45 border-b border-l border-white/35 bg-white/54 backdrop-blur-xl"
                animate={
                  isTracking
                    ? {
                        borderColor: "rgba(255,255,255,0.55)",
                        backgroundColor: "rgba(255,255,255,0.64)",
                      }
                    : {
                        borderColor: "rgba(255,255,255,0.35)",
                        backgroundColor: "rgba(255,255,255,0.54)",
                      }
                }
                transition={{ duration: 0.22 }}
              />
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* 햄스터 */}
        <motion.div
          key={jumpTrigger}
          initial={{ scale: 1 }}
          animate={{
            scale: isTracking ? [1, 1.015, 1] : 1,
          }}
          transition={{
            duration: isTracking ? 1.2 : 0.35,
            repeat: isTracking ? Infinity : 0,
            ease: "easeInOut",
          }}
          className="relative z-20 h-full w-full"
        >
          <HamsterScene lookTarget={lookTarget} jumpTrigger={jumpTrigger} />
        </motion.div>
      </div>
    </div>
  );
}