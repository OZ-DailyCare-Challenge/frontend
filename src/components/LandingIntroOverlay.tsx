"use client";

import { useEffect, useRef, useState } from "react";
import { animate, motion } from "framer-motion";

const STORAGE_KEY = "landing_intro_seen";

type LandingIntroOverlayProps = {
  onFinish?: () => void;
};

export default function LandingIntroOverlay({
  onFinish,
}: LandingIntroOverlayProps) {
  const [visible, setVisible] = useState(false);
  const [opening, setOpening] = useState(false);
  const [radius, setRadius] = useState(4);
  const [viewport, setViewport] = useState({ width: 1, height: 1 });
  const maskIdRef = useRef(
    `landing-intro-mask-${Math.random().toString(36).slice(2)}`
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const seen = sessionStorage.getItem(STORAGE_KEY);

    setViewport({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    if (seen) {
      onFinish?.();
      return;
    }

    setVisible(true);

    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);

    const startTimer = window.setTimeout(() => {
      setOpening(true);

      const maxRadius = Math.hypot(window.innerWidth, window.innerHeight) * 1.12;

      animate(4, maxRadius, {
        duration: 1.28,
        ease: [0.22, 1, 0.36, 1],
        onUpdate: (latest) => {
          setRadius(latest);
        },
      });
    }, 120);

    const finishTimer = window.setTimeout(() => {
      sessionStorage.setItem(STORAGE_KEY, "true");
      setVisible(false);
      onFinish?.();
    }, 1580);

    return () => {
      window.clearTimeout(startTimer);
      window.clearTimeout(finishTimer);
      window.removeEventListener("resize", handleResize);
    };
  }, [onFinish]);

  if (!visible) return null;

  const rPercent =
    (radius / Math.max(viewport.width, viewport.height)) * 100;

  return (
    <div className="pointer-events-none absolute inset-0 z-[9999] overflow-hidden">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <mask id={maskIdRef.current}>
            <rect width="100" height="100" fill="white" />
            <circle cx="50" cy="46" r={rPercent} fill="black" />
          </mask>
        </defs>

        <rect
          width="100"
          height="100"
          fill="white"
          mask={`url(#${maskIdRef.current})`}
        />
      </svg>

      <motion.div
        initial={{ scale: 1, opacity: 0.95 }}
        animate={
          opening ? { scale: 0.42, opacity: 0 } : { scale: 1, opacity: 0.95 }
        }
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="absolute left-1/2 top-[46%] h-[10px] w-[10px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
        style={{
          boxShadow: "0 0 18px rgba(255,255,255,0.95)",
        }}
      />

      <motion.div
        initial={{ scale: 0.25, opacity: 0.85 }}
        animate={
          opening ? { scale: 9, opacity: 0 } : { scale: 0.25, opacity: 0.85 }
        }
        transition={{ duration: 0.72, ease: "easeOut" }}
        className="absolute left-1/2 top-[46%] h-[20px] w-[20px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/95"
        style={{
          boxShadow: "0 0 22px rgba(255,255,255,0.42)",
        }}
      />

      <motion.div
        initial={{ scale: 0.25, opacity: 0.52 }}
        animate={
          opening ? { scale: 14, opacity: 0 } : { scale: 0.25, opacity: 0.52 }
        }
        transition={{ duration: 0.98, delay: 0.05, ease: "easeOut" }}
        className="absolute left-1/2 top-[46%] h-[20px] w-[20px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/70"
        style={{
          boxShadow: "0 0 28px rgba(255,255,255,0.24)",
        }}
      />

      <motion.div
        initial={{ scale: 1, opacity: 0.42 }}
        animate={
          opening ? { scale: 30, opacity: 0 } : { scale: 1, opacity: 0.42 }
        }
        transition={{
          duration: 1.0,
          delay: 0.03,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="absolute left-1/2 top-[46%] h-[28px] w-[28px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          boxShadow:
            "0 0 26px rgba(0,0,0,0.1), inset 0 0 26px rgba(0,0,0,0.06)",
        }}
      />

      <motion.div
        initial={{ scale: 1, opacity: 0.9 }}
        animate={
          opening ? { scale: 6.5, opacity: 0 } : { scale: 1, opacity: 0.9 }
        }
        transition={{ duration: 0.88, ease: "easeOut" }}
        className="absolute left-1/2 top-[46%] h-[110px] w-[110px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/75 blur-2xl"
      />
    </div>
  );
}