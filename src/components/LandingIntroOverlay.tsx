"use client";

import { useEffect } from "react";

type LandingIntroOverlayProps = {
  onFinish?: () => void;
};

export default function LandingIntroOverlay({
  onFinish,
}: LandingIntroOverlayProps) {
  useEffect(() => {
    onFinish?.();
  }, [onFinish]);

  return null;
}