"use client";

import { AnimatePresence, motion } from "framer-motion";

type Bubble = {
  id: number;
  emoji: string;
  hint: string;
  title: string;
  summary: string;
  detail: string;
};

type BubbleModalProps = {
  bubble: Bubble | null;
  onClose: () => void;
};

export default function BubbleModal({ bubble, onClose }: BubbleModalProps) {
  return (
    <AnimatePresence>
      {bubble ? (
        <motion.div
          key="bubble-modal-overlay"
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/28 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            key="bubble-modal-card"
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[460px] overflow-hidden rounded-[30px] border border-white/45 bg-white/88 p-6 shadow-[0_22px_60px_rgba(18,49,35,0.18)] backdrop-blur-xl"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(178,244,194,0.38),transparent_42%)]" />
            <div className="absolute left-[-10%] top-[-16%] h-40 w-40 rounded-full bg-white/60 blur-3xl" />

            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-[#d9eadc] bg-white/80 text-[#355845] transition hover:bg-white"
            >
              ✕
            </button>

            <div className="relative z-10">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/70 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.92),rgba(218,245,224,0.78)_45%,rgba(198,236,255,0.42)_100%)] shadow-[inset_0_1px_8px_rgba(255,255,255,0.55)]">
                  <span className="text-3xl">{bubble.emoji}</span>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#63b275]">
                    BUBBLE INFO
                  </p>
                  <h3 className="mt-1 text-2xl font-bold text-[#163126]">
                    {bubble.title}
                  </h3>
                </div>
              </div>

              <p className="mt-6 text-base font-semibold text-[#355845]">
                {bubble.summary}
              </p>

              <p className="mt-4 text-sm leading-8 text-[#163126]/72">
                {bubble.detail}
              </p>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}