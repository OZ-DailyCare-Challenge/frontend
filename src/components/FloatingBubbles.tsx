"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Bubble = {
  id: number;
  emoji: string;
  hint: string;
  title: string;
  summary: string;
  detail: string;
};

type PhysicsBubble = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  ax: number;
  ay: number;
  size: number;
  interactive: boolean;
  data?: Bubble;
  depth: number;
};

type PopParticle = {
  id: string;
  bubbleId: number;
  x: number;
  y: number;
  size: number;
  dx: number;
  dy: number;
  delay: number;
};

type PopBurst = {
  id: string;
  bubbleId: number;
  x: number;
  y: number;
  size: number;
  particles: PopParticle[];
};

type Props = {
  bubbles: Bubble[];
  onOpen: (bubble: Bubble) => void;
  onHover?: (target: { x: number; y: number } | null) => void;
};

const SAFE_PADDING = 20;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

function circleRectCollision(
  cx: number,
  cy: number,
  radius: number,
  rect: { x: number; y: number; width: number; height: number }
) {
  const closestX = clamp(cx, rect.x, rect.x + rect.width);
  const closestY = clamp(cy, rect.y, rect.y + rect.height);
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy < radius * radius;
}

function normalize(dx: number, dy: number) {
  const len = Math.hypot(dx, dy) || 0.0001;
  return { x: dx / len, y: dy / len };
}

const sparkleLayout = [
  { left: "18%", top: "28%", size: 5, delay: 0.0 },
  { left: "78%", top: "26%", size: 4, delay: 0.35 },
  { left: "70%", top: "72%", size: 3.5, delay: 0.65 },
];

function createBurst(
  bubbleId: number,
  centerX: number,
  centerY: number,
  size: number
): PopBurst {
  const particleCount = 10;
  const radius = size * 0.42;

  const particles: PopParticle[] = Array.from({ length: particleCount }, (_, i) => {
    const angle = (Math.PI * 2 * i) / particleCount;
    const jitter = (i % 2 === 0 ? 1 : -1) * 0.18;
    const finalAngle = angle + jitter;
    const distance = radius * (0.78 + (i % 3) * 0.12);

    return {
      id: `particle-${bubbleId}-${Date.now()}-${i}`,
      bubbleId,
      x: centerX,
      y: centerY,
      size: i % 3 === 0 ? 8 : i % 3 === 1 ? 6 : 5,
      dx: Math.cos(finalAngle) * distance,
      dy: Math.sin(finalAngle) * distance,
      delay: i * 0.012,
    };
  });

  return {
    id: `burst-${bubbleId}-${Date.now()}`,
    bubbleId,
    x: centerX,
    y: centerY,
    size,
    particles,
  };
}

function BubbleShell({
  bubble,
  interactive,
}: {
  bubble: PhysicsBubble;
  interactive: boolean;
}) {
  return (
    <>
      {interactive && (
        <>
          <motion.div
            className="pointer-events-none absolute left-[-20%] top-[52%] h-[18%] w-[46%] -translate-y-1/2 rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.00),rgba(255,255,255,0.08),rgba(255,255,255,0.20),rgba(255,255,255,0.00))] blur-lg"
            animate={{
              opacity: [0.18, 0.38, 0.18],
              scaleX: [0.92, 1.08, 0.92],
              x: [-2, 2, -2],
            }}
            transition={{
              duration: 3.8 + bubble.id * 0.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {sparkleLayout.map((s, idx) => (
            <motion.span
              key={`${bubble.id}-sparkle-${idx}`}
              className="pointer-events-none absolute rounded-full bg-white/85 blur-[1px]"
              style={{
                left: s.left,
                top: s.top,
                width: s.size,
                height: s.size,
              }}
              animate={{
                opacity: [0.16, 0.74, 0.16],
                scale: [0.82, 1.24, 0.82],
              }}
              transition={{
                duration: 2.1,
                delay: s.delay + bubble.id * 0.08,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}

          <motion.div
            className="pointer-events-none absolute inset-[-14%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0.06)_35%,transparent_72%)] blur-xl"
            animate={{
              opacity: [0.28, 0.48, 0.28],
              scale: [0.98, 1.03, 0.98],
            }}
            transition={{
              duration: 3.6 + bubble.id * 0.25,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </>
      )}

      {/* 깊이감 바탕 */}
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_55%,rgba(180,220,205,0.18)_0%,rgba(255,255,255,0.03)_52%,rgba(255,255,255,0.01)_100%)]" />

      {/* 유리막 */}
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_28%_22%,rgba(255,255,255,0.52),rgba(255,255,255,0.14)_24%,rgba(190,250,225,0.08)_46%,rgba(155,220,255,0.06)_68%,rgba(255,255,255,0.015)_100%)]" />

      {/* 메인 테두리 */}
      <div className="absolute inset-0 rounded-full border border-white/38 bg-white/[0.018] backdrop-blur-[2px]" />
      <div className="absolute inset-[1px] rounded-full border border-white/12" />

      {/* 얇은 iridescent rim */}
      <div className="absolute inset-0 rounded-full opacity-90 [background:conic-gradient(from_12deg,rgba(255,185,205,0.18),rgba(160,230,255,0.16),rgba(195,255,215,0.18),rgba(255,238,175,0.15),rgba(255,185,205,0.18))] [mask:radial-gradient(circle,transparent_70%,black_78%,black_100%)]" />

      {/* 내부 second rim */}
      {interactive && (
        <div className="absolute inset-[6%] rounded-full border border-white/16" />
      )}

      {/* 큰 하이라이트 */}
      <div className="absolute left-[11%] top-[9%] h-[34%] w-[30%] rounded-full bg-white/62 blur-md" />

      {/* 위쪽 라인 반사 */}
      <div className="absolute left-[17%] top-[15%] h-[14%] w-[36%] rotate-[-18deg] rounded-full border-t border-white/60 opacity-85" />

      {/* 보조 하이라이트 */}
      <div className="absolute right-[16%] bottom-[14%] h-[12%] w-[12%] rounded-full bg-white/18 blur-md" />

      {/* 미세한 하단 쉐도우 */}
      <div className="absolute inset-[10%] rounded-full [box-shadow:inset_0_-10px_18px_rgba(70,120,95,0.08)]" />
    </>
  );
}

export default function FloatingBubbles({
  bubbles,
  onOpen,
  onHover,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);

  const [bubbleStates, setBubbleStates] = useState<PhysicsBubble[]>([]);
  const [popBursts, setPopBursts] = useState<PopBurst[]>([]);
  const [poppingIds, setPoppingIds] = useState<number[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const buildBubbles = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      const mainSize = clamp(width * 0.108, 140, 210);
      const decoSize = clamp(width * 0.064, 76, 118);

      const interactive: PhysicsBubble[] = [
        {
          id: 1,
          x: width * 0.11,
          y: height * 0.12,
          vx: 0.23,
          vy: 0.16,
          ax: 0,
          ay: 0,
          size: mainSize,
          interactive: true,
          data: bubbles[0],
          depth: 50,
        },
        {
          id: 2,
          x: width * 0.79,
          y: height * 0.18,
          vx: -0.2,
          vy: 0.14,
          ax: 0,
          ay: 0,
          size: mainSize * 1.03,
          interactive: true,
          data: bubbles[1],
          depth: 50,
        },
        {
          id: 3,
          x: width * 0.06,
          y: height * 0.45,
          vx: 0.18,
          vy: -0.14,
          ax: 0,
          ay: 0,
          size: mainSize * 0.98,
          interactive: true,
          data: bubbles[2],
          depth: 50,
        },
        {
          id: 4,
          x: width * 0.69,
          y: height * 0.54,
          vx: -0.18,
          vy: -0.16,
          ax: 0,
          ay: 0,
          size: mainSize,
          interactive: true,
          data: bubbles[3],
          depth: 50,
        },
      ];

      const decorative: PhysicsBubble[] = [
        {
          id: 101,
          x: width * 0.26,
          y: height * 0.18,
          vx: 0.15,
          vy: 0.09,
          ax: 0,
          ay: 0,
          size: decoSize,
          interactive: false,
          depth: 25,
        },
        {
          id: 102,
          x: width * 0.88,
          y: height * 0.1,
          vx: -0.14,
          vy: 0.1,
          ax: 0,
          ay: 0,
          size: decoSize * 0.92,
          interactive: false,
          depth: 25,
        },
        {
          id: 103,
          x: width * 0.22,
          y: height * 0.74,
          vx: 0.12,
          vy: -0.1,
          ax: 0,
          ay: 0,
          size: decoSize,
          interactive: false,
          depth: 25,
        },
        {
          id: 104,
          x: width * 0.58,
          y: height * 0.12,
          vx: -0.12,
          vy: 0.09,
          ax: 0,
          ay: 0,
          size: decoSize * 0.94,
          interactive: false,
          depth: 25,
        },
        {
          id: 105,
          x: width * 0.62,
          y: height * 0.7,
          vx: -0.14,
          vy: -0.12,
          ax: 0,
          ay: 0,
          size: decoSize * 1.04,
          interactive: false,
          depth: 25,
        },
        {
          id: 106,
          x: width * 0.9,
          y: height * 0.82,
          vx: 0.13,
          vy: -0.1,
          ax: 0,
          ay: 0,
          size: decoSize * 0.9,
          interactive: false,
          depth: 25,
        },
      ];

      setBubbleStates([...interactive, ...decorative]);
    };

    buildBubbles();

    const handleResize = () => buildBubbles();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [bubbles]);

  useEffect(() => {
    let lastTime = performance.now();

    const animateFrame = (time: number) => {
      const dtRaw = (time - lastTime) / 16.666;
      const dt = Math.min(Math.max(dtRaw, 0.6), 1.5);
      lastTime = time;

      setBubbleStates((prev) => {
        if (!containerRef.current) return prev;

        const rect = containerRef.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        const noGoZones = [
          {
            x: width * 0.57,
            y: height * 0.3,
            width: width * 0.17,
            height: height * 0.42,
          },
          {
            x: width * 0.11,
            y: height * 0.7,
            width: 170,
            height: 72,
          },
        ];

        const next = prev.map((b) => ({ ...b, ax: 0, ay: 0 }));

        for (let i = 0; i < next.length; i++) {
          const b = next[i];
          const t = time * 0.00055 + b.id * 0.72;
          b.ax += Math.sin(t) * 0.007;
          b.ay += Math.cos(t * 1.08) * 0.007;
        }

        for (let i = 0; i < next.length; i++) {
          const b = next[i];
          const cx = b.x + b.size / 2;
          const cy = b.y + b.size / 2;
          const radius = b.size / 2;

          for (const zone of noGoZones) {
            if (circleRectCollision(cx, cy, radius + 8, zone)) {
              const zoneCx = zone.x + zone.width / 2;
              const zoneCy = zone.y + zone.height / 2;
              const away = normalize(cx - zoneCx, cy - zoneCy);
              b.ax += away.x * 0.12;
              b.ay += away.y * 0.12;
            }
          }
        }

        for (let i = 0; i < next.length; i++) {
          for (let j = i + 1; j < next.length; j++) {
            const a = next[i];
            const b = next[j];

            const ax = a.x + a.size / 2;
            const ay = a.y + a.size / 2;
            const bx = b.x + b.size / 2;
            const by = b.y + b.size / 2;

            const dx = bx - ax;
            const dy = by - ay;
            const dist = Math.hypot(dx, dy) || 0.0001;
            const minDist = a.size / 2 + b.size / 2;

            if (dist < minDist + 4) {
              const n = normalize(dx, dy);
              const strength = (minDist + 4 - dist) * 0.004;

              a.ax -= n.x * strength;
              a.ay -= n.y * strength;
              b.ax += n.x * strength;
              b.ay += n.y * strength;

              if (dist < minDist) {
                const overlap = minDist - dist;
                a.x -= n.x * overlap * 0.2;
                a.y -= n.y * overlap * 0.2;
                b.x += n.x * overlap * 0.2;
                b.y += n.y * overlap * 0.2;
              }
            }
          }
        }

        for (let i = 0; i < next.length; i++) {
          const b = next[i];

          if (b.x < SAFE_PADDING + 10) b.ax += 0.035;
          if (b.x + b.size > width - SAFE_PADDING - 10) b.ax -= 0.035;
          if (b.y < SAFE_PADDING + 10) b.ay += 0.035;
          if (b.y + b.size > height - SAFE_PADDING - 10) b.ay -= 0.035;
        }

        for (let i = 0; i < next.length; i++) {
          const b = next[i];

          b.vx += b.ax * dt;
          b.vy += b.ay * dt;

          const maxSpeed = b.interactive ? 0.82 : 0.72;
          const speed = Math.hypot(b.vx, b.vy);

          if (speed > maxSpeed) {
            const ratio = maxSpeed / speed;
            b.vx *= ratio;
            b.vy *= ratio;
          }

          b.vx *= 0.997;
          b.vy *= 0.997;

          b.x += b.vx * dt;
          b.y += b.vy * dt;

          if (b.x < SAFE_PADDING) {
            b.x = SAFE_PADDING;
            b.vx = Math.abs(b.vx) * 0.92;
          }
          if (b.x + b.size > width - SAFE_PADDING) {
            b.x = width - SAFE_PADDING - b.size;
            b.vx = -Math.abs(b.vx) * 0.92;
          }
          if (b.y < SAFE_PADDING) {
            b.y = SAFE_PADDING;
            b.vy = Math.abs(b.vy) * 0.92;
          }
          if (b.y + b.size > height - SAFE_PADDING) {
            b.y = height - SAFE_PADDING - b.size;
            b.vy = -Math.abs(b.vy) * 0.92;
          }
        }

        return next;
      });

      animationRef.current = requestAnimationFrame(animateFrame);
    };

    animationRef.current = requestAnimationFrame(animateFrame);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const popCleanup = useMemo(() => new Map<string, number>(), []);

  useEffect(() => {
    return () => {
      popCleanup.forEach((timeoutId) => window.clearTimeout(timeoutId));
      popCleanup.clear();
    };
  }, [popCleanup]);

  const handleInteractiveBubbleClick = (bubble: PhysicsBubble) => {
    if (!bubble.data) return;

    const centerX = bubble.x + bubble.size / 2;
    const centerY = bubble.y + bubble.size / 2;

    setPoppingIds((prev) => [...prev, bubble.id]);

    const burst = createBurst(bubble.id, centerX, centerY, bubble.size);
    setPopBursts((prev) => [...prev, burst]);

    const cleanupKey = burst.id;
    const cleanupId = window.setTimeout(() => {
      setPopBursts((prev) => prev.filter((b) => b.id !== burst.id));
      setPoppingIds((prev) => prev.filter((id) => id !== bubble.id));
      popCleanup.delete(cleanupKey);
    }, 720);

    popCleanup.set(cleanupKey, cleanupId);

    window.setTimeout(() => {
      onOpen(bubble.data!);
    }, 180);
  };

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 z-[60] overflow-hidden"
    >
      {bubbleStates.map((bubble) => {
        const isPopping = poppingIds.includes(bubble.id);

        if (bubble.interactive && bubble.data) {
          return (
            <motion.button
              key={bubble.id}
              type="button"
              onClick={() => handleInteractiveBubbleClick(bubble)}
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                onHover?.({
                  x: rect.left + rect.width / 2,
                  y: rect.top + rect.height / 2,
                });
              }}
              onMouseLeave={() => onHover?.(null)}
              whileHover={!isPopping ? { scale: 1.075, y: -1 } : {}}
              whileTap={!isPopping ? { scale: 0.96 } : {}}
              animate={
                isPopping
                  ? {
                      scale: [1, 1.08, 0.82],
                      opacity: [1, 0.78, 0],
                      filter: [
                        "blur(0px)",
                        "blur(0px)",
                        "blur(6px)",
                      ],
                    }
                  : {
                      scale: 1,
                      opacity: 1,
                      filter: "blur(0px)",
                    }
              }
              transition={{
                duration: isPopping ? 0.34 : 0.2,
                ease: isPopping ? [0.22, 1, 0.36, 1] : "easeOut",
              }}
              className="absolute pointer-events-auto flex items-center justify-center rounded-full"
              style={{
                left: bubble.x,
                top: bubble.y,
                width: bubble.size,
                height: bubble.size,
                zIndex: bubble.depth,
              }}
              aria-label={bubble.data.title}
            >
              <motion.div
                className="pointer-events-none absolute inset-[-12%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.24)_0%,rgba(255,255,255,0.10)_34%,transparent_68%)] blur-xl"
                initial={{ opacity: 0.34, scale: 0.95 }}
                whileHover={{ opacity: 0.88, scale: 1.12 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              />

              <motion.div
                className="pointer-events-none absolute inset-[7%] rounded-full border border-white/28"
                initial={{ opacity: 0.14, scale: 0.9 }}
                whileHover={{ opacity: 0.34, scale: 1.02 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              />

              <BubbleShell bubble={bubble} interactive />
            </motion.button>
          );
        }

        return (
          <motion.div
            key={bubble.id}
            className="absolute rounded-full opacity-95"
            style={{
              left: bubble.x,
              top: bubble.y,
              width: bubble.size,
              height: bubble.size,
              zIndex: bubble.depth,
            }}
            animate={{
              scale: [1, 1.012, 1],
            }}
            transition={{
              duration: 4.4 + bubble.id * 0.02,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <BubbleShell bubble={bubble} interactive={false} />
          </motion.div>
        );
      })}

      <AnimatePresence>
        {popBursts.map((burst) => (
          <motion.div
            key={burst.id}
            className="pointer-events-none absolute"
            style={{
              left: burst.x,
              top: burst.y,
              zIndex: 90,
            }}
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* 중심 링 */}
            <motion.div
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/80"
              style={{
                width: burst.size * 0.34,
                height: burst.size * 0.34,
                boxShadow: "0 0 22px rgba(255,255,255,0.35)",
              }}
              initial={{ scale: 0.65, opacity: 0.86 }}
              animate={{ scale: 1.75, opacity: 0 }}
              transition={{ duration: 0.42, ease: "easeOut" }}
            />

            {/* 잔광 */}
            <motion.div
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/35 blur-xl"
              style={{
                width: burst.size * 0.42,
                height: burst.size * 0.42,
              }}
              initial={{ scale: 0.9, opacity: 0.7 }}
              animate={{ scale: 1.65, opacity: 0 }}
              transition={{ duration: 0.38, ease: "easeOut" }}
            />

            {/* 파편 */}
            {burst.particles.map((particle) => (
              <motion.span
                key={particle.id}
                className="absolute rounded-full border border-white/70 bg-white/25 backdrop-blur-sm"
                style={{
                  width: particle.size,
                  height: particle.size,
                  left: 0,
                  top: 0,
                  boxShadow: "0 0 12px rgba(255,255,255,0.25)",
                }}
                initial={{
                  x: -particle.size / 2,
                  y: -particle.size / 2,
                  opacity: 0.95,
                  scale: 0.95,
                }}
                animate={{
                  x: particle.dx - particle.size / 2,
                  y: particle.dy - particle.size / 2,
                  opacity: 0,
                  scale: 0.55,
                }}
                transition={{
                  duration: 0.55,
                  delay: particle.delay,
                  ease: [0.22, 1, 0.36, 1],
                }}
              />
            ))}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}