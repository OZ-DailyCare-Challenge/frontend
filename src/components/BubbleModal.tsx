"use client";

import { AnimatePresence, motion } from "framer-motion";

type Bubble = {
  id: number;
  emoji: string;
  image?: string;
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
          className="fixed inset-0 z-[120] flex items-center justify-center bg-[#163126]/8 px-4 backdrop-blur-[2px]"
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
            className="relative w-full max-w-[430px] overflow-hidden rounded-[34px] border border-white/60 bg-white/42 px-7 py-8 text-center shadow-[0_24px_70px_rgba(18,49,35,0.16)] backdrop-blur-2xl"
          >
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.58),rgba(255,255,255,0.24))]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_16%,rgba(255,255,255,0.62),transparent_30%),radial-gradient(circle_at_86%_18%,rgba(178,244,194,0.34),transparent_35%),radial-gradient(circle_at_50%_100%,rgba(199,236,255,0.26),transparent_42%)]" />
            <div className="absolute left-[-12%] top-[-18%] h-44 w-44 rounded-full bg-white/34 blur-3xl" />
            <div className="absolute right-[-18%] top-[34%] h-36 w-36 rounded-full bg-[#c7ecff]/24 blur-3xl" />

            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/60 bg-white/42 text-sm font-black text-[#355845] backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/66"
            >
              ✕
            </button>

            <div className="relative z-10 mx-auto max-w-[330px]">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-white/75 bg-[radial-gradient(circle_at_30%_26%,rgba(255,255,255,0.94),rgba(224,248,229,0.64)_45%,rgba(198,236,255,0.44)_100%)] shadow-[inset_0_2px_12px_rgba(255,255,255,0.7),0_16px_30px_rgba(46,125,91,0.12)] backdrop-blur-md">
                {bubble.image ? (
                  <img
                    src={bubble.image}
                    alt=""
                    className="h-20 w-20 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-5xl">{bubble.emoji}</span>
                )}
              </div>

              <p className="mt-5 text-[11px] font-black uppercase tracking-[0.24em] text-[#63b275]">
                bubble info
              </p>

              <h3 className="mt-2 text-3xl font-black text-[#163126]">
                {bubble.title}
              </h3>

              <p className="mt-4 whitespace-pre-line text-base font-black leading-7 text-[#355845]">
                {bubble.summary}
              </p>

              <div className="mx-auto mt-5 h-px w-16 bg-[#2E7D5B]/18" />

              <p className="mt-5 whitespace-pre-line text-sm font-semibold leading-8 text-[#3f5e4f]">
                {bubble.detail}
              </p>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
